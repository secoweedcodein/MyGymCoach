# shared/

Código compartido cross-feature. 

- components/guards/ - Guards de navegación (ProtectedRoute, OnboardingGuard, AdminGuard)
- components/ui/ - Componentes UI genéricos reutilizables
- contexts/ - Contextos globales (AuthProvider, AlertContext, SheetContext)
- hooks/ - Hooks compartidos (useAuth)
- 	ypes/ - Tipos compartidos transversales
- utils/ - Utilidades compartidas puras

**Reglas:** No depender de features específicos. No hacer consultas directas a Supabase. Recibir datos/acciones por props.

