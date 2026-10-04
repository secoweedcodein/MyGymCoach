// components/home/TodayWorkoutCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './primitives';
import { COLORS, SPACING, RADIUS } from './theme';

function WeekStrip({ week }) {
  const doneCount = week.filter((d) => d.done).length;
  return (
    <View style={styles.weekWrap}>
      <View style={styles.weekHeader}>
        <Text style={styles.weekTitle}>Esta semana</Text>
        <Text style={styles.weekCount}>
          {doneCount} {doneCount === 1 ? 'día entrenado' : 'días entrenados'}
        </Text>
      </View>
      <View style={styles.weekRow}>
        {week.map((d, i) => (
          <View key={i} style={styles.dayCol}>
            <View
              style={[
                styles.dayDot,
                d.done && styles.dayDotDone,
                d.isToday && !d.done && styles.dayDotToday,
              ]}
            >
              {d.done && <Ionicons name="checkmark" size={14} color={COLORS.onAccent} />}
            </View>
            <Text style={[styles.dayLabel, d.isToday && styles.dayLabelToday]}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Hero del Home. No existe un "plan del día" en los datos, así que muestra la rutina
 * destacada y el estado real de hoy (completado / pendiente) según las sesiones.
 */
export default function TodayWorkoutCard({
  routine,
  meta,
  trainedToday,
  week,
  onStart,
  onCreate,
}) {
  if (!routine) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyIcon}>
          <Ionicons name="barbell-outline" size={26} color={COLORS.accent} />
        </View>
        <Text style={styles.title}>Crea tu primera rutina</Text>
        <Text style={styles.metaText}>
          Elige tus ejercicios y empieza a registrar tu progreso.
        </Text>
        <PressableScale onPress={onCreate} style={styles.cta} accessibilityLabel="Crear rutina">
          <Ionicons name="add" size={20} color={COLORS.onAccent} />
          <Text style={styles.ctaText}>Crear rutina</Text>
        </PressableScale>
      </View>
    );
  }

  const metaText = meta.isChallenge
    ? `Reto activo${meta.daysRemaining !== null ? ` · ${meta.daysRemaining} días restantes` : ''}`
    : meta.exerciseCount > 0
    ? `${meta.exerciseCount} ${meta.exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}`
    : 'Rutina';

  const ctaLabel = meta.isChallenge
    ? 'Ver reto'
    : trainedToday
    ? 'Entrenar otra vez'
    : 'Comenzar entrenamiento';

  return (
    <View style={styles.card}>
      <View style={styles.glow} pointerEvents="none" />

      <View style={[styles.badge, trainedToday && styles.badgeDone]}>
        <Ionicons
          name={trainedToday ? 'checkmark-circle' : 'time-outline'}
          size={14}
          color={trainedToday ? COLORS.onAccent : COLORS.textMuted}
        />
        <Text style={[styles.badgeText, trainedToday && styles.badgeTextDone]}>
          {trainedToday ? 'Completado hoy' : 'Pendiente hoy'}
        </Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {routine.name}
      </Text>
      <Text style={styles.metaText}>{metaText}</Text>

      <PressableScale
        onPress={onStart}
        style={styles.cta}
        accessibilityLabel={`${ctaLabel}: ${routine.name}`}
      >
        <Ionicons name={meta.isChallenge ? 'flag' : 'play'} size={18} color={COLORS.onAccent} />
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </PressableScale>

      <View style={styles.divider} />
      <WeekStrip week={week} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.screen,
    padding: 20,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COLORS.accent,
    opacity: 0.07,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface2,
    marginBottom: 14,
  },
  badgeDone: { backgroundColor: COLORS.accent },
  badgeText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  badgeTextDone: { color: COLORS.onAccent },
  title: { fontSize: 26, lineHeight: 31, fontWeight: '800', color: COLORS.text, letterSpacing: -0.6 },
  metaText: { marginTop: 6, fontSize: 14, lineHeight: 20, color: COLORS.textMuted, fontWeight: '500' },
  cta: {
    marginTop: 20,
    minHeight: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  ctaText: { fontSize: 16, fontWeight: '800', color: COLORS.onAccent },
  divider: { height: 1, backgroundColor: COLORS.border, marginTop: 20, marginBottom: 16 },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  weekWrap: {},
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  weekTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  weekCount: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6, flex: 1 },
  dayDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotDone: { backgroundColor: COLORS.accent },
  dayDotToday: { borderWidth: 1.5, borderColor: COLORS.accent, backgroundColor: 'transparent' },
  dayLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textDim },
  dayLabelToday: { color: COLORS.text },
});