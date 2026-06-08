# Подключение Yandex Mobile Ads SDK

Этот документ описывает, как из развлекательного мок-режима перейти к реальной
монетизации в собранном Dev/Production-приложении.

## Архитектура (что уже сделано)

- `services/ads.tsx` — `StubAdsProvider` + контракт `AdsService`
  (`showInterstitial`, `showRewarded`). Используется по умолчанию в Expo Go и
  web-превью.
- `services/adsYandex.tsx` — `YandexAdsProvider`, нативная обёртка вокруг SDK
  Yandex Mobile Ads. Если нативный модуль не подгружен или не заданы env-ID —
  прозрачно делегирует Stub.
- `services/adsProvider.tsx` — умный `AdsProvider`, который сам выбирает между
  Yandex и Stub. Подключён в `app/_layout.tsx`. Вызывающий код
  (`useAds`, `useAdsEnabled`) не меняется при переключении.
- `plugins/withYandexAds.js` — Expo config plugin, прописывает в Info.plist /
  AndroidManifest нужные ключи.
- `eas.json` — профили `development` / `preview` / `production`.

## Что нужно сделать владельцу приложения

### 1. Завести рекламные блоки

В кабинете **РСЯ для приложений** (`partner.yandex.ru/legacy/distribution/admob`)
создайте мобильное приложение и добавьте два блока:

- `Interstitial` (межстраничный)
- `Rewarded` (с вознаграждением)

Существующие веб-ID `R-M-19305714-1/2` **не подходят** — это блоки веб-РСЯ.

### 2. Прокинуть ID в env

В `eas.json` (профили `development` / `preview` / `production`) или в кабинете
EAS Secrets укажите:

```
EXPO_PUBLIC_YANDEX_INTERSTITIAL_ID=R-M-XXXXXXX-1
EXPO_PUBLIC_YANDEX_REWARDED_ID=R-M-XXXXXXX-2
```

Локально можно скопировать `.env.example` → `.env.local`. Без этих переменных
будет работать Stub (заглушка).

### 3. Нативный SDK уже в зависимостях

`react-native-yandex-mobile-ads` и `expo-dev-client` уже подключены в
`artifacts/ai-destiny-scanner/package.json` и `app.json`. Дополнительно ставить
ничего не нужно — лишь `pnpm install`.

В Expo Go нативный модуль отсутствует и `YandexAdsProvider` автоматически
делегирует `StubAdsProvider`. Чтобы Metro не падал на временных директориях
`expo-dev-launcher`, в `metro.config.js` они исключены из watch — это уже
сделано.

> Если вы решите перейти на другой клиент SDK, поменяйте имя пакета в константе
> `YANDEX_PACKAGE` в `services/adsYandex.tsx` и обновите зависимость.

### 4. Собрать Dev Client через EAS

```bash
pnpm --filter @workspace/ai-destiny-scanner exec eas login
pnpm --filter @workspace/ai-destiny-scanner exec eas build:configure
pnpm --filter @workspace/ai-destiny-scanner exec eas build --profile development --platform android
```

Android-сборка бесплатна и быстрее всего. После сборки:

1. Установите получившийся APK на устройство.
2. Запустите Dev Client.
3. Подключитесь к Metro: `pnpm --filter @workspace/ai-destiny-scanner run dev`.

### 5. Проверить на устройстве

- Первый скан → interstitial Yandex (вместо демо-заглушки).
- Повторный скан / совместимость → rewarded Yandex; `onReward` разблокирует
  действие.
- В About выключите тоггл «Показывать рекламу» — оба формата должны перестать
  показываться (`AdsService` сразу резолвится).

### 6. iOS-нюансы

- В `app.json` → `plugins.withYandexAds` можно дополнительно передать:
  - `userTrackingUsageDescription` — текст разрешения ATT (App Tracking
    Transparency, iOS 14+);
  - `skAdNetworkItems` — список SKAdNetwork-идентификаторов Yandex (см. их
    [актуальный список](https://yandex.ru/dev/mobile-ads));
  - `iosAppId` / `androidAppId` — если ваш SDK требует Application ID в манифесте.

## Откат на Stub

Достаточно убрать env-переменные `EXPO_PUBLIC_YANDEX_*` или удалить пакет
`react-native-yandex-mobile-ads`. `AdsProvider` автоматически вернётся к
`StubAdsProvider`.
