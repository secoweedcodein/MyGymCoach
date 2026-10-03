// features/workout/components/RestTimerModal.js
import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';

function fmt(s) {
  if (s <= 0) return '00:00';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function RestTimerModal({ visible, seconds = 120, onSkip, onDone }) {
  const [left, setLeft] = useState(seconds);
  const ref = useRef(null);

  useEffect(() => {
    if (!visible) {
      if (ref.current) clearInterval(ref.current);
      setLeft(seconds);
      return;
    }
    setLeft(seconds);
    ref.current = setInterval(() => {
      setLeft(l => {
        if (l <= 1) {
          clearInterval(ref.current);
          onDone?.();
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [visible, seconds, onDone]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.title}>Descanso</Text>
          <Text style={s.time}>{fmt(left)}</Text>
          <TouchableOpacity style={s.skip} onPress={onSkip}>
            <Text style={s.skipText}>Saltar descanso</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 18, padding: 24, width: '80%', alignItems: 'center' },
  title: { color: T2, fontWeight: '800', letterSpacing: 2 },
  time: { color: T1, fontSize: 56, fontWeight: '900', marginVertical: 12 },
  skip: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: BG, borderRadius: 12, borderWidth: 1, borderColor: BORDER },
  skipText: { color: T1, fontWeight: '800' },
});
