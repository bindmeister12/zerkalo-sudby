import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DisclaimerBadge } from "@/components/DisclaimerBadge";
import { ScanningAnimation } from "@/components/ScanningAnimation";
import { ParticleBackground } from "@/components/ParticleBackground";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useAds } from "@/services/ads";

const FREE_SCAN_LIMIT = 1;

export default function ScanningScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const {
    userProfile,
    palmImageBase64,
    palmImageMimeType,
    setDestinyResult,
    setHasCompletedOnboarding,
    incrementFreeScans,
    isPremium,
    freeScansUsed,
    subscriptionsEnabled,
  } = useApp();
  const ads = useAds();

  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const titleOpacity = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    Animated.timing(titleOpacity, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== "web" }).start();

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) {
          clearInterval(progressInterval);
          return p;
        }
        return p + Math.random() * 3 + 0.5;
      });
    }, 200);

    const msgInterval = setInterval(() => {
      setMessageIndex((i) => i + 1);
    }, 2500);

    analyze();

    return () => {
      clearInterval(progressInterval);
      clearInterval(msgInterval);
    };
  }, []);

  async function analyze() {
    if (!userProfile) {
      router.replace("/onboarding");
      return;
    }

    if (!palmImageBase64) {
      router.replace("/palm-capture");
      return;
    }

    if (subscriptionsEnabled && !isPremium && freeScansUsed >= FREE_SCAN_LIMIT) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace("/paywall" as any);
      return;
    }

    const domain = process.env.EXPO_PUBLIC_DOMAIN || "localhost";
    const base = Platform.OS === "web" ? "/api" : `https://${domain}/api`;

    try {
      const response = await fetch(`${base}/destiny/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userProfile.name,
          birthDate: userProfile.birthDate,
          birthTime: userProfile.birthTime,
          gender: userProfile.gender,
          palmImageBase64,
          palmImageMimeType: palmImageMimeType || "image/jpeg",
        }),
      });

      if (!response.ok) {
        setError("Ошибка анализа. Попробуй снова.");
        return;
      }

      const data = await response.json();
      setProgress(100);
      setDestinyResult(data);
      setHasCompletedOnboarding(true);
      incrementFreeScans();

      setTimeout(async () => {
        await ads.showInterstitial();
        router.replace("/results");
      }, 800);
    } catch {
      setError("Нет связи с оракулом. Проверь интернет и попробуй снова.");
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ParticleBackground count={25} />
      <LinearGradient
        colors={["rgba(139, 92, 246, 0.15)", "transparent", "rgba(59, 130, 246, 0.1)"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />

      <View style={[styles.content, { paddingTop: topPad + 20, paddingBottom: botPad + 20 }]}>
        <Animated.View style={{ opacity: titleOpacity, alignItems: "center" }}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            AI сканирование
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Не закрывай экран
          </Text>
        </Animated.View>

        <ScanningAnimation progress={Math.min(progress, 100)} messageIndex={messageIndex} />

        {error && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        )}

        <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.neonPurple + "30" }]}>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            ИИ анализирует твои данные и строит персональный отчёт судьбы
          </Text>
        </View>

        <DisclaimerBadge style={{ width: "100%" }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  infoBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    width: "100%",
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
