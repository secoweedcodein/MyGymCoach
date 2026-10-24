INSERT INTO public.activity_level (id, display_name, multiplier)
VALUES
  ('sedentary', 'Sedentario', 1.200),
  ('light', 'Ligera', 1.375),
  ('moderate', 'Moderada', 1.550),
  ('active', 'Activa', 1.725),
  ('very_active', 'Muy activa', 1.900)
ON CONFLICT (id) DO UPDATE
SET display_name = EXCLUDED.display_name,
    multiplier = EXCLUDED.multiplier;

-- activity_level_id es la columna que consume el cliente (Onboarding/Profile/useNutrition).
-- Se garantiza por si la base no la tenía (no existe en 006).
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS activity_level_id text;

ALTER TABLE public.user_profiles
  ALTER COLUMN activity_level_id SET DEFAULT 'sedentary';