-- 011_rls_hardening_optional.sql
-- Hardening aditivo e idempotente (OPTATIVO). Re-aplicable: todas las
-- sentencias usan DROP POLICY IF EXISTS / IF NOT EXISTS.
--
-- ⚠️ REVISA antes de aplicar: `supabase db push` toca tu base de producción.
-- Este archivo NO cierra brechas de la app (F7/F8 ya están en remoto con 001-010).
-- foods NO está aquí a propósito: es un catálogo compartido de solo-lectura
-- (los usuarios guardan comidas en user_recipes/nutrition_logs/food_favorites),
-- por lo que no necesita políticas de INSERT por usuario.

-- ============================================================
-- 2. challenge_participants.progress: solo el owner actualiza su progreso
-- ============================================================
drop policy if exists "Users update own challenge progress" on public.challenge_participants;
create policy "Users update own challenge progress"
  on public.challenge_participants
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 3. is_trending en routines/trends: impedir autopublicación masiva
--    (los inserts de usuario ya no usan is_trending; es solo refuerzo)
-- ============================================================
drop policy if exists "Prevent users setting trending" on public.routines;
create policy "Prevent users setting trending"
  on public.routines
  for update
  using (is_admin() or is_trending = false)
  with check (is_admin() or is_trending = false);

drop policy if exists "Admins can toggle trend visibility" on public.trends;
create policy "Admins can toggle trend visibility"
  on public.trends
  for update
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- 5. Índices aditivos para consultas frecuentes (idempotente)
-- ============================================================
create index if not exists user_recipes_status_idx
  on public.user_recipes (status);
create index if not exists user_recipes_user_idx
  on public.user_recipes (user_id);
create index if not exists saved_recipes_user_idx
  on public.saved_recipes (user_id);
