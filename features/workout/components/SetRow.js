// features/workout/components/SetRow.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const GREEN = '#3DD68C';
const BLUE = '#3E8EFF';
const ORANGE = '#FF9500';
const RED = '#FF453A';
const PURPLE = '#A78BFA';

const TYPE_CONFIG = {
  N: { color: BLUE, label: 'Normal' },
  W: { color: ORANGE, label: 'Calent.' },
  D: { color: RED, label: 'Drop' },
  F: { color: PURPLE, label: 'Fallo' },
};

export default function SetRow({ set, onPress, onLongPress, onToggleComplete, showRpe }) {
  const t = TYPE_CONFIG[set.setType] || TYPE_CONFIG.N;
  return (
    <TouchableOpacity
      style={[s.setRow, set.completed && s.setRowDone]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={[s.typeBadge, { backgroundColor: t.color + '22', borderColor: t.color }]}>
        <Text style={[s.typeBadgeText, { color: t.color }]}>{set.setNumber}</Text>
      </View>
      <Text style={s.setText}>
        {Number(set.weightKg) || 0} kg × {Number(set.reps) || 0}
      </Text>
      {showRpe && set.rpe ? <Text style={s.rpe}>RPE {set.rpe}</Text> : null}
      <TouchableOpacity onPress={onToggleComplete} style={[s.checkBtn, set.completed && s.checkBtnDone]} hitSlop={8}>
        <Text style={s.checkText}>{set.completed ? '✓' : ''}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE2,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 6,
    gap: 8,
  },
  setRowDone: { backgroundColor: GREEN + '22', borderColor: GREEN + '66' },
  typeBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeText: { fontWeight: '800', fontSize: 12 },
  setText: { flex: 1, color: T1, fontWeight: '700', fontSize: 14 },
  rpe: { color: T2, fontSize: 11, fontWeight: '700', marginRight: 6 },
  checkBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG,
  },
  checkBtnDone: { backgroundColor: GREEN, borderColor: GREEN },
  checkText: { color: '#000', fontWeight: '900' },
});
