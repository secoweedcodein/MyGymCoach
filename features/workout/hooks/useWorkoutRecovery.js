// features/workout/hooks/useWorkoutRecovery.js
import { useCallback, useEffect, useState } from 'react';
import { loadActiveWorkout, clearActiveWorkout } from '../services/activeWorkoutStorage';

export function useWorkoutRecovery() {
  const [hasRecovery, setHasRecovery] = useState(false);
  const [recovery, setRecovery] = useState(null);

  const check = useCallback(async () => {
    try {
      const d = await loadActiveWorkout();
      if (!d) {
        setHasRecovery(false);
        setRecovery(null);
        return;
      }
      if (d.isActive) {
        setHasRecovery(true);
        setRecovery(d);
      } else {
        setHasRecovery(false);
        setRecovery(null);
      }
    } catch {
      setHasRecovery(false);
      setRecovery(null);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const clear = useCallback(async () => {
    try {
      await clearActiveWorkout();
    } catch {}
    setHasRecovery(false);
    setRecovery(null);
  }, []);

  return { hasRecovery, recovery, check, clear };
}
