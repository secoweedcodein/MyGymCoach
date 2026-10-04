// lib/offline/network.js
import NetInfo from '@react-native-community/netinfo';

let isConnected = true;
let unsubscribe = null;

export function initNetworkListener(onChange) {
  if (unsubscribe) unsubscribe();
  unsubscribe = NetInfo.addEventListener(state => {
    const connected = !!state.isConnected && state.isInternetReachable !== false;
    if (connected !== isConnected) {
      isConnected = connected;
      onChange?.(isConnected);
    }
  });
  return () => {
    unsubscribe?.();
    unsubscribe = null;
  };
}

export async function getNetworkStatus() {
  const state = await NetInfo.fetch();
  return !!state.isConnected && state.isInternetReachable !== false;
}
