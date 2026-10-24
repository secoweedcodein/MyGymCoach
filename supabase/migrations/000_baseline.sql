-- 000_baseline.sql
-- Esquema base para que las migraciones 001-005 puedan ejecutarse desde una base
-- de datos VACÍA (supabase db reset / db push en un proyecto nuevo).
--
-- Contexto: las migraciones 001-005 se escribieron asumiendo que las tablas ya
-- existían (fueron creadas a mano en el remoto con el Dashboard). 006 las
-- materializa con CREATE TABLE IF NOT EXISTS, pero al correr DESPUÉS de 001-005
-- el reset fallaba (001 hace ALTER/POLICY sobre tablas inexistentes).
--
-- Este archivo materializa de forma idempotente las tablas que 001-005 referencian.
-- Es 100% seguro sobre bases ya migradas (todo es IF NOT EXISTS / no-op), por lo que
-- no altera el remoto. Las definiciones son idénticas a 006 para evitar divergencias;
-- 006 sigue siendo la referencia canónica y solo hace ADD COLUMN IF NOT EXISTS de más.
--
-- NO incluye: badges/user_badges/chat_messages (002), ni challenges/daily_steps/
-- custom_exercises/user_stats (003), ni activity_level (006), que se crean en su
-- propia migración antes de ser usadas.

-- ============================================================
-- PERFIL Y OBJETIVOS
-- ============================================================

create table if not exists public.user_profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  full_name         text,
  email             text,
  birth_year        integer,
  weight_kg         numeric(5,1),
  height_cm         numeric(5,1),
  goal              text,
  activity_level    text,
  activity_level_id text,
  calorie_goal      numeric(7,1),
  protein_goal      numeric(6,1),
  days_per_week     integer,
  role              text not null default 'user',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.nutrition_goals (
  user_id        uuid primary key references public.user_profiles (id) on delete cascade,
  calories       numeric(7,1),
  protein_g      numeric(6,1),
  carbs_g        numeric(6,1),
  fat_g          numeric(6,1),
  goal           text,
  activity_level text,
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- ENTRENAMIENTO
-- ============================================================

create table if not exists public.routines (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.user_profiles (id) on delete cascade,
  name                  text not null,
  description           text,
  exercise_ids          jsonb not null default '[]',
  is_challenge          boolean not null default false,
  is_trending           boolean not null default false,
  challenge_type        text,
  challenge_start_date  date,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists routines_user_id_idx on public.routines (user_id);

create table if not exists public.workout_sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.user_profiles (id) on delete cascade,
  routine_id         uuid references public.routines (id) on delete set null,
  routine_name       text,
  started_at         timestamptz not null default now(),
  finished_at        timestamptz,
  total_sets         integer not null default 0,
  total_volume_kg    numeric(10,1) not null default 0,
  notes              text
);

create index if not exists workout_sessions_user_id_idx on public.workout_sessions (user_id, finished_at);

create table if not exists public.workout_sets (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_name  text not null,
  exercise_id    uuid,
  set_number     integer not null default 1,
  weight_kg      numeric(6,1) not null default 0,
  reps           integer not null default 0,
  target_reps    integer,
  rpe            numeric(3,1),
  completed      boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists workout_sets_session_id_idx on public.workout_sets (session_id);

create table if not exists public.personal_records (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.user_profiles (id) on delete cascade,
  exercise_name text not null,
  weight_kg     numeric(6,1) not null,
  reps          integer not null,
  session_id    uuid references public.workout_sessions (id) on delete set null,
  achieved_at   timestamptz not null default now()
);

create index if not exists personal_records_user_exercise_idx
  on public.personal_records (user_id, exercise_name);

-- ============================================================
-- NUTRICIÓN: LOGS, ALIMENTOS, FAVORITOS Y RECIENTES
-- ============================================================

create table if not exists public.nutrition_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.user_profiles (id) on delete cascade,
  food_id     uuid,
  name        text,
  barcode     text,
  meal_type   text,
  quantity    numeric(6,2) not null default 1,
  calories    numeric(7,1) not null default 0,
  protein_g   numeric(6,1) not null default 0,
  carbs_g     numeric(6,1) not null default 0,
  fat_g       numeric(6,1) not null default 0,
  logged_date date not null default current_date,
  created_at  timestamptz not null default now()
);

create index if not exists nutrition_logs_user_date_idx
  on public.nutrition_logs (user_id, logged_date);

create table if not exists public.foods (
  food_id      uuid primary key default gen_random_uuid(),
  user_id      uuid references public.user_profiles (id) on delete cascade,
  name         text not null,
  barcode      text,
  brand        text,
  serving_size numeric(6,2),
  serving_unit text,
  calories     numeric(7,1) not null default 0,
  protein_g    numeric(6,1) not null default 0,
  carbs_g      numeric(6,1) not null default 0,
  fat_g        numeric(6,1) not null default 0,
  usage_count  integer not null default 0,
  created_at   timestamptz not null default now()
);

create unique index if not exists foods_barcode_uidx on public.foods (barcode);

create table if not exists public.food_favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.user_profiles (id) on delete cascade,
  food_id    uuid not null references public.foods (food_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, food_id)
);

