// src/hooks/useHomeData.js
// Carga en paralelo todo lo que necesita el Home (rutinas, nutrición, sesiones, racha).
// Una sola consulta a workout_sessions sirve para: stats del mes, semana y "entrenó hoy".
import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase.js';
import { todayKey } from '../../lib/dateUtils';
import { getUserStreak } from '../../services/streakService';

const DAY_MS = 1000 * 60 * 60 * 24;
const WEEK_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const EMPTY_STATS = { workouts: 0, sets: 0, volume: 0 };
const EMPTY_STREAK = { currentStreak: 0, longestStreak: 0 };

function startOfWeekMonday(now) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function isExpiredChallenge(routine, now) {
  if (!routine.is_challenge || !routine.challenge_start_date) return false;
  const diffDays = Math.ceil((now - new Date(routine.challenge_start_date)) / DAY_MS);
  return diffDays >= 30;
}

function buildWeek(sessions, now) {
  const trained = new Set(sessions.map((s) => dayKey(new Date(s.finished_at))));
  const weekStart = startOfWeekMonday(now);
  const todayStr = dayKey(now);

  return WEEK_LABELS.map((label, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const key = dayKey(date);
    return { label, done: trained.has(key), isToday: key === todayStr };
  });
}

export function useHomeData(userId) {
  const [routines, setRoutines] = useState([]);
  const [monthStats, setMonthStats] = useState(EMPTY_STATS);
  const [week, setWeek] = useState(() => buildWeek([], new Date()));
  const [trainedToday, setTrainedToday] = useState(false);
  const [todayCalories, setTodayCalories] = useState(0);
  const [streak, setStreak] = useState(EMPTY_STREAK);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async ({ pull = false } = {}) => {
      if (!userId) return;
      const requestId = ++requestRef.current;
      if (pull) setRefreshing(true);
      setError(null);

      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const weekStart = startOfWeekMonday(now);
        const since = (weekStart < monthStart ? weekStart : monthStart).toISOString();

        const [routinesRes, nutritionRes, sessionsRes, streakData] = await Promise.all([
          supabase
            .from('routines')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
          supabase
            .from('nutrition_logs')
            .select('calories')
            .eq('user_id', userId)
            .eq('logged_date', todayKey()),
          supabase
            .from('workout_sessions')
            .select('total_sets, total_volume_kg, finished_at')
            .eq('user_id', userId)
            .not('finished_at', 'is', null)
            .gte('finished_at', since),
          getUserStreak(userId).catch(() => null),
        ]);

        if (requestId !== requestRef.current) return; // llegó una carga más reciente

        // Rutinas (+ limpieza de retos expirados, igual que antes)
        if (routinesRes.error) {
          setError(routinesRes.error);
        } else if (routinesRes.data) {
          const expiredIds = [];
          const active = routinesRes.data.filter((r) => {
            if (isExpiredChallenge(r, now)) {
              expiredIds.push(r.id);
              return false;
            }
            return true;
          });
          setRoutines(active);

          if (expiredIds.length > 0) {
            supabase
              .from('routines')
              .delete()
              .in('id', expiredIds)
              .then(({ error: delError }) => {
                if (delError && __DEV__) console.warn('Error eliminando retos expirados:', delError);
              });
          }
        }

        // Nutrición del día
        if (!nutritionRes.error) {
          const kcal = (nutritionRes.data || []).reduce((a, r) => a + (r.calories || 0), 0);
          setTodayCalories(Math.round(kcal));
        }

        // Sesiones: mes, semana y hoy
        if (sessionsRes.error || !sessionsRes.data) {
          setMonthStats(EMPTY_STATS);
          setTrainedToday(false);
          setWeek(buildWeek([], now));
        } else {
          const sessions = sessionsRes.data;
          const monthSessions = sessions.filter((s) => new Date(s.finished_at) >= monthStart);
          setMonthStats({
            workouts: monthSessions.length,
            sets: monthSessions.reduce((a, s) => a + (s.total_sets || 0), 0),
            volume: Math.round(monthSessions.reduce((a, s) => a + (s.total_volume_kg || 0), 0)),
          });
          setWeek(buildWeek(sessions, now));
          const todayStr = dayKey(now);
          setTrainedToday(sessions.some((s) => dayKey(new Date(s.finished_at)) === todayStr));
        }

        if (streakData) setStreak(streakData);
      } catch (err) {
        if (requestId === requestRef.current) setError(err);
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [userId],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const reload = useCallback(() => load({ pull: true }), [load]);

  return {
    routines,
    monthStats,
    week,
    trainedToday,
    todayCalories,
    streak,
    loading,
    refreshing,
    error,
    reload,
  };
}