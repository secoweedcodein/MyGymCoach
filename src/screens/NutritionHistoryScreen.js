// src/screens/NutritionHistoryScreen.js
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT   = '#C0FF3E';
const BG       = '#0D0D0D';
const SURFACE  = '#161616';
const SRF2     = '#1E1E1E';
const BORDER   = '#FFFFFF0D';
const BORDER2  = '#FFFFFF18';
const T1       = '#FFFFFF';
const T2       = '#A0A0A0';
const T3       = '#555555';
const RED      = '#FF453A';
const ORANGE   = '#FF9500';
const BLUE     = '#3E8EFF';
const PURPLE   = '#A78BFA';
const GREEN    = '#3DD68C';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;

// ─── Configuración de períodos ────────────────────────────────────────────────
const PERIODS = [
  { key: 'today', label: 'Hoy', days: 1 },
  { key: 'week',  label: 'Semana', days: 7 },
  { key: 'month', label: 'Mes', days: 30 },
  { key: 'year',  label: 'Año', days: 365 },
];

const MEAL_CONFIG = {
  breakfast: { label: 'Desayuno', icon: '🌅', color: '#FFCD00' },
  lunch:     { label: 'Almuerzo', icon: '☀️',  color: '#3EE5FF' },
  dinner:    { label: 'Cena',     icon: '🌙',  color: '#A78BFA' },
  snack:     { label: 'Snack',    icon: '🍎',  color: '#FF6B3E' },
};

// ─── Helpers de fechas ────────────────────────────────────────────────────────
function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function getDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  d.setHours(0, 0, 0, 0);
  return formatDate(d);
}

function getDaysArray(numDays) {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(formatDate(d));
  }
  return days;
}

