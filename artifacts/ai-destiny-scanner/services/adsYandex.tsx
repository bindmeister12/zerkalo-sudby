import React, { useEffect, useMemo, useRef, useState } from "react";
import { NativeModules, Platform } from "react-native";
import {
  AdsContext,
  type AdsProviderProps,
  type AdsService,
  StubAdsProvider,
} from "./ads";

/**
 * Имя npm-пакета нативного SDK Яндекс.Мобильной рекламы.
 * Задано через строковую переменную (а не литералом), чтобы Metro не пытался
 * статически разрешить модуль в Expo Go / web, где нативного бинарника нет.
 *
 * Используется community-обёртка `react-native-yandex-mobile-ads` (есть на npm).
 * Если выберете другой клиент — поменяйте только это имя.
 */
const YANDEX_PACKAGE = "react-native-yandex-mobile-ads";

type MobileAdsConfig = {
  userConsent?: boolean;
  locationConsent?: boolean;
  enableLogging?: boolean;
  enableDebugErrorIndicator?: boolean;
};

type RewardedResp = {
  amount?: bigint | number;
  type?: string;
  click?: boolean;
};

type YandexNative = {
  MobileAds?: { initialize: (cfg: MobileAdsConfig) => unknown };
  InterstitialAdManager?: { showAd: (adUnitId: string) => Promise<boolean> };
  RewardedAdManager?: { showAd: (adUnitId: string) => Promise<RewardedResp> };
};

/**
 * Проверка наличия именно нативного биндинга Yandex Mobile Ads.
 *
 * JS-пакет `react-native-yandex-mobile-ads` бандлится Metro и в Expo Go тоже —
 * `require()` будет успешен. Но внутри он берёт реальные методы из
 * `NativeModules.{MobileAds,InterstitialAdManager,RewardedAdManager}`, которых
 * без `expo-dev-client` / EAS-сборки попросту нет. Поэтому источник истины —
 * именно `NativeModules`, а не успех `require`.
 */
function hasYandexNativeBindings(): boolean {
  if (Platform.OS === "web") return false;
  const nm = NativeModules as Record<string, unknown>;
  return Boolean(nm.InterstitialAdManager && nm.RewardedAdManager);
}

function loadYandexNative(): YandexNative | null {
  if (!hasYandexNativeBindings()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const req = require as unknown as (name: string) => YandexNative;
    return req(YANDEX_PACKAGE);
  } catch {
    return null;
  }
}

export function isYandexAdsAvailable(): boolean {
  if (Platform.OS === "web") return false;
  const interstitialId = process.env.EXPO_PUBLIC_YANDEX_INTERSTITIAL_ID;
  const rewardedId = process.env.EXPO_PUBLIC_YANDEX_REWARDED_ID;
  if (!interstitialId || !rewardedId) return false;
  if (!hasYandexNativeBindings()) return false;
  return loadYandexNative() !== null;
}

/**
 * YandexAdsProvider — реализация {@link AdsService} поверх нативного
 * Yandex Mobile Ads SDK. Если нативный модуль не подгружен или не заданы
 * env-ID — провайдер прозрачно делегирует {@link StubAdsProvider}.
 */
export function YandexAdsProvider(props: AdsProviderProps) {
  const native = useMemo(() => loadYandexNative(), []);
  const interstitialId = process.env.EXPO_PUBLIC_YANDEX_INTERSTITIAL_ID;
  const rewardedId = process.env.EXPO_PUBLIC_YANDEX_REWARDED_ID;

  if (!native || !interstitialId || !rewardedId) {
    return <StubAdsProvider {...props} />;
  }
  return (
    <YandexAdsProviderImpl
      {...props}
      native={native}
      interstitialId={interstitialId}
      rewardedId={rewardedId}
    />
  );
}

function YandexAdsProviderImpl({
  children,
  initialEnabled = true,
  isEnabled,
  onEnabledChange,
  native,
  interstitialId,
  rewardedId,
}: AdsProviderProps & {
  native: YandexNative;
  interstitialId: string;
  rewardedId: string;
}) {
  const [internalEnabled, setInternalEnabled] = useState(initialEnabled);
  const enabled = isEnabled ?? internalEnabled;
  const setEnabled = (v: boolean) => {
    if (onEnabledChange) onEnabledChange(v);
    else setInternalEnabled(v);
  };

  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    try {
      native.MobileAds?.initialize({
        userConsent: true,
        locationConsent: false,
        enableLogging: false,
      });
    } catch {
      // не блокируем приложение, если SDK не смог инициализироваться
    }
  }, [native]);

  const ads = useMemo<AdsService>(
    () => ({
      async showInterstitial() {
        if (!enabled) return;
        const mgr = native.InterstitialAdManager;
        if (!mgr) return;
        try {
          await mgr.showAd(interstitialId);
        } catch {
          // показ упал — не блокируем пользователя
        }
      },
      async showRewarded() {
        if (!enabled) return { rewarded: true };
        const mgr = native.RewardedAdManager;
        // Если нативного rewarded-менеджера нет — НЕ выдаём награду по дефолту:
        // иначе нативная сборка могла бы случайно бесплатно разблокировать платный путь.
        if (!mgr) return { rewarded: false };
        try {
          const result = await mgr.showAd(rewardedId);
          // SDK возвращает RewardedResp, награду засчитываем только при amount > 0.
          const amount = result?.amount;
          const hasReward =
            typeof amount === "bigint"
              ? amount > 0n
              : typeof amount === "number"
                ? amount > 0
                : false;
          return { rewarded: hasReward };
        } catch {
          return { rewarded: false };
        }
      },
    }),
    [enabled, native, interstitialId, rewardedId],
  );

  return (
    <AdsContext.Provider value={{ ads, enabled, setEnabled }}>
      {children}
    </AdsContext.Provider>
  );
}
