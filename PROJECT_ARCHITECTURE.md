# My Gym Coach — Arquitectura del Proyecto

> Esquema generado para que IAs entiendan la estructura, capas y flujos del proyecto.

## 1. Visión general
Aplicación móvil React Native + Expo Router + Supabase para seguimiento de entrenamiento, nutrición y contenido fitness. Arquitectura modular por features, offline-first con idempotencia y flujo de auth reactivo.

## 2. Stack Tecnológico
- **Framework**: React Native + Expo (managed)
- **Routing**: Expo Router (file-based)
- **Backend/Auth/DB**: Supabase (Postgres + Auth + RLS + RPCs)
- **Estado**: React hooks + Context (AuthProvider)
- **Almacenamiento local**: AsyncStorage
- **Red/Offline**: @react-native-community/netinfo
- **Utilidades**: date-fns, lodash, etc.
- **UI**: Componentes nativos + estilos StyleSheet

## 3. Estructura de Carpetas

```text
mygymcoach/
├── app/                        # Expo Router (file-based routing)
│   ├── _layout.js              # Root layout + AuthProvider + ErrorBoundary
│   ├── index.js                # Entry point (splash + navegación reactiva)
│   ├── auth.js                 # Re-export AuthScreen
│   ├── onboarding.js           # Re-export Onboarding
│   ├── workout.js              # Re-export WorkoutScreen (feature)
│   ├── (auth)/                 # Grupo auth
│   │   ├── _layout.js
│   │   ├── index.js
│   │   └── login.js
│   ├── (tabs)/                 # Grupo tabs principal
│   │   ├── _layout.js          # ProtectedRoute + OnboardingGuard
│   │   ├── home.js
│   │   ├── explore.js
│   │   ├── coach.js
│   │   ├── profile.js
│   │   └── workout.js          # Re-export WorkoutScreen
│   └── admin/                  # Rutas admin
│       └── _layout.js          # AdminGuard
├── features/                   # Feature-First modular
│   └── workout/                # Feature: Sistema de entrenamiento
│       ├── README.md
│       ├── types/              # Contratos (workout.types.ts/js)
│       ├── utils/              # Lógica pura
│       │   ├── metrics.js      # Volumen, PR, progresión, streaks
│       │   └── idempotency.js  # UUIDs + idempotency keys
│       ├── services/           # Persistencia/sync
│       │   ├── activeWorkoutStorage.js
│       │   ├── workoutSyncService.js
│       │   └── workoutQueueProcessor.js
│       ├── hooks/               # Estado reactivo
│       │   ├── useWorkoutSession.js
│       │   ├── useWorkoutTimer.js
│       │   ├── useRestTimer.js
│       │   ├── useWorkoutHydration.js
│       │   └── useWorkoutRecovery.js
│       ├── components/          # UI desacoplada
│       │   ├── TimerFloating.js
│       │   ├── ExerciseCard.js
│       │   ├── SetRow.js
│       │   ├── SetEditorModal.js
│       │   ├── ExerciseSelectorModal.js
│       │   ├── RestTimerModal.js
│       │   └── CircularTimer.js
│       └── screens/             # Pantallas feature
│           └── WorkoutScreen.js
├── src/                        # Código compartido (legacy + core)
│   ├── contexts/
│   │   ├── AuthProvider.js/tsx # Auth global (getSession + onAuthStateChange)
│   │   └── AlertContext.js
│   ├── hooks/
│   │   └── useAuth.js/tsx      # Hook consumo auth
│   ├── components/
│   │   ├── guards/             # Guards de rutas
│   │   │   ├── ProtectedRoute.js/tsx
│   │   │   ├── OnboardingGuard.js/tsx
│   │   │   └── AdminGuard.js/tsx
│   │   ├── ErrorBoundary.js
│   │   ├── ExerciseIcon.js
│   │   ├── WeightChart.js
│   │   ├── BottomTabBar.js
│   │   ├── PlateCalculatorModal.js
│   │   ├── RPESelector.js
│   │   └── GymKeypad.js
│   ├── screens/                 # Screens legacy (migrados parcialmente)
│   │   ├── authscreen.js
│   │   ├── OnboardingScreen.js
│   │   ├── homeScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── workoutscreen.js     # Compat → feature
│   │   ├── hooks/               # Hooks específicos screens
│   │   └── data/                # Datos estáticos
│   └── context/                 # Contexts adicionales
├── services/                    # Servicios globales
│   ├── offline/
│   │   ├── mutationQueueService.js  # Cola con estados + idempotencia
│   │   └── networkListener.js       # Listener conectividad + AppState
│   ├── exportService.js
│   ├── userRecipeService.js
│   ├── foodService.js
│   └── ...
├── lib/                         # Utilidades núcleo
│   ├── offline/
│   │   ├── network.js           # NetInfo wrapper
│   │   ├── retry.js            # withRetry + backoff+jitter
│   │   └── storageKeys.js      # Claves unificadas
│   ├── trainingLogic.js         # Lógica pura entrenamiento
│   ├── nutritionCalculator.js
│   ├── nutritionConstants.js
│   ├── supabase.js             # Cliente Supabase
│   └── adminAuth.js            # Verificación admin
├── supabase/
│   ├── migrations/              # Migraciones SQL
│   │   └── 20251004100000_add_finish_workout_rpc.sql  # RPC transaccional
│   └── functions/               # Edge Functions
└── PROJECT_ARCHITECTURE.md      # Este esquema
```

