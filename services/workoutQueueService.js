// services/workoutQueueService.js
//
// Permite que el entrenamiento no se pierda si no hay conexión:
//   - saveWorkoutSession(payload) intenta guardar sesión + series en red.
//   - Si falla por red, enqueuePendingSession(payload) lo encola en AsyncStorage.
//   - flushPendingSessions() reintenta los encolados (llamar al abrir la app).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const PENDING_KEY = '@mygymcoach_pending_sessions';

// ¿El error viene de falta de red (no de datos/SQL)?
export function isNetworkError(error) {
  if (!error) return true;
  const code = error.code || error.error;
  return !code || code === 'FETCH_ERROR' || code === 'NETWORK_ERROR' || code === 'REQUEST_TIMEOUT';
}

// Guarda una sesión completa (sesión + series) en Supabase.
// payload: { session: {...workout_sessions}, sets: [...workout_sets sin session_id] }
export async function saveWorkoutSession(payload) {
  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .insert(payload.session)
    .select()
    .single();

  if (sessionError) throw sessionError;

  if (payload.sets?.length) {
    const setsWithSessionId = payload.sets.map(s => ({ ...s, session_id: session.id }));
    const { error: setsError } = await supabase.from('workout_sets').insert(setsWithSessionId);
    if (setsError) throw setsError;
  }

  return session;
}

// Encola una sesión para sincronizarla más tarde.
export async function enqueuePendingSession(payload) {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push({ payload, queuedAt: new Date().toISOString() });
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.warn('enqueuePendingSession error:', e);
    return false;
  }
}

// Reintenta todas las sesiones pendientes. Si vuelve a fallar por red, las deja encoladas.
export async function flushPendingSessions() {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    if (!raw) return;
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return;

    const remaining = [];
    for (const item of list) {
      try {
        await saveWorkoutSession(item.payload);
      } catch (e) {
        if (isNetworkError(e)) {
          remaining.push(item);
          break;
        }
        // Error real de datos: se descarta para no bloquear el resto.
      }
    }

    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
  } catch (e) {
    console.warn('flushPendingSessions error:', e);
  }
}