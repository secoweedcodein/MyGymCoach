// components/home/ProgressCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, formatNumber } from './theme';

function Stat({ value, unit, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function ProgressCard({ stats, streak }) {
  const hasActivity = stats.workouts > 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tu mes</Text>

      <View style={styles.statsRow}>
        <Stat value={formatNumber(stats.workouts)} label="Entrenos" />
        <View style={styles.sep} />
        <Stat value={formatNumber(stats.sets)} label="Series" />
        <View style={styles.sep} />
        <Stat value={formatNumber(stats.volume)} unit="kg" label="Volumen" />
      </View>

      {!hasActivity && (
        <Text style={styles.hint}>Aún no registras sesiones este mes. Tu primer entreno aparecerá aquí.</Text>
      )}

      <View style={styles.streakRow}>
        <View style={styles.streakIcon}>
          <Ionicons name="flame" size={16} color={COLORS.accent} />
        </View>
        <Text style={styles.streakMain}>
          Racha de {streak.currentStreak} {streak.currentStreak === 1 ? 'día' : 'días'}
        </Text>
        {streak.longestStreak > 0 && (
          <Text style={styles.streakBest}>Mejor: {streak.longestStreak}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.screen,
    padding: 18,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'flex-start', paddingRight: 8 },
  sep: { width: 1, alignSelf: 'stretch', backgroundColor: COLORS.border, marginRight: 14 },
  statValue: { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.6 },
  statUnit: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  statLabel: { marginTop: 2, fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  hint: { marginTop: 14, fontSize: 12, lineHeight: 17, color: COLORS.textDim, fontWeight: '500' },
  streakRow: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakMain: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.text },
  streakBest: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
});