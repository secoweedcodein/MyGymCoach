// components/home/RoutineList.js
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './primitives';
import { getRoutineMeta, openRoutine } from './routineNavigation';
import { COLORS, SPACING, RADIUS } from './theme';

export function RoutineCard({ routine, index }) {
  const meta = useMemo(() => getRoutineMeta(routine, index), [routine, index]);

  const metaText = meta.isChallenge
    ? `Reto activo${meta.daysRemaining !== null ? ` · ${meta.daysRemaining} días` : ''}`
    : meta.exerciseCount > 0
    ? `${meta.exerciseCount} ejercicios`
    : 'Rutina';

  return (
    <PressableScale
      onPress={() => openRoutine(routine)}
      style={styles.card}
      scaleTo={0.98}
      accessibilityLabel={`${routine.name}. ${metaText}`}
    >
      <View style={[styles.bar, { backgroundColor: meta.accent }]} />
      <View style={styles.inner}>
        <View style={styles.top}>
          <View style={styles.titleWrap}>
            <Text style={styles.name} numberOfLines={2}>
              {routine.name}
            </Text>
            <Text style={[styles.meta, meta.isChallenge && { color: COLORS.challenge }]}>
              {metaText}
            </Text>
          </View>
          <View style={styles.action}>
            <Ionicons
              name={meta.isChallenge ? 'chevron-forward' : 'play'}
              size={meta.isChallenge ? 18 : 14}
              color={COLORS.onAccent}
            />
          </View>
        </View>

        {meta.chips.length > 0 && (
          <View style={styles.chipRow}>
            {meta.chips.map((name, i) => (
              <View key={`${name}-${i}`} style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {name}
                </Text>
              </View>
            ))}
            {meta.extra > 0 && (
              <View style={[styles.chip, styles.chipMore]}>
                <Text style={[styles.chipText, { color: COLORS.textDim }]}>+{meta.extra} más</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </PressableScale>
  );
}

export default function RoutineList({ routines, onNew }) {
  if (routines.length === 0) return null;

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Más rutinas</Text>
        <PressableScale onPress={onNew} style={styles.newBtn} accessibilityLabel="Nueva rutina">
          <Ionicons name="add" size={16} color={COLORS.onAccent} />
          <Text style={styles.newBtnText}>Nueva</Text>
        </PressableScale>
      </View>
      {routines.map((r, i) => (
        <RoutineCard key={r.id} routine={r} index={i + 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screen,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  newBtnText: { fontSize: 12, fontWeight: '800', color: COLORS.onAccent },
  card: {
    marginHorizontal: SPACING.screen,
    marginBottom: 10,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  bar: { width: 4 },
  inner: { flex: 1, padding: 14 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  titleWrap: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text, letterSpacing: -0.2 },
  meta: { marginTop: 3, fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  action: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chip: {
    maxWidth: '100%',
    backgroundColor: COLORS.surface2,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipMore: { borderColor: COLORS.borderStrong },
  chipText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
});