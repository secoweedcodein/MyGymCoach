// features/workout/hooks/useWorkoutHydration.js
import { useEffect, useState } from 'react';
import { loadActiveWorkout } from '../services/activeWorkoutStorage';

export function useWorkoutHydration() {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await loadActiveWorkout();
        if (d) setData(d);
      } catch (e) {
        console.warn('useWorkoutHydration error', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  return { ready, data };
}
