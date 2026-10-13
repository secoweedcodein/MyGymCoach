# My Gym Coach — Arquitectura del Proyecto (Fase 02)

> Esquema canónico para que desarrolladores humanos o agentes IA entiendan la estructura,
> capas, flujos y convenciones del proyecto. **Última actualización: Fase 02.**

## 1. Visión general

Aplicación móvil React Native + Expo Router + Supabase para seguimiento de entrenamiento,
nutrición y contenido fitness. Arquitectura **Feature-First modular**, offline-first con
idempotencia y flujo de auth reactivo.

## 2. Stack Tecnológico

- **Framework**: React Native 0.81.5 + Expo SDK 54 (managed)
- **Routing**: Expo Router ~6.0.24 (file-based)
- **Backend/Auth/DB**: Supabase (Postgres + Auth + RLS + RPCs + Edge Functions)
- **Estado**: React Context + custom hooks (AuthProvider)
- **Almacenamiento local**: AsyncStorage
- **Red/Offline**: @react-native-community/netinfo
- **Utilidades**: date-fns, lodash
- **UI**: Componentes nativos + StyleSheet
- **Lenguaje canónico**: TypeScript (migración progresiva desde JS)

## 3. Arquitectura de Capas

```
┌──────────────────────────────────────────────────────────┐
│  CAPA 1 — Routing           app/                         │
│  Expo Router file-based. Solo re-exports y guards.       │
├──────────────────────────────────────────────────────────┤
│  CAPA 2 — Features          features/<domain>/           │
│  Dominios autocontenidos (workout, routines, nutrition…)  │
├──────────────────────────────────────────────────────────┤
│  CAPA 3 — Shared            shared/  (migración en curso)│
│  Componentes, hooks y contextos cross-feature.           │
│  Actual: src/contexts/, src/hooks/, src/components/      │
├──────────────────────────────────────────────────────────┤
│  CAPA 4 — Services          services/                    │
│  Infraestructura: cola offline, network listener.        │
├──────────────────────────────────────────────────────────┤
│  CAPA 5 — Core / Lib        lib/                         │
│  supabase client, theme tokens, lógica pura, retry.      │
├──────────────────────────────────────────────────────────┤
│  CAPA 6 — Backend           supabase/                    │
│  Migraciones SQL, RPCs, Edge Functions (Deno).           │
└──────────────────────────────────────────────────────────┘
```

**Regla de dependencia**: Las capas solo pueden depender de capas inferiores.
Nunca de capas superiores ni de features hermanas.

## 4. Estructura de Carpetas Canónica

