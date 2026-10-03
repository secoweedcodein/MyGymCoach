// features/workout/components/TimerFloating.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';

function formatTime(sec) {
  if (sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TimerFloating({ elapsed = 0, isPaused = false, onPause, onResume, onFinish }) {
  return (
    <View style={s.container}>
      <View style={s.left}>
        <Text style={s.timer}>{formatTime(elapsed)}</Text>
        <Text style={s.state}>{isPaused ? 'PAUSADO' : 'EN CURSO'}</Text>
      </View>
      <View style={s.right}>
        <TouchableOpacity style={s.btn} onPress={isPaused ? onResume : onPause} activeOpacity={0.8}>
          <Text style={s.btnText}>{isPaused ? 'Reanudar' : 'Pausar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={onFinish} activeOpacity={0.8}>
          <Text style={s.btnPrimaryText}>Finalizar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  left: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  timer: { fontSize: 18, fontWeight: '800', color: T1 },
  state: { fontSize: 10, fontWeight: '700', color: T2, letterSpacing: 1.2 },
  right: { flexDirection: 'row', gap: 8 },
  btn: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnText: { color: T1, fontWeight: '700', fontSize: 12 },
  btnPrimary: { backgroundColor: ACCENT },
  btnPrimaryText: { color: '#000', fontWeight: '800', fontSize: 12 },
});
