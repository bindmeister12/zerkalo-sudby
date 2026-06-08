---
name: Admin panel auth
description: Как устроена авторизация в панели администратора Зеркала Судьбы.
---

JWT с payload `{ role: "admin" }`, подписан тем же `SESSION_SECRET` (или `JWT_SECRET`), срок жизни 24 часа.

**Why:** Отдельный admin JWT изолирует admin-сессии от user-сессий — нельзя использовать user-токен для admin-маршрутов.

**How to apply:**
- `POST /api/admin/login` — принимает `ADMIN_PASSWORD` из env, возвращает JWT.
- Все `/api/admin/*` маршруты проверяют Bearer-токен через `verifyAdminToken()` в `artifacts/api-server/src/routes/admin.ts`.
- Фронт хранит токен в `sessionStorage` (очищается при закрытии вкладки).
- Если `ADMIN_PASSWORD` не установлен — endpoint возвращает 503.
