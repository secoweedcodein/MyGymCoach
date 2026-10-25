// features/routines/services/exerciseService.js
import { supabase } from '../../../lib/supabase';
import {
  getExercise,
  getAllExercises,
  replaceCustomExercises,
} from '../../../src/screens/data/exercises';

export async function loadCustomExercisesList() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) {
    replaceCustomExercises();
    return getAllExercises();
  }

  const { data, error } = await supabase
    .from('custom_exercises')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  if (error) throw error;
  replaceCustomExercises(data || []);
  return getAllExercises();
}

export async function createCustomExerciseForUser({ name, muscle, type }) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('Inicia sesión para crear ejercicios personalizados');
  const { error } = await supabase
    .from('custom_exercises')
    .insert({ user_id: user.id, name, muscle, type })
    .select()
    .single();
  if (error) throw error;
  return loadCustomExercisesList();
}

export { getExercise };