function getDayLabel(dateStr, totalDays) {
  const d = new Date(dateStr);
  const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  if (totalDays <= 7) return dayNames[d.getDay()];
  if (totalDays <= 30) return String(d.getDate());
  const months = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  return months[d.getMonth()];
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function NutritionHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [goals, setGoals] = useState(null);
  const [period, setPeriod] = useState('week');

  // Cargar datos iniciales
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data: goalsData } = await supabase
        .from('nutrition_goals')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setGoals(goalsData || { calories: 2000, protein_g: 150, carbs_g: 250, fat_g: 70 });
    })();
  }, []);

  // Cargar logs según período
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      const periodConfig = PERIODS.find(p => p.key === period);
      const startDate = getDaysAgo(periodConfig.days);

      const { data } = await supabase
        .from('nutrition_logs')
        .select('logged_date, meal_type, food_name, calories, protein_g, carbs_g, fat_g, quantity_g')
        .eq('user_id', userId)
        .gte('logged_date', startDate)
        .order('logged_date', { ascending: true });

      setLogs(data || []);
      setLoading(false);
    })();
  }, [userId, period]);

  // ─── Cálculos en memoria (optimizados con useMemo) ─────────────────────────
  const daysArray = useMemo(() => {
    const periodConfig = PERIODS.find(p => p.key === period);
    return getDaysArray(periodConfig.days);
  }, [period]);

  // Agrupar logs por día
  const logsByDay = useMemo(() => {
    const map = {};
    daysArray.forEach(d => { map[d] = []; });
    logs.forEach(log => {
      if (map[log.logged_date]) map[log.logged_date].push(log);
    });
    return map;
  }, [logs, daysArray]);

  // Totales por día
  const dailyTotals = useMemo(() => {
    return daysArray.map(date => {
      const dayLogs = logsByDay[date] || [];
      return {
        date,
        calories: dayLogs.reduce((a, l) => a + (l.calories || 0), 0),
        protein:  dayLogs.reduce((a, l) => a + (l.protein_g || 0), 0),
        carbs:    dayLogs.reduce((a, l) => a + (l.carbs_g || 0), 0),
        fat:      dayLogs.reduce((a, l) => a + (l.fat_g || 0), 0),
      };
    });
  }, [logsByDay, daysArray]);

  // Promedios
  const averages = useMemo(() => {
    const daysWithData = dailyTotals.filter(d => d.calories > 0);
    const n = daysWithData.length || 1;
    return {
      calories: Math.round(daysWithData.reduce((a, d) => a + d.calories, 0) / n),
      protein:  Math.round(daysWithData.reduce((a, d) => a + d.protein, 0) / n),
      carbs:    Math.round(daysWithData.reduce((a, d) => a + d.carbs, 0) / n),
      fat:      Math.round(daysWithData.reduce((a, d) => a + d.fat, 0) / n),
    };
  }, [dailyTotals]);

  // Cumplimiento de objetivos
  const compliance = useMemo(() => {
    if (!goals) return { calDays: 0, protDays: 0, bothDays: 0, total: 0 };
    const daysWithData = dailyTotals.filter(d => d.calories > 0);
    const total = daysWithData.length;
    let calDays = 0, protDays = 0, bothDays = 0;
    daysWithData.forEach(d => {
      const calOk = d.calories >= goals.calories * 0.9 && d.calories <= goals.calories * 1.1;
      const protOk = d.protein >= goals.protein_g * 0.9;
      if (calOk) calDays++;
      if (protOk) protDays++;
      if (calOk && protOk) bothDays++;
    });
    return { calDays, protDays, bothDays, total };
  }, [dailyTotals, goals]);

  // Top alimentos
  const topFoods = useMemo(() => {
    const count = {};
    logs.forEach(l => {
      const name = l.food_name || 'Sin nombre';
      count[name] = (count[name] || 0) + 1;
    });
    return Object.entries(count)
      .map(([name, times]) => ({ name, times }))
      .sort((a, b) => b.times - a.times)
      .slice(0, 5);
  }, [logs]);

  // Distribución por comida
  const mealDistribution = useMemo(() => {
    const dist = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    logs.forEach(l => {
      if (dist[l.meal_type] !== undefined) {
        dist[l.meal_type] += l.calories || 0;
      }
    });
    const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
    const daysCount = daysArray.length || 1;
    return Object.entries(dist).map(([key, cal]) => ({
      key,
      calories: cal,
      avg: Math.round(cal / daysCount),
      percent: Math.round((cal / total) * 100),
    }));
  }, [logs, daysArray]);

  // Estadísticas avanzadas
  const advancedStats = useMemo(() => {
    const daysWithData = dailyTotals.filter(d => d.calories > 0);
    if (daysWithData.length === 0) {
      return { min: 0, max: 0, bestDay: null, worstDay: null, streak: 0 };
    }
    const cals = daysWithData.map(d => d.calories);
    const min = Math.min(...cals);
    const max = Math.max(...cals);
    const bestDay = daysWithData.reduce((a, b) => {
      const scoreA = Math.abs(a.calories - (goals?.calories || 2000));
      const scoreB = Math.abs(b.calories - (goals?.calories || 2000));
      return scoreA < scoreB ? a : b;
    });
    const worstDay = daysWithData.reduce((a, b) => {
      const scoreA = Math.abs(a.calories - (goals?.calories || 2000));
      const scoreB = Math.abs(b.calories - (goals?.calories || 2000));
      return scoreA > scoreB ? a : b;
    });
    // Racha actual
    let streak = 0;
    for (let i = dailyTotals.length - 1; i >= 0; i--) {
      const d = dailyTotals[i];
      if (d.calories === 0) break;
      const calOk = d.calories >= (goals?.calories || 2000) * 0.9;
      if (calOk) streak++;
      else break;
    }
    return { min, max, bestDay, worstDay, streak };
  }, [dailyTotals, goals]);

  if (loading) {
    return (
      <View style={st.loading}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={st.loadingText}>Cargando historial...</Text>
      </View>
    );
  }

  return (
    <View style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
          <Text style={st.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={st.title}>Historial Nutrición</Text>
          <Text style={st.subtitle}>Tu progreso alimenticio</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        {/* Filtros de tiempo */}
        <View style={st.filtersRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[st.filterBtn, period === p.key && st.filterBtnActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[st.filterText, period === p.key && st.filterTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Resumen nutricional */}
        <Text style={st.sectionLabel}>RESUMEN</Text>
        <View style={st.summaryGrid}>
          <SummaryCard
            icon="🔥" label="Calorías" value={averages.calories}
            goal={goals?.calories} unit="kcal" color={ACCENT}
          />
          <SummaryCard
            icon="💪" label="Proteínas" value={averages.protein}
            goal={goals?.protein_g} unit="g" color={BLUE}
          />
          <SummaryCard
            icon="🍚" label="Carbos" value={averages.carbs}
            goal={goals?.carbs_g} unit="g" color={PURPLE}
          />
          <SummaryCard
            icon="🥑" label="Grasas" value={averages.fat}
            goal={goals?.fat_g} unit="g" color={ORANGE}
          />
        </View>

        {/* Gráfico de calorías (líneas) */}
        <Text style={st.sectionLabel}>CALORÍAS DIARIAS</Text>
        <View style={st.chartCard}>
          <LineChart
            data={dailyTotals.map(d => d.calories)}
            labels={daysArray.map(d => getDayLabel(d, daysArray.length))}
            goalLine={goals?.calories}
            color={ACCENT}
            height={180}
          />
        </View>

        {/* Gráfico de proteínas (barras) */}
        <Text style={st.sectionLabel}>PROTEÍNA DIARIA</Text>
        <View style={st.chartCard}>
          <BarChart
            data={dailyTotals.map(d => d.protein)}
            labels={daysArray.map(d => getDayLabel(d, daysArray.length))}
            goalLine={goals?.protein_g}
            color={BLUE}
            height={160}
          />
        </View>

        {/* Cumplimiento */}
        <Text style={st.sectionLabel}>CUMPLIMIENTO</Text>
        <View style={st.complianceCard}>
          <ComplianceStat
            label="Días con calorías ok"
            value={compliance.calDays}
            total={compliance.total}
            color={ACCENT}
          />
          <ComplianceStat
            label="Días con proteína ok"
            value={compliance.protDays}
            total={compliance.total}
            color={BLUE}
          />
          <ComplianceStat
            label="Días con ambos"
            value={compliance.bothDays}
            total={compliance.total}
            color={GREEN}
          />
          <View style={st.complianceDivider} />
          <View style={st.adherenceRow}>
            <Text style={st.adherenceLabel}>Adherencia total</Text>
            <Text style={st.adherenceValue}>
              {compliance.total > 0
                ? Math.round((compliance.bothDays / compliance.total) * 100)
                : 0}%
            </Text>
          </View>
        </View>

        {/* Top alimentos */}
        <Text style={st.sectionLabel}>MÁS CONSUMIDOS</Text>
        <View style={st.topFoodsCard}>
          {topFoods.length === 0 ? (
            <Text style={st.emptyText}>Sin registros aún</Text>
          ) : (
            topFoods.map((food, idx) => (
              <FoodRankItem key={idx} rank={idx + 1} name={food.name} times={food.times} />
            ))
          )}
        </View>

        {/* Distribución de comidas */}
        <Text style={st.sectionLabel}>DISTRIBUCIÓN DEL DÍA</Text>
        <View style={st.distributionCard}>
          <DonutChart data={mealDistribution} size={160} />
          <View style={st.distributionLegend}>
            {mealDistribution.map(m => (
              <View key={m.key} style={st.legendRow}>
                <View style={[st.legendDot, { backgroundColor: MEAL_CONFIG[m.key].color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={st.legendLabel}>
                    {MEAL_CONFIG[m.key].icon} {MEAL_CONFIG[m.key].label}
                  </Text>
                  <Text style={st.legendSub}>
                    {m.avg} kcal/día · {m.percent}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Estadísticas avanzadas */}
        <Text style={st.sectionLabel}>ESTADÍSTICAS</Text>
        <View style={st.advancedCard}>
          <AdvancedRow label="Promedio diario" value={`${averages.calories} kcal`} />
          <AdvancedRow label="Proteína promedio" value={`${averages.protein} g`} />
          <AdvancedRow label="Mínimo registrado" value={`${advancedStats.min} kcal`} />
          <AdvancedRow label="Máximo registrado" value={`${advancedStats.max} kcal`} />
          {advancedStats.bestDay && (
            <AdvancedRow
              label="Mejor día"
              value={`${advancedStats.bestDay.calories} kcal · ${new Date(advancedStats.bestDay.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}`}
            />
          )}
          {advancedStats.worstDay && (
            <AdvancedRow
              label="Peor día"
              value={`${advancedStats.worstDay.calories} kcal · ${new Date(advancedStats.worstDay.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}`}
            />
          )}
          <View style={st.streakRow}>
            <Text style={st.streakIcon}>🔥</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.streakLabel}>Racha actual</Text>
              <Text style={st.streakValue}>{advancedStats.streak} días cumpliendo</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Tarjeta de resumen ───────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, goal, unit, color }) {
  const pct = goal > 0 ? Math.min(value / goal, 1.2) : 0;
  const statusColor = pct >= 0.9 && pct <= 1.1 ? GREEN : pct >= 0.7 ? ORANGE : RED;

  return (
    <View style={sc.wrap}>
      <View style={sc.header}>
        <Text style={sc.icon}>{icon}</Text>
        <View style={[sc.statusDot, { backgroundColor: statusColor }]} />
      </View>
      <Text style={sc.label}>{label}</Text>
      <Text style={[sc.value, { color }]}>
        {value}<Text style={sc.unit}>{unit}</Text>
      </Text>
      <Text style={sc.goal}>Meta: {goal}{unit}</Text>
      <View style={sc.barTrack}>
        <View style={[sc.barFill, { width: `${Math.min(pct * 100, 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  wrap: {
    flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: BORDER, minWidth: '47%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  icon: { fontSize: 18 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 10, color: T3, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  value: { fontSize: 20, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
  unit: { fontSize: 10, color: T3, fontWeight: '600', marginLeft: 2 },
  goal: { fontSize: 10, color: T3, marginTop: 2 },
  barTrack: { height: 3, backgroundColor: SRF2, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2 },
});

// ─── Gráfico de líneas ────────────────────────────────────────────────────────
function LineChart({ data, labels, goalLine, color, height }) {
  const animProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animProgress.setValue(0);
    Animated.timing(animProgress, {
      toValue: 1, duration: 800, useNativeDriver: false,
    }).start();
  }, [data]);

  const max = Math.max(...data, goalLine || 0) * 1.15 || 100;
  const min = 0;
  const chartHeight = height - 30;
  const pointSpacing = data.length > 1 ? CHART_WIDTH / (data.length - 1) : CHART_WIDTH;

  const points = data.map((val, idx) => ({
    x: data.length > 1 ? idx * pointSpacing : CHART_WIDTH / 2,
    y: chartHeight - ((val - min) / (max - min)) * chartHeight,
    value: val,
  }));

  const goalY = goalLine ? chartHeight - ((goalLine - min) / (max - min)) * chartHeight : null;

  return (
    <View style={{ height }}>
      {/* Línea de objetivo */}
      {goalY !== null && (
        <View style={[lc.goalLine, { top: goalY }]}>
          <View style={[lc.goalDash, { borderColor: ORANGE + '60' }]} />
          <Text style={lc.goalLabel}>{goalLine}</Text>
        </View>
      )}

      {/* Líneas conectando puntos */}
      {points.map((p, idx) => {
        if (idx === points.length - 1) return null;
        const next = points[idx + 1];
        const dx = next.x - p.x;
        const dy = next.y - p.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        return (
          <Animated.View
            key={`line-${idx}`}
            style={[
              lc.segment,
              {
                left: p.x, top: p.y,
                width: length,
                transform: [{ rotate: `${angle}deg` }],
                opacity: animProgress,
              },
            ]}
          />
        );
      })}

      {/* Puntos */}
      {points.map((p, idx) => (
        <Animated.View
          key={`point-${idx}`}
          style={[
            lc.point,
            {
              left: p.x - 4, top: p.y - 4,
              backgroundColor: color,
              transform: [{ scale: animProgress }],
            },
          ]}
        />
      ))}

      {/* Etiquetas X */}
      <View style={lc.labelsRow}>
        {labels.map((label, idx) => {
          const showLabel = data.length <= 10 || idx % Math.ceil(data.length / 10) === 0;
          return (
            <Text
              key={idx}
              style={[lc.label, { left: data.length > 1 ? idx * pointSpacing - 10 : CHART_WIDTH / 2 - 10 }]}
            >
              {showLabel ? label : ''}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const lc = StyleSheet.create({
  goalLine: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center' },
  goalDash: { flex: 1, borderTopWidth: 1, borderStyle: 'dashed' },
  goalLabel: { fontSize: 9, color: ORANGE, fontWeight: '700', marginLeft: 4 },
  segment: {
    position: 'absolute', height: 2, backgroundColor: ACCENT,
    borderRadius: 1, transformOrigin: 'left center',
  },
  point: {
    position: 'absolute', width: 8, height: 8, borderRadius: 4,
    borderWidth: 2, borderColor: BG,
  },
  labelsRow: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 20 },
  label: { position: 'absolute', bottom: 0, fontSize: 9, color: T3, fontWeight: '600', width: 20, textAlign: 'center' },
});

// ─── Gráfico de barras ────────────────────────────────────────────────────────
function BarChart({ data, labels, goalLine, color, height }) {
  const animProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animProgress.setValue(0);
    Animated.timing(animProgress, {
      toValue: 1, duration: 700, useNativeDriver: false,
    }).start();
  }, [data]);

  const max = Math.max(...data, goalLine || 0) * 1.15 || 100;
  const chartHeight = height - 30;
  const barWidth = Math.max(8, Math.min(30, (CHART_WIDTH / data.length) * 0.6));
  const spacing = CHART_WIDTH / data.length;

  const goalY = goalLine ? chartHeight - (goalLine / max) * chartHeight : null;

  return (
    <View style={{ height }}>
      {goalY !== null && (
        <View style={[bc.goalLine, { top: goalY }]}>
          <View style={[bc.goalDash, { borderColor: ORANGE + '60' }]} />
          <Text style={bc.goalLabel}>{goalLine}g</Text>
        </View>
      )}

      <View style={bc.barsRow}>
        {data.map((val, idx) => {
          const barHeight = (val / max) * chartHeight;
          const meetsGoal = goalLine && val >= goalLine * 0.9;
          const barColor = val === 0 ? SRF2 : meetsGoal ? color : SRF2;

          return (
            <View key={idx} style={[bc.barColumn, { width: spacing }]}>
              <View style={bc.barTrack}>
                <Animated.View
                  style={[
                    bc.bar,
                    {
                      height: animProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, barHeight],
                      }),
                      backgroundColor: barColor,
                      width: barWidth,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={bc.labelsRow}>
        {labels.map((label, idx) => {
          const showLabel = data.length <= 10 || idx % Math.ceil(data.length / 10) === 0;
          return (
            <Text key={idx} style={[bc.label, { width: spacing }]}>
              {showLabel ? label : ''}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const bc = StyleSheet.create({
  goalLine: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', zIndex: 1 },
  goalDash: { flex: 1, borderTopWidth: 1, borderStyle: 'dashed' },
  goalLabel: { fontSize: 9, color: ORANGE, fontWeight: '700', marginLeft: 4 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', height: '100%', paddingBottom: 20 },
  barColumn: { alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { borderRadius: 3, minHeight: 2 },
  labelsRow: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', height: 20 },
  label: { fontSize: 9, color: T3, fontWeight: '600', textAlign: 'center' },
});

// ─── Stat de cumplimiento ─────────────────────────────────────────────────────
function ComplianceStat({ label, value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <View style={cs.wrap}>
      <View style={cs.header}>
        <Text style={cs.label}>{label}</Text>
        <Text style={[cs.value, { color }]}>{value}/{total}</Text>
      </View>
      <View style={cs.barTrack}>
        <View style={[cs.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
  wrap: { marginBottom: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 12, color: T2, fontWeight: '600' },
  value: { fontSize: 12, fontWeight: '800' },
  barTrack: { height: 6, backgroundColor: SRF2, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
});

// ─── Item de ranking de alimentos ─────────────────────────────────────────────
function FoodRankItem({ rank, name, times }) {
  const medals = ['🥇', '🥈', '🥉'];
  const medal = medals[rank - 1] || `#${rank}`;

  return (
    <View style={fr.wrap}>
      <Text style={fr.rank}>{medal}</Text>
      <View style={fr.info}>
        <Text style={fr.name} numberOfLines={1}>{name}</Text>
        <View style={fr.barTrack}>
          <View style={[fr.barFill, { width: `${Math.min(times * 5, 100)}%` }]} />
        </View>
      </View>
      <Text style={fr.times}>{times}x</Text>
    </View>
  );
}

const fr = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BORDER, gap: 10,
  },
  rank: { fontSize: 18, width: 30, textAlign: 'center' },
  info: { flex: 1 },
  name: { fontSize: 13, color: T1, fontWeight: '600', marginBottom: 4 },
  barTrack: { height: 3, backgroundColor: SRF2, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 3, backgroundColor: ACCENT, borderRadius: 2 },
  times: { fontSize: 13, color: ACCENT, fontWeight: '800', minWidth: 35, textAlign: 'right' },
});

// ─── Gráfico Donut ────────────────────────────────────────────────────────────
function DonutChart({ data, size }) {
  const total = data.reduce((a, d) => a + d.calories, 0) || 1;
  const animProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animProgress.setValue(0);
    Animated.timing(animProgress, {
      toValue: 1, duration: 900, useNativeDriver: false,
    }).start();
  }, [data]);

  // Construir segmentos
  const segments = [];
  let currentAngle = 0;
  data.forEach(d => {
    const angle = (d.calories / total) * 360;
    segments.push({
      color: MEAL_CONFIG[d.key].color,
      startAngle: currentAngle,
      angle,
    });
    currentAngle += angle;
  });

  return (
    <View style={[dc.wrap, { width: size, height: size }]}>
      {/* Track base */}
      <View style={[dc.track, { width: size, height: size, borderRadius: size / 2 }]} />

      {/* Segmentos simulados con Views rotados */}
      {segments.map((seg, idx) => {
        if (seg.angle <= 0) return null;
        return (
          <Animated.View
            key={idx}
            style={[
              dc.segment,
              {
                width: size, height: size, borderRadius: size / 2,
                borderWidth: size / 5,
                borderColor: seg.color,
                transform: [
                  { rotate: `${seg.startAngle}deg` },
                  { scale: animProgress },
                ],
                opacity: animProgress,
              },
            ]}
          />
        );
      })}

      {/* Centro */}
      <View style={[dc.center, { width: size * 0.6, height: size * 0.6, borderRadius: (size * 0.6) / 2 }]}>
        <Text style={dc.centerValue}>{Math.round(total / data.length)}</Text>
        <Text style={dc.centerLabel}>kcal/día</Text>
      </View>
    </View>
  );
}

const dc = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  track: { position: 'absolute', borderWidth: size => size / 5, borderColor: SRF2 },
  segment: { position: 'absolute' },
  center: {
    position: 'absolute', backgroundColor: BG,
    alignItems: 'center', justifyContent: 'center',
  },
  centerValue: { fontSize: 20, fontWeight: '800', color: T1 },
  centerLabel: { fontSize: 9, color: T3, fontWeight: '600', marginTop: 2 },
});

// ─── Fila de estadísticas avanzadas ───────────────────────────────────────────
function AdvancedRow({ label, value }) {
  return (
    <View style={ar.wrap}>
      <Text style={ar.label}>{label}</Text>
      <Text style={ar.value}>{value}</Text>
    </View>
  );
}

const ar = StyleSheet.create({
  wrap: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  label: { fontSize: 12, color: T2, fontWeight: '600' },
  value: { fontSize: 13, color: T1, fontWeight: '800' },
});

// ─── Estilos principales ──────────────────────────────────────────────────────
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loading: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: T3, marginTop: 12, fontSize: 13 },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: SURFACE,
    borderWidth: 1, borderColor: BORDER2, alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 18, color: T1, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: T1, letterSpacing: -0.4 },
  subtitle: { fontSize: 12, color: T3, marginTop: 1, fontWeight: '500' },

  filtersRow: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 20,
  },
  filterBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: SURFACE,
    borderWidth: 1, borderColor: BORDER, alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  filterText: { fontSize: 12, fontWeight: '700', color: T2 },
  filterTextActive: { color: BG },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2, color: T3,
    textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 10, marginTop: 8,
  },

  summaryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10, marginBottom: 10,
  },

  chartCard: {
    marginHorizontal: 20, backgroundColor: SURFACE, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: BORDER, marginBottom: 10,
  },

  complianceCard: {
    marginHorizontal: 20, backgroundColor: SURFACE, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: BORDER, marginBottom: 10,
  },
  complianceDivider: { height: 1, backgroundColor: BORDER, marginVertical: 10 },
  adherenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  adherenceLabel: { fontSize: 13, color: T1, fontWeight: '700' },
  adherenceValue: { fontSize: 20, fontWeight: '800', color: GREEN },

  topFoodsCard: {
    marginHorizontal: 20, backgroundColor: SURFACE, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: BORDER, marginBottom: 10,
  },
  emptyText: { fontSize: 12, color: T3, textAlign: 'center', paddingVertical: 20 },

  distributionCard: {
    marginHorizontal: 20, backgroundColor: SURFACE, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: BORDER, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  distributionLegend: { flex: 1 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, color: T1, fontWeight: '700' },
  legendSub: { fontSize: 10, color: T3, marginTop: 1 },

  advancedCard: {
    marginHorizontal: 20, backgroundColor: SURFACE, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: BORDER, marginBottom: 10,
  },
  streakRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: BORDER,
  },
  streakIcon: { fontSize: 32 },
  streakLabel: { fontSize: 12, color: T3, fontWeight: '600' },
  streakValue: { fontSize: 16, color: ACCENT, fontWeight: '800', marginTop: 2 },
});