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

export async function createRoutine(userId, payload) {
  const routinePayload = {
    user_id: userId,
    name: payload.name.trim(),
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

export async function deleteRoutineExercises(routineId) {
  const { error } = await supabase.from('routine_exercises').delete().eq('routine_id', routineId);
  if (error) throw error;
}

export async function insertRoutineExercises(rows) {
  const { error } = await supabase.from('routine_exercises').insert(rows);
  if (error) throw error;
}
