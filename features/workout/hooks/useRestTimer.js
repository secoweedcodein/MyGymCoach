// features/workout/hooks/useRestTimer.js
import { useEffect, useRef, useState } from 'react';
import { Vibration } from 'react-native';

export function useRestTimer() {
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(120);
  const [left, setLeft] = useState(120);
  const ref = useRef(null);

  const start = (s = 120) => {
    if (ref.current) clearInterval(ref.current);
    setSeconds(s);
    setLeft(s);
    setActive(true);
    ref.current = setInterval(() => {
      setLeft(l => {
        if (l <= 1) {
          clearInterval(ref.current);
          Vibration.vibrate([0, 80, 40, 80]);
          setActive(false);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
  };

  const skip = () => {
    if (ref.current) clearInterval(ref.current);
    setActive(false);
  };

  const stop = () => {
    if (ref.current) clearInterval(ref.current);
    setActive(false);
  };

  useEffect(() => () => {
    if (ref.current) clearInterval(ref.current);
  }, []);

  return { active, seconds, left, start, skip, stop };
}
