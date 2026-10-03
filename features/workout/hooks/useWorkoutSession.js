// features/workout/hooks/useWorkoutSession.js
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { createIdempotencyKey } from '../../../lib/trainingLogic';
import { sessionStats } from '../utils/metrics';
import { enqueueMutation } from '../../../services/offline/mutationQueueService';

const ACTIVE_WORKOUT_KEY = '@mygymcoach_active_workout_v2';

function nowIso() {
  return new Date().toISOString();
}

export function useWorkoutSession(userId) {
  const [exercises, setExercises] = useState([]);
  const [routineName, setRoutineName] = useState('Entreno');
  const [startedAt, setStartedAt] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessionClientId, setSessionClientId] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const intervalRef = useRef(null);
  const pauseRef = useRef(0);
  const startedTsRef = useRef(null);

  const saveState = useCallback(async () => {
    try {
      const data = {
        exercises,
        routineName,
        startedAt,
        sessionId,
        sessionClientId,
        idempotencyKey,
        elapsed,
        isActive,
        isPaused,
        savedAt: nowIso(),
      };
      await AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('useWorkoutSession.saveState error', e);
    }
  }, [exercises, routineName, startedAt, sessionId, sessionClientId, idempotencyKey, elapsed, isActive, isPaused]);

  const loadState = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(ACTIVE_WORKOUT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.exercises) setExercises(d.exercises);
      if (d.routineName) setRoutineName(d.routineName);
      if (d.startedAt) setStartedAt(d.startedAt);
      if (d.sessionId) setSessionId(d.sessionId);
      if (d.sessionClientId) setSessionClientId(d.sessionClientId);
      if (d.idempotencyKey) setIdempotencyKey(d.idempotencyKey);
      if (typeof d.elapsed === 'number') setElapsed(d.elapsed);
      if (typeof d.isActive === 'boolean') setIsActive(d.isActive);
      if (typeof d.isPaused === 'boolean') setIsPaused(d.isPaused);
      if (d.startedAt) startedTsRef.current = new Date(d.startedAt).getTime() - (d.elapsed || 0) * 1000;
    } catch (e) {
      console.warn('useWorkoutSession.loadState error', e);
    } finally {
      setHydrated(true);
    }
  }, []);

  const clearState = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ACTIVE_WORKOUT_KEY);
    } catch (e) {
      console.warn('useWorkoutSession.clearState error', e);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        if (startedTsRef.current) {
          const now = Date.now();
          const diff = Math.floor((now - startedTsRef.current) / 1000);
          setElapsed(diff);
        } else {
          setElapsed(e => e + 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isActive, isPaused]);

  useEffect(() => {
    saveState();
  }, [saveState]);

  const startSession = useCallback(
    ({ routineName: rn = 'Entreno' } = {}) => {
      const now = nowIso();
      const ts = Date.now();
      const sidClient = randomUUID();
      const ik = createIdempotencyKey(userId, now);
      startedTsRef.current = ts;
      setRoutineName(rn);
      setStartedAt(now);
      setSessionClientId(sidClient);
      setIdempotencyKey(ik);
      setSessionId(null);
      setElapsed(0);
      setIsActive(true);
      setIsPaused(false);
      setExercises([]);
      enqueueMutation({
        userId,
        type: 'create_session',
        clientGeneratedId: sidClient,
        payload: {
          session: {
            user_id: userId,
            routine_name: rn,
            started_at: now,
            idempotency_key: ik,
            client_generated_id: sidClient,
          },
          sets: [],
        },
      }).catch(() => {});
    },
    [userId]
  );

  const pauseSession = useCallback(() => {
    if (isActive) {
      pauseRef.current = Date.now();
      setIsPaused(true);
    }
  }, [isActive]);

  const resumeSession = useCallback(() => {
    if (isActive && isPaused && startedTsRef.current) {
      const pausedAt = pauseRef.current || Date.now();
      const offset = Math.floor((Date.now() - pausedAt) / 1000);
      startedTsRef.current = startedTsRef.current + offset * 1000;
      setIsPaused(false);
    }
  }, [isActive, isPaused]);

  const addExercise = useCallback((ex) => {
    const id = ex.id ?? ex.exerciseId ?? randomUUID();
    setExercises(prev => [
      ...prev,
      {
        id,
        name: ex.name,
        exerciseId: ex.exerciseId ?? id,
        sets: [],
        targetSets: ex.targetSets,
        targetRepsMin: ex.targetRepsMin,
        targetRepsMax: ex.targetRepsMax,
        restSeconds: ex.restSeconds,
        rir: ex.rir,
        rpeTarget: ex.rpeTarget,
        notes: ex.notes,
      },
    ]);
  }, []);

  const addSet = useCallback(
    (exerciseId, setData) => {
      const s = {
        id: randomUUID(),
        exerciseId,
        setNumber: 0,
        setType: setData.setType || 'N',
        weightKg: setData.weightKg ?? null,
        reps: setData.reps ?? null,
        completed: setData.completed !== false,
        loggedAt: nowIso(),
        rpe: setData.rpe ?? null,
        clientGeneratedId: randomUUID(),
      };
      setExercises(prev =>
        prev.map(e => {
          if (e.id !== exerciseId) return e;
          const nextSets = [...e.sets, s];
          return { ...e, sets: nextSets.map((ns, i) => ({ ...ns, setNumber: i + 1 })) };
        })
      );
    },
    []
  );

  const toggleSetComplete = useCallback((exerciseId, setId) => {
    setExercises(prev =>
      prev.map(e =>
        e.id !== exerciseId
          ? e
          : { ...e, sets: e.sets.map(st => (st.id === setId ? { ...st, completed: !st.completed } : st)) }
      )
    );
  }, []);

  const removeSet = useCallback((exerciseId, setId) => {
    setExercises(prev =>
      prev.map(e =>
        e.id !== exerciseId
          ? e
          : { ...e, sets: e.sets.filter(st => st.id !== setId).map((ns, i) => ({ ...ns, setNumber: i + 1 })) }
      )
    );
  }, []);

  const finishSession = useCallback(async () => {
    const finishedAt = nowIso();
    const allSets = exercises.flatMap(e => e.sets.map(st => ({ ...st, exerciseName: e.name, exerciseId: e.exerciseId })));
    const stats = sessionStats(allSets, elapsed);
    const payload = {
      session: {
        user_id: userId,
        routine_name: routineName,
        started_at: startedAt,
        finished_at: finishedAt,
        total_sets: stats.totalSets,
        total_volume_kg: stats.totalVolumeKg,
        duration_minutes: stats.durationMinutes,
        idempotency_key: idempotencyKey,
        client_generated_id: sessionClientId,
      },
      sets: allSets.map(st => ({
        exercise_id: st.exerciseId,
        exercise_name: st.exerciseName,
        set_number: st.setNumber,
        set_type: st.setType,
        weight_kg: st.weightKg,
        reps: st.reps,
        completed: st.completed !== false,
        logged_at: st.loggedAt,
        rpe: st.rpe ?? null,
        client_generated_id: st.clientGeneratedId,
      })),
    };
    await enqueueMutation({
      userId,
      type: 'finish_session',
      clientGeneratedId: sessionClientId,
      payload,
    });
    setIsActive(false);
    setIsPaused(false);
    await clearState();
  }, [exercises, elapsed, userId, routineName, startedAt, idempotencyKey, sessionClientId, clearState]);

  const resetSession = useCallback(async () => {
    setIsActive(false);
    setIsPaused(false);
    setExercises([]);
    setElapsed(0);
    startedTsRef.current = null;
    await clearState();
  }, [clearState]);

  return {
    exercises,
    routineName,
    startedAt,
    sessionId,
    sessionClientId,
    idempotencyKey,
    elapsed,
    isActive,
    isPaused,
    hydrated,
    startSession,
    pauseSession,
    resumeSession,
    addExercise,
    addSet,
    toggleSetComplete,
    removeSet,
    finishSession,
    resetSession,
    setRoutineName,
    setExercises,
  };
}
