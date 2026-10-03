// features/workout/services/workoutSyncService.js
import { supabase } from '../../../lib/supabase';
import { isTransientNetworkError } from '../../../lib/trainingLogic';

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
  const sessionRow = { ...payload.session, user_id: userId ?? payload.session.user_id };
  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .insert(sessionRow)
    .select()
    .single();
  if (sessionError) throw sessionError;
  if (payload.sets?.length) {
    const setsWithSessionId = payload.sets.map(s => ({ ...s, session_id: session.id }));
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
    const { sets = [], sessionId, userId: uid } = item.payload || {};
    if (!sets.length) return { ok: true };
    const rows = sets.map(s => ({ ...s, session_id: sessionId }));
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
