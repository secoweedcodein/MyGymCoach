# Workout Feature (FASE 3 + 4)

Arquitectura Feature-First modular para el sistema de entrenamiento.

## Estructura
- `types/` — Contratos y tipos (JS/TS)
- `utils/` — Lógica pura (métricas, idempotencia)
- `services/` — Persistencia local + sync + cola
- `hooks/` — Estado reactivo + timers + hidratación
- `components/` — UI desacoplada
- `screens/` — Pantallas feature

## Pipeline Offline
UI → AsyncStorage → Mutation Queue (`pending → syncing → synced | failed`) → `OfflineSyncManager` (red + AppState foreground + evento de encolado) → Retry exponencial con jitter → Supabase RPC `finish_workout` con fallback idempotente.

- `failed` con `permanent=false`: reintentable (`nextRetryAt` + `maxAttempts`).
- `failed` con `permanent=true`: dead-letter, no se reintenta.
- Ítems en `syncing` más de 2 min se recuperan (app cerrada a mitad de envío).
- `OfflineSyncManager` se monta en `app/_layout.js` dentro de `AuthProvider`.

## Idempotencia
- `idempotency_key` estable por sesión (userId + startedAt); índice único en DB.
- `client_generated_id` (UUID) local para dedupe de la cola (no se persiste en columnas).
- RPC upsert por clave + verificación previa en el fallback.

## Recuperación local
`services/activeWorkoutStorage.js` usa `@mygymcoach_active_workout_v2` y migra automáticamente la clave legada `@mygymcoach_active_workout`.
