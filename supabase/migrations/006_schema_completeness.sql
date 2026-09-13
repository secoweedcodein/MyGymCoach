-- 006_schema_completeness.sql
-- Objetivo: reconciliar el esquema para que un entorno local (supabase db reset) sea
-- reproducible y equivalente al remoto. Es 100% idempotente y NO modifica tablas que ya
-- existan (usa siempre IF NOT EXISTS / ADD COLUMN IF NOT EXISTS), por lo que es seguro
-- aplicarlo también a una base existente sin borrar ni renombrar datos.
--
-- Nota: las tablas históricas se crearon a mano en el remoto (las migraciones 001-005
-- solo añadieron columnas/políticas). Aquí se materializan como CREATE TABLE IF NOT EXISTS
-- para que el esquema canónico del proyecto esté versionado y una base nueva nazca completa.

-- ============================================================
-- 1. PERFIL Y OBJETIVOS NUTRICIONALES
-- ============================================================

create table if not exists public.user_profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text,
  email         text,
  birth_year    integer,
  weight_kg     numeric(5,1),
  height_cm     numeric(5,1),
  goal          text,
  activity_level text,
  calorie_goal  numeric(7,1),
  protein_goal  numeric(6,1),
  days_per_week integer,
  role          text not null default 'user',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Columnas añadidas por migraciones posteriores o usadas por el cliente (coachAnalysis).
-- Se garantizan por si un entorno no aplicó alguna migración antigua.
alter table public.user_profiles add column if not exists role text not null default 'user';
alter table public.user_profiles add column if not exists calorie_goal numeric(7,1);
alter table public.user_profiles add column if not exists protein_goal numeric(6,1);
alter table public.user_profiles add column if not exists goal text;
alter table public.user_profiles add column if not exists activity_level text;
alter table public.user_profiles add column if not exists days_per_week integer;
alter table public.user_profiles add column if not exists weight_kg numeric(5,1);
alter table public.user_profiles add column if not exists height_cm numeric(5,1);
alter table public.user_profiles add column if not exists full_name text;
alter table public.user_profiles add column if not exists birth_year integer;
alter table public.user_profiles add column if not exists updated_at timestamptz not null default now();

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

-- Columnas consumidas por FASE 3 (sistema nutricional centralizado) y por el perfil.
alter table public.nutrition_goals add column if not exists goal text;
alter table public.nutrition_goals add column if not exists activity_level text;

create table if not exists public.activity_level (
  id           text primary key,
  display_name text not null,
  multiplier   numeric(4,3) not null
);

-- ============================================================
-- 2. ENTRENAMIENTO
-- ============================================================

create table if not exists public.routines (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.user_profiles (id) on delete cascade,
  name                  text not null,
  description           text,
  exercise_ids          jsonb not null default '[]',
  is_challenge          boolean not null default false,
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
-- 3. NUTRICIÓN: LOGS, ALIMENTOS, FAVORITOS Y RECIENTES
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

create table if not exists public.food_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.user_profiles (id) on delete cascade,
  food_name   text,
  meal_type   text,
  quantity    numeric(6,2) not null default 1,
  calories    numeric(7,1) not null default 0,
  protein_g   numeric(6,1) not null default 0,
  carbs_g     numeric(6,1) not null default 0,
  fat_g       numeric(6,1) not null default 0,
  logged_date date not null default current_date,
  created_at  timestamptz not null default now()
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
-- 4. PROGRESO (PESO, USO DE IA)
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
-- 5. CONTENIDO EXPLORABLE Y COMUNIDAD
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
-- 6. ROLES ADICIONALES
-- ============================================================

create table if not exists public.user_roles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'user',
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 7. RECONCILIACIÓN CON EL CÓDIGO EXISTENTE
-- ============================================================

-- adminService filtra challenges por is_official.
alter table public.challenges add column if not exists is_official boolean not null default false;

-- La política 004 lee routines.is_trending para el feed de la comunidad.
alter table public.routines add column if not exists is_trending boolean not null default false;

-- RLS para las tablas nuevas creadas arriba (actividad, registros antiguos y roles).
alter table public.activity_level enable row level security;
alter table public.food_logs enable row level security;
alter table public.user_roles enable row level security;

-- activity_level es catálogo: lectura autenticada, solo admins modifican.
drop policy if exists "All authenticated users can read activity levels" on public.activity_level;
create policy "All authenticated users can read activity levels"
  on public.activity_level for select using (auth.role() = 'authenticated');
drop policy if exists "Only admins can modify activity levels" on public.activity_level;
create policy "Only admins can modify activity levels"
  on public.activity_level for all using (is_admin());

-- food_logs: CRUD del propietario.
drop policy if exists "Users can manage their own food logs" on public.food_logs;
create policy "Users can manage their own food logs"
  on public.food_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_roles: lectura propia, admins lo gestionan (complemento de user_profiles.role).
drop policy if exists "Users can read their own role" on public.user_roles;
create policy "Users can read their own role"
  on public.user_roles for select using (auth.uid() = user_id);
drop policy if exists "Admins can manage all user roles" on public.user_roles;
create policy "Admins can manage all user roles"
  on public.user_roles for all using (is_admin());