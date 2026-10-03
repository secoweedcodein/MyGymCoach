// features/workout/services/workoutQueueProcessor.js
import {
  getQueue,
  saveQueue,
  updateQueueItem,
  removeQueueItem,
  getRetryDelayMs,
  isRetryableError,
} from '../../../services/offline/mutationQueueService';
import { syncMutation } from './workoutSyncService';

let processing = false;
let timer = null;

export function setProcessingFlag(v) {
  processing = v;
}

export async function processQueue(userId, { onItemSynced, onItemFailed, onQueueEmpty } = {}) {
  if (processing || !userId) return;
  processing = true;
  try {
    const list = await getQueue(userId);
    const pending = list.filter(it => it.state === 'pending' || it.state === 'failed');
    if (pending.length === 0) {
      onQueueEmpty?.();
      return;
    }

    for (const item of pending) {
      if (item.state !== 'pending' && item.state !== 'failed') continue;
      const attempts = (item.attempts || 0) + 1;
      await updateQueueItem(userId, item.id, { state: 'syncing', attempts, lastAttemptAt: new Date().toISOString() });
      try {
        const result = await syncMutation(item, userId);
        await removeQueueItem(userId, item.id);
        onItemSynced?.(item, result);
      } catch (error) {
        const retryable = isRetryableError(error);
        const maxAttempts = item.maxAttempts || 50;
        const nextState = retryable && attempts < maxAttempts ? 'failed' : 'failed';
        await updateQueueItem(userId, item.id, {
          state: nextState,
          error: error?.message || String(error),
          lastErrorCode: error?.code || null,
        });
        onItemFailed?.(item, error, { retryable, attempts, willRetry: retryable && attempts < maxAttempts });
      }
    }
  } finally {
    processing = false;
  }
}

export function scheduleProcess(userId, opts, delayMs = 0) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  timer = setTimeout(() => {
    processQueue(userId, opts).catch(() => {});
  }, delayMs);
}

export function cancelScheduledProcess() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
