-- Migration 004: limpieza de políticas genéricas del dashboard y conjunto canónico estricto
-- La base real se creó a mano con el Dashboard de Supabase, que deja políticas
-- automáticas muy permisivas ("Enable read access for all users", etc.).
-- Estas políticas conviven (OR) con las estrictas de 001/003 y siguen exponiendo
-- datos de usuarios a clientes anónimos (ej: routines, foods, articles, trends).
--
-- Esta migración:
--   1) Restaura EXECUTE de is_admin() para anon/authenticated (PostgREST debe poder
--      evaluar las políticas administrativas; la función es de solo lectura).
--   2) Elimina TODAS las políticas existentes en cada tabla gestionada.
--   3) Aplica el conjunto canónico (propietario o catálogo con solo lectura autenticada).

-- ══════════════════════════════════════════════════════════════════
-- 1. is_admin(): ejecutable por PostgREST (anon + authenticated)
-- ══════════════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ══════════════════════════════════════════════════════════════════
-- 2. Eliminar las políticas existentes en TODAS las tablas gestionadas
-- ══════════════════════════════════════════════════════════════════
DO $$
DECLARE
  tbl text;
  pol record;
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
      FOR pol IN SELECT policyname FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = tbl
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

-- ══════════════════════════════════════════════════════════════════
-- 3. Conjunto canónico de políticas estrictas
-- ══════════════════════════════════════════════════════════════════

-- Habilitar RLS en todas las tablas (idempotente)
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Tablas de datos de usuario: CRUD del propietario + admins
CREATE POLICY "Users can manage their own routines" ON public.routines
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read trending or challenge routines" ON public.routines
  FOR SELECT USING (auth.role() = 'authenticated' AND (is_trending = true OR is_challenge = true));
CREATE POLICY "Admins can manage all routines" ON public.routines
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own workout sessions" ON public.workout_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all workout sessions" ON public.workout_sessions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can manage sets for their own sessions" ON public.workout_sets
  FOR ALL USING (session_id IN (SELECT id FROM public.workout_sessions WHERE user_id = auth.uid()))
  WITH CHECK (session_id IN (SELECT id FROM public.workout_sessions WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage all workout sets" ON public.workout_sets
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own nutrition goals" ON public.nutrition_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all nutrition goals" ON public.nutrition_goals
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own nutrition logs" ON public.nutrition_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all nutrition logs" ON public.nutrition_logs
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own saved recipes" ON public.saved_recipes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all saved recipes" ON public.saved_recipes
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own meal plans" ON public.meal_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all meal plans" ON public.meal_plans
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own food favorites" ON public.food_favorites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all food favorites" ON public.food_favorites
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own recent foods" ON public.recent_foods
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all recent foods" ON public.recent_foods
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own weight logs" ON public.weight_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all weight logs" ON public.weight_logs
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own personal records" ON public.personal_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all personal records" ON public.personal_records
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own AI usage" ON public.ai_usage
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all AI usage" ON public.ai_usage
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own challenges" ON public.user_challenges
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all user challenges" ON public.user_challenges
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- user_recipes: propias + las aprobadas son catálogo + admins
CREATE POLICY "Users can manage their own recipes" ON public.user_recipes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can read approved recipes" ON public.user_recipes
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins can manage all user recipes" ON public.user_recipes
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own daily steps" ON public.daily_steps
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all daily steps" ON public.daily_steps
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own custom exercises" ON public.custom_exercises
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all custom exercises" ON public.custom_exercises
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own stats" ON public.user_stats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all stats" ON public.user_stats
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can manage their own badges" ON public.user_badges
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all user badges" ON public.user_badges
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can view and manage their own chat messages" ON public.chat_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all chat messages" ON public.chat_messages
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Tablas catálogo: lectura para usuarios autenticados, solo admins modifican
CREATE POLICY "All authenticated users can read foods" ON public.foods
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "All authenticated users can create foods" ON public.foods
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "All authenticated users can update foods" ON public.foods
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can delete foods" ON public.foods
  FOR DELETE USING (is_admin());

CREATE POLICY "All authenticated users can read trends" ON public.trends
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can modify trends" ON public.trends
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "All authenticated users can read public routines" ON public.public_routines
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can modify public routines" ON public.public_routines
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "All authenticated users can read articles" ON public.articles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can modify articles" ON public.articles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "All authenticated users can read IA recipes" ON public.recipes_ia
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can modify IA recipes" ON public.recipes_ia
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "All authenticated users can read featured content" ON public.featured_content
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can modify featured content" ON public.featured_content
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "All authenticated users can read challenges" ON public.challenges
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can modify challenges" ON public.challenges
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Anyone can read badges" ON public.badges
  FOR SELECT USING (true);
CREATE POLICY "Only admins can modify badges" ON public.badges
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());