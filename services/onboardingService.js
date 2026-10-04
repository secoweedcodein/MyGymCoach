import { supabase } from '../lib/supabase';

export async function getPostAuthRoute(userId) {
  if (!userId) return '/auth';

  const { data, error } = await supabase
    .from('user_profiles')
    .select('days_per_week')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  const daysPerWeek = Number(data?.days_per_week);
  return Number.isInteger(daysPerWeek) && daysPerWeek >= 1 && daysPerWeek <= 7
    ? '/home'
    : '/onboarding';
}