## 4. Arquitectura de Capas

| Capa | Ubicación | Responsabilidad |
|---|---|---|
| **Routing/UI** | `app/` | Navegación file-based, layouts, guards |
| **Features** | `features/*` | Dominio modular (workout). Aislado, reutilizable, testeable |
| **Screens/Shared** | `src/screens`, `src/components` | UI compartida y screens legacy |
| **Hooks** | `features/*/hooks`, `src/hooks` | Estado reactivo, side-effects acotados |
| **Services** | `services/` | Persistencia, sync, colas, integraciones externas |
| **Core/Utils** | `lib/` | Lógica pura, helpers, infraestructura (offline, retry) |
| **Data** | `supabase/` | DB schema, RPCs, Edge Functions |

## 5. Autenticación y Navegación

### Flujo reactivo (estricto)
`Auth (Login/Registro) → Session (validación global) → Onboarding (perfil incompleto) → App (Main Tabs/Home)`

### Componentes
- **`AuthProvider`** (`src/contexts/AuthProvider.js/tsx`): Único source of truth. Inicializa con `supabase.auth.getSession()` + escucha `supabase.auth.onAuthStateChange()`. Expone `user`, `session`, `isLoading`.
- **`useAuth`** (`src/hooks/useAuth.js/tsx`): Consumo del contexto sin prop-drilling.
- **`ProtectedRoute`**: Expulsa no autenticados a `/auth`.
- **`OnboardingGuard`**: Fuerza a completar onboarding si perfil incompleto.
- **`AdminGuard`**: Verifica rol admin (JWT/RPC/perfiles).

### Entry Point
`app/index.js`: Usa `useAuth` + AsyncStorage onboarding → navegación reactiva (sin listeners dispersos).

## 6. Sistema de Entrenamiento (FASE 3)

### Feature `features/workout/`
- **Tipos**: Contratos claros (`WorkoutSession`, `WorkoutSet`, `ExerciseEntry`, `MutationState`)
- **Utils**: Volumen, estadísticas, 1RM estimado (Brzycki), PRs, progresión, detección plateau, streaks (puro, determinista)
- **Hooks**: `useWorkoutSession` (estado sesión activa + persistencia), `useWorkoutTimer` (timer), `useRestTimer` (descanso con vibración), `useWorkoutHydration`/`useWorkoutRecovery` (recuperación ante cierres inesperados)
- **Components**: UI desacoplada (TimerFloating, ExerciseCard, SetRow, SetEditorModal, ExerciseSelectorModal, RestTimerModal, CircularTimer)
- **Screen**: `WorkoutScreen.js` modular (orquesta hooks + lógica UI)

