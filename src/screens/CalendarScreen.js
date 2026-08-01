import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase.js';
import { colors, radius, spacing } from '../../lib/theme.js';

const TIME_FILTERS = [
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'year', label: 'Año' },
  { key: 'all', label: 'Todo' },
];

export default function CalendarScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workoutDates, setWorkoutDates] = useState(new Set());
  const [loading, setLoading] = useState(true);
  
  // Nuevos estados para el filtro y las estadísticas
  const [timeFilter, setTimeFilter] = useState('month');
  const [stats, setStats] = useState({ workouts: 0, sets: 0, volume: 0 });

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [currentDate, timeFilter])
  );

  async function fetchData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Obtener estadísticas según el filtro de tiempo seleccionado
    let startDate = null;
    const now = new Date();

    if (timeFilter === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Ajuste para empezar en Lunes
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff);
      startOfWeek.setHours(0, 0, 0, 0);
      startDate = startOfWeek.toISOString();
    } else if (timeFilter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (timeFilter === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString();
    }

    let query = supabase
      .from('workout_sessions')
      .select('finished_at, total_sets, total_volume_kg')
      .eq('user_id', user.id)
      .not('finished_at', 'is', null);

    if (startDate) {
      query = query.gte('finished_at', startDate);
    }

    const { data: statsData } = await query;

    if (statsData) {
      const totalSets = statsData.reduce((a, s) => a + (s.total_sets || 0), 0);
      const totalVol = statsData.reduce((a, s) => a + (s.total_volume_kg || 0), 0);
      setStats({ workouts: statsData.length, sets: totalSets, volume: Math.round(totalVol) });
    }

    // 2. Obtener días de entreno para el mes visualizado en el calendario (independiente del filtro de stats)
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStartDate = new Date(year, month, 1).toISOString();
    const monthEndDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const { data: monthData } = await supabase
      .from('workout_sessions')
      .select('finished_at')
      .eq('user_id', user.id)
      .not('finished_at', 'is', null)
      .gte('finished_at', monthStartDate)
      .lte('finished_at', monthEndDate);

    if (monthData) {
      const dates = new Set(monthData.map(session => {
        const d = new Date(session.finished_at);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }));
      setWorkoutDates(dates);
    }

    setLoading(false);
  }

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  // --- Lógica Matemática del Calendario ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  let firstDayIndex = new Date(year, month, 1).getDay() - 1;
  if (firstDayIndex === -1) firstDayIndex = 6; 

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const renderDays = () => {
    const days = [];
    
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isWorkoutDay = workoutDates.has(dateString);
      
      days.push(
        <View key={i} style={styles.dayCell}>
          <Text style={[styles.dayText, isWorkoutDay && styles.workoutDayText]}>
            {i}
          </Text>
          {isWorkoutDay ? <View style={styles.dot} /> : <View style={styles.emptyDot} />}
        </View>
      );
    }
    return days;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Historial de Entrenos</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Selector de Tiempo */}
        <View style={styles.filterRow}>
          {TIME_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterBtn, timeFilter === filter.key && styles.filterBtnActive]}
              onPress={() => setTimeFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, timeFilter === filter.key && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Estadísticas */}
        <View style={styles.statsRow}>
          <StatCard label="Entrenos" value={stats.workouts} unit="" icon="🏋️" />
          <StatCard label="Series" value={stats.sets} unit="" icon="📊" />
          <StatCard label="Volumen" value={`${stats.volume}`} unit="kg" icon="⚡" />
        </View>

        {/* Control del Mes */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowBtn}>
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>
          
          <Text style={styles.monthText}>
            📅 {monthNames[month]} {year}
          </Text>
          
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowBtn}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Contenedor del Calendario */}
        <View style={styles.calendarCard}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.accent} style={{ marginVertical: 40 }} />
          ) : (
            <>
              <View style={styles.weekRow}>
                {weekDays.map((day, idx) => (
                  <Text key={idx} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {renderDays()}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Sub-componente de Estadísticas ────────────────────────────────────────────
function StatCard({ label, value, unit, icon }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}<Text style={styles.statUnit}>{unit}</Text></Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 40,
    marginBottom: 20,
  },
  backBtn: { padding: 8 },
  backText: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  title: { color: colors.t1, fontSize: 18, fontWeight: '700' },
  
  // Filtros de tiempo
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: '#ffffff08',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.t3,
  },
  filterTextActive: {
    color: '#0D0D0D', // Color de fondo para contraste
    fontWeight: '800',
  },

  // Estadísticas
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bg3,
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  statIcon: { fontSize: 18, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.t1, letterSpacing: -0.5 },
  statUnit: { fontSize: 13, fontWeight: '600', color: colors.t3 },
  statLabel: { fontSize: 10, color: colors.t3, fontWeight: '600', letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' },

  // Calendario
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  arrowBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  arrowText: { color: colors.accent, fontSize: 28 },
  monthText: { color: colors.t1, fontSize: 20, fontWeight: '700', textTransform: 'capitalize' },
  
  calendarCard: {
    backgroundColor: colors.bg3,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  weekDayText: {
    color: colors.t3,
    fontSize: 14,
    fontWeight: '600',
    width: '14.28%',
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dayText: {
    color: colors.t1,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  workoutDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  emptyDot: {
    width: 6,
    height: 6,
  }
});