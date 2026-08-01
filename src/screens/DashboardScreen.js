import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../lib/supabase';
import { colors, radius, spacing, type, shadow } from '../../lib/theme';

const width = Dimensions.get('window').width - spacing.md * 2;

const PERIODS = [
  { label: 'Mes', value: 'month' },
  { label: '3 Meses', value: '3months' },
  { label: 'Año', value: 'year' },
];

export default function DashboardScreen() {
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({ workouts: 0, sets: 0, volume: 0 });
  const [trend, setTrend] = useState({ workouts: 0, volume: 0 });
  const [streak, setStreak] = useState(0);

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ data: [0] }],
  });

  useEffect(() => {
    loadStats();
  }, [period]);

  function rangeFor(periodValue, offsetPeriods = 0) {
    // offsetPeriods = 0 -> período actual, 1 -> período anterior equivalente
    const end = new Date();
    const start = new Date();

    if (periodValue === 'month') {
      end.setMonth(end.getMonth() - offsetPeriods);
      start.setMonth(start.getMonth() - offsetPeriods - 1);
    } else if (periodValue === '3months') {
      end.setMonth(end.getMonth() - offsetPeriods * 3);
      start.setMonth(start.getMonth() - offsetPeriods * 3 - 3);
    } else {
      end.setFullYear(end.getFullYear() - offsetPeriods);
      start.setFullYear(start.getFullYear() - offsetPeriods - 1);
    }
    return { start, end };
  }

  async function loadStats() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const current = rangeFor(period, 0);
    const previous = rangeFor(period, 1);

    const [{ data: currentData }, { data: previousData }, { data: streakData }] =
      await Promise.all([
        supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', user.id)
          .gte('finished_at', current.start.toISOString())
          .lte('finished_at', current.end.toISOString())
          .order('finished_at', { ascending: true }),
        supabase
          .from('workout_sessions')
          .select('id, total_volume_kg')
          .eq('user_id', user.id)
          .gte('finished_at', previous.start.toISOString())
          .lte('finished_at', previous.end.toISOString()),
        // últimos 60 días alcanzan de sobra para calcular la racha actual
        supabase
          .from('workout_sessions')
          .select('finished_at')
          .eq('user_id', user.id)
          .not('finished_at', 'is', null)
          .order('finished_at', { ascending: false })
          .limit(200),
      ]);

    const data = currentData || [];
    const prevData = previousData || [];

    const workouts = data.length;
    const sets = data.reduce((sum, s) => sum + (s.total_sets || 0), 0);
    const volume = data.reduce((sum, s) => sum + (s.total_volume_kg || 0), 0);
    const prevVolume = prevData.reduce(
      (sum, s) => sum + (s.total_volume_kg || 0),
      0
    );

    setStats({ workouts, sets, volume });
    setTrend({
      workouts: percentDelta(workouts, prevData.length),
      volume: percentDelta(volume, prevVolume),
    });
    setStreak(computeStreak(streakData || []));

    const recent = data.slice(-7);
    setChartData({
      labels: recent.map((s) =>
        new Date(s.finished_at).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
        })
      ),
      datasets: [{ data: recent.map((s) => s.total_volume_kg || 0) }],
    });

    setLoading(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Resumen</Text>
          <Text style={styles.title}>Tu progreso</Text>
        </View>

        {streak > 0 && (
          <View style={styles.streakPill}>
            <Ionicons name="flame" size={16} color={colors.accent} />
            <Text style={styles.streakText}>{streak} días</Text>
          </View>
        )}
      </View>

      <View style={styles.tabs}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[styles.tab, period === p.value && styles.tabActive]}
            onPress={() => setPeriod(p.value)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.tabText,
                period === p.value && styles.tabTextActive,
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.cards}>
        <Card value={stats.workouts} label="Entrenos" trend={trend.workouts} />
        <Card value={stats.sets} label="Series" />
        <Card
          value={stats.volume}
          label="Kg totales"
          trend={trend.volume}
          accent
        />
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Volumen — últimos entrenos</Text>
          <Text style={styles.chartUnit}>kg</Text>
        </View>

        {chartData.datasets[0].data.length > 0 ? (
          <LineChart
            data={chartData}
            width={width - spacing.md * 2}
            height={200}
            chartConfig={{
              backgroundGradientFrom: colors.bg2,
              backgroundGradientTo: colors.bg2,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(216, 255, 63, ${opacity})`,
              labelColor: () => colors.t3,
              propsForDots: { r: '4', strokeWidth: '2', stroke: colors.accent },
              propsForBackgroundLines: { stroke: colors.border },
            }}
            bezier
            withInnerLines={false}
            style={{ marginLeft: -spacing.md, borderRadius: radius.md }}
          />
        ) : (
          <View style={styles.chartEmpty}>
            <Ionicons name="stats-chart-outline" size={28} color={colors.t3} />
            <Text style={styles.chartEmptyText}>
              {loading ? 'Cargando...' : 'Sin datos en este período'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.avgCard}>
        <AvgStat
          icon="repeat"
          value={stats.workouts ? Math.round(stats.sets / stats.workouts) : 0}
          label="Series por entreno"
        />
        <View style={styles.avgDivider} />
        <AvgStat
          icon="trending-up"
          value={
            stats.workouts ? Math.round(stats.volume / stats.workouts) : 0
          }
          label="Kg por entreno"
        />
      </View>
    </ScrollView>
  );
}

function percentDelta(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function computeStreak(rows) {
  if (!rows.length) return 0;
  const days = new Set(
    rows.map((r) => new Date(r.finished_at).toDateString())
  );
  let streak = 0;
  const cursor = new Date();
  // Permite que "hoy" no cuente en contra si todavía no entrenaste
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function Card({ value, label, trend, accent }) {
  const showTrend = typeof trend === 'number' && trend !== 0;
  const positive = trend > 0;
  return (
    <View style={styles.card}>
      <Text style={[styles.cardValue, accent && { color: colors.accent }]}>
        {value}
      </Text>
      <Text style={styles.cardLabel}>{label}</Text>
      {showTrend && (
        <View style={styles.trendRow}>
          <Ionicons
            name={positive ? 'arrow-up' : 'arrow-down'}
            size={11}
            color={positive ? colors.success : colors.danger}
          />
          <Text
            style={[
              styles.trendText,
              { color: positive ? colors.success : colors.danger },
            ]}
          >
            {Math.abs(trend)}%
          </Text>
        </View>
      )}
    </View>
  );
}

function AvgStat({ icon, value, label }) {
  return (
    <View style={styles.avgStat}>
      <View style={styles.avgIconWrap}>
        <Ionicons name={icon} size={16} color={colors.accent} />
      </View>
      <View>
        <Text style={styles.avgValue}>{value}</Text>
        <Text style={styles.avgLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 56,
    marginBottom: spacing.lg,
  },
  greeting: {
    color: colors.t3,
    ...type.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    color: colors.t1,
    ...type.display,
    marginTop: 2,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    color: colors.t3,
    fontWeight: '700',
    fontSize: 13,
  },
  tabTextActive: {
    color: colors.bg,
  },
  cards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.bg2,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardValue: {
    color: colors.t1,
    fontSize: 24,
    fontWeight: '800',
  },
  cardLabel: {
    color: colors.t3,
    marginTop: 4,
    ...type.caption,
    fontWeight: '600',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  chartTitle: {
    color: colors.t1,
    ...type.caption,
    fontWeight: '700',
  },
  chartUnit: {
    color: colors.t3,
    fontSize: 11,
    fontWeight: '600',
  },
  chartEmpty: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chartEmptyText: {
    color: colors.t3,
    ...type.body,
  },
  avgCard: {
    flexDirection: 'row',
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avgStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avgIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avgValue: {
    color: colors.t1,
    fontSize: 16,
    fontWeight: '700',
  },
  avgLabel: {
    color: colors.t3,
    fontSize: 12,
    fontWeight: '600',
  },
  avgDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
});