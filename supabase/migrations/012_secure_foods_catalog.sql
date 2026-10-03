-- Keep the shared catalog read-only for clients and store personal foods per owner.

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated users can create foods" ON public.foods;
DROP POLICY IF EXISTS "All authenticated users can read foods" ON public.foods;
DROP POLICY IF EXISTS "All authenticated users can update foods" ON public.foods;
DROP POLICY IF EXISTS "Only admins can delete foods" ON public.foods;
DROP POLICY IF EXISTS "Authenticated users can read foods" ON public.foods;
DROP POLICY IF EXISTS "Admins can manage foods" ON public.foods;
DROP POLICY IF EXISTS "Foods authenticated catalog read" ON public.foods;
DROP POLICY IF EXISTS "Foods admins manage catalog" ON public.foods;

REVOKE ALL PRIVILEGES ON TABLE public.foods FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.foods TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.foods TO service_role;

CREATE POLICY "Foods authenticated catalog read"
  ON public.foods
  FOR SELECT
  TO authenticated
  USING (source IS DISTINCT FROM 'user');

CREATE POLICY "Foods admins manage catalog"
  ON public.foods
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.user_foods (
  food_id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id uuid NOT NULL DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  barcode text,
  brand text NOT NULL DEFAULT '',
  calories numeric(8,2) NOT NULL DEFAULT 0 CHECK (calories >= 0),
  protein_g numeric(8,2) NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
  carbs_g numeric(8,2) NOT NULL DEFAULT 0 CHECK (carbs_g >= 0),
  fat_g numeric(8,2) NOT NULL DEFAULT 0 CHECK (fat_g >= 0),
  serving_size text NOT NULL DEFAULT '100 g',
  source text NOT NULL DEFAULT 'user'
    CHECK (source IN ('user', 'openfoodfacts')),
  search_name text NOT NULL,
  category text NOT NULL DEFAULT 'otros',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_foods_user_barcode_key UNIQUE (user_id, barcode)
);

CREATE INDEX IF NOT EXISTS user_foods_user_search_idx
  ON public.user_foods (user_id, search_name);

ALTER TABLE public.user_foods ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.user_foods FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_foods TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.user_foods TO service_role;

DROP POLICY IF EXISTS "Users read own foods" ON public.user_foods;
DROP POLICY IF EXISTS "Users insert own foods" ON public.user_foods;
DROP POLICY IF EXISTS "Users update own foods" ON public.user_foods;
DROP POLICY IF EXISTS "Users delete own foods" ON public.user_foods;

CREATE POLICY "Users read own foods"
  ON public.user_foods
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own foods"
  ON public.user_foods
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own foods"
  ON public.user_foods
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own foods"
  ON public.user_foods
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);