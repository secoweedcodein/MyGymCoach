// src/lib/supabase.js
// ─────────────────────────────────────────────────────────
// INSTRUCCIONES:
// 1. Ve a https://supabase.com y crea una cuenta gratuita
// 2. Crea un nuevo proyecto
// 3. Ve a Settings → API y copia:
//    - Project URL  → pégala en SUPABASE_URL
//    - anon public  → pégala en SUPABASE_ANON_KEY
// ─────────────────────────────────────────────────────────

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ajajfeefrrwyqoaexkxl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ggzBZ8Bd4qvNmGP96w8qPQ_KKelgIxq';
console.log("URL:", SUPABASE_URL);
console.log("KEY:", SUPABASE_ANON_KEY);
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─────────────────────────────────────────────────────────
// SQL PARA CREAR LAS TABLAS EN SUPABASE
// Ve a tu proyecto → SQL Editor → New Query → pega esto:
// ─────────────────────────────────────────────────────────
/*

-- Tabla de rutinas
create table routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  exercise_ids integer[] not null default '{}',
  created_at timestamptz default now()
);

-- Tabla de sesiones de entreno
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  routine_name text not null,
  started_at timestamptz default now(),
  finished_at timestamptz,
  total_sets integer default 0,
  total_volume_kg numeric default 0
);

-- Tabla de series registradas
create table workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references workout_sessions(id) on delete cascade,
  exercise_id integer not null,
  exercise_name text not null,
  set_number integer not null,
  set_type text default 'N',  -- N, W, D, F
  weight_kg numeric,
  reps integer,
  completed boolean default false,
  logged_at timestamptz default now()
);

-- Habilitar Row Level Security (privacidad por usuario)
alter table routines enable row level security;
alter table workout_sessions enable row level security;
alter table workout_sets enable row level security;

-- Políticas: cada usuario solo ve sus datos
create policy "Mis rutinas" on routines for all using (auth.uid() = user_id);
create policy "Mis sesiones" on workout_sessions for all using (auth.uid() = user_id);
create policy "Mis series" on workout_sets for all using (
  session_id in (select id from workout_sessions where user_id = auth.uid())
);

*/