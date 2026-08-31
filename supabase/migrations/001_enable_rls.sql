-- Migration 001: Enable RLS on all tables
-- Nota: la base real se creó a mano y esta migración NUNCA se aplicó (Remote vacío).
-- Se corrige para que coincida con el esquema real:
--   * user_profiles NO tenía columna "role" (necesaria para is_admin) -> se añade.
--   * la tabla foods NO tiene columna "user_id" (política UPDATE antigua rompía el push).

-- Asegurar columna role para is_admin()
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Creación de la función is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Lista de tablas: routines, workout_sessions, workout_sets, user_profiles, nutrition_goals, nutrition_logs, saved_recipes, meal_plans, food_favorites, recent_foods, foods, weight_logs, personal_records, trends, public_routines, articles, recipes_ia, featured_content, ai_usage, user_challenges, user_recipes

-- Habilitar RLS en todas las tablas
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

-- Políticas para tablas de usuario (CRUD completo para el propietario)
-- (DROP previo para que sea idempotente ante reintentos del push)
-- routines
DROP POLICY IF EXISTS "Users can manage their own routines" ON public.routines;
CREATE POLICY "Users can manage their own routines" ON public.routines FOR ALL USING (auth.uid() = user_id);
-- workout_sessions
DROP POLICY IF EXISTS "Users can manage their own workout sessions" ON public.workout_sessions;
CREATE POLICY "Users can manage their own workout sessions" ON public.workout_sessions FOR ALL USING (auth.uid() = user_id);
-- user_profiles
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;
CREATE POLICY "Users can manage their own profile" ON public.user_profiles FOR ALL USING (auth.uid() = id);
-- nutrition_goals
DROP POLICY IF EXISTS "Users can manage their own nutrition goals" ON public.nutrition_goals;
CREATE POLICY "Users can manage their own nutrition goals" ON public.nutrition_goals FOR ALL USING (auth.uid() = user_id);
-- nutrition_logs
DROP POLICY IF EXISTS "Users can manage their own nutrition logs" ON public.nutrition_logs;
CREATE POLICY "Users can manage their own nutrition logs" ON public.nutrition_logs FOR ALL USING (auth.uid() = user_id);
-- saved_recipes
DROP POLICY IF EXISTS "Users can manage their own saved recipes" ON public.saved_recipes;
CREATE POLICY "Users can manage their own saved recipes" ON public.saved_recipes FOR ALL USING (auth.uid() = user_id);
-- meal_plans
DROP POLICY IF EXISTS "Users can manage their own meal plans" ON public.meal_plans;
CREATE POLICY "Users can manage their own meal plans" ON public.meal_plans FOR ALL USING (auth.uid() = user_id);
-- food_favorites
DROP POLICY IF EXISTS "Users can manage their own food favorites" ON public.food_favorites;
CREATE POLICY "Users can manage their own food favorites" ON public.food_favorites FOR ALL USING (auth.uid() = user_id);
-- recent_foods
DROP POLICY IF EXISTS "Users can manage their own recent foods" ON public.recent_foods;
CREATE POLICY "Users can manage their own recent foods" ON public.recent_foods FOR ALL USING (auth.uid() = user_id);
-- weight_logs
DROP POLICY IF EXISTS "Users can manage their own weight logs" ON public.weight_logs;
CREATE POLICY "Users can manage their own weight logs" ON public.weight_logs FOR ALL USING (auth.uid() = user_id);
-- personal_records
DROP POLICY IF EXISTS "Users can manage their own personal records" ON public.personal_records;
CREATE POLICY "Users can manage their own personal records" ON public.personal_records FOR ALL USING (auth.uid() = user_id);
-- ai_usage
DROP POLICY IF EXISTS "Users can manage their own AI usage" ON public.ai_usage;
CREATE POLICY "Users can manage their own AI usage" ON public.ai_usage FOR ALL USING (auth.uid() = user_id);
-- user_challenges
DROP POLICY IF EXISTS "Users can manage their own challenges" ON public.user_challenges;
CREATE POLICY "Users can manage their own challenges" ON public.user_challenges FOR ALL USING (auth.uid() = user_id);
-- user_recipes: los usuarios gestionan las suyas; admins todas (ver 003)
DROP POLICY IF EXISTS "Users can manage their own recipes" ON public.user_recipes;
CREATE POLICY "Users can manage their own recipes" ON public.user_recipes FOR ALL USING (auth.uid() = user_id);

-- Políticas para workout_sets usando subconsulta
DROP POLICY IF EXISTS "Users can manage sets for their own sessions" ON public.workout_sets;
CREATE POLICY "Users can manage sets for their own sessions" ON public.workout_sets
FOR ALL USING (
  session_id IN (SELECT id FROM public.workout_sessions WHERE user_id = auth.uid())
);

-- Políticas para tablas de solo lectura / públicas
-- trends
DROP POLICY IF EXISTS "All authenticated users can read trends" ON public.trends;
CREATE POLICY "All authenticated users can read trends" ON public.trends FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Only admins can modify trends" ON public.trends;
CREATE POLICY "Only admins can modify trends" ON public.trends FOR ALL USING (is_admin());
-- public_routines
DROP POLICY IF EXISTS "All authenticated users can read public routines" ON public.public_routines;
CREATE POLICY "All authenticated users can read public routines" ON public.public_routines FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Only admins can modify public routines" ON public.public_routines;
CREATE POLICY "Only admins can modify public routines" ON public.public_routines FOR ALL USING (is_admin());
-- articles
DROP POLICY IF EXISTS "All authenticated users can read articles" ON public.articles;
CREATE POLICY "All authenticated users can read articles" ON public.articles FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Only admins can modify articles" ON public.articles;
CREATE POLICY "Only admins can modify articles" ON public.articles FOR ALL USING (is_admin());
-- recipes_ia
DROP POLICY IF EXISTS "All authenticated users can read IA recipes" ON public.recipes_ia;
CREATE POLICY "All authenticated users can read IA recipes" ON public.recipes_ia FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Only admins can modify IA recipes" ON public.recipes_ia;
CREATE POLICY "Only admins can modify IA recipes" ON public.recipes_ia FOR ALL USING (is_admin());
-- featured_content
DROP POLICY IF EXISTS "All authenticated users can read featured content" ON public.featured_content;
CREATE POLICY "All authenticated users can read featured content" ON public.featured_content FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Only admins can modify featured content" ON public.featured_content;
CREATE POLICY "Only admins can modify featured content" ON public.featured_content FOR ALL USING (is_admin());

-- Políticas para la tabla foods
-- foods es un catálogo compartido y NO tiene columna user_id,
-- así que el UPDATE se concede a los usuarios autenticados igual que el INSERT.
DROP POLICY IF EXISTS "All authenticated users can read foods" ON public.foods;
CREATE POLICY "All authenticated users can read foods" ON public.foods FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "All authenticated users can create foods" ON public.foods;
CREATE POLICY "All authenticated users can create foods" ON public.foods FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "All authenticated users can update foods" ON public.foods;
CREATE POLICY "All authenticated users can update foods" ON public.foods FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Only admins can delete foods" ON public.foods;
CREATE POLICY "Only admins can delete foods" ON public.foods FOR DELETE USING (is_admin());