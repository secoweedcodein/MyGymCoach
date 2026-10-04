// services/offline/networkListener.js
import { AppState } from 'react-native';
import { initNetworkListener, getNetworkStatus } from '../../lib/offline/network';
import { scheduleProcess } from '../../features/workout/services/workoutQueueProcessor';

let listener = null;
let appStateSub = null;
let currentUserId = null;
let opts = {};

function maybeProcess(delayMs) {
  if (currentUserId) scheduleProcess(currentUserId, opts, delayMs);
}

export async function startNetworkListener(userId, options = {}) {
  currentUserId = userId;
  opts = options || {};

  if (!listener) {
    listener = initNetworkListener((connected) => {
      if (connected) maybeProcess(100);
    });
  }

  if (!appStateSub) {
    appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') maybeProcess(200);
    });
  }

  const connected = await getNetworkStatus();
  if (connected) maybeProcess(50);
}

export function stopNetworkListener() {
  listener?.();
  listener = null;
  appStateSub?.remove?.();
  appStateSub = null;
  currentUserId = null;
}

export function updateNetworkListenerUser(userId) {
  currentUserId = userId;
  if (userId) maybeProcess(0);
}
