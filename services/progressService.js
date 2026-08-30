import { supabase } from '../lib/supabase';

// Fórmula Brzycki: 1RM = peso × (36 / (37 - reps))
export const calculate1RM = (weight, reps) => {
  if (!weight || !reps || reps >= 37) return 0;
  return Math.round(weight * (36 / (37 - reps)));
};

// Fórmula Epley (alternativa): 1RM = peso × (1 + reps/30)
export const calculate1RM_Epley = (weight, reps) => {
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30));
};

// Obtener récords personales por ejercicio
export const getUserRecords = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .order('weight_kg', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('Error fetching records:', e);
    return [];
  }
};

// Calcular volumen total por grupo muscular (últimas 4 semanas)
export const getVolumeByMuscle = async (userId, weeks = 4) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));
    
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', userId)
      .gte('started_at', startDate.toISOString());

    if (!sessions || sessions.length === 0) return {};

    const sessionIds = sessions.map(s => s.id);
    
    const { data: sets } = await supabase
      .from('workout_sets')
      .select('exercise_name, weight_kg, reps, completed')
      .in('session_id', sessionIds)
      .eq('completed', true);

    if (!sets) return {};

    // Agrupar por ejercicio y calcular volumen
    const volumeByExercise = {};
    sets.forEach(set => {
      const volume = (set.weight_kg || 0) * (set.reps || 0);
      if (!volumeByExercise[set.exercise_name]) {
        volumeByExercise[set.exercise_name] = 0;
      }
      volumeByExercise[set.exercise_name] += volume;
    });

    return volumeByExercise;
  } catch (e) {
    console.error('Error calculating volume:', e);
    return {};
  }
};

// Detectar nuevo récord personal
export const checkAndSavePR = async (userId, exerciseName, weight, reps, sessionId) => {
  try {
    const estimated1RM = calculate1RM(weight, reps);
    
    // Buscar récord actual
    const { data: currentPR } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_name', exerciseName)
      .maybeSingle();

    // Si no hay récord o el nuevo es mejor, guardar
    if (!currentPR || estimated1RM > calculate1RM(currentPR.weight_kg, currentPR.reps)) {
      const newPR = {
        user_id: userId,
        exercise_name: exerciseName,
        weight_kg: weight,
        reps: reps,
        session_id: sessionId,
        achieved_at: new Date().toISOString(),
      };

      if (currentPR) {
        await supabase.from('personal_records').update(newPR).eq('id', currentPR.id);
      } else {
        await supabase.from('personal_records').insert(newPR);
      }

      return { isNewPR: true, pr: newPR };
    }

    return { isNewPR: false };
  } catch (e) {
    console.error('Error checking PR:', e);
    return { isNewPR: false };
  }
};