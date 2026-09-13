-- 007_rls_hardening.sql
-- Objetivo: endurecer el RLS canónico heredado de 004 y cerrar los riesgos residuales:
--   1) ai_usage: el cliente podía INSERT/UPDATE/DELETE directamente su contador
--      (regateo del límite diario). Se deja SOLO lectura y se exponen RPCs atómicos
--      (increment_ai_usage / decrement_ai_usage / get_ai_usage) con límite diario.
--   2) user_badges: el usuario podía auto-otorgarse insignias. Queda solo lectura propia.
--   3) user_stats: los usuarios podían modificar sus estadísticas. Queda solo lectura propia.
--   4) chat_messages: se restringe a SELECT/INSERT propios (sin UPDATE/DELETE del cliente).
--   5) Índices y grants explícitos por si faltan (PostgREST + RLS operan via JWT).
--   6) Bucket de storage mygymcoach-images con políticas acotadas.
-- Migración idempotente: re-aplicable sin errores sobre una BD ya migrada.

-- ══════════════════════════════════════════════════════════════════
-- 0. RLS habilitado en todas las tablas gestionadas (idempotente)
-- ══════════════════════════════════════════════════════════════════
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'routines','workout_sessions','workout_sets','user_profiles',
    'nutrition_goals','nutrition_logs','saved_recipes','meal_plans',
    'food_favorites','recent_foods','foods','weight_logs','personal_records',
    'trends','public_routines','articles','recipes_ia','featured_content',
    'ai_usage','user_challenges','user_recipes','badges','user_badges',
    'chat_messages','challenges','daily_steps','custom_exercises','user_stats'
  ] LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END IF;
  END LOOP;
END;
$$;

-- ══════════════════════════════════════════════════════════════════
-- 1. ai_usage: solo lectura; el contador se gestiona vía RPCs
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can manage their own AI usage" ON public.ai_usage;

CREATE POLICY "Users can read their own AI usage" ON public.ai_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Los clientes solo pueden leer su uso; nunca insertar/actualizar/borrar filas.
REVOKE INSERT, UPDATE, DELETE ON PUBLIC.ai_usage FROM anon;
REVOKE INSERT, UPDATE, DELETE ON PUBLIC.ai_usage FROM authenticated;
GRANT SELECT ON public.ai_usage TO authenticated;

-- Limpieza de duplicados previa a consolidar la unicidad por (user_id, date).
DELETE FROM public.ai_usage a
USING public.ai_usage b
WHERE a.user_id = b.user_id AND a.date = b.date AND a.ctid < b.ctid;

-- Índice único: una fila por usuario y día.
CREATE UNIQUE INDEX IF NOT EXISTS ai_usage_user_date_uidx
  ON public.ai_usage (user_id, date);

-- RPC: consultar el uso de hoy (0 si no hay registro).
CREATE OR REPLACE FUNCTION public.get_ai_usage()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT messages_count FROM public.ai_usage
     WHERE user_id = auth.uid() AND date = CURRENT_DATE),
    0
  );
$$;

-- RPC: incrementar el contador de hoy de forma atómica y con límite diario.
-- Lanza excepción si el usuario ya superó p_limit. Retorna el nuevo contador.
-- SECURITY DEFINER con search_path fijo; el único canal de escritura de ai_usage.
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_limit integer DEFAULT 20)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_today  date := CURRENT_DATE;
  v_count  integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 THEN
    p_limit := 1;
  END IF;

  LOOP
    SELECT messages_count INTO v_count
    FROM public.ai_usage
    WHERE user_id = v_uid AND date = v_today
    FOR UPDATE;

    IF v_count IS NULL THEN
      INSERT INTO public.ai_usage (user_id, date, messages_count, updated_at)
      VALUES (v_uid, v_today, 1, now())
      ON CONFLICT (user_id, date) DO NOTHING
      RETURNING messages_count INTO v_count;

      IF v_count IS NULL THEN
        CONTINUE;
      END IF;
    ELSE
      IF v_count >= p_limit THEN
        RAISE EXCEPTION 'Has alcanzado el límite de % mensajes por día. Vuelve mañana.', p_limit
          USING ERRCODE = 'P0001';
      END IF;

      v_count := v_count + 1;
      UPDATE public.ai_usage
      SET messages_count = v_count, updated_at = now()
      WHERE user_id = v_uid AND date = v_today;
    END IF;

    RETURN v_count;
  END LOOP;
