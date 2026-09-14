import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRating } from '../lib/ratings';

const ACCENT = '#C0FF3E';
const T2 = '#A0A0A0';
const T3 = '#555555';

export default function RatingBar({
  value,
  count,
  myScore,
  onRate,
  disabled = false,
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={s.wrap}>
      <View style={s.stars}>
        {stars.map((n) => {
          const filled = (myScore || 0) >= n;
          return (
            <TouchableOpacity
              key={n}
              onPress={() => !disabled && onRate?.(n)}
              disabled={disabled || !onRate}
              hitSlop={8}
            >
              <Ionicons name={filled ? 'star' : 'star-outline'} size={22} color={ACCENT} />
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={s.meta}>
        {formatRating(value)} · {count || 0} votos
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 6 },
  stars: { flexDirection: 'row', gap: 6 },
  meta: { fontSize: 12, color: T2, fontWeight: '600' },
});
