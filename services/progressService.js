import { supabase } from '../lib/supabase';

// Fórmula Brzycki: 1RM = peso × (36 / (37 - reps))
export const calculate1RM = (weight, reps) => {
  if (!weight || !reps || reps >= 37) return 0;
  return Math.round(weight * (36 / (37 - reps)));
};

// Detectar nuevo récord personal
export const checkAndSavePR = async (userId, exerciseName, weight, reps, sessionId) => {
  try {
    const estimated1RM = calculate1RM(weight, reps);
    
    // Buscar récord actual (el más reciente del ejercicio)
    const { data: currentPR } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_name', exerciseName)
      .order('achieved_at', { ascending: false })
      .limit(1)
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