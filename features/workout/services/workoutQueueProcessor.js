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
  if (processing || !userId) return { processed: 0, remaining: 0 };
  const { onItemSynced, onItemFailed, onQueueEmpty } = opts;
  lastOpts = opts;
  processing = true;
  let processed = 0;
  try {
    const list = await getQueue(userId);
    const now = Date.now();
    const candidates = list.filter(it => isDue(it, now));

    if (candidates.length === 0) {
      onQueueEmpty?.();
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
  }
}

function scheduleNext(userId, list) {
  const retryable = list.filter(it => it.state === 'failed' && !it.permanent && it.nextRetryAt);
  if (retryable.length === 0) return;
  const soonest = Math.min(...retryable.map(it => new Date(it.nextRetryAt).getTime()));
  const delay = Math.max(1000, soonest - Date.now());
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
