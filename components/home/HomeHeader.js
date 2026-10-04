// components/home/HomeHeader.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './primitives';
import { COLORS, SPACING, RADIUS } from './theme';

export default function HomeHeader({
  greeting,
  name,
  dateLabel,
  statusText,
  streakDays,
  initial,
  onLogoPress,
  onAvatarPress,
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <PressableScale onPress={onLogoPress} scaleTo={0.98} accessibilityLabel="MyGymCoach">
          <Text style={styles.logo}>
            MyGym<Text style={styles.logoAccent}>Coach</Text>
          </Text>
        </PressableScale>

        <View style={styles.right}>
          {streakDays > 0 && (
            <View style={styles.streak} accessibilityLabel={`Racha de ${streakDays} días`}>
              <Ionicons name="flame" size={14} color={COLORS.accent} />
              <Text style={styles.streakText}>{streakDays}</Text>
            </View>
          )}
          <PressableScale
            onPress={onAvatarPress}
            style={styles.avatar}
            accessibilityLabel="Cuenta"
          >
            {initial ? (
              <Text style={styles.avatarText}>{initial}</Text>
            ) : (
              <Ionicons name="person" size={16} color={COLORS.textMuted} />
            )}
          </PressableScale>
        </View>
      </View>

      <Text style={styles.greeting} numberOfLines={2}>
        {name ? `${greeting}, ${name}` : greeting}
      </Text>
      <Text style={styles.sub} numberOfLines={1}>
        {dateLabel}
        {statusText ? `  ·  ${statusText}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: SPACING.screen, paddingBottom: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: -0.4 },
  logoAccent: { color: COLORS.accent },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  streakText: { fontSize: 13, fontWeight: '800', color: COLORS.text },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  greeting: {
    marginTop: 22,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
  },
  sub: { marginTop: 6, fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
});