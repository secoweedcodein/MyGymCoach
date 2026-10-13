# Guía de Arquitectura — MyGymCoach

> Referencia rápida para desarrolladores y agentes IA.
> Para documentación completa, ver `PROJECT_ARCHITECTURE.md`.

## Regla de Oro

> **Antes de crear un archivo, pregunta: ¿A qué feature pertenece? ¿Ya existe el patrón?**

## Dónde colocar código nuevo

| Tipo de código | Ubicación | Ejemplo |
|---|---|---|
| Pantalla de un feature | `features/<domain>/screens/` | `features/nutrition/screens/FoodSearchScreen.js` |
| Hook de un feature | `features/<domain>/hooks/` | `features/nutrition/hooks/useFoodSearch.js` |
| Servicio de un feature | `features/<domain>/services/` | `features/nutrition/services/foodService.js` |
| Componente de un feature | `features/<domain>/components/` | `features/nutrition/components/FoodItem.js` |
| Tipo de un feature | `features/<domain>/types/` | `features/nutrition/types/nutrition.types.ts` |
| Componente compartido | `shared/components/` | `shared/components/ui/GymKeypad.js` |
| Hook compartido | `shared/hooks/` | `shared/hooks/useAuth.ts` |
| Contexto global | `shared/contexts/` | `shared/contexts/AuthProvider.tsx` |
| Función pura | `lib/` | `lib/nutritionCalculator.js` |
| Token de diseño | `lib/theme.js` | Añadir a `colors`, `radius`, etc. |
| Ruta de Expo Router | `app/` | `app/food-search.js` (re-export) |
| Migración SQL | `supabase/migrations/` | `014_nombre.sql` |
| Edge Function | `supabase/functions/` | `supabase/functions/nueva/index.ts` |

## Qué NO hacer

- ❌ Crear archivos en `src/screens/` (legacy, en migración)
- ❌ Importar de un feature hermano (`features/a/` → `features/b/`)
- ❌ Hardcodear colores, radios o spacing (usar `lib/theme.js`)
- ❌ Crear archivos de tema locales
- ❌ Escribir lógica de negocio en componentes de pantalla
- ❌ Hacer fetch directo a Supabase desde componentes UI
- ❌ Crear archivos `.js` nuevos para contexts/hooks/guards (usar `.ts`/`.tsx`)

## Crear un nuevo feature

1. Crear directorio `features/<domain>/`
2. Crear `README.md` con propósito y API pública
3. Crear `types/<domain>.types.ts` con contratos
4. Crear `screens/`, `hooks/`, `services/` según necesidad
5. Crear ruta en `app/` como re-export:
   ```js
   // app/mi-feature.js
   import MiFeatureScreen from '../features/mi-feature/screens/MiFeatureScreen';
   export default function TabMiFeature() { return <MiFeatureScreen />; }
   ```

## Patrón de rutas en `app/`

Las rutas son **thin wrappers** que re-exportan pantallas de features:

```js
// app/(tabs)/home.js
import HomeScreen from '../../features/home/screens/HomeScreen';
export default function TabHome() { return <HomeScreen />; }
```

## Patrón de servicio

```js
// features/<domain>/services/<name>Service.js
import { supabase } from '../../../lib/supabase';

export async function fetchItems(userId) {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}
```

## Patrón de hook

```js
// features/<domain>/hooks/use<Name>.js
import { useState, useEffect } from 'react';
import { fetchItems } from '../services/<name>Service';

export function useItems(userId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchItems(userId)
      .then(data => mounted && setItems(data))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [userId]);

  return { items, loading };
}
```
