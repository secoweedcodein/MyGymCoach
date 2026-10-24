// features/routines/services/exerciseService.js
import { supabase } from '../../../lib/supabase';
import {
  getExercise,
  createCustomExercise,
  loadCustomExercises,
  getAllExercises,
} from '../../../src/screens/data/exercises';

export async function loadCustomExercisesList() {
  try {
    await loadCustomExercises(supabase);
    return getAllExercises();
  } catch (e) {
    throw e;
  }
}

export async function createCustomExerciseForUser({ name, muscle, type }) {
  try {
    const created = await createCustomExercise(supabase, { name, muscle, type });
    if (!created) throw new Error('No se pudo crear el ejercicio');
    await loadCustomExercises(supabase);
    return getAllExercises();
  } catch (e) {
    throw e;
  }
}

export { getExercise };
