# MyGymCoach - Arquitectura Oficial (Fase 02)

> Documento canónico para desarrolladores humanos y agentes IA. Debe mantenerse actualizado con cada migración arquitectónica.

## 1. Objetivo
Establecer una arquitectura mantenible, escalable y coherente basada en **Feature-First modular**, adaptada al estado real del proyecto. El objetivo es que nuevas funcionalidades puedan añadirse sin inventar estructuras, duplicar servicios o romper convenciones.

## 2. Visión General
Aplicación móvil React Native + Expo Router + TypeScript/JS + Supabase para seguimiento de entrenamiento, nutrición, progreso, exploración y coach IA. Arquitectura offline-first con idempotencia para el flujo de entrenamiento.

**Stack:** React Native 0.81.5, Expo SDK 54, Expo Router ~6.0.24, Supabase (Auth/Postgres/RLS/RPC/Edge Functions), Zustand/Context API, AsyncStorage, NetInfo.

## 3. Estructura Oficial de Carpetas

`
mygymcoach/
├── app/                        # Capa de enrutamiento (Expo Router) - thin wrappers/re-exports
├── features/                   # Lógica de negocio por dominio (autocontenido)
├── shared/                     # Código compartido cross-feature (en consolidación)
│   ├── components/             # Componentes reutilizables compartidos
│   │   ├── guards/             # Guards de navegación
│   │   └── ui/                 # Componentes UI genéricos
│   ├── contexts/               # Contextos globales compartidos
│   ├── hooks/                  # Hooks compartidos cross-feature
│   └── types/                  # Tipos globales compartidos
├── services/                   # Infraestructura transversal (offline queue/listeners)
│   └── offline/
├── lib/                        # Infraestructura técnica y utilidades puras
│   ├── offline/                # network/retry/storageKeys
│   └── supabase.js             # Cliente Supabase singleton
├── components/                 # Componentes compartidos existentes (transición)
├── src/                        # LEGACY - en migración progresiva hacia features/shared
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── screens/
│   └── ui/
├── assets/
└── supabase/                   # Migraciones, RPCs, Edge Functions
`

> Nota: shared/ se está creando para consolidar lo que hoy vive en src/. src/ permanece mientras se migra para evitar romper imports.

## 4. Responsabilidades por Directorio

### 4.1 pp/ - Routing y Composición
- Define rutas con Expo Router (file-based). 
- **Thin wrappers**: re-exportan pantallas desde eatures/*/screens/ o desde módulos migrados.
- Grupos (auth), (tabs), rutas admin/explore según estructura actual.
- Aplicar guards vía composición cuando corresponda.
- **NO**: lógica de negocio compleja, consultas directas a Supabase con lógica de dominio, cálculos reutilizables.

### 4.2 eatures/ - Funcionalidades del Negocio
Cada dominio autocontenido. Estructura sugerida (usar solo lo necesario):
`
features/<domain>/
├── README.md
├── index.ts (barrel opcional - evitar re-exports indiscriminados)
├── components/     # Componentes exclusivos del feature
├── hooks/          # Hooks específicos del feature
├── screens/        # Pantallas del feature (export default)
├── services/       # Acceso a datos / lógica de negocio del feature
├── types/          # Tipos locales/dominio
├── utils/          # Funciones puras específicas
└── schemas/        # Validaciones si aplica
`

Dominios existentes/relevantes: uth, workout (migrado), outines, 
utrition, explore, coach, profile, home, history, steps, dmin (según código real).

### 4.3 shared/ - Compartido Cross-Feature
- shared/components/guards/: ProtectedRoute, OnboardingGuard, AdminGuard
- shared/components/ui/: Componentes UI genéricos reutilizables
- shared/contexts/: AuthProvider, AlertContext, SheetContext (globales)
- shared/hooks/: Hooks compartidos (useAuth, etc.)
- shared/types/: Tipos compartidos verdaderamente transversales

**Regla:** Componentes compartidos NO deben depender de features específicos, NO deben hacer consultas directas a Supabase. Deben recibir datos/acciones por props.

### 4.4 services/ - Infraestructura Transversal
Reservado para integraciones compartidas: cola offline (services/offline/), listeners de red, etc. **NO** acumular todos los servicios de features aquí. Los servicios específicos van en eatures/<domain>/services/.

### 4.5 lib/ - Infraestructura Técnica
Cliente Supabase (lib/supabase.js singleton), theme (lib/theme.js - source of truth), utilidades puras transversales (dateUtils, errors, logger, cache, lógica pura como 	rainingLogic.js, 
utritionCalculator.js), retry/network helpers.

## 5. Reglas de Dependencias
**Dirección:** pp/ → eatures//shared/ → services//lib/. Capas inferiores no dependen de superiores.

- Features **NO** deben importar entre sí (acoplamiento cruzado prohibido). Si necesitan compartir, usar shared/ o contratos explícitos.
- shared/ NO depende de eatures/.
- Servicios/hooks pueden usar lib/ y cliente Supabase.
- Componentes UI compartidos son puros (props + callbacks).
- Evitar dependencias circulares.

## 6. Convenciones

### Nomenclatura
- Componentes React: PascalCase (ej. ExerciseCard.js)
- Pantallas: PascalCase + Screen (ej. RoutinesScreen.js)
- Hooks: camelCase con prefijo use (ej. useWorkoutSession.js)
- Servicios: camelCase + Service (ej. oodService.js)
- Tipos/Interfaces: PascalCase
- Funciones/variables: camelCase
- Constantes globales: UPPER_SNAKE_CASE cuando aplique
- Rutas Expo Router: respetar convención existente (kebab-case en algunos casos)

### Imports
- Mantener orden: externos → internos/aliases → relativos
- Evitar imports sin uso
- Respetar aliases existentes en 	sconfig.json/Babel/Metro (no añadir nuevos sin revisar)
- Evitar rutas relativas excesivamente largas cuando hay estructura clara
- Preferir imports desde interfaz pública del módulo cuando exista

### Exportaciones
- Preferir named exports para servicios/hooks/utils/tipos cuando encajan con estilo actual
- Default export donde lo exija framework/convensión existente (pantallas)
- Evitar index.ts reexportando indiscriminadamente
- Solo exportar API pública

## 7. Encapsulación de Supabase
**Regla:** Las pantallas NO deben concentrar consultas complejas de negocio. 

- **Operaciones específicas de feature** → eatures/<domain>/services/
- **Operaciones transversales** → evaluar caso por caso; si justificadas y compartidas, podrían ir a services/ o shared/
- **Hooks** coordinan estado/ciclo de vida y delegan a servicios
- **Componentes UI** reciben datos/acciones por props
- Mantener filtros/orden/relaciones/permisos/RLS tal como están (NO cambiar esquema/RLS/datos)
- Documentar excepciones cuando una operación sencilla debe permanecer en pantalla por razones técnicas concretas
- No exponer claves/credenciales

**Estado actual:** Mayoría de consultas en src/screens/ (71+ referencias detectadas). eatures/ aún con pocas llamadas directas. Migración incremental requerida.

## 8. Tipos y Contratos
- Distinguir: tipos de BD (Supabase), tipos de dominio, tipos de entrada/salida de servicios, props de componentes
- Evitar duplicados; si compartido entre módulos, ubicar en shared/types/ o eatures/*/types/ según alcance
- Aprovechar tipos generados por Supabase si existen/usables
- No usar ny para "arreglar" rápido; tipar lo necesario
- Conversiones explícitas si modelos persisten ↔ dominio difieren