## 7. Offline-First + Idempotencia (FASE 4)

### Pipeline estricto
$$\text{Acción de UI} \longrightarrow \text{AsyncStorage (Local)} \longrightarrow \text{Cola de Mutaciones (Queue)} \longrightarrow \text{Network Listener} \longrightarrow \text{Retry} \longrightarrow \text{Supabase RPC}$$

### Máquina de estados
Cada ítem de cola: `pending → syncing → synced | failed` (con `error`, `attempts`, `lastAttemptAt`, `nextRetryAt`, `permanent`, `maxAttempts`).
- `failed` + `permanent=false` → reintentable (backoff + `nextRetryAt`).
- `failed` + `permanent=true` → dead-letter (error no reintentable o `maxAttempts` agotado).
- `syncing` > 2 min → se recupera (app cerrada a mitad de envío).

### Idempotencia
- `idempotency_key` estable: `wk_<hash(userId:startedAt)>` (índice único en DB)
- `client_generated_id` (UUID v4) local para dedupe de la cola (no se persiste como columna)
- Dedupe por clave, verificación previa de sesión existente
- Escritura preferente vía **RPC `public.finish_workout(p_session JSONB, p_sets JSONB)`** (transaccional, SECURITY DEFINER, idempotente; definido en `008_training_engine.sql`). Fallback 2-pasos (columnas reales + `exercise_id` UUID o NULL) si el RPC no está.

### Infraestructura offline
- **Cola**: `services/offline/mutationQueueService.js` (estados + metadatos + FIFO + evento de cambio)
- **Processor**: `features/workout/services/workoutQueueProcessor.js` (secuencial, backoff con `nextRetryAt`, dead-letter)
- **Network**: `lib/offline/network.js` + `services/offline/networkListener.js` (NetInfo + AppState foreground)
- **Ciclo de vida**: `src/components/OfflineSyncManager.js`, montado en `app/_layout.js` dentro de `AuthProvider`
- **Retry**: `lib/offline/retry.js` + backoff exponencial con **jitter** y tope configurable

### Persistencia estado activo
`features/workout/services/activeWorkoutStorage.js` usa `@mygymcoach_active_workout_v2` y migra la clave legada `@mygymcoach_active_workout` (rehidratación + recuperación automática).

## 8. Base de Datos (Supabase)

### Tablas clave (workout)
- `workout_sessions` (PK uuid, user_id FK, `idempotency_key` text, métricas)
- `workout_sets` (PK uuid, session_id FK, ejercicio + series + completado)
- `routines`, `routine_exercises` (plantillas)

### RPCs
- `public.finish_workout(p_session JSONB, p_sets JSONB)` — Guarda sesión+sets de forma transaccional e idempotente (SECURITY DEFINER). Retorna sesión creada/identificada.

## 9. Convenciones

- **Feature-First**: Dominio encapsulado en `features/`. Evita acoplamiento cross-feature.
- **Lógica pura vs side-effects**: Utils/metrics 100% puros (testeables). Services/hooks concentran efectos.
- **Estado único**: Auth centralizado. Estado de workout local + cola offline.
- **Idempotente + resiliente**: Nunca pierde datos offline; evita duplicados en reconexiones.
- **Type-first contracts**: Tipos compartidos en `features/workout/types/`.
- **Compatibilidad hacia atrás**: Re-exports mantienen imports existentes.

## 10. Puntos de Entrada Críticos
- `app/_layout.js` — Providers raíz (Auth + UI)
- `app/index.js` — Navegación reactiva
- `features/workout/screens/WorkoutScreen.js` — Orquestación entrenamiento
- `services/offline/mutationQueueService.js` — Núcleo cola offline
- `features/workout/services/workoutSyncService.js` — Sincronización RPC/fallback
- `src/contexts/AuthProvider.js` — Source of truth auth
