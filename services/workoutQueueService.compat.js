// services/workoutQueueService.compat.js
// Compatibilidad: expone misma API y usa nueva cola con estados
import {
  enqueueMutation,
  getQueue,
} from './offline/mutationQueueService';
import {
  saveWorkoutSessionTransactional,
  saveWorkoutSessionFallback,
} from '../features/workout/services/workoutSyncService';
import { isTransientNetworkError } from '../lib/trainingLogic';

export const isNetworkError = isTransientNetworkError;

export async function saveWorkoutSession(payload, userId) {
  const rpc = await saveWorkoutSessionTransactional(payload, userId);
  if (rpc.usedRpc) return rpc.session;
  return await saveWorkoutSessionFallback(payload, userId);
}

export async function enqueuePendingSession(payload, userId) {
  const uid = userId ?? payload?.session?.user_id ?? null;
  await enqueueMutation({
    userId: uid,
    type: 'finish_session',
    clientGeneratedId: payload?.session?.client_generated_id,
    payload,
  });
  return true;
}

export async function flushPendingSessions(userId) {
  const list = await getQueue(userId);
  let flushed = 0;
  const remaining = [];
  for (const it of list) {
    if (it.state !== 'pending' && it.state !== 'failed') {
      remaining.push(it);
      continue;
    }
    try {
      if (it.type === 'finish_session') {
        await saveWorkoutSession(it.payload, userId ?? it.userId);
        flushed++;
      } else {
        // otros tipos: omitir en compat por ahora
        remaining.push(it);
      }
    } catch (e) {
      if (isNetworkError(e)) {
        remaining.push({ ...it, attempts: (it.attempts || 0) + 1, state: 'failed' });
      } else {
        // descartar inválido
      }
    }
  }
  await AsyncStorageCompatSave(userId, remaining);
  return { flushed, remaining: remaining.length };
}

async function AsyncStorageCompatSave(userId, list) {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  const key = userId ? `@mygymcoach_mutation_queue_v1_${userId}` : '@mygymcoach_mutation_queue_v1';
  await AsyncStorage.setItem(key, JSON.stringify(list));
}
