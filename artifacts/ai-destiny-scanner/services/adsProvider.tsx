import React from "react";
import { Platform } from "react-native";
import { type AdsProviderProps, StubAdsProvider } from "./ads";
import { isYandexAdsAvailable, YandexAdsProvider } from "./adsYandex";

/**
 * AdsProvider — умный фабричный провайдер. Выбирает реализацию рекламы
 * на основании окружения:
 *
 *  - если доступны нативные биндинги Yandex Mobile Ads SDK и заданы env-ID
 *    EXPO_PUBLIC_YANDEX_INTERSTITIAL_ID / EXPO_PUBLIC_YANDEX_REWARDED_ID —
 *    используется {@link YandexAdsProvider};
 *  - иначе (Expo Go, web, отсутствие ID, отсутствие нативного биндинга) —
 *    {@link StubAdsProvider}.
 *
 * Контракт {@link AdsService} одинаков, поэтому переключение прозрачно для
 * вызывающего кода (useAds/useAdsEnabled).
 */
export function AdsProvider(props: AdsProviderProps) {
  const yandex = isYandexAdsAvailable();
  if (__DEV__) {
    const why = yandex
      ? "Yandex (native bindings + env IDs)"
      : Platform.OS === "web"
        ? "Stub (web)"
        : !process.env.EXPO_PUBLIC_YANDEX_INTERSTITIAL_ID ||
            !process.env.EXPO_PUBLIC_YANDEX_REWARDED_ID
          ? "Stub (env IDs missing)"
          : "Stub (native module not linked — likely Expo Go)";
    // eslint-disable-next-line no-console
    console.log(`[ads] provider: ${why}`);
  }
  if (yandex) return <YandexAdsProvider {...props} />;
  return <StubAdsProvider {...props} />;
}