```text
mygymcoach/
├── app/                        # Expo Router (file-based routing)
│   ├── _layout.js              # Root → Providers (Auth, Alert, Sheet, Offline)
│   ├── index.js                # Entry → Splash + navegación reactiva
│   ├── auth.js                 # Re-export AuthScreen
│   ├── onboarding.js           # Re-export OnboardingScreen
│   ├── workout.js              # Re-export WorkoutScreen
│   ├── (auth)/                 # Grupo auth
│   ├── (tabs)/                 # Grupo tabs (ProtectedRoute + OnboardingGuard)
│   │   ├── home.js
│   │   ├── explore.js
│   │   ├── coach.js
│   │   └── profile.js
│   ├── admin/                  # Rutas admin (AdminGuard)
│   └── explore/                # Sub-rutas explore
│
├── features/                   # Feature-First modular (11 dominios)
│   ├── auth/                   # Autenticación y onboarding
│   ├── workout/                # Entrenamiento ✅ (migrado)
│   ├── routines/               # Gestión de rutinas
│   ├── nutrition/              # Nutrición, alimentos, recetas
│   ├── explore/                # Contenido, retos, artículos
│   ├── coach/                  # Coach IA
│   ├── profile/                # Perfil y BMI
│   ├── home/                   # Dashboard principal
│   ├── history/                # Historial de entrenamientos
│   ├── steps/                  # Podómetro
│   └── admin/                  # Panel administrativo
│
├── shared/                     # Código compartido cross-feature
│   ├── components/             # guards/, ui/, feedback/, layout/
│   ├── contexts/               # AuthProvider, AlertContext, SheetContext
│   ├── hooks/                  # useAuth, useHomeData
│   └── types/                  # Tipos globales
│
├── services/                   # Servicios de infraestructura
│   └── offline/                # mutationQueueService, networkListener
│
├── lib/                        # Núcleo y utilidades puras
│   ├── supabase.js             # Cliente Supabase (singleton)
│   ├── theme.js                # Design system (ÚNICO source of truth)
│   ├── offline/                # network, retry, storageKeys
│   ├── trainingLogic.js        # Lógica pura entrenamiento
│   ├── nutritionCalculator.js  # Lógica pura nutrición
│   └── ...                     # dateUtils, errors, logger, cache
│
├── supabase/                   # Backend
│   ├── migrations/             # 14 migraciones SQL (000-013)
│   ├── functions/              # Edge Functions (coach-chat, coach-analysis, generate-recipe)
│   └── config.toml
│
├── assets/                     # Recursos estáticos
│
└── src/                        # ⚠️ LEGACY (migración en curso a features/ y shared/)
    ├── contexts/               # → shared/contexts/
    ├── hooks/                  # → shared/hooks/
    ├── components/             # → shared/components/
    ├── screens/                # → features/<domain>/screens/
    ├── context/                # → shared/contexts/
    └── ui/                     # → shared/components/ui/
```

## 5. Blueprint de Feature Module

Cada feature sigue exactamente esta estructura interna:

```text
features/<domain>/
├── README.md               # Propósito, API pública, dependencias
├── index.ts                # Barrel export
├── types/<domain>.types.ts # Contratos TypeScript
├── screens/                # Pantallas (export default)
├── hooks/                  # Custom hooks (named export)
├── services/               # Persistencia/sync (named exports)
├── components/             # UI desacoplada (named export, opcional)
└── utils/                  # Lógica pura (opcional)
```

## 6. Autenticación y Navegación

### Flujo reactivo
`Auth → Session → Onboarding (si perfil incompleto) → App (Tabs/Home)`

### Componentes
- **AuthProvider** (`src/contexts/AuthProvider.tsx`): Source of truth. `getSession()` + `onAuthStateChange()`.
- **useAuth** (`src/hooks/useAuth.ts`): Consumo del contexto.
- **ProtectedRoute**: Expulsa no autenticados a `/auth`.
- **OnboardingGuard**: Fuerza completar onboarding.
- **AdminGuard**: Verifica rol admin (JWT/RPC).

### Entry Point
`app/index.js`: `useAuth` + AsyncStorage onboarding → navegación reactiva.

## 7. Sistema de Entrenamiento (Feature Workout)

### Feature `features/workout/`
- **Tipos**: `WorkoutSession`, `WorkoutSet`, `ExerciseEntry`, `MutationState`
- **Utils**: Volumen, 1RM (Brzycki), PRs, progresión, streaks (puro, determinista)
- **Hooks**: `useWorkoutSession`, `useWorkoutTimer`, `useRestTimer`, `useWorkoutHydration`, `useWorkoutRecovery`
- **Components**: TimerFloating, ExerciseCard, SetRow, SetEditorModal, etc.
- **Screen**: WorkoutScreen.js (orquesta hooks + UI)

## 8. Offline-First + Idempotencia

### Pipeline
`UI → AsyncStorage → Cola de Mutaciones → Network Listener → Retry → Supabase RPC`

### Máquina de estados
`pending → syncing → synced | failed` (con `permanent`, `maxAttempts`, `nextRetryAt`).

