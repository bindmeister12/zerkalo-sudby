# Зеркало Судьбы

Мистическое AI-приложение для мобильных устройств: сканирует ладонь, анализирует астрологию и нумерологию, генерирует персональный отчёт о судьбе с помощью ИИ. Контент носит развлекательный характер.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — запустить API-сервер (порт 8080)
- `pnpm --filter @workspace/ai-destiny-scanner run dev` — запустить Expo приложение (порт 21698)
- `pnpm run typecheck` — полная проверка типов
- `pnpm run build` — typecheck + сборка всех пакетов
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI Integrations (auto-set)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native) + expo-router
- API: Express 5
- AI: OpenAI via Replit AI Integrations (vision + image generation)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Mobile app: `artifacts/ai-destiny-scanner/`
- API server: `artifacts/api-server/`
- Destiny AI route: `artifacts/api-server/src/routes/destiny.ts`
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- Generated API client: `lib/api-client-react/src/generated/`
- DB schema: `lib/db/src/schema/index.ts`

## Architecture decisions

- OpenAI `gpt-5-mini` с vision для анализа ладони + `gpt-image-1` для генерации мистического портрета
- Нумерология и знак зодиака вычисляются на сервере по дате рождения
- Параллельный вызов OpenAI: анализ ладони + генерация портрета одновременно
- Архетипы судьбы и аура выбираются случайно для разнообразия результатов

## Product

Мобильное приложение "Зеркало Судьбы":
- Приветственный экран с мистической анимацией
- Онбординг: имя, дата рождения, пол, время рождения
- Загрузка фото ладони
- Анимация "AI-сканирования"
- Персональный отчёт: профиль личности, сильные/слабые стороны, стиль любви, энергия денег, предсказание будущего, тип родственной души, аура, число судьбы, счастливые числа и дни
- Ежедневные предсказания
- Профиль пользователя

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- После изменения OpenAPI spec нужно запустить `pnpm --filter @workspace/api-spec run codegen`
- API-сервер нужно перезапускать при изменении backend-кода
- Expo HMR работает автоматически при изменении frontend-кода

## Ads (Yandex Mobile Ads)

- В Expo Go и web-превью работает `StubAdsProvider` (мок-экраны).
- В EAS-сборке с подключённым нативным SDK Yandex автоматически активируется
  `YandexAdsProvider` — выбор делает `services/adsProvider.tsx`.
- Env: `EXPO_PUBLIC_YANDEX_INTERSTITIAL_ID`, `EXPO_PUBLIC_YANDEX_REWARDED_ID`
  (без них — Stub).
- Полная инструкция по подключению нативного SDK и EAS Build — в
  `docs/ads-setup.md`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
