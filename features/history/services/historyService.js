// features/history/services/historyService.js
import { supabase } from '../../../lib/supabase';

export async function fetchHistory(userId, limit = 20) {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function fetchHistoryDetail(sessionId) {
  const { data, error } = await supabase
    .from('workout_sets')
    .select('*')
    .eq('session_id', sessionId)
    .order('exercise_name', { ascending: true })
    .order('set_number', { ascending: true });
  if (error) throw error;
  return data || [];
}
