// features/workout/services/workoutSyncService.js
import { supabase } from '../../../lib/supabase';
import { isTransientNetworkError } from '../../../lib/trainingLogic';

// Columnas reales del esquema (006/008). Filtramos para no enviar campos
// locales (client_generated_id, logged_at, ...) que no existen en la tabla.
const SESSION_COLS = [
  'user_id', 'routine_id', 'routine_name', 'started_at', 'finished_at',
  'total_sets', 'total_volume_kg', 'duration_minutes', 'notes', 'idempotency_key',
];
const SET_COLS = [
  'exercise_id', 'exercise_name', 'set_number', 'set_type',
  'weight_kg', 'reps', 'target_reps', 'rpe', 'completed',
];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pick(obj, keys) {
  const out = {};
  for (const k of keys) {
    if (obj && obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

function toUuidOrNull(value) {
  return value && UUID_RE.test(String(value)) ? value : null;
}

function sanitizeSession(session, fallbackUserId) {
  return {
    ...pick(session, SESSION_COLS),
    user_id: fallbackUserId ?? session?.user_id ?? null,
  };
}

function sanitizeSets(sets, sessionId) {
  return (sets || []).map((s) => ({
    ...pick(s, SET_COLS),
    exercise_id: toUuidOrNull(s.exercise_id),
    session_id: sessionId,
  }));
}

export async function saveWorkoutSessionTransactional(payload, userId) {
  try {
    const { data, error } = await supabase.rpc('finish_workout', {
      p_session: payload.session,
      p_sets: payload.sets || [],
    });
    if (error) {
      const msg = error.message || '';
      if (error.code === 'PGRST202' || /\bcould not find\b/i.test(msg) || /finish_workout/i.test(msg)) {
        return { usedRpc: false };
      }
      throw error;
    }
    return { usedRpc: true, session: data };
  } catch (e) {
    if (e && (e.code === 'PGRST202' || /\bfunction public\.finish_workout/.test(e.message || ''))) {
      return { usedRpc: false };
    }
    throw e;
  }
}

export async function saveWorkoutSessionFallback(payload, userId) {
  const idempotencyKey = payload.session.idempotency_key;
  if (idempotencyKey) {
    const existing = await findSessionByKey(userId ?? payload.session.user_id, idempotencyKey);
    if (existing) return existing;
  }
  const sessionRow = sanitizeSession(payload.session, userId);
  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .insert(sessionRow)
    .select()
    .single();
  if (sessionError) throw sessionError;
  if (payload.sets?.length) {
    const setsWithSessionId = sanitizeSets(payload.sets, session.id);
    const { error: setsError } = await supabase.from('workout_sets').insert(setsWithSessionId);
    if (setsError) {
      await supabase.from('workout_sessions').delete().eq('id', session.id).maybeSingle();
      throw setsError;
    }
  }
  return session;
}

async function findSessionByKey(userId, idempotencyKey) {
  if (!userId || !idempotencyKey) return null;
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id, routine_name, total_sets, total_volume_kg')
    .eq('user_id', userId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function syncMutation(item, userId) {
  if (item.type === 'create_session' || item.type === 'finish_session') {
    const payload = item.payload;
    const rpc = await saveWorkoutSessionTransactional(payload, userId);
    if (rpc.usedRpc) return rpc.session;
    return await saveWorkoutSessionFallback(payload, userId);
  }
  if (item.type === 'add_sets') {
    const { sets = [], sessionId } = item.payload || {};
    if (!sets.length) return { ok: true };
    const rows = sanitizeSets(sets, sessionId);
    const { error } = await supabase.from('workout_sets').insert(rows);
    if (error) throw error;
    return { ok: true };
  }
  if (item.type === 'update_prs') {
    // Placeholder: mantener estructura idempotente
    return { ok: true };
  }
  throw new Error(`Unknown mutation type: ${item.type}`);
}

export { isTransientNetworkError };
