---
name: RuStore Pay SDK setup
description: Config plugin and TypeScript wrapper for RuStore subscriptions — what needs manual configuration before EAS build.
---

## Required manual steps before EAS Build
1. **consoleAppId** — get from RuStore Console → fill in `app.json` plugins withRuStore.consoleAppId
2. **Products** — create in RuStore Console with IDs: `zerkalo_premium_monthly`, `zerkalo_premium_annual`
3. **Private key** (shared by user) — for server-side purchase verification if needed

## Plugin location
`artifacts/ai-destiny-scanner/plugins/withRuStore.js`
- Adds Maven repo: https://artifactory-external.vkpartner.ru/artifactory/maven
- Adds dep: ru.rustore.sdk-wrapper.react-native:pay:10.3.1
- Handles both Kotlin and Java MainApplication

## TypeScript service
`artifacts/ai-destiny-scanner/services/ruStorePayments.ts`
- Wraps NativeModules.RuStoreReactPay with Platform.OS guard
- init is automatic via AndroidManifest (no JS init call needed)
- deeplink scheme: "mirodestiny"

**Why:** RuStore init is automatic via AndroidManifest meta-data per SDK 10.3.1 docs.
