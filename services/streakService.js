import { supabase } from '../lib/supabase';

export const getUserStreak = async (userId) => {
  try {
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('started_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (!sessions || sessions.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Calcular racha actual
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const uniqueDays = [...new Set(sessions.map(s => 
      new Date(s.started_at).toISOString().split('T')[0]
    ))].sort().reverse();

    for (let i = 0; i < uniqueDays.length; i++) {
      const sessionDate = new Date(uniqueDays[i]);
      sessionDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === i) {
        currentStreak++;
        tempStreak++;
      } else if (diffDays > i) {
        break;
      }
    }

    // Calcular racha más larga
    tempStreak = 0;
    for (let i = 0; i < uniqueDays.length - 1; i++) {
      const date1 = new Date(uniqueDays[i]);
      const date2 = new Date(uniqueDays[i + 1]);
      const diff = Math.floor((date1 - date2) / (1000 * 60 * 60 * 24));
      
      if (diff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  } catch (e) {
    console.error('Error calculating streak:', e);
    return { currentStreak: 0, longestStreak: 0 };
  }
};