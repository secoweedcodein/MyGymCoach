// features/profile/services/profileService.js
import { supabase } from '../../../lib/supabase';

export async function fetchUserProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function upsertUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({ ...updates, id: userId }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchProfileDashboardData(userId, nutritionSince) {
  if (typeof userId !== 'string' || !userId.trim()) {
    throw new TypeError('El usuario es obligatorio');
  }
  if (typeof nutritionSince !== 'string' || !nutritionSince.trim()) {
    throw new TypeError('La fecha inicial de nutrición es obligatoria');
  }

  const [profile, sessions, nutrition, goals] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('workout_sessions')
      .select('total_sets, total_volume_kg')
      .eq('user_id', userId)
      .not('finished_at', 'is', null),
    supabase.from('nutrition_logs')
      .select('calories, protein_g, carbs_g, fat_g')
      .eq('user_id', userId)
      .gte('logged_date', nutritionSince),
    supabase.from('nutrition_goals')
      .select('calories, protein_g, carbs_g, fat_g')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  const failedQuery = [profile, sessions, nutrition, goals].find((result) => result.error);
  if (failedQuery) throw failedQuery.error;

  return {
    profile: profile.data || null,
    sessions: sessions.data || [],
    nutritionLogs: nutrition.data || [],
    nutritionGoals: goals.data || null,
  };
}

export async function saveProfileData(userId, { profile, weightLog, nutritionGoals }) {
  if (typeof userId !== 'string' || !userId.trim()) {
    throw new TypeError('El usuario es obligatorio');
  }

  const profileResult = await supabase
    .from('user_profiles')
    .upsert({ ...profile, id: userId }, { onConflict: 'id' });
  if (profileResult.error) throw profileResult.error;

  if (weightLog) {
    const weightResult = await supabase
      .from('weight_logs')
      .upsert({ ...weightLog, user_id: userId }, { onConflict: 'user_id,logged_date' });
    if (weightResult.error) throw weightResult.error;
  }

  if (nutritionGoals) {
    const goalsResult = await supabase
      .from('nutrition_goals')
      .upsert({ ...nutritionGoals, user_id: userId });
    if (goalsResult.error) throw goalsResult.error;
  }
}