## 9. Migración Gradual
**Principios:** Pequeños cambios verificables, sin rediseño visual, sin cambiar lógica de negocio/esquema/RLS.

Orden sugerido:
1. Consolidar estructura shared/ (guards/contexts/hooks) y crear docs/architecture.md (hecho/ en proceso)
2. Migrar cross-cutting compartido (src/contexts/*, src/hooks/useAuth.ts, src/components/guards/*) hacia shared/ manteniendo compatibilidad
3. Identificar y encapsular accesos Supabase más problemáticos por feature (empezar por los que ya tienen eatures/<domain>/)
4. Migrar pantallas de src/screens/ a eatures/<domain>/screens/ cuando dominio claro y acoplamiento manejable
5. Mover componentes compartidos genéricos a shared/components/

Siempre: documentar, actualizar imports, verificar typecheck/lint, comparar con baseline.

## 10. Validación
Tras cada bloque: 
pm run typecheck, 
pm run lint (si aplica), revisar imports/exports, rutas Expo Router, inicializar app no romper. Errores pre-existentes no atribuir a migración; errores nuevos investigar.

## 11. Deuda Técnica Pendiente (Detectada)
- Gran parte de lógica y consultas en src/screens/ (especialmente RoutinesScreen.js, HistoryDetailScreen.js, etc.)
- src/contexts/ y src/hooks/ aún no consolidados en shared/ (arquitectura documenta destino pero no migrado completamente)
- src/components/guards/ no movidos a shared/components/guards/
- Muchos componentes en components/ raíz podrían reorganizarse
- Mezcla JS/TS; migración progresiva a TS
- Algunos servicios en services/ raíz vs eatures/*/services/ - clarificar responsabilidades
- Barrel files (index.*) inexistentes o poco usados - evitar re-exports masivos

## 12. Procedimiento para Nueva Funcionalidad
1. Identificar dominio → crear/usar eatures/<dominio>/
2. Definir tipos en 	ypes/
3. Servicio para datos en services/ (si usa Supabase)
4. Hook para lógica/estado en hooks/
5. Componentes UI exclusivos en components/
6. Pantalla en screens/ (export default)
7. Añadir ruta thin wrapper en pp/ si expuesta via navegación
8. Usar solo lib/theme.js para estilos, recibir datos por props si componente compartido
9. Seguir reglas de dependencias

## 13. Excepciones Justificadas
Documentar caso por caso. Ejemplos potenciales: operaciones extremadamente simples, código legacy con acoplamiento temporal hasta refactor mayor. NO usar como excusa para añadir nuevas violaciones.

## 14. Estado de Migración (Actual)
- **Consolidado/documentado:** Capas, convenciones, blueprint de feature (ver PROJECT_ARCHITECTURE.md, ARCHITECTURE_GUIDE.md)
- **Parcialmente migrado:** eatures/workout/ (bien estructurado), resto de features existen pero estructura interna variable
- **Pendiente:** Mover shared desde src/ a shared/ manteniendo compatibilidad; encapsular consultas Supabase desde src/screens/; reorganizar guards/contexts/hooks
