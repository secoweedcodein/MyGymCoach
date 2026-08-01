// src/components/RecordToast.js
//
// Toast que aparece desde abajo cuando el usuario bate un récord personal.
// Se auto-oculta a los 3 segundos. No interrumpe el flujo (no es un Alert).
//
// USO:
//   <RecordToast record={newRecord} onHide={clearRecord} />
//
//   record: { type: 'weight'|'reps'|'volume', exerciseName, value, unit } | null

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const TYPE_CONFIG = {
  weight: { emoji: '🏆', label: 'Récord de peso',    color: '#C0FF3E' },
  reps:   { emoji: '🔥', label: 'Récord de reps',    color: '#3EE5FF' },
  volume: { emoji: '⚡',  label: 'Récord de volumen', color: '#FF6B3E' },
};

export default function RecordToast({ record, onHide }) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const timer     = useRef(null);

  useEffect(() => {
    if (!record) return;

    // Limpia timer previo
    if (timer.current) clearTimeout(timer.current);

    // Entrada
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0,  useNativeDriver: true, tension: 80 }),
      Animated.timing(opacity,    { toValue: 1,  duration: 200, useNativeDriver: true }),
    ]).start();

    // Auto-ocultar a los 3s
    timer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 20, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 0,  duration: 250, useNativeDriver: true }),
      ]).start(() => onHide?.());
    }, 3000);

    return () => clearTimeout(timer.current);
  }, [record]);

  if (!record) return null;

  const cfg = TYPE_CONFIG[record.type] ?? TYPE_CONFIG.weight;

  return (
    <Animated.View
      style={[
        s.toast,
        { opacity, transform: [{ translateY }], borderColor: cfg.color + '55' },
      ]}
      pointerEvents="none"
    >
      <View style={[s.iconBox, { backgroundColor: cfg.color + '22' }]}>
        <Text style={s.icon}>{cfg.emoji}</Text>
      </View>

      <View style={s.textCol}>
        <View style={s.topRow}>
          <View style={[s.badge, { backgroundColor: cfg.color + '22' }]}>
            <Text style={[s.badgeText, { color: cfg.color }]}>NUEVO RÉCORD</Text>
          </View>
        </View>
        <Text style={s.exName} numberOfLines={1}>{record.exerciseName}</Text>
        <Text style={s.value}>
          {record.value}
          <Text style={s.unit}> {record.unit}</Text>
        </Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  toast: {
    position:        'absolute',
    bottom:          90,
    left:            16,
    right:           16,
    backgroundColor: '#1A1A1A',
    borderRadius:    18,
    borderWidth:     1,
    flexDirection:   'row',
    alignItems:      'center',
    padding:         14,
    gap:             12,
    // Sombra iOS
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.4,
    shadowRadius:    16,
    // Sombra Android
    elevation:       12,
    zIndex:          999,
  },
  iconBox: {
    width:         44,
    height:        44,
    borderRadius:  12,
    alignItems:    'center',
    justifyContent:'center',
  },
  icon:     { fontSize: 22 },
  textCol:  { flex: 1 },
  topRow:   { marginBottom: 3 },
  badge:    { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText:{ fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  exName:   { fontSize: 15, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  value:    { fontSize: 13, fontWeight: '600', color: '#A0A0A0', marginTop: 1 },
  unit:     { fontSize: 12, fontWeight: '400', color: '#555555' },
});