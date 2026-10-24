// features/routines/hooks/useRoutines.js
import { useState, useCallback } from 'react';
import { fetchUserRoutines, fetchRoutineExercises } from '../services/routinesService';

export function useRoutines() {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRoutines = useCallback(async (userId) => {
    if (!userId) return [];
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserRoutines(userId);
      setRoutines(data);
      return data;
    } catch (e) {
      setError(e?.message || 'Error al cargar rutinas');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoutineExercises = useCallback(async (routineId) => {
    if (!routineId) return [];
    try {
      return await fetchRoutineExercises(routineId);
    } catch (e) {
      throw e;
    }
  }, []);

  return { routines, loading, error, loadRoutines, loadRoutineExercises, setRoutines };
}