create table if not exists public.recent_foods (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.user_profiles (id) on delete cascade,
  food_id      uuid not null references public.foods (food_id) on delete cascade,
  usage_count  integer not null default 1,
  last_used_at timestamptz not null default now(),
  unique (user_id, food_id)
);

create table if not exists public.meal_plans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.user_profiles (id) on delete cascade,
  name       text,
  day        date,
  meals      jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- ============================================================
-- PROGRESO
-- ============================================================

create table if not exists public.weight_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.user_profiles (id) on delete cascade,
  logged_date date not null,
  weight_kg   numeric(5,1) not null,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (user_id, logged_date)
);

create table if not exists public.ai_usage (
  user_id        uuid not null references public.user_profiles (id) on delete cascade,
  date           date not null default current_date,
  messages_count integer not null default 0,
  updated_at     timestamptz not null default now(),
  primary key (user_id, date)
);

-- ============================================================
-- CONTENIDO EXPLORABLE Y COMUNIDAD
-- ============================================================

create table if not exists public.recipes_ia (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  subtitle      text,
  category      text,
  calories      integer,
  protein       numeric(6,1),
  carbs_g       numeric(6,1),
  fat_g         numeric(6,1),
  time          text,
  tags          jsonb not null default '[]',
  image_url     text,
  ingredients   jsonb not null default '[]',
  instructions  jsonb not null default '[]',
  created_at    timestamptz not null default now()
);

create table if not exists public.user_recipes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.user_profiles (id) on delete cascade,
  recipe_name   text not null,
  author_name   text,
  protein       numeric(6,1),
  calories      integer,
  carbs_g       numeric(6,1),
  fat_g         numeric(6,1),
  time          text,
  status        text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
  ingredients   jsonb not null default '[]',
  instructions  jsonb not null default '[]',
  image_url     text,
  created_at    timestamptz not null default now()
);

create table if not exists public.saved_recipes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.user_profiles (id) on delete cascade,
  recipe_id   uuid not null,
  recipe_type text not null default 'ia',
  notes       text,
  created_at  timestamptz not null default now(),
  unique (user_id, recipe_id)
);

create table if not exists public.trends (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subtitle    text,
  description text,
  image_id    integer,
  level       text,
  rating      numeric(3,1),
  users       text,
  badge       text,
  route       text,
  position    integer,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.public_routines (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  exercise_ids jsonb not null default '[]',
  level        text,
  image_id     integer,
  created_at   timestamptz not null default now()
);

create table if not exists public.articles (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  category   text,
  content    text,
  read_time  integer,
  image_id   integer,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.featured_content (
  id          text primary key,
  title       text not null,
  subtitle    text,
  image_id    integer,
  route       text,
  target_id   text,
  participants integer,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- RETOS DE USUARIO (referenciada por 001/004, no creada por 006)
-- ============================================================

create table if not exists public.user_challenges (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.user_profiles (id) on delete cascade,
  challenge_id uuid,
  progress     jsonb not null default '{}',
  joined_at    timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists user_challenges_user_id_idx on public.user_challenges (user_id);
