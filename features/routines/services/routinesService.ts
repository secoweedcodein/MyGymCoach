// features/routines/services/routinesService.ts
import { supabase } from '../../../lib/supabase';

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  exercise_ids?: string[] | any[];
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface RoutineExercise {
  id?: string;
  routine_id: string;
  position: number;
  exercise_id: string | null;
  exercise_name: string;
  target_sets?: number;
  target_reps_min?: number | null;
  target_reps_max?: number | null;
  rest_seconds?: number | null;
  rir?: number | null;
  rpe?: number | null;
  notes?: string | null;
}

export async function fetchUserRoutines(userId: string): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Routine[]) || [];
}

export async function fetchRoutineExercises(routineId: string): Promise<RoutineExercise[]> {
  const { data, error } = await supabase
    .from('routine_exercises')
    .select('exercise_id, exercise_name, position, target_sets, target_reps_min, target_reps_max, rest_seconds, rir, rpe, notes')
    .eq('routine_id', routineId)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data as RoutineExercise[]) || [];
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function createRoutine(userId: string, payload: { name: string; exerciseIds?: any[] }): Promise<{ id: string }> {
  const routinePayload: any = {
    user_id: userId,
    name: payload.name?.trim(),
    exercise_ids: payload.exerciseIds || [],
  };
  const { data, error } = await supabase.from('routines').insert(routinePayload).select('id').single();
  if (error) throw error;
  return data as { id: string };
}

export async function updateRoutine(routineId: string, payload: { name?: string; exerciseIds?: any[] }) {
  const routinePayload: any = {
    name: payload.name?.trim(),
    exercise_ids: payload.exerciseIds || [],
  };
  const { error } = await supabase.from('routines').update(routinePayload).eq('id', routineId);
  if (error) throw error;
}

export async function deleteRoutine(routineId: string) {
  const { error } = await supabase.from('routines').delete().eq('id', routineId);
  if (error) throw error;
}

export async function deleteRoutineExercises(routineId: string) {
  const { error } = await supabase.from('routine_exercises').delete().eq('routine_id', routineId);
  if (error) throw error;
}

export async function insertRoutineExercises(rows: Partial<RoutineExercise>[]) {
  const { error } = await supabase.from('routine_exercises').insert(rows as any);
  if (error) throw error;
}

export async function duplicateRoutineExercises(routineId: string, rows: Partial<RoutineExercise>[]) {
  if (!Array.isArray(rows) || rows.length === 0) return;
  const { error } = await supabase.from('routine_exercises').insert(rows as any);
  if (error) throw error;
}

export async function saveRoutineWithExercisesAtomic({ routineId = null, userId, name, exerciseIds = [], exercises = [] }: {
  routineId?: string | null;
  userId: string;
  name: string;
  exerciseIds?: any[];
  exercises?: any[];
}) {
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
