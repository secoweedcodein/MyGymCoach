// lib/offline/retry.js
import { nextBackoffMs } from '../trainingLogic';

export async function withRetry(fn, { maxAttempts = 10, baseMs = 500, capMs = 30000, jitter = true } = {}) {
  let attempt = 0;
  let lastErr;
  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      attempt++;
      if (attempt >= maxAttempts) break;
      let d = nextBackoffMs(attempt - 1, { baseMs, capMs });
      if (jitter) d = Math.floor(d * (0.8 + Math.random() * 0.4));
      await new Promise(r => setTimeout(r, d));
    }
  }
  throw lastErr;
}
