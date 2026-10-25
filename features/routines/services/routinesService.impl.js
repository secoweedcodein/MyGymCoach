import { supabase } from '../../../lib/supabase';

function requireText(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`Se requiere ${label}`);
  }
}

export async function fetchUserRoutines(userId) {
  requireText(userId, 'el usuario');
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchRoutineExercises(routineId) {
  requireText(routineId, 'la rutina');
  const { data, error } = await supabase
    .from('routine_exercises')
    .select('exercise_id, exercise_name, position, target_sets, target_reps_min, target_reps_max, rest_seconds, rir, rpe, notes')
    .eq('routine_id', routineId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function findUserRoutineByName(userId, name) {
  requireText(userId, 'el usuario');
  requireText(name, 'el nombre de la rutina');
  const { data, error } = await supabase
    .from('routines')
    .select('id')
    .eq('user_id', userId)
    .eq('name', name)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function createRoutine(userId, payload) {
  requireText(userId, 'el usuario');
  requireText(payload?.name, 'el nombre de la rutina');
  if (payload.exerciseIds !== undefined && !Array.isArray(payload.exerciseIds)) {
    throw new TypeError('Los ejercicios de la rutina deben ser una lista');
  }
  const routinePayload = {
    ...payload,
    user_id: userId,
    name: payload.name?.trim(),
    exercise_ids: payload.exerciseIds || payload.exercise_ids || [],
  };
  delete routinePayload.exerciseIds;
  const { data, error } = await supabase.from('routines').insert(routinePayload).select('id').single();
  if (error) throw error;
  return data;
}

export async function updateRoutine(routineId, payload) {
  requireText(routineId, 'la rutina');
  if (!payload || typeof payload !== 'object') {
    throw new TypeError('Los cambios de la rutina son obligatorios');
  }
  const routinePayload = {};
  if (payload.name !== undefined) {
    requireText(payload.name, 'el nombre de la rutina');
    routinePayload.name = payload.name.trim();
  }
  if (payload.exerciseIds !== undefined) {
    if (!Array.isArray(payload.exerciseIds)) {
      throw new TypeError('Los ejercicios de la rutina deben ser una lista');
    }
    routinePayload.exercise_ids = payload.exerciseIds;
  }
  if (Object.keys(routinePayload).length === 0) {
    throw new TypeError('Se requiere al menos un cambio para la rutina');
  }
  const { error } = await supabase.from('routines').update(routinePayload).eq('id', routineId);
  if (error) throw error;
}

export async function deleteRoutine(routineId) {
  requireText(routineId, 'la rutina');
  const { error } = await supabase.from('routines').delete().eq('id', routineId);
  if (error) throw error;
}

export async function deleteRoutineExercises(routineId) {
  requireText(routineId, 'la rutina');
  const { error } = await supabase.from('routine_exercises').delete().eq('routine_id', routineId);
  if (error) throw error;
}

export async function insertRoutineExercises(rows) {
  if (!Array.isArray(rows)) throw new TypeError('Los ejercicios deben ser una lista');
  if (rows.length === 0) return;
  const { error } = await supabase.from('routine_exercises').insert(rows);
  if (error) throw error;
}

export async function duplicateRoutineExercises(routineId, rows) {
  requireText(routineId, 'la rutina');
  if (!Array.isArray(rows)) throw new TypeError('Los ejercicios deben ser una lista');
  if (rows.length === 0) return 0;
  const rowsToInsert = rows.map((row) => ({ ...row, routine_id: routineId }));
  const { error } = await supabase.from('routine_exercises').insert(rowsToInsert);
  if (error) throw error;
  return rowsToInsert.length;
}

export async function saveRoutineWithExercisesAtomic({ routineId = null, userId, name, exerciseIds = [], exercises = [] }) {
  requireText(userId, 'el usuario');
  requireText(name, 'el nombre de la rutina');
  if (!Array.isArray(exerciseIds) || !Array.isArray(exercises)) {
    throw new TypeError('Los ejercicios deben ser listas');
  }
  const { data, error } = await supabase.rpc('save_routine_with_exercises', {
    p_routine_id: routineId,
    p_user_id: userId,
    p_name: name,
    p_exercise_ids: exerciseIds,
    p_exercises: exercises,
  });
  if (error) throw error;
  return data;
}
