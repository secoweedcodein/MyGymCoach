import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { colors, radius, spacing } from '../../lib/theme.js';

export default function StatsScreen() {
  const [stats, setStats] = useState({ streak: 0, total: 0 });
  const [monthly, setMonthly] = useState({ sessions: 0, volume: 0, time: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Obtener Stats Generales
    const { data: userStats } = await supabase
      .from('user_stats')
      .select('current_streak, total_workouts')
      .eq('user_id', user.id)
      .maybeSingle();

    // 2. Obtener Reporte Mensual
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('total_volume_kg, duration_minutes')
      .eq('user_id', user.id)
      .gte('finished_at', thirtyDaysAgo.toISOString());

    const report = (sessions || []).reduce((acc, s) => ({
      sessions: acc.sessions + 1,
      volume: acc.volume + (s.total_volume_kg || 0),
      time: acc.time + (s.duration_minutes || 0),
    }), { sessions: 0, volume: 0, time: 0 });

    setStats({ streak: userStats?.current_streak || 0, total: userStats?.total_workouts || 0 });
    setMonthly(report);
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Estadísticas</Text>

      {/* Resumen General */}
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.label}>Racha Actual</Text>
          <Text style={styles.value}>🔥 {stats.streak} días</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.label}>Entrenos Totales</Text>
          <Text style={styles.value}>💪 {stats.total}</Text>
        </View>
      </View>

      {/* Reporte Mensual */}
      <Text style={[styles.title, { fontSize: 20, marginTop: 30 }]}>Últimos 30 días</Text>
      <View style={styles.monthlyGrid}>
        <View style={styles.monthlyCard}>
          <Text style={styles.label}>Sesiones</Text>
          <Text style={styles.value}>{monthly.sessions}</Text>
        </View>
        <View style={styles.monthlyCard}>
          <Text style={styles.label}>Volumen (kg)</Text>
          <Text style={styles.value}>{Math.round(monthly.volume / 1000)}k</Text>
        </View>
        <View style={styles.monthlyCard}>
          <Text style={styles.label}>Tiempo (min)</Text>
          <Text style={styles.value}>{monthly.time}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  title: { color: colors.t1, fontSize: 24, fontWeight: '800', marginBottom: 20 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  monthlyGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: {
    backgroundColor: colors.bg3,
    width: '48%',
    padding: 20,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  monthlyCard: {
    backgroundColor: colors.bg3,
    width: '31%',
    padding: 15,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  label: { color: colors.t3, fontSize: 11, marginBottom: 5, textTransform: 'uppercase' },
  value: { color: colors.t1, fontSize: 16, fontWeight: '700' }
});