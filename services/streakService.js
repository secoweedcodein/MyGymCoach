import { supabase } from '../lib/supabase';

// Clave local (no UTC): 2024-01-05
function toLocalDateKey(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Racha (en días) de entrenamientos: única fuente de verdad para workouts.
// - currentStreak con "gracia": si hoy aún no entrenaste, la racha no se rompe.
// - longestStreak: máximo de días consecutivos con al menos 1 sesión.
export const getUserStreak = async (userId) => {
  try {
    const { data: sessions, error } = await supabase
      .from('workout_sessions')
      .select('started_at')
      .eq('user_id', userId)
      .not('started_at', 'is', null)
      .order('started_at', { ascending: false });

    if (error) throw error;
    if (!sessions || sessions.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const uniqueDays = [...new Set(sessions.map(s => toLocalDateKey(s.started_at)))].sort();

    // Racha actual con gracia: si hoy no has entrenado, parte desde ayer.
    let cursor = new Date();
    const daySet = new Set(uniqueDays);
    if (!daySet.has(toLocalDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

    let currentStreak = 0;
    while (daySet.has(toLocalDateKey(cursor))) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    // Racha más larga
    let longestStreak = 0;
    let temp = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(`${uniqueDays[i - 1]}T00:00:00`);
      const cur = new Date(`${uniqueDays[i]}T00:00:00`);
      const diff = Math.round((cur - prev) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        temp++;
      } else {
        longestStreak = Math.max(longestStreak, temp);
        temp = 1;
      }
    }
    longestStreak = Math.max(longestStreak, temp);

    return { currentStreak, longestStreak };
  } catch (e) {
    console.error('Error calculating streak:', e);
    return { currentStreak: 0, longestStreak: 0 };
  }
};