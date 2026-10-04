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

ALTER TABLE public.user_profiles
  ALTER COLUMN activity_level_id SET DEFAULT 'sedentary';