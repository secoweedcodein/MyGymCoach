# Notas de despliegue — F5 (nutrición) y F6 (Coach IA + recetas IA)

Pasos para llevar las migraciones de F5 y las Edge Functions de F6 a un proyecto
Supabase (local o remoto). Requiere: Docker, Supabase CLI (`npx supabase`) y una
clave de OpenAI.

## 0. Prerrequisitos

- Docker en ejecución (para el stack local `supabase start`).
- CLI de Supabase: `npx supabase --version`.
- `OPENAI_API_KEY` válida (se guarda SOLO como secreto del proyecto, nunca en el repo).

## 1. Configuración (ya hecha en el repo)

- `supabase/config.toml` registra las tres funciones con `verify_jwt = true`:
  - `[functions.coach-chat]` → `supabase/functions/coach-chat/index.ts`
  - `[functions.coach-analysis]` → `supabase/functions/coach-analysis/index.ts`
  - `[functions.generate-recipe]` → `supabase/functions/generate-recipe/index.ts`
- `verify_jwt = true` en el gateway: cualquier llamada sin token JWT válido es rechazada;
  el `userId` se deriva del token (nunca del cuerpo), evitando IDOR.

## 2. Despliegue local (opcional, para pruebas)

```powershell
npx supabase start                       # levanta Postgres + Edge Runtime + Studio
npx supabase db reset                    # aplica todas las migraciones (incluye 009)
npx supabase functions serve --env-file .env.local   # Edge functions con OPENAI_API_KEY
```

Nota: `increment_ai_usage`/`decrement_ai_usage`/`get_ai_usage` (migración 007) son los
únicos canales de escritura de `ai_usage`; el contador es por `(user_id, date)`.

## 3. Despliegue a producción

```powershell
# 1º) Vincular el proyecto remoto (una vez por máquina)
npx supabase link --project-ref <PROJECT_REF>

# 2º) Aplicar migraciones pendientes (009_nutrition_f5 y las que falten)
npx supabase db push

# 3º) Crear el secreto de OpenAI en el proyecto
npx supabase secrets set OPENAI_API_KEY=<tu_clave>

# 4º) Desplegar/actualizar las Edge Functions
npx supabase functions deploy coach-chat
npx supabase functions deploy coach-analysis
npx supabase functions deploy generate-recipe

# 5º) (Opcional) desplegar con metadatos de import map
npx supabase functions deploy coach-chat --import-map ./functions/coach-chat/deno.json
```

## 4. Verificaciones post-despliegue

1. **Migración 009**: desde Studio o SQL, confirmar helper y catálogo:
   ```sql
   select public.food_search_name('AvócaDo') = 'avocado' as helper_ok;
   select count(*) from foods;      -- ~49 filas del seed
   select count(*) from foods where search_name is not null;  -- backfill completo
   ```
2. **Cuota de IA** (comportamiento no fail-open):
   ```sql
   select * from ai_usage where user_id = auth.uid() and date = current_date;
   select * from get_ai_usage();   -- NULL si no hay fila = es correcto (no consumido)
   ```
   En el cliente: al exceder el límite (chat: 20/día, recetas: 10/día) el servidor
   devuelve HTTP 429 con `{ error, code: "quota" }` y la APP lo muestra tal cual
   (no cae en fallback rule-based).
3. **Smoke test de chat** (token de un usuario en `Authorization`):
   ```
   POST <project>.functions.supabase.co/coach-chat
   body: { messages: [{ role:"user", content:"¿Cómo entreno hoy?" }] }
   → 200 { reply, usage: { used, dailyLimit: 20 } }
   ```
4. **Smoke test de recetas** (mismo token):
   ```
   POST <project>.functions.supabase.co/generate-recipe
   body: { prompt: "bowl de pollo con quinoa, alto en proteína", category: "Almuerzo" }
   → 200 { recipe: { name, subtitle, category, time, calories, protein, carbs, fat, tags, ingredients, instructions }, usage: { used, dailyLimit: 10 } }
   ```
   Error esperado: 401 sin token; 429 al superar el límite; 502 `parse`/`incomplete`
   (en ese caso el turno se reembolsa con `decrement_ai_usage`).
5. **Persistencia de recetas** (administrador): en `AdminRecipeFormScreen` generar,
   editar y guardar; comprobar en `recipes_ia` que las filas usan `carbs_g/fat_g/instructions`
   (columnas canónicas; las columnas `difficulty/servings/description/tips` NO existen).
6. **RLS**: `nutrition_goals`, `user_profiles` legibles solo para el dueño; chat y recetas
   autenticados (verify_jwt). La clave `service_role` nunca se usa en el cliente.

## 5. Rollback

- Edge functions: redeploy de la versión previa o `supabase functions delete <name>`.
- Migración 009: contraer en local con `supabase db reset` (no ejecutar SQL destructivo
  en remoto sin backup previo).