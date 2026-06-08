---
name: Free scan gate
description: Logic that blocks non-premium users after 1 free scan and redirects to paywall.
---

## Location
`artifacts/ai-destiny-scanner/app/scanning.tsx`

## Logic
Check happens in analyze() BEFORE the API call:
- FREE_SCAN_LIMIT = 1
- if (!isPremium && freeScansUsed >= FREE_SCAN_LIMIT) → router.replace("/paywall" as any)
- isPremium from AppContext (set to true after RuStore purchase success)
- freeScansUsed tracked in AppContext, persisted in AsyncStorage

## Note
Route cast as `any` because expo-router typed routes cache doesn't include new paywall screen until Expo dev server restarts and regenerates types.

**Why:** Prevents typed-routes error from blocking typecheck while the screen is new.
