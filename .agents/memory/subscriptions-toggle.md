---
name: Subscriptions toggle
description: Как работает переключатель платных подписок между admin-панелью и мобильным приложением.
---

Таблица `app_settings` (key TEXT PRIMARY KEY, value TEXT) хранит `subscriptions_enabled = "false"|"true"`.

**Why:** Владелец не является ИП и не может принимать платежи через RuStore прямо сейчас. Подписки выключены по умолчанию — все пользователи получают бесплатный доступ до включения.

**How to apply:**
- Admin-панель: `PATCH /api/admin/settings` с `{ subscriptionsEnabled: boolean }` — меняет значение в БД.
- Публичный endpoint: `GET /api/app-config` → `{ subscriptionsEnabled: boolean }`.
- Мобильное приложение: fetches `/api/app-config` при старте в `AppContext.tsx`, хранит в state `subscriptionsEnabled` (не персистируется — всегда свежее при запуске).
- В `scanning.tsx`: paywall показывается только если `subscriptionsEnabled && !isPremium && freeScansUsed >= FREE_SCAN_LIMIT`.
- Default в БД: `false` (подписки выключены).
