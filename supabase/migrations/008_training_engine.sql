-- 008_training_engine.sql
-- FASE 4: motor de entrenamiento y progresión.
-- Estilo: idempotente (CREATE ... IF NOT EXISTS / ADD COLUMN IF NOT EXISTS),
-- compatible con bases ya migradas (001-007) o creadas en el remoto a mano.

-- ─────────── 1. Detalle de ejercicios de rutina ──────────────────────────────
-- Programación completa: orden, series objetivo, rango de reps, descanso,
-- RIR/RPE y notas. Ahora la rutina puede repetir el mismo ejercicio con
-- semanas distintas (las restricciones UNIQUE se evitan a propósito).

create table if not exists public.routine_exercises (
    id                 uuid primary key default gen_random_uuid(),
    routine_id         uuid not null references public.routines(id) on delete cascade,
    position           integer not null default 0,
    exercise_id        text,
    exercise_name      text not null default '',
    target_sets        integer not null default 3,
    target_reps_min    integer,
    target_reps_max    integer,
    rest_seconds       integer not null default 120,
    rir                integer,
    rpe                numeric(3,1),
    notes              text,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now()
);

comment on table public.routine_exercises is
  'Ejercicios de una rutina de usuario con programación completa (FASE 4)';

create index if not exists routine_exercises_routine_position_idx
  on public.routine_exercises (routine_id, position);

alter table public.routine_exercises enable row level security;

drop policy if exists "Users manage own routine exercises" on public.routine_exercises;
create policy "Users manage own routine exercises"
  on public.routine_exercises
  for all
  using (exists (
    select 1 from public.routines r
    where r.id = routine_exercises.routine_id and r.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.routines r
    where r.id = routine_exercises.routine_id and r.user_id = auth.uid()
  ));

drop policy if exists "Admins manage all routine exercises" on public.routine_exercises;
create policy "Admins manage all routine exercises"
  on public.routine_exercises
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─────────── 2. Sesiones: duración e idempotencia ────────────────────────────
alter table public.workout_sessions add column if not exists duration_minutes integer;
alter table public.workout_sessions add column if not exists idempotency_key text;

comment on column public.workout_sessions.duration_minutes is
  'Duración en minutos calculada al finalizar (FASE 4)';
comment on column public.workout_sessions.idempotency_key is
  'Clave de idempotencia: evita duplicar una sesión al reconectar/repulsar (FASE 4)';

create unique index if not exists workout_sessions_idempotency_uidx
  on public.workout_sessions (user_id, idempotency_key)
  where idempotency_key is not null;

-- ─────────── 3. Series: tipo de serie (Normal/Calent/Drop/Fallo) ─────────────
alter table public.workout_sets add column if not exists set_type text not null default 'N';

-- ─────────── 4. PR: métricas múltiples ───────────────────────────────────────
-- Además del peso/reps de referencia, se guardan el mejor peso, más reps,
-- mejor volumen y 1RM estimado (Brzycki) por ejercicio.
alter table public.personal_records add column if not exists max_weight_kg  numeric(6,1);
alter table public.personal_records add column if not exists max_reps        integer;
alter table public.personal_records add column if not exists max_volume_kg   numeric(10,1);
alter table public.personal_records add column if not exists estimated_1rm   numeric(6,1);

comment on column public.personal_records.max_weight_kg is 'Mejor peso registrado';
comment on column public.personal_records.max_reps is 'Máximo de repeticiones con carga';
comment on column public.personal_records.max_volume_kg is 'Mejor volumen (kg x reps)';
comment on column public.personal_records.estimated_1rm is '1RM estimado (Brzycki)';

-- Índice de apoyo: un ejercicio puede tener varios PR históricos; se resuelve
-- por ejercicio con la fila más reciente. No se fuerza unicidad para no
-- romper bases existentes.
create index if not exists personal_records_exercise_uidx
  on public.personal_records (user_id, exercise_name, achieved_at desc);

-- ─────────── 5. RPC finish_workout (transaccional + idempotente) ────────────
-- Guarda sesión + series + PR en una sola transacción.
-- - Idempotente por idempotency_key: si ya existe, devuelve duplicado.
-- - SECURITY DEFINER: el usuario solo puede escribir sus propias filas.
-- - Error del contador de PR nunca hace fail-open: no degrada la sesión.
create or replace function public.finish_workout(
    p_session jsonb,
    p_sets    jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user uuid := auth.uid();
    v_session_id uuid;
    v_set jsonb;
    v_exercise_id uuid;
    v_exercise_name text;
    v_weight numeric;
    v_reps integer;
    v_e1rm numeric;
    v_volume numeric;
    v_updated integer := 0;
    v_sets_inserted integer := 0;
begin
    if v_user is null then
        raise exception 'No autorizado';
    end if;
    if p_session is null or jsonb_typeof(p_session) <> 'object' then
        raise exception 'payload de sesión inválido';
    end if;

    -- Idempotencia: misma clave => devolver sin duplicar ni reescribir.
    if (p_session ->> 'idempotency_key') is not null then
        select id into v_session_id
        from public.workout_sessions
        where user_id = v_user
          and idempotency_key = p_session ->> 'idempotency_key'
        limit 1;
        if v_session_id is not null then
            return jsonb_build_object('session_id', v_session_id, 'duplicate', true, 'sets_inserted', 0);
        end if;
    end if;

    insert into public.workout_sessions (
        user_id, routine_id, routine_name, started_at, finished_at,
        total_sets, total_volume_kg, duration_minutes, notes, idempotency_key
    ) values (
        v_user,
        nullif(p_session ->> 'routine_id', '')::uuid,
        nullif(p_session ->> 'routine_name', ''),
        coalesce((p_session ->> 'started_at')::timestamptz, now()),
        (p_session ->> 'finished_at')::timestamptz,
        coalesce((p_session ->> 'total_sets')::integer, 0),
        coalesce((p_session ->> 'total_volume_kg')::numeric, 0),
        (p_session ->> 'duration_minutes')::integer,
        p_session ->> 'notes',
        p_session ->> 'idempotency_key'
    )
    returning id into v_session_id;

    -- Series
    if p_sets is not null and jsonb_typeof(p_sets) = 'array' then
        for v_set in select * from jsonb_array_elements(p_sets)
        loop
            -- exercise_id es uuid en el esquema, pero los retos usan ids string
            -- y un cast directo rompería la sesión. Se guarda NULL si no es uuid.
            if (v_set ->> 'exercise_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
                v_exercise_id := (v_set ->> 'exercise_id')::uuid;
            else
                v_exercise_id := null;
            end if;
            insert into public.workout_sets (
                session_id, exercise_id, exercise_name, set_number, set_type,
                weight_kg, reps, target_reps, rpe, completed
            ) values (
                v_session_id,
                v_exercise_id,
                coalesce(v_set ->> 'exercise_name', ''),
                coalesce((v_set ->> 'set_number')::integer, 1),
                coalesce(v_set ->> 'set_type', 'N'),
                coalesce((v_set ->> 'weight_kg')::numeric, 0),
                coalesce((v_set ->> 'reps')::integer, 0),
                (v_set ->> 'target_reps')::integer,
                (v_set ->> 'rpe')::numeric,
                coalesce((v_set ->> 'completed')::boolean, true)
            );
            v_sets_inserted := v_sets_inserted + 1;
        end loop;
    end if;

    -- PR acumulativo por ejercicio (nunca borra, solo suma el máximo).
    if p_sets is not null and jsonb_typeof(p_sets) = 'array' then
        for v_set in select * from jsonb_array_elements(p_sets)
        loop
            v_exercise_name := nullif(v_set ->> 'exercise_name', '');
            v_weight := coalesce((v_set ->> 'weight_kg')::numeric, 0);
            v_reps := coalesce((v_set ->> 'reps')::integer, 0);
            if v_exercise_name is null or v_weight <= 0 or v_reps <= 0 or v_reps >= 37 then
                continue;
            end if;
            v_e1rm := v_weight * (36.0 / (37.0 - v_reps));
            v_volume := v_weight * v_reps;

            update public.personal_records set
                weight_kg     = v_weight,
                reps          = v_reps,
                max_weight_kg = greatest(coalesce(max_weight_kg, 0), v_weight),
                max_reps      = greatest(coalesce(max_reps, 0), v_reps),
                max_volume_kg = greatest(coalesce(max_volume_kg, 0), v_volume),
                estimated_1rm = greatest(coalesce(estimated_1rm, 0), v_e1rm),
                session_id    = v_session_id,
                achieved_at   = now()
            where user_id = v_user and exercise_name = v_exercise_name
              and (coalesce(max_weight_kg, 0) < v_weight
                   or coalesce(max_reps, 0) < v_reps
                   or coalesce(max_volume_kg, 0) < v_volume
                   or coalesce(estimated_1rm, 0) < v_e1rm);

            get diagnostics v_updated = row_count;
            if v_updated = 0 then
                if not exists (
                    select 1 from public.personal_records
                    where user_id = v_user and exercise_name = v_exercise_name
                ) then
                    insert into public.personal_records (
                        user_id, exercise_name, weight_kg, reps,
                        max_weight_kg, max_reps, max_volume_kg, estimated_1rm,
                        session_id, achieved_at
                    ) values (
                        v_user, v_exercise_name, v_weight, v_reps,
                        v_weight, v_reps, v_volume, v_e1rm,
                        v_session_id, now()
                    );
                end if;
            end if;
        end loop;
    end if;

    return jsonb_build_object(
        'session_id',    v_session_id,
        'duplicate',     false,
        'sets_inserted', v_sets_inserted
    );
end;
$$;

revoke all on function public.finish_workout(jsonb, jsonb) from public;
grant execute on function public.finish_workout(jsonb, jsonb) to authenticated;
grant execute on function public.finish_workout(jsonb, jsonb) to service_role;