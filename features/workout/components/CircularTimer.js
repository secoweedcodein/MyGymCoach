// features/workout/components/CircularTimer.js
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

const ACCENT = '#C0FF3E';
const ORANGE = '#FF9500';
const RED = '#FF453A';

function fmt(s) {
  if (s <= 0) return '00:00';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function CircularTimer({ restLeft = 0, restSec = 120, running = false }) {
  const progress = restSec > 0 ? restLeft / restSec : 1;
  const isWarning = restLeft <= 30 && restLeft > 10;
  const isDanger = restLeft <= 10;
  const timerColor = isDanger ? RED : isWarning ? ORANGE : ACCENT;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (running && isDanger) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.04, duration: 400, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.setValue(1);
    }
  }, [running, isDanger, pulse]);

  return (
    <Animated.View style={[s.container, { transform: [{ scale: pulse }] }]}>
      <Text style={[s.text, { color: timerColor }]}>{fmt(restLeft)}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 20, fontWeight: '800' },
});
