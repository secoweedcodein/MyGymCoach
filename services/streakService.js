// services/streakService.js - REEMPLAZAR COMPLETAMENTE

import { supabase } from '../lib/supabase';

export const getUserStreak = async (userId) => {
  try {
    // Obtener todas las sesiones ordenadas por fecha
    const { data: sessions, error } = await supabase
      .from('workout_sessions')
      .select('started_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error || !sessions || sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0, today: false };
    }

    // Obtener fechas únicas (solo día, sin hora)
    const uniqueDates = [...new Set(
      sessions.map(s => new Date(s.started_at).toISOString().split('T')[0])
    )].sort().reverse();

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // ¿Entrenó hoy o ayer? (gracia de 1 día)
    const hasRecentWorkout = uniqueDates[0] === today || uniqueDates[0] === yesterday;
    
    if (!hasRecentWorkout) {
      return { currentStreak: 0, longestStreak: 0, today: false };
    }

    // Calcular racha actual
    let currentStreak = 1;
    let previousDate = uniqueDates[0];

    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = uniqueDates[i];
      const daysDiff = Math.floor(
        (new Date(previousDate) - new Date(currentDate)) / 86400000
      );

      if (daysDiff === 1) {
        currentStreak++;
        previousDate = currentDate;
      } else {
        break;
      }
    }

    // Calcular racha más larga
    let longestStreak = currentStreak;
    let tempStreak = 1;

    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const daysDiff = Math.floor(
        (new Date(uniqueDates[i]) - new Date(uniqueDates[i + 1])) / 86400000
      );

      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      today: uniqueDates[0] === today
    };
  } catch (error) {
    console.error('Error calculating streak:', error);
    return { currentStreak: 0, longestStreak: 0, today: false };
  }
};