// src/screens/homeScreen.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase.js';
import BottomTabBar from '../../components/BottomTabBar';
import { useAuth } from '../hooks/useAuth';
import { useHomeData } from '../hooks/useHomeData';

import HomeHeader from '../../components/home/HomeHeader';
import TodayWorkoutCard from '../../components/home/TodayWorkoutCard';
import ProgressCard from '../../components/home/ProgressCard';
import CoachCard from '../../components/home/CoachCard';
import QuickActions from '../../components/home/QuickActions';
import RoutineList from '../../components/home/RoutineList';
import { HomeSkeleton, ErrorState, ErrorBanner } from '../../components/home/HomeStates';
import { FadeInView } from '../../components/home/primitives';
import { getRoutineMeta, openRoutine } from '../../components/home/routineNavigation';
import { COLORS, ROUTES, SPACING } from '../../components/home/theme';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function getGreeting(hour) {
  return hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
}

function getFirstName(user) {
  const full = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? '';
  return String(full).trim().split(/\s+/)[0] || '';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    routines,
    monthStats,
    week,
    trainedToday,
    todayCalories,
    streak,
    loading,
    refreshing,
    error,
    reload,
  } = useHomeData(user?.id);

  // Acceso oculto al login de admin: 5 toques al logo en 2 s (comportamiento original).
  const [tapCount, setTapCount] = useState(0);
  useEffect(() => {
    if (tapCount >= 5) {
      router.push(ROUTES.adminLogin);
      setTapCount(0);
      return undefined;
    }
    const timeout = setTimeout(() => setTapCount(0), 2000);
    return () => clearTimeout(timeout);
  }, [tapCount]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Cuenta', '¿Quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }, []);

  // Rutina destacada: la más reciente que no sea reto (o el primer elemento si solo hay retos).
  const featured = useMemo(
    () => routines.find((r) => !r.is_challenge) ?? routines[0] ?? null,
    [routines],
  );
  const featuredMeta = useMemo(() => (featured ? getRoutineMeta(featured, 0) : null), [featured]);
  const otherRoutines = useMemo(
    () => (featured ? routines.filter((r) => r.id !== featured.id) : []),
    [routines, featured],
  );

  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const dateLabel = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;
  const firstName = getFirstName(user);
  const initial = (firstName || user?.email || '').charAt(0).toUpperCase();
  const statusText = loading ? '' : trainedToday ? 'Ya entrenaste hoy' : 'Hoy aún no entrenas';

  const hasData = routines.length > 0 || monthStats.workouts > 0;
  const showFullError = !loading && !!error && !hasData;
  const showBanner = !loading && !!error && hasData;

  let body;
  if (loading) {
    body = <HomeSkeleton />;
  } else if (showFullError) {
    body = <ErrorState onRetry={reload} />;
  } else {
    body = (
      <View style={styles.sections}>
        {showBanner && <ErrorBanner onRetry={reload} />}

        <FadeInView index={0}>
          <TodayWorkoutCard
            routine={featured}
            meta={featuredMeta}
            trainedToday={trainedToday}
            week={week}
            onStart={() => featured && openRoutine(featured)}
            onCreate={() => router.push(ROUTES.routines)}
          />
        </FadeInView>

        <FadeInView index={1}>
          <ProgressCard stats={monthStats} streak={streak} />
        </FadeInView>

        <FadeInView index={2}>
          <CoachCard onPress={() => router.push(ROUTES.coach)} />
        </FadeInView>

        <FadeInView index={3}>
          <QuickActions todayCalories={todayCalories} />
        </FadeInView>

        <FadeInView index={4}>
          <RoutineList routines={otherRoutines} onNew={() => router.push(ROUTES.routines)} />
        </FadeInView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={COLORS.accent} />
        }
      >
        <HomeHeader
          greeting={greeting}
          name={firstName}
          dateLabel={dateLabel}
          statusText={statusText}
          streakDays={streak.currentStreak}
          initial={initial}
          onLogoPress={() => setTapCount((c) => c + 1)}
          onAvatarPress={handleSignOut}
        />
        {body}
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  content: { paddingBottom: 40 },
  sections: { gap: SPACING.section - 8, paddingTop: 12 },
});