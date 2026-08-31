-- Migration 003: Security hardening v2 (ajustada al esquema real de la BD)
-- 1) Bloquea la escalada de rol admin en user_profiles (la columna role la añadió 001)
-- 2) Habilita RLS en challenges, daily_steps y custom_exercises (sin RLS hasta ahora)
-- 3) Crea user_stats (tabla que StatsScreen lee y que no existía)
-- 4) Permite a administradores gestionar user_recipes de todos los usuarios
-- 5) Endurece is_admin() (search_path + permisos)

-- ══════════════════════════════════════════════════════════════════
-- 1. user_profiles: impedir auto-asignación de role='admin'
-- ══════════════════════════════════════════════════════════════════

-- Los clientes (anon/authenticated) nunca deben poder leer/escribir la columna role
REVOKE INSERT (role) ON public.user_profiles FROM anon, authenticated;
REVOKE UPDATE (role) ON public.user_profiles FROM anon, authenticated;

-- Valor por defecto seguro (por si el cliente omite la columna)
ALTER TABLE public.user_profiles ALTER COLUMN role SET DEFAULT 'user';

-- Trigger de defensa en profundidad:
-- Cualquier operación originada desde un cliente autenticado (JWT con sub)
-- fuerza role='user'. Las operaciones de administración (SQL editor / service role)
-- no tienen auth.uid() y por tanto pueden asignar role='admin' legítimamente.
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.role := 'user';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_escalation ON public.user_profiles;
CREATE TRIGGER prevent_role_escalation
BEFORE INSERT OR UPDATE OF role ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- ══════════════════════════════════════════════════════════════════
-- 2. Endurecer is_admin()
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- NOTA: PostgREST evalúa las políticas FOR ALL USING (is_admin()) también para el
-- rol anon, por lo que is_admin() debe seguir siendo ejecutable por anon.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ══════════════════════════════════════════════════════════════════
-- 3. challenges: tabla de catálogo (admin escribe, usuarios leen)
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.challenges (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL DEFAULT '',
  subtitle      text DEFAULT '',
  description   text DEFAULT '',
  duration_days integer DEFAULT 30,
  level         text DEFAULT 'Principiante',
  frequency     text DEFAULT '',
  session_time  integer DEFAULT 0,
  image_id      text DEFAULT '',
  status        text DEFAULT 'draft',
  exercise_ids  integer[] DEFAULT '{}',
  objectives    jsonb DEFAULT '[]'::jsonb,
  phases        jsonb DEFAULT '[]'::jsonb,
  days          jsonb DEFAULT '[]'::jsonb,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated users can read challenges" ON public.challenges;
CREATE POLICY "All authenticated users can read challenges"
  ON public.challenges FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Only admins can modify challenges" ON public.challenges;
CREATE POLICY "Only admins can modify challenges"
  ON public.challenges FOR ALL USING (is_admin());

-- ══════════════════════════════════════════════════════════════════
-- 4. daily_steps: datos por usuario
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.daily_steps (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       date NOT NULL,
  steps      integer DEFAULT 0,
  goal       integer DEFAULT 10000,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'daily_steps' AND indexdef LIKE '%(user_id, date)%'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS daily_steps_user_date ON public.daily_steps (user_id, date);
  END IF;
END;
$$;

ALTER TABLE public.daily_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own daily steps" ON public.daily_steps;
CREATE POLICY "Users can manage their own daily steps"
  ON public.daily_steps FOR ALL USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- 5. custom_exercises: ejercicios personalizados por usuario
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.custom_exercises (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  muscle     text NOT NULL,
  type       text NOT NULL DEFAULT 'Hipertrofia',
  icon       text DEFAULT 'CUS',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own custom exercises" ON public.custom_exercises;
CREATE POLICY "Users can manage their own custom exercises"
  ON public.custom_exercises FOR ALL USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- 6. user_stats: tabla que StatsScreen lee (current_streak, total_workouts)
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.user_stats (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak bigint DEFAULT 0,
  total_workouts bigint DEFAULT 0,
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own stats" ON public.user_stats;
CREATE POLICY "Users can manage their own stats"
  ON public.user_stats FOR ALL USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- 7. user_recipes: además del CRUD propio, admins gestionan todas
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Admins can manage all user recipes" ON public.user_recipes;
CREATE POLICY "Admins can manage all user recipes"
  ON public.user_recipes FOR ALL USING (is_admin());

-- ══════════════════════════════════════════════════════════════════
-- 8. Tablas latentes de importService (sessions / sets)
-- Solo aplica si ya existen; si no existen, se omite sin error.
-- ══════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF to_regclass('public.sessions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND schemaname = 'public'
    ) THEN
      EXECUTE 'CREATE POLICY "Users can manage their own imported sessions"
        ON public.sessions FOR ALL USING (auth.uid() = user_id)';
    END IF;
  END IF;

  IF to_regclass('public.sets') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'sets' AND schemaname = 'public'
    ) THEN
      EXECUTE 'CREATE POLICY "Users can manage their own imported sets"
        ON public.sets FOR ALL USING (
          session_id IN (SELECT id FROM public.sessions WHERE user_id = auth.uid())
        )';
    END IF;
  END IF;
END;
$$;