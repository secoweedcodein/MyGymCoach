# Excepciones de Acceso a Supabase (Fase 02)

Las siguientes excepciones están **justificadas y documentadas**. Se mantienen en su ubicación actual para evitar refactorizaciones arriesgadas fuera del alcance seguro de esta fase.

## Criterios
- Operaciones extremadamente sencillas sin lógica de negocio compleja
- Alto acoplamiento / riesgo de regresión sin valor arquitectónico claro ahora
- Pendientes para migración controlada en fase posterior

## Inventario

### src/screens/RoutinesScreen.js
- Consultas directas a Supabase para listar/guardar/editar rutinas y routine_exercises
- **Justificación:** Pantalla monolítica con mucha lógica de UI; migración completa requiere refactor extenso. Se ha creado eatures/routines/services/routinesService.js como API preparada para migración incremental.
- **Estado:** Pendiente migración (parcialmente preparado)

### src/screens/ProfileScreen.js
- Consultas a user_profiles/auth
- **Justificación:** Mezcla con UI compleja; preparado con eatures/profile/services/profileService.js
- **Estado:** Pendiente

### src/screens/FoodSearchScreen.js, NutritionScreen.js, MealpPlanScreen.js
- Consultas de nutrición
- **Justificación:** Dominio nutrition amplio; existen referencias en código; migración incremental planificada
- **Estado:** Pendiente

### src/screens/HistoryScreen.js, HistoryDetailScreen.js
- Consultas a workout_sessions/workout_sets
- **Justificación:** Parcialmente relacionado con features/workout; preparado con eatures/history/services/historyService.js
- **Estado:** Pendiente

### src/screens/explore/*, src/screens/admin/*, src/screens/CoachChatScreen.js
- Varias consultas específicas de dominio
- **Justificación:** Múltiples dominios, menor prioridad o mayor acoplamiento
- **Estado:** Pendiente migración controlada

### src/screens/authscreen.js, hooks/screens/hooks/useNutrition.js
- Autenticación/nutrición
- **Justificación:** Casos puntuales; evaluar caso por caso
- **Estado:** Pendiente

## Recomendación
Migrar por feature usando los servicios creados cuando se toque el archivo por bugfix/mejora (regla del boy scout) para reducir riesgo.
