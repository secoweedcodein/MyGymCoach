// services/workoutQueueService.js
//
// Entrenamiento sin conexión (FASE 4):
//   - Cada sesión lleva idempotency_key (generada en el cliente) para no duplicar.
//   - saveWorkoutSession usa el RPC transaccional finish_workout cuando existe
//     (sesión + sets + PR en una sola transacción, idempotente por clave);
//     si el RPC no está, hace el flujo en dos pasos con verificación previa.
//   - Cola POR USUARIO en AsyncStorage (no global).
//   - flushPendingSessions reintenta de forma segura: errores de red se quedan,
//     errores de datos se descartan y no bloquean el resto.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import {
  isTransientNetworkError,
  dedupeQueueByKey,
  nextBackoffMs,
} from '../lib/trainingLogic';

const PENDING_KEY_PREFIX = '@mygymcoach_pending_sessions_v2';

export function pendingQueueKey(userId) {
  return userId ? `${PENDING_KEY_PREFIX}_${userId}` : PENDING_KEY_PREFIX;
}

export { isTransientNetworkError as isNetworkError };

/**
 * Guarda una sesión completa (sesión + sets) de forma transaccional e idempotente.
 * payload: { session: {...workout_sessions, idempotency_key}, sets: [...workout_sets sin session_id] }
 */
export async function saveWorkoutSession(payload, userId) {
  if (!payload || !payload.session) {
    throw new Error('saveWorkoutSession requiere session');
  }

  const rpcResult = await tryTransactionalSave(payload, userId);
  if (rpcResult.used) {
    return rpcResult.session;
  }

  const idempotencyKey = payload.session.idempotency_key;

  // Flujo en dos pasos con dedupe por idempotency_key.
  if (idempotencyKey) {
    const existing = await findSessionByKey(userId ?? payload.session.user_id, idempotencyKey);
    if (existing) return existing;
  }

  const sessionRow = {
    ...payload.session,
    user_id: userId ?? payload.session.user_id,
  };
  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .insert(sessionRow)
    .select()
    .single();
  if (sessionError) throw sessionError;

  if (payload.sets?.length) {
    const setsWithSessionId = payload.sets.map(s => ({ ...s, session_id: session.id }));
    const { error: setsError } = await supabase.from('workout_sets').insert(setsWithSessionId);
    if (setsError) {
      // Intento limpiar el hueco dejado sin sets para no corromper estadísticas.
      await supabase.from('workout_sessions').delete().eq('id', session.id).maybeSingle();
      throw setsError;
    }
  }

  return session;
}

// Si el RPC existe, es la vía preferida (transaccional). Given que es
// SECURITY DEFINER, nunca debería fallar por falta de RLS.
async function tryTransactionalSave(payload, userId) {
  try {
    const { data, error } = await supabase.rpc('finish_workout', {
      p_session: payload.session,
      p_sets: payload.sets || [],
    });

    if (error) {
      const msg = error.message || '';
      // RPC no desplegado (ej. remoto sin migración 008): avisar para usar el fallback.
      if (error.code === 'PGRST202' || /\bcould not find\b/i.test(msg) || /finish_workout/i.test(msg)) {
        return { used: false, session: null };
      }
      throw error;
    }

    return { used: true, session: data };
  } catch (e) {
    // Errores reales del RPC (ej. payload inválido) no deben enmascararse.
    if (e && (e.code === 'PGRST202' || /\bfunction public\.finish_workout/.test(e.message || ''))) {
      return { used: false, session: null };
    }
    throw e;
  }
}

async function findSessionByKey(userId, idempotencyKey) {
  if (!userId || !idempotencyKey) return null;
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id, routine_name, total_sets, total_volume_kg')
    .eq('user_id', userId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  if (error) return null;
  return data;
}

/** Encola una sesión para sincronizar más tarde (cola por usuario). */
export async function enqueuePendingSession(payload, userId) {
  if (!payload) return false;
  const uid = userId ?? payload.session?.user_id;
  const key = pendingQueueKey(uid);
  try {
    const raw = await AsyncStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    list.push({
      payload,
      userId: uid ?? null,
      queuedAt: new Date().toISOString(),
      attempts: 0,
    });
    await AsyncStorage.setItem(key, JSON.stringify(dedupeQueueByKey(list)));
    return true;
  } catch (e) {
    console.warn('enqueuePendingSession error:', e);
    return false;
  }
}

/** Reintenta las sesiones pendientes de un usuario. Errores de red las dejan
 *  encoladas (con backoff); errores de datos se descartan sin bloquear el resto. */
export async function flushPendingSessions(userId) {
  const key = pendingQueueKey(userId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return { flushed: 0, remaining: 0 };
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return { flushed: 0, remaining: 0 };

    const remaining = [];
    let flushed = 0;

    for (const item of list) {
      const itemUserId = item.userId ?? userId ?? item.payload?.session?.user_id;
      if (itemUserId && userId && itemUserId !== userId) continue;

      try {
        await saveWorkoutSession(item.payload, itemUserId);
        flushed++;
      } catch (e) {
        if (isTransientNetworkError(e)) {
          remaining.push({ ...item, attempts: (item.attempts || 0) + 1 });
        } else {
          // Error real de datos: se descarta para no bloquear el resto.
          console.warn('flushPendingSessions: descartando sesión inválida', e?.message);
        }
      }
    }

    await AsyncStorage.setItem(key, JSON.stringify(remaining));
    return { flushed, remaining: remaining.length };
  } catch (e) {
    console.warn('flushPendingSessions error:', e);
    return { flushed: 0, remaining: -1 };
  }
}

/** Espera según backoff exponencial del intento. */
export const getRetryDelayMs = (attempt) => nextBackoffMs(attempt || 0);