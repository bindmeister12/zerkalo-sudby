/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Expo config plugin: Yandex Mobile Ads SDK
 *
 * Что делает:
 *  - iOS: прописывает в Info.plist `GADApplicationIdentifier` (если задан),
 *    `SKAdNetworkItems` (для iOS 14+ attribution) и `NSUserTrackingUsageDescription`.
 *  - Android: добавляет в AndroidManifest <meta-data android:name="com.yandex.mobile.ads.APP_ID">.
 *
 * Параметры:
 *   {
 *     iosAppId?: string,            // App ID для iOS (если у вашей сети требуется)
 *     androidAppId?: string,        // App ID для Android (если требуется)
 *     userTrackingUsageDescription?: string, // текст разрешения ATT (iOS 14+)
 *     skAdNetworkItems?: string[]   // SKAdNetwork identifiers (если требуется)
 *   }
 *
 * Сам нативный SDK Yandex Mobile Ads поставляется npm-пакетом
 * (`mobile-ads-react-native-plugin` или аналог) — он же подтягивает CocoaPod/Gradle-зависимость.
 * Этот плагин лишь дописывает требуемые ключи в манифесты.
 */
const { withInfoPlist, withAndroidManifest } = require("@expo/config-plugins");

function withYandexAdsIOS(config, props) {
  return withInfoPlist(config, (cfg) => {
    const plist = cfg.modResults;

    if (props.userTrackingUsageDescription) {
      plist.NSUserTrackingUsageDescription = props.userTrackingUsageDescription;
    }

    if (props.iosAppId) {
      plist.GADApplicationIdentifier = props.iosAppId;
    }

    if (Array.isArray(props.skAdNetworkItems) && props.skAdNetworkItems.length > 0) {
      const existing = Array.isArray(plist.SKAdNetworkItems) ? plist.SKAdNetworkItems : [];
      const merged = new Map();
      for (const item of existing) {
        if (item && item.SKAdNetworkIdentifier) merged.set(item.SKAdNetworkIdentifier, item);
      }
      for (const id of props.skAdNetworkItems) {
        if (typeof id === "string") merged.set(id, { SKAdNetworkIdentifier: id });
      }
      plist.SKAdNetworkItems = Array.from(merged.values());
    }

    return cfg;
  });
}

function withYandexAdsAndroid(config, props) {
  return withAndroidManifest(config, (cfg) => {
    if (!props.androidAppId) return cfg;
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;

    app["meta-data"] = app["meta-data"] || [];
    const META_NAME = "com.yandex.mobile.ads.APP_ID";
    const existing = app["meta-data"].find(
      (m) => m.$ && m.$["android:name"] === META_NAME,
    );
    if (existing) {
      existing.$["android:value"] = props.androidAppId;
    } else {
      app["meta-data"].push({
        $: {
          "android:name": META_NAME,
          "android:value": props.androidAppId,
        },
      });
    }

    return cfg;
  });
}

const withYandexAds = (config, props = {}) => {
  let cfg = config;
  cfg = withYandexAdsIOS(cfg, props);
  cfg = withYandexAdsAndroid(cfg, props);
  return cfg;
};

module.exports = withYandexAds;
