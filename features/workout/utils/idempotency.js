// features/workout/utils/idempotency.js
import { createIdempotencyKey, hashString } from '../../../lib/trainingLogic';
import { randomUUID } from 'expo-crypto';

export { createIdempotencyKey, hashString };

export function generateClientId() {
  return randomUUID();
}
