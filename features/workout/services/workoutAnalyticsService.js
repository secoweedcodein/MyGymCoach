import { supabase } from '../../../lib/supabase';

export async function fetchWorkoutSessions(userId, startDate, endDate, columns = '*') {
  if (typeof userId !== 'string' || !userId.trim()) {
    throw new TypeError('Se requiere el usuario');
  }
  let query = supabase
    .from('workout_sessions')
    .select(columns)
    .eq('user_id', userId);
  if (startDate) query = query.gte('finished_at', startDate);
  if (endDate) query = query.lte('finished_at', endDate);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchCalendarWorkoutData(userId, statsStart, monthStart, monthEnd) {
  const statsQuery = supabase
    .from('workout_sessions')
    .select('finished_at, total_sets, total_volume_kg')
    .eq('user_id', userId)
    .not('finished_at', 'is', null);
  const monthQuery = supabase
    .from('workout_sessions')
    .select('finished_at')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .gte('finished_at', monthStart)
    .lte('finished_at', monthEnd);
  const [statsResult, monthResult] = await Promise.all([
    statsStart ? statsQuery.gte('finished_at', statsStart) : statsQuery,
    monthQuery,
  ]);
  if (statsResult.error) throw statsResult.error;
  if (monthResult.error) throw monthResult.error;
  return { stats: statsResult.data || [], month: monthResult.data || [] };
}

export async function fetchWorkoutPeriodComparison(userId, currentRange, previousRange) {
  const [current, previous] = await Promise.all([
    supabase.from('workout_sessions').select('*').eq('user_id', userId)
      .gte('finished_at', currentRange.start).lte('finished_at', currentRange.end)
      .order('finished_at', { ascending: true }),
    supabase.from('workout_sessions').select('id, total_volume_kg').eq('user_id', userId)
      .gte('finished_at', previousRange.start).lte('finished_at', previousRange.end),
  ]);
  if (current.error) throw current.error;
  if (previous.error) throw previous.error;
  return { current: current.data || [], previous: previous.data || [] };
}
