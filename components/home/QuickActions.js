// components/home/QuickActions.js
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PressableScale } from './primitives';
import { COLORS, SPACING, RADIUS, ROUTES, formatNumber } from './theme';

const COLUMNS = 3;
const GAP = 10;

export default function QuickActions({ todayCalories }) {
  const { width } = useWindowDimensions();
  const tileWidth = Math.floor((width - SPACING.screen * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  const items = [
    { key: 'history', icon: 'time-outline', label: 'Historial', route: ROUTES.history },
    { key: 'calendar', icon: 'calendar-outline', label: 'Calendario', route: ROUTES.calendar },
    { key: 'dashboard', icon: 'stats-chart-outline', label: 'Dashboard', route: ROUTES.dashboard },
    {
      key: 'nutrition',
      icon: 'restaurant-outline',
      label: 'Nutrición',
      sub: todayCalories > 0 ? `${formatNumber(todayCalories)} kcal` : undefined,
      route: ROUTES.nutrition,
    },
    { key: 'steps', icon: 'walk-outline', label: 'Pasos', route: ROUTES.steps },
    { key: 'bmi', icon: 'body-outline', label: 'IMC', route: ROUTES.bmi },
  ];

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <PressableScale
          key={item.key}
          onPress={() => router.push(item.route)}
          style={[styles.tile, { width: tileWidth }]}
          accessibilityLabel={item.label}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={item.icon} size={20} color={COLORS.accent} />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
          {item.sub ? (
            <Text style={styles.sub} numberOfLines={1}>
              {item.sub}
            </Text>
          ) : null}
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingHorizontal: SPACING.screen,
  },
  tile: {
    minHeight: 92,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  sub: { marginTop: 2, fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
});