### Idempotencia
- `idempotency_key`: `wk_<hash(userId:startedAt)>` (índice único en DB)
- `client_generated_id` (UUID) para dedupe local
- RPC `finish_workout(p_session, p_sets)` transaccional e idempotente

### Infraestructura
- Cola: `services/offline/mutationQueueService.js`
- Processor: `features/workout/services/workoutQueueProcessor.js`
- Network: `lib/offline/network.js` + `services/offline/networkListener.js`
- Sync Manager: `src/components/OfflineSyncManager.js` en `app/_layout.js`
- Retry: `lib/offline/retry.js` (backoff exponencial + jitter)

## 9. Design System

### Source of Truth: `lib/theme.js`

| Export | Contenido |
|---|---|
| `colors` | Paleta completa (bg, accent, estado, texto, bordes) |
| `radius` | sm(10), md(16), lg(22), xl(28), full(999) |
| `spacing` | xs(4), sm(8), md(16), lg(24), xl(32) |
| `type` | display, title, body, caption, label |
| `shadow` | card shadow preset |

**Regla**: Todo color, radio, spacing y tipografía se importa de `lib/theme.js`.
Prohibido hardcodear valores en StyleSheets.

## 10. Convenciones

### Nombres
- Pantallas: `PascalCase` + `Screen` (e.g., `RoutinesScreen.js`)
- Componentes: `PascalCase` (e.g., `ExerciseCard.js`)
- Hooks: `camelCase` + `use` (e.g., `useWorkoutSession.js`)
- Servicios: `camelCase` + `Service` (e.g., `foodService.js`)
- Rutas: `kebab-case` minúsculas (e.g., `history-detail.js`)

### Arquitectura
- **Feature-First**: Dominio encapsulado en `features/`. Sin acoplamiento cross-feature.
- **Lógica pura vs side-effects**: Utils 100% puros. Services/hooks concentran efectos.
- **Estado único**: Auth centralizado. Estado local + cola offline por feature.
- **Idempotente + resiliente**: Nunca pierde datos offline.
- **Type-first contracts**: Tipos definidos antes de implementar.

## 11. Puntos de Entrada Críticos

- `app/_layout.js` — Providers raíz (Auth + Alert + Sheet + Offline)
- `app/index.js` — Navegación reactiva
- `features/workout/screens/WorkoutScreen.js` — Orquestación entrenamiento
- `services/offline/mutationQueueService.js` — Núcleo cola offline
- `features/workout/services/workoutSyncService.js` — Sincronización RPC/fallback
- `src/contexts/AuthProvider.tsx` — Source of truth auth
- `lib/theme.js` — Source of truth design system

## 12. Base de Datos (Supabase)

### Tablas clave
- `user_profiles`, `workout_sessions`, `workout_sets`
- `routines`, `routine_exercises`
- `foods`, `nutrition_entries`, `meal_plans`
- `articles`, `recipes`, `challenges`, `trends`

### RPCs
- `finish_workout(p_session, p_sets)` — Transaccional e idempotente (SECURITY DEFINER)
- `assert_admin()` — Verificación de rol

### Edge Functions
- `coach-chat` — Chat IA (OpenAI)
- `coach-analysis` — Análisis de entrenamiento
- `generate-recipe` — Generación de recetas

## 13. Estado de Migración

| Carpeta | Estado | Destino |
|---|---|---|
| `features/workout/` | ✅ Migrado | — |
| `src/contexts/` | 🔲 Pendiente | `shared/contexts/` |
| `src/hooks/` | 🔲 Pendiente | `shared/hooks/` |
| `src/components/guards/` | 🔲 Pendiente | `shared/components/guards/` |
| `src/screens/` | 🔲 Pendiente | `features/<domain>/screens/` |
| `components/` | 🔲 Pendiente | `shared/components/ui/` |
| `components/home/` | 🔲 Pendiente | `features/home/components/` |
| `services/` (feature-specific) | 🔲 Pendiente | `features/<domain>/services/` |
