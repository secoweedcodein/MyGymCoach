// components/home/CoachCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './primitives';
import { COLORS, SPACING, RADIUS } from './theme';

export default function CoachCard({ onPress }) {
  return (
    <PressableScale
      onPress={onPress}
      style={styles.card}
      scaleTo={0.98}
      accessibilityLabel="Abrir Coach IA"
    >
      <View style={styles.iconWrap}>
        <Ionicons name="sparkles" size={22} color={COLORS.onAccent} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Coach IA</Text>
        <Text style={styles.desc} numberOfLines={2}>
          Tu asistente de entrenamiento. Consulta tus dudas y recibe orientación.
        </Text>
      </View>
      <View style={styles.chevron}>
        <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.screen,
    padding: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.accent + '55',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  desc: { marginTop: 2, fontSize: 12, lineHeight: 17, color: COLORS.textMuted, fontWeight: '500' },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});