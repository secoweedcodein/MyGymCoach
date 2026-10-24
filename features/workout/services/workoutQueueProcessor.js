// features/workout/services/workoutQueueProcessor.js
//
// Procesador de la cola de mutaciones offline.
// Estados: pending -> syncing -> synced (se elimina) | failed
//   - failed con permanent=false: reintentable (respeta nextRetryAt y maxAttempts).
//   - failed con permanent=true: dead-letter, no se vuelve a intentar.
import {
  getQueue,
  updateQueueItem,
  removeQueueItem,
  getRetryDelayMs,
  isRetryableError,
} from '../../../services/offline/mutationQueueService';
import { syncMutation } from './workoutSyncService';

let processing = false;
let rerun = false;
let timer = null;
let timerAt = 0;
let lastOpts = {};

export function setProcessingFlag(v) {
  processing = v;
}

const STALE_SYNCING_MS = 2 * 60 * 1000;

function isDue(item, now) {
  if (item.state === 'pending') return true;
  // Recupera ítems que quedaron en 'syncing' si la app se cerró a mitad.
  if (item.state === 'syncing') {
    if (!item.lastAttemptAt) return true;
    return now - new Date(item.lastAttemptAt).getTime() > STALE_SYNCING_MS;
  }
  if (item.state !== 'failed') return false;
  if (item.permanent) return false;
  if (!item.nextRetryAt) return true;
  return new Date(item.nextRetryAt).getTime() <= now;
}

export async function processQueue(userId, opts = {}) {
  if (!userId) return { processed: 0, remaining: 0 };
  // Si ya se está procesando, marca una nueva pasada. Los ítems encolados
  // mientras procesábamos (o que fallen y queden pendientes de reintento)
  // quedaban varados porque el early-return no reprogramaba nada.
  if (processing) {
    rerun = true;
    return { processed: 0, remaining: 0, deferred: true };
  }
  const { onItemSynced, onItemFailed, onQueueEmpty } = opts;
  lastOpts = opts;
  processing = true;
  let processed = 0;
  try {
    const list = await getQueue(userId);
    const now = Date.now();
    const candidates = list.filter(it => isDue(it, now));

    if (candidates.length === 0) {
      if (list.length === 0) onQueueEmpty?.();
      // Reprograma reintentos futuros / syncing obsoletos aunque no haya nada due ahora.
      scheduleNext(userId, list);
      return { processed: 0, remaining: list.length };
    }

    for (const item of candidates) {
      const attempts = (item.attempts || 0) + 1;
      await updateQueueItem(userId, item.id, {
        state: 'syncing',
        attempts,
        lastAttemptAt: new Date().toISOString(),
      });

      try {
        const result = await syncMutation(item, userId);
        await removeQueueItem(userId, item.id);
        processed++;
        onItemSynced?.(item, result);
      } catch (error) {
        const retryable = isRetryableError(error);
        const maxAttempts = item.maxAttempts || 50;
        const willRetry = retryable && attempts < maxAttempts;
        await updateQueueItem(userId, item.id, {
          state: 'failed',
          permanent: !willRetry,
          error: error?.message || String(error),
          lastErrorCode: error?.code || null,
          nextRetryAt: willRetry
            ? new Date(Date.now() + getRetryDelayMs(attempts - 1)).toISOString()
            : null,
        });
        onItemFailed?.(item, error, { retryable, attempts, willRetry });
      }
    }

    const remaining = await getQueue(userId);
    scheduleNext(userId, remaining);
    return { processed, remaining: remaining.length };
  } finally {
    processing = false;
    // Ítems encolados durante esta pasada: reejecuta de inmediato.
    if (rerun) {
      rerun = false;
      scheduleProcess(userId, lastOpts, 0);
    }
  }
}

function scheduleNext(userId, list) {
  if (!list || list.length === 0) return;
  const now = Date.now();
  const times = [];
  for (const it of list) {
    if (it.state === 'pending') {
      times.push(now);
    } else if (it.state === 'syncing') {
      const since = it.lastAttemptAt ? new Date(it.lastAttemptAt).getTime() : 0;
      times.push(Math.max(now, since + STALE_SYNCING_MS));
    } else if (it.state === 'failed' && !it.permanent) {
      const at = it.nextRetryAt ? new Date(it.nextRetryAt).getTime() : now;
      times.push(Math.max(now, at));
    }
  }
  if (times.length === 0) return;
  const soonest = Math.min(...times);
  const delay = Math.max(1000, soonest - now);
  scheduleProcess(userId, lastOpts, delay);
}

export function scheduleProcess(userId, opts = {}, delayMs = 0) {
  if (!userId) return;
  const at = Date.now() + delayMs;
  // Si ya hay un temporizador más cercano, no lo retrasamos.
  if (timer && timerAt <= at) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    timerAt = 0;
    processQueue(userId, opts).catch(() => {});
  }, delayMs);
  timerAt = at;
}

export function cancelScheduledProcess() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
    timerAt = 0;
  }
}
