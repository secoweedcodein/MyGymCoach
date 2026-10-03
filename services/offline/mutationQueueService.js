// services/offline/mutationQueueService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { dedupeQueueByKey, isTransientNetworkError, nextBackoffMs } from '../../lib/trainingLogic';

const QUEUE_KEY_PREFIX = '@mygymcoach_mutation_queue_v1';

function queueKey(userId) {
  return userId ? `${QUEUE_KEY_PREFIX}_${userId}` : QUEUE_KEY_PREFIX;
}

function nowIso() {
  return new Date().toISOString();
}

export async function getQueue(userId) {
  try {
    const raw = await AsyncStorage.getItem(queueKey(userId));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveQueue(userId, list) {
  try {
    await AsyncStorage.setItem(queueKey(userId), JSON.stringify(list));
  } catch (e) {
    console.warn('mutationQueueService.saveQueue error', e);
  }
}

export async function enqueueMutation({ userId, type, payload, clientGeneratedId }) {
  const list = await getQueue(userId);
  const item = {
    id: randomUUID(),
    type,
    state: 'pending',
    payload,
    attempts: 0,
    maxAttempts: 50,
    error: null,
    lastErrorCode: null,
    lastAttemptAt: null,
    queuedAt: nowIso(),
    clientGeneratedId: clientGeneratedId || payload?.clientGeneratedId || randomUUID(),
    userId: userId || null,
  };
  list.push(item);
  await saveQueue(userId, dedupeQueueByKey(list));
  return item;
}

export async function updateQueueItem(userId, itemId, updates) {
  const list = await getQueue(userId);
  const next = list.map(it => (it.id === itemId ? { ...it, ...updates } : it));
  await saveQueue(userId, next);
  return next.find(it => it.id === itemId) || null;
}

export async function removeQueueItem(userId, itemId) {
  const list = await getQueue(userId);
  const next = list.filter(it => it.id !== itemId);
  await saveQueue(userId, next);
}

export function getRetryDelayMs(attempt) {
  return nextBackoffMs(attempt || 0);
}

export function isRetryableError(error) {
  return isTransientNetworkError(error);
}
