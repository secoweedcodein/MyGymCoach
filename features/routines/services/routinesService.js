// features/routines/services/routinesService.js
import { supabase } from '../../../lib/supabase';

export async function fetchUserRoutines(userId) {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchRoutineExercises(routineId) {
  const { data, error } = await supabase
    .from('routine_exercises')
    .select('exercise_id, exercise_name, position, target_sets, target_reps_min, target_reps_max, rest_seconds, rir, rpe, notes')
    .eq('routine_id', routineId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function createRoutine(userId, payload) {
  const routinePayload = {
    user_id: userId,
    name: payload.name?.trim(),
    exercise_ids: payload.exerciseIds || [],
  };
  const { data, error } = await supabase.from('routines').insert(routinePayload).select('id').single();
  if (error) throw error;
  return data;
}

export async function updateRoutine(routineId, payload) {
  const routinePayload = {
    name: payload.name?.trim(),
    exercise_ids: payload.exerciseIds || [],
  };
  const { error } = await supabase.from('routines').update(routinePayload).eq('id', routineId);
  if (error) throw error;
}

export async function deleteRoutine(routineId) {
  const { error } = await supabase.from('routines').delete().eq('id', routineId);
  if (error) throw error;
}

export async function deleteRoutineExercises(routineId) {
  const { error } = await supabase.from('routine_exercises').delete().eq('routine_id', routineId);
  if (error) throw error;
}

export async function insertRoutineExercises(rows) {
  const { error } = await supabase.from('routine_exercises').insert(rows);
  if (error) throw error;
}

export async function duplicateRoutineExercises(routineId, rows) {
  if (!Array.isArray(rows) || rows.length === 0) return { error: null };
  const { error } = await supabase.from('routine_exercises').insert(rows);
  if (error) throw error;
}

export async function saveRoutineWithExercisesAtomic({ routineId = null, userId, name, exerciseIds = [], exercises = [] }) {
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
