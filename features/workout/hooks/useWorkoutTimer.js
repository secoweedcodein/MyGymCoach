// features/workout/hooks/useWorkoutTimer.js
import { useEffect, useRef, useState } from 'react';

export function useWorkoutTimer({ isActive, isPaused, initialElapsed = 0, startedAt } = {}) {
  const [elapsed, setElapsed] = useState(initialElapsed);
  const startTsRef = useRef(null);
  const pausedAtRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (startedAt && !startTsRef.current) {
      const base = Date.now() - initialElapsed * 1000;
      startTsRef.current = base;
    }
  }, [startedAt, initialElapsed]);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        if (startTsRef.current) {
          const diff = Math.floor((Date.now() - startTsRef.current) / 1000);
          setElapsed(diff);
        } else {
          setElapsed(e => e + 1);
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isActive, isPaused]);

  const pause = () => {
    pausedAtRef.current = Date.now();
  };

  const resume = () => {
    if (startTsRef.current && pausedAtRef.current) {
      const offset = Math.floor((Date.now() - pausedAtRef.current) / 1000);
      startTsRef.current += offset * 1000;
      pausedAtRef.current = 0;
    }
  };

  const reset = () => {
    setElapsed(0);
    startTsRef.current = null;
    pausedAtRef.current = 0;
  };

  const set = (s) => setElapsed(s);

  return { elapsed, pause, resume, reset, set };
}
