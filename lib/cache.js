const store = new Map();

export function cacheGet(key) {
  const hit = store.get(key);
  if (!hit) return null;
  if (hit.expiresAt && hit.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

export function cacheSet(key, value, ttlMs = 60_000) {
  store.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : 0 });
  return value;
}

export function cacheClear(prefix) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (String(key).startsWith(prefix)) store.delete(key);
  }
}
