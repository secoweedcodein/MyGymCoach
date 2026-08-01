// src/components/ExerciseIcon.js
//
// Reemplaza los emojis inconsistentes por badges de texto limpios.
// Cada músculo tiene su color propio (definido en MUSCLE_COLORS).
//
// Uso:
//   <ExerciseIcon exercise={ex} size="md" />   // tamaños: sm | md | lg
//
// El badge muestra las siglas del ejercicio (campo `icon` en exercises.js)
// sobre un fondo con el color del músculo al 15% de opacidad.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MUSCLE_COLORS } from '../src/screens/data/exercises';
import { getAllExercises } from '../src/screens/data/exercises.js';

const SIZES = {
  sm: { box: 32, font: 9  },
  md: { box: 40, font: 11 },
  lg: { box: 50, font: 13 },
};

export default function ExerciseIcon({ exercise, size = 'md' }) {
  const { box, font } = SIZES[size] ?? SIZES.md;
  const baseColor = MUSCLE_COLORS[exercise?.muscle] ?? '#888888';

  return (
    <View
      style={[
        styles.box,
        {
          width:           box,
          height:          box,
          borderRadius:    box * 0.28,
          backgroundColor: baseColor + '22',   // 13% opacidad
          borderColor:     baseColor + '44',   // 26% opacidad
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            fontSize:   font,
            color:      baseColor,
            lineHeight: box,
          },
        ]}
        numberOfLines={1}
      >
        {exercise?.icon ?? '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
  },
  label: {
    fontWeight:     '800',
    textAlign:      'center',
    letterSpacing:  0.3,
  },
});