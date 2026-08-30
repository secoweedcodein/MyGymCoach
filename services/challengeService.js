import { supabase } from '../lib/supabase';

export const generateMonthlyChallenge = async (userId) => {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  
  // Generar objetivo basado en historial
  const { data: lastMonthSessions } = await supabase
    .from('workout_sessions')
    .select('total_volume_kg')
    .eq('user_id', userId)
    .gte('started_at', new Date(year, month - 2, 1).toISOString())
    .lt('started_at', new Date(year, month - 1, 1).toISOString());

  const avgVolume = lastMonthSessions?.length > 0
    ? lastMonthSessions.reduce((sum, s) => sum + (s.total_volume_kg || 0), 0) / lastMonthSessions.length
    : 10000;

  const challenge = {
    user_id: userId,
    challenge_id: `monthly_${year}_${month}`,
    name: `Reto ${month}/${year}`,
    description: `Acumula ${Math.round(avgVolume * 1.1)}kg de volumen este mes`,
    objectives: {
      volume_kg: Math.round(avgVolume * 1.1),
      sessions: 16
    },
    started_at: new Date(year, month - 1, 1).toISOString(),
    status: 'active'
  };

  const { data, error } = await supabase
    .from('user_challenges')
    .upsert(challenge, { onConflict: 'user_id,challenge_id' })
    .select()
    .single();

  return { success: !error, challenge: data };
};

export const getActiveChallenge = async (userId) => {
  const { data } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  return data;
};