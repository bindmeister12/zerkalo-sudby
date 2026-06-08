import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

export interface AdsService {
  showInterstitial: () => Promise<void>;
  showRewarded: () => Promise<{ rewarded: boolean }>;
}

type AdState =
  | { type: "idle" }
  | { type: "interstitial"; remaining: number; resolve: () => void }
  | {
      type: "rewarded";
      remaining: number;
      total: number;
      resolve: (r: { rewarded: boolean }) => void;
    };

const INTERSTITIAL_SECONDS = 3;
const REWARDED_SECONDS = 5;

export type AdsContextValue = {
  ads: AdsService;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
};

export const AdsContext = createContext<AdsContextValue | null>(null);

/**
 * AdsProvider is the React context plumbing. Callers always use {@link useAds}
 * regardless of which concrete provider is mounted, so the provider can be
 * swapped (e.g. {@link StubAdsProvider} → YandexAdsProvider) without touching
 * any feature code.
 */
export type AdsProviderProps = {
  children: React.ReactNode;
  initialEnabled?: boolean;
  isEnabled?: boolean;
  onEnabledChange?: (v: boolean) => void;
};

/**
 * StubAdsProvider — мок-реализация {@link AdsService}. Показывает оформленные
 * экраны-заглушки interstitial/rewarded вместо реальных рекламных блоков.
 * При подключении Yandex Mobile Ads SDK заменяется на `YandexAdsProvider`,
 * который реализует тот же контракт; вызывающий код не меняется.
 */
export function StubAdsProvider(props: AdsProviderProps) {
  return <AdsProviderInternal {...props} />;
}

/** Backwards-compatible alias for the default (stub) provider. */
export const AdsProvider = StubAdsProvider;

function AdsProviderInternal({
  children,
  initialEnabled = true,
  isEnabled,
  onEnabledChange,
}: AdsProviderProps) {
  const [internalEnabled, setInternalEnabled] = useState(initialEnabled);
  const enabled = isEnabled ?? internalEnabled;
  const setEnabled = useCallback(
    (v: boolean) => {
      if (onEnabledChange) onEnabledChange(v);
      else setInternalEnabled(v);
    },
    [onEnabledChange],
  );

  const [state, setState] = useState<AdState>({ type: "idle" });
  const stateRef = useRef<AdState>(state);
  stateRef.current = state;

  useEffect(() => {
    if (state.type === "idle") return;
    const timer = setInterval(() => {
      setState((prev) => {
        if (prev.type === "idle") return prev;
        const next = prev.remaining - 1;
        return { ...prev, remaining: next } as AdState;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state.type]);

  const handleClose = useCallback(() => {
    const s = stateRef.current;
    if (s.type === "interstitial") {
      setState({ type: "idle" });
      s.resolve();
    } else if (s.type === "rewarded") {
      setState({ type: "idle" });
      s.resolve({ rewarded: s.remaining <= 0 });
    }
  }, []);

  const ads = useMemo<AdsService>(
    () => ({
      showInterstitial() {
        if (!enabled) return Promise.resolve();
        return new Promise<void>((resolve) => {
          setState({ type: "interstitial", remaining: INTERSTITIAL_SECONDS, resolve });
        });
      },
      showRewarded() {
        if (!enabled) return Promise.resolve({ rewarded: true });
        return new Promise<{ rewarded: boolean }>((resolve) => {
          setState({
            type: "rewarded",
            remaining: REWARDED_SECONDS,
            total: REWARDED_SECONDS,
            resolve,
          });
        });
      },
    }),
    [enabled],
  );

  return (
    <AdsContext.Provider value={{ ads, enabled, setEnabled }}>
      {children}
      <AdModal state={state} onClose={handleClose} />
    </AdsContext.Provider>
  );
}

export function useAds(): AdsService {
  const ctx = useContext(AdsContext);
  if (!ctx) throw new Error("useAds must be used inside AdsProvider");
  return ctx.ads;
}

export function useAdsEnabled(): { enabled: boolean; setEnabled: (v: boolean) => void } {
  const ctx = useContext(AdsContext);
  if (!ctx) throw new Error("useAdsEnabled must be used inside AdsProvider");
  return { enabled: ctx.enabled, setEnabled: ctx.setEnabled };
}

function AdModal({ state, onClose }: { state: AdState; onClose: () => void }) {
  const colors = useColors();
  const visible = state.type !== "idle";

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={() => {}}>
      <View style={[styles.root, { backgroundColor: "#0b0518" }]}>
        <LinearGradient
          colors={["rgba(139,92,246,0.35)", "rgba(11,5,24,0.95)", "rgba(236,72,153,0.25)"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.demoTagWrap}>
          <View style={[styles.demoTag, { borderColor: colors.gold }]}>
            <Ionicons name="megaphone" size={14} color={colors.gold} />
            <Text style={[styles.demoTagText, { color: colors.gold }]}>ДЕМО-БЛОК · реклама</Text>
          </View>
        </View>

        <View style={styles.center}>
          <View style={[styles.iconCircle, { borderColor: colors.neonPurple }]}>
            <Ionicons
              name={state.type === "rewarded" ? "gift" : "sparkles"}
              size={42}
              color={colors.neonPurple}
            />
          </View>
          <Text style={styles.title}>
            {state.type === "rewarded" ? "Награда за просмотр" : "Реклама (межстраничная)"}
          </Text>
          <Text style={styles.subtitle}>
            {state.type === "rewarded"
              ? "Посмотрите ролик до конца, чтобы получить бесплатный повторный доступ."
              : "Здесь будет реальная реклама после подключения Yandex Mobile Ads SDK."}
          </Text>

          {state.type === "rewarded" && (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, ((state.total - Math.max(state.remaining, 0)) / state.total) * 100)}%`,
                    backgroundColor: colors.neonPurple,
                  },
                ]}
              />
            </View>
          )}

          {state.type !== "idle" && state.remaining > 0 && (
            <View style={styles.timerRow}>
              <ActivityIndicator color={colors.gold} />
              <Text style={styles.timerText}>
                {state.type === "rewarded" ? "Награда через" : "Закрыть через"} {state.remaining} с
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={[
              styles.closeBtn,
              {
                borderColor: colors.neonPurple,
                opacity: state.type !== "idle" && state.remaining > 0 ? 0.4 : 1,
              },
            ]}
            disabled={state.type !== "idle" && state.remaining > 0}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.closeText, { color: colors.foreground }]}>
              {state.type === "rewarded" ? "Получить награду" : "Закрыть"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.footer}>
            Это демо-блок. Здесь будет реальная реклама.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, paddingTop: Platform.OS === "ios" ? 70 : 40, paddingBottom: 30 },
  demoTagWrap: { alignItems: "center" },
  demoTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  demoTagText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18 },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    marginTop: 10,
  },
  progressFill: { height: "100%", borderRadius: 3 },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timerText: { color: "#fff", fontFamily: "Inter_500Medium", fontSize: 13 },
  bottom: { gap: 10 },
  closeBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  closeText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  footer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
