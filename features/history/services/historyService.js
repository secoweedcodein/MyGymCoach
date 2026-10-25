// features/history/services/historyService.js
import { supabase } from '../../../lib/supabase';

function requireId(id, label) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new TypeError(`Se requiere ${label}`);
  }
}

export async function fetchCurrentUserHistory() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) return [];
  return fetchHistory(data.user.id);
}

export async function fetchHistory(userId, limit = null) {
  requireId(userId, 'el usuario');
  if (limit !== null && (!Number.isInteger(limit) || limit < 1)) {
    throw new TypeError('El límite debe ser un entero positivo');
  }

  let query = supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('finished_at', { ascending: false });
  if (limit !== null) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchHistoryDetail(sessionId) {
  requireId(sessionId, 'la sesión');
  const { data, error } = await supabase
    .from('workout_sets')
    .select('*')
    .eq('session_id', sessionId)
    .order('exercise_name', { ascending: true })
    .order('set_number', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function deleteHistorySession(sessionId) {
  requireId(sessionId, 'la sesión');
  const { error } = await supabase
    .from('workout_sessions')
    .delete()
    .eq('id', sessionId);
  if (error) throw error;
}