END;
$$;

-- RPC: compensar un consumo fallido (reembolso). Nunca baja de 0.
CREATE OR REPLACE FUNCTION public.decrement_ai_usage()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_today  date := CURRENT_DATE;
  v_count  integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  UPDATE public.ai_usage
  SET messages_count = GREATEST(messages_count - 1, 0), updated_at = now()
  WHERE user_id = v_uid AND date = v_today
  RETURNING messages_count INTO v_count;

  RETURN COALESCE(v_count, 0);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_ai_usage() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_ai_usage(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_ai_usage() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ai_usage() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrement_ai_usage() TO authenticated, service_role;

-- ══════════════════════════════════════════════════════════════════
-- 2. user_badges: el usuario no se auto-otorga insignias (solo lectura)
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can manage their own badges" ON public.user_badges;

CREATE POLICY "Users can read their own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.user_badges FROM anon, authenticated;
GRANT SELECT ON public.user_badges TO authenticated;

-- ══════════════════════════════════════════════════════════════════
-- 3. user_stats: lectura propia; la escritura queda restringida a admins
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can manage their own stats" ON public.user_stats;

CREATE POLICY "Users can read their own stats" ON public.user_stats
  FOR SELECT USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.user_stats FROM anon, authenticated;
GRANT SELECT ON public.user_stats TO authenticated;

-- ══════════════════════════════════════════════════════════════════
-- 4. chat_messages: el cliente solo lee y escribe SUS mensajes
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can view and manage their own chat messages" ON public.chat_messages;

CREATE POLICY "Users can read their own chat messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

REVOKE UPDATE, DELETE ON public.chat_messages FROM anon, authenticated;
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;

-- ══════════════════════════════════════════════════════════════════
-- 5. Índices de apoyo para las consultas habituales del cliente
-- ══════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS chat_messages_user_created_idx
  ON public.chat_messages (user_id, created_at);

-- ══════════════════════════════════════════════════════════════════
-- 6. Grants explícitos (idempotentes) para expositores PostgREST/RLS
-- ══════════════════════════════════════════════════════════════════
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Catálogo y lectura general para autenticados (datos propios).
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- CRUD en tablas gestionadas para autenticados (RLS decide qué filas).
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ══════════════════════════════════════════════════════════════════
-- 7. Storage: bucket de imágenes con políticas acotadas
-- ══════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public)
VALUES ('mygymcoach-images', 'mygymcoach-images', false)
ON CONFLICT (id) DO NOTHING;

-- Autenticados pueden leer objetos del bucket propio del usuario o administrador.
DROP POLICY IF EXISTS "Authenticated users can read mygymcoach images" ON storage.objects;
CREATE POLICY "Authenticated users can read mygymcoach images"
  ON storage.objects
  FOR SELECT USING (
    bucket_id = 'mygymcoach-images'
    AND auth.role() = 'authenticated'
  );

-- Los administradores gestionan (subir/actualizar/borrar) objetos del bucket.
DROP POLICY IF EXISTS "Admins can upload mygymcoach images" ON storage.objects;
CREATE POLICY "Admins can upload mygymcoach images"
  ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'mygymcoach-images'
    AND is_admin()
  );

DROP POLICY IF EXISTS "Admins can update mygymcoach images" ON storage.objects;
CREATE POLICY "Admins can update mygymcoach images"
  ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'mygymcoach-images'
    AND is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete mygymcoach images" ON storage.objects;
CREATE POLICY "Admins can delete mygymcoach images"
  ON storage.objects
  FOR DELETE USING (
    bucket_id = 'mygymcoach-images'
    AND is_admin()
  );

-- ══════════════════════════════════════════════════════════════════
-- 8. Rutinas: netear la lectura de la comunidad antes de hardening
--    (las políticas canónicas de 004 ya cubren el acceso; solo se asegura
--     la columna is_trending referenciada por la política 004)
-- ══════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF to_regclass('public.routines') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.routines ADD COLUMN IF NOT EXISTS is_trending boolean NOT NULL DEFAULT false';
  END IF;
END;
$$;