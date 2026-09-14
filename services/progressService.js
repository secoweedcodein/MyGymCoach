// services/progressService.js
import { supabase } from '../lib/supabase';
import { estimate1RM, summarizeBestSets } from '../lib/trainingLogic';

// Determina si el esquema soporta las columnas de métricas múltiples (FASE 4).
let multiMetricSupport = null;

async function supportsMultiMetrics() {
  if (multiMetricSupport !== null) return multiMetricSupport;
  try {
    const { error } = await supabase
      .from('personal_records')
      .select('id, max_weight_kg')
      .limit(1);
    multiMetricSupport = !error;
  } catch {
    multiMetricSupport = false;
  }
  return multiMetricSupport;
}

const fallbackRow = row => ({
  id: row?.id,
  user_id: row?.user_id,
  exercise_name: row?.exercise_name,
  weight_kg: row?.max_weight_kg ?? row?.weight_kg ?? 0,
  reps: row?.max_reps ?? row?.reps ?? 0,
  volume_kg: row?.max_volume_kg ?? null,
  estimated_1rm: row?.estimated_1rm ?? null,
  session_id: row?.session_id,
  achieved_at: row?.achieved_at,
});

/**
 * Detecta y guarda récords personales a partir de las series de una sesión.
 * Evalúa 4 métricas: mejor peso, más reps, mejor volumen y 1RM estimado.
 *
 * @param {string} userId
 * @param {string} exerciseName
 * @param {Object[]} sets { weight_kg, reps }
 * @param {string} [sessionId]
 * @returns {Promise<{ isNewPR: boolean, improved: string[], pr: Object|null }>}
 */
export async function checkAndSavePR(userId, exerciseName, sets, sessionId) {
  try {
    if (!userId || !exerciseName || !Array.isArray(sets) || sets.length === 0) {
      return { isNewPR: false, improved: [], pr: null };
    }

    const multi = await supportsMultiMetrics();
    if (multi) {
      return await saveMultiMetricPR(userId, exerciseName, sets, sessionId);
    }
    return await saveLegacyPR(userId, exerciseName, sets, sessionId);
  } catch (e) {
    console.error('[progressService] Error checking PR:', e);
    return { isNewPR: false, improved: [], pr: null };
  }
}

// Modo FASE 4: cada PR es una fila por ejercicio con las 4 métricas como máximos.
async function saveMultiMetricPR(userId, exerciseName, sets, sessionId) {
  const { summary, lastImproved } = summarizeBestSets(sets);
  const isImprovement =
    summary.max_weight > 0 || summary.max_reps > 0 || summary.max_volume > 0 || summary.e1rm > 0;

  if (!isImprovement) return { isNewPR: false, improved: [], pr: null };

  // El set de referencia para mantener compatibilidad con la UI clásica (peso × reps).
  const bestE1rmSet = [...sets].sort(
    (a, b) => estimate1RM(b.weight_kg, b.reps) - estimate1RM(a.weight_kg, a.reps)
  )[0];

  const { data: current } = await supabase
    .from('personal_records')
    .select('id, max_weight_kg, max_reps, max_volume_kg, estimated_1rm')
    .eq('user_id', userId)
    .eq('exercise_name', exerciseName)
    .order('achieved_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentSummary = current
    ? {
        max_weight: current.max_weight_kg ?? 0,
        max_reps: current.max_reps ?? 0,
        max_volume: current.max_volume_kg ?? 0,
        e1rm: current.estimated_1rm ?? 0,
      }
    : { max_weight: 0, max_reps: 0, max_volume: 0, e1rm: 0 };

  const improved = [];
  if (summary.max_weight > currentSummary.max_weight) improved.push('max_weight');
  if (summary.max_reps > currentSummary.max_reps) improved.push('max_reps');
  if (summary.max_volume > currentSummary.max_volume) improved.push('max_volume');
  if (summary.e1rm > currentSummary.e1rm) improved.push('e1rm');

  if (improved.length === 0) {
    return { isNewPR: false, improved: [], pr: fallbackRow(current) };
  }

  const newValues = {
    user_id: userId,
    exercise_name: exerciseName,
    weight_kg: bestE1rmSet.weight_kg,
    reps: bestE1rmSet.reps,
    max_weight_kg: Math.max(summary.max_weight, currentSummary.max_weight),
    max_reps: Math.max(summary.max_reps, currentSummary.max_reps),
    max_volume_kg: Math.max(summary.max_volume, currentSummary.max_volume),
    estimated_1rm: Math.max(summary.e1rm, currentSummary.e1rm),
    session_id: sessionId ?? null,
    achieved_at: new Date().toISOString(),
  };

  let result;
  if (current) {
    result = await supabase.from('personal_records').update(newValues).eq('id', current.id).select().single();
  } else {
    const insertPayload = { user_id: userId, exercise_name: exerciseName, ...newValues };
    result = await supabase.from('personal_records').insert(insertPayload).select().single();
  }

  if (result.error) throw result.error;
  return { isNewPR: true, improved, pr: fallbackRow(result.data) };
}

// Modo legacy (esquema sin columnas nuevas): compara solo por 1RM estimado.
async function saveLegacyPR(userId, exerciseName, sets, sessionId) {
  const best = sets.reduce((acc, s) => {
    const e = estimate1RM(s.weight_kg, s.reps);
    return e > acc.e ? { set: s, e } : acc;
  }, { set: null, e: 0 });

  if (!best.set) return { isNewPR: false, improved: [], pr: null };

  const { data: currentPR } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_name', exerciseName)
    .order('achieved_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (currentPR && estimate1RM(currentPR.weight_kg, currentPR.reps) >= best.e) {
    return { isNewPR: false, improved: [], pr: currentPR };
  }

  const newPR = {
    user_id: userId,
    exercise_name: exerciseName,
    weight_kg: best.set.weight_kg,
    reps: best.set.reps,
    session_id: sessionId ?? null,
    achieved_at: new Date().toISOString(),
  };

  if (currentPR) {
    await supabase.from('personal_records').update(newPR).eq('id', currentPR.id);
  } else {
    await supabase.from('personal_records').insert(newPR);
  }
  return { isNewPR: true, improved: ['e1rm'], pr: newPR };
}

/** Mantiene compatibilidad con el import original (traslada sets individuales). */
export async function checkAndSavePRLegacy(userId, exerciseName, weight, reps, sessionId) {
  return checkAndSavePR(userId, exerciseName, [{ weight_kg: weight, reps }], sessionId);
}

export const calculate1RM = estimate1RM;