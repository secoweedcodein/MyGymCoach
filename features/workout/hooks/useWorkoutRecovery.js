// features/workout/hooks/useWorkoutRecovery.js
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@mygymcoach_active_workout_v2';

export function useWorkoutRecovery() {
  const [hasRecovery, setHasRecovery] = useState(false);
  const [recovery, setRecovery] = useState(null);

  const check = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) {
        setHasRecovery(false);
        setRecovery(null);
        return;
      }
      const d = JSON.parse(raw);
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
      await AsyncStorage.removeItem(KEY);
    } catch {}
    setHasRecovery(false);
    setRecovery(null);
  }, []);

  return { hasRecovery, recovery, check, clear };
}
