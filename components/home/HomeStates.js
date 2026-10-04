// components/home/HomeStates.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale, Skeleton } from './primitives';
import { COLORS, SPACING, RADIUS } from './theme';

/** Skeleton con la misma silueta que el Home real (hero, progreso, accesos). */
export function HomeSkeleton() {
  return (
    <View style={styles.skeletonWrap} accessibilityLabel="Cargando">
      <Skeleton style={styles.skHero} />
      <Skeleton style={styles.skProgress} />
      <Skeleton style={styles.skCoach} />
      <View style={styles.skGrid}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} style={styles.skTile} />
        ))}
      </View>
    </View>
  );
}

/** Error a pantalla completa (sin datos previos que mostrar). */
export function ErrorState({ onRetry }) {
  return (
    <View style={styles.errorCard}>
      <View style={styles.errorIcon}>
        <Ionicons name="cloud-offline-outline" size={28} color={COLORS.textMuted} />
      </View>
      <Text style={styles.errorTitle}>No pudimos cargar tus datos</Text>
      <Text style={styles.errorText}>Revisa tu conexión e inténtalo de nuevo.</Text>
      <PressableScale onPress={onRetry} style={styles.retryBtn} accessibilityLabel="Reintentar">
        <Ionicons name="refresh" size={16} color={COLORS.onAccent} />
        <Text style={styles.retryText}>Reintentar</Text>
      </PressableScale>
    </View>
  );
}

/** Aviso compacto cuando ya hay datos en pantalla pero falló una actualización. */
export function ErrorBanner({ onRetry }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>No se pudieron actualizar tus datos.</Text>
      <PressableScale onPress={onRetry} accessibilityLabel="Reintentar">
        <Text style={styles.bannerAction}>Reintentar</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonWrap: { paddingHorizontal: SPACING.screen, gap: SPACING.gap },
  skHero: { height: 300, borderRadius: RADIUS.lg },
  skProgress: { height: 150, borderRadius: RADIUS.lg },
  skCoach: { height: 78, borderRadius: RADIUS.lg },
  skGrid: { flexDirection: 'row', gap: 10 },
  skTile: { flex: 1, height: 92 },

  errorCard: {
    marginHorizontal: SPACING.screen,
    marginTop: 12,
    padding: 28,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  errorTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  errorText: { marginTop: 6, fontSize: 13, lineHeight: 19, color: COLORS.textMuted, textAlign: 'center' },
  retryBtn: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 22,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accent,
  },
  retryText: { fontSize: 14, fontWeight: '800', color: COLORS.onAccent },

  banner: {
    marginHorizontal: SPACING.screen,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.danger + '44',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bannerText: { flex: 1, fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  bannerAction: { fontSize: 12, fontWeight: '800', color: COLORS.accent },
});