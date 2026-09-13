-- seed.sql
-- Datos iniciales de referencia para `supabase db reset` (ver config.toml → db.seed).
-- Solo añade filas de catálogo; nunca borra ni modifica datos existentes.

-- Niveles de actividad: multiplicadores TDEE que usa el sistema nutricional (FASE 3).
insert into public.activity_level (id, display_name, multiplier) values
  ('sedentary',     'Sedentario',     1.200),
  ('light',         'Ligera',         1.375),
  ('moderate',      'Moderada',       1.550),
  ('active',        'Activa',         1.725),
  ('very_active',   'Muy activa',     1.900)
on conflict (id) do nothing;