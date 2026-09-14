// services/streakService.js
//
// Racha de entrenamiento por CONSISTENCIA (FASE 4):
//   - No asume que entrenar todos los días es obligatorio.
//   - La separación tolerada entre entrenamientos deriva de los días planificados
//     por semana (user_profiles.days_per_week, default 3).
//   - Cálculo con aritmética civil sobre claves YYYY-MM-DD locales: inmune al
//     desfase de zona horaria que producía toISOString().
import { supabase } from '../lib/supabase';
import { computeWorkoutStreak } from '../lib/trainingLogic';
import { todayKey } from '../lib/dateUtils';

const DEFAULT_PLANNED_DAYS = 3;

/**
 * Calcula la racha basándose en consistencia respecto de los días planificados.
 * @param {string} userId
 * @param {{ plannedDaysPerWeek?: number }} [opts]
 */
export const getUserStreak = async (userId, opts = {}) => {
  try {
    if (!userId) {
      return { currentStreak: 0, longestStreak: 0, today: false, plannedDaysPerWeek: DEFAULT_PLANNED_DAYS, pendingToday: false };
    }

    // Días planificados por semana (consistencia, no obligación diaria).
    const planned = opts.plannedDaysPerWeek ?? await getPlannedDaysPerWeek(userId);

    const { data: sessions, error } = await supabase
      .from('workout_sessions')
      .select('finished_at')
      .eq('user_id', userId)
      .order('finished_at', { ascending: false });

    if (error || !sessions || sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0, today: false, plannedDaysPerWeek: planned, pendingToday: false };
    }

    // Claves locales (YYYY-MM-DD) en la zona del dispositivo.
    const keys = sessions.map(s => toLocalDayKey(s.finished_at)).filter(Boolean);

    const streak = computeWorkoutStreak(keys, {
      plannedDaysPerWeek: planned,
      today: todayKey(),
    });

    return {
      currentStreak: streak.current,
      longestStreak: streak.longest,
      today: streak.today,
      plannedDaysPerWeek: planned,
      maxGap: streak.maxGap,
      pendingToday: !streak.today && streak.lastWorkoutDay ? streak.current > 0 : false,
    };
  } catch (error) {
    console.error('Error calculating streak:', error);
    return { currentStreak: 0, longestStreak: 0, today: false, plannedDaysPerWeek: DEFAULT_PLANNED_DAYS, pendingToday: false };
  }
};

async function getPlannedDaysPerWeek(userId) {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('days_per_week')
      .eq('id', userId)
      .maybeSingle();
    const v = Number(data?.days_per_week);
    return v >= 1 && v <= 7 ? v : DEFAULT_PLANNED_DAYS;
  } catch {
    return DEFAULT_PLANNED_DAYS;
  }
}

// Convierte un timestamp ISO a clave local YYYY-MM-DD sin off-by-one de timezone.
function toLocalDayKey(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return null;
  }
}