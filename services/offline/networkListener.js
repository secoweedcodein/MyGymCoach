// services/offline/networkListener.js
import { initNetworkListener, getNetworkStatus } from '../../lib/offline/network';
import { processQueue, scheduleProcess } from '../../features/workout/services/workoutQueueProcessor';

let listener = null;
let currentUserId = null;
let opts = {};

export async function startNetworkListener(userId, options = {}) {
  currentUserId = userId;
  opts = options;
  if (listener) return;
  listener = initNetworkListener(async (connected) => {
    if (connected && currentUserId) {
      scheduleProcess(currentUserId, opts, 100);
    }
  });
  const connected = await getNetworkStatus();
  if (connected && currentUserId) {
    scheduleProcess(currentUserId, opts, 200);
  }
}

export function stopNetworkListener() {
  listener?.();
  listener = null;
}

export function updateNetworkListenerUser(userId) {
  currentUserId = userId;
}
