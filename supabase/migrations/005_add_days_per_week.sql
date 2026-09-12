ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS days_per_week integer
  CHECK (days_per_week BETWEEN 1 AND 7);