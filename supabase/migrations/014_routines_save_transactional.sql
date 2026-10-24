-- 014_routines_save_transactional.sql
-- FASE 03: Guardado atómico de rutinas con sus ejercicios
-- Garantiza que no quede rutina sin ejercicios si falla la inserción, o viceversa.

create or replace function public.save_routine_with_exercises(
  p_routine_id uuid,
  p_user_id uuid,
  p_name text,
  p_exercise_ids jsonb default '[]'::jsonb,
  p_exercises jsonb default '[]'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as 
declare
  v_routine_id uuid;
  v_name text := trim(coalesce(p_name, ''));
  v_ex jsonb;
  v_rows jsonb := '[]'::jsonb;
  v_idx int := 0;
  v_ex_id text;
  v_ex_name text;
  v_sets int;
  v_rmin int;
  v_rmax int;
  v_rest int;
  v_rir int;
  v_rpe numeric;
  v_notes text;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'No autorizado';
  end if;
  if v_name = '' then
    raise exception 'Nombre de rutina requerido';
  end if;
  if p_exercises is null or jsonb_array_length(p_exercises) = 0 then
    raise exception 'Selecciona al menos un ejercicio';
  end if;

  if p_routine_id is not null then
    -- Actualizar rutina existente (verificar propiedad)
    update public.routines
    set name = v_name,
        exercise_ids = coalesce(p_exercise_ids, '[]'::jsonb)
    where id = p_routine_id and user_id = p_user_id
    returning id into v_routine_id;
    if v_routine_id is null then
      raise exception 'Rutina no encontrada o sin permisos';
    end if;
  else
    -- Crear nueva rutina
    insert into public.routines (user_id, name, exercise_ids)
    values (p_user_id, v_name, coalesce(p_exercise_ids, '[]'::jsonb))
    returning id into v_routine_id;
  end if;

  -- Eliminar ejercicios anteriores y reinsertar (atómico)
  delete from public.routine_exercises where routine_id = v_routine_id;

  for v_ex in select * from jsonb_array_elements(p_exercises)
  loop
    v_ex_id := coalesce(v_ex ->> 'exercise_id', v_ex ->> 'id');
    v_ex_name := coalesce(v_ex ->> 'exercise_name', v_ex ->> 'name', '');
    v_sets := coalesce((v_ex ->> 'target_sets')::int, (v_ex ->> 'sets')::int, 1);
    v_rmin := nullif(v_ex ->> 'target_reps_min', '')::int;
    if v_rmin is null then v_rmin := nullif(v_ex ->> 'repsMin', '')::int; end if;
    v_rmax := nullif(v_ex ->> 'target_reps_max', '')::int;
    if v_rmax is null then v_rmax := nullif(v_ex ->> 'repsMax', '')::int; end if;
    v_rest := coalesce(nullif(v_ex ->> 'rest_seconds', '')::int, nullif(v_ex ->> 'rest', '')::int, 90);
    v_rir := nullif(v_ex ->> 'rir', '')::int;
    v_rpe := nullif(v_ex ->> 'rpe', '')::numeric;
    v_notes := nullif(trim(coalesce(v_ex ->> 'notes', '')), '');

    insert into public.routine_exercises (
      routine_id, position, exercise_id, exercise_name,
      target_sets, target_reps_min, target_reps_max,
      rest_seconds, rir, rpe, notes
    ) values (
      v_routine_id, v_idx, v_ex_id, v_ex_name,
      v_sets, v_rmin, v_rmax,
      v_rest, v_rir, v_rpe, v_notes
    );
    v_idx := v_idx + 1;
  end loop;

  return jsonb_build_object('routine_id', v_routine_id, 'exercises_count', v_idx);
exception
  when others then
    raise;
end;
;

revoke all on function public.save_routine_with_exercises(uuid, uuid, text, jsonb, jsonb) from public;
grant execute on function public.save_routine_with_exercises(uuid, uuid, text, jsonb, jsonb) to authenticated;
grant execute on function public.save_routine_with_exercises(uuid, uuid, text, jsonb, jsonb) to service_role;
