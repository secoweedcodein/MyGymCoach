// src/screens/HomeScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase.js';
import { getExercise } from './data/exercises.js';
import { colors } from '../../lib/theme.js';
import BottomTabBar from '../../components/BottomTabBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Design tokens ─────────────────────────────────────────────────────────────
const ACCENT   = '#C0FF3E';
const BG       = '#0D0D0D';
const SURFACE  = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER   = '#FFFFFF0D';
const T1       = '#FFFFFF';
const T2       = '#A0A0A0';
const T3       = '#555555';

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, icon }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={s.statValue}>{value}<Text style={s.statUnit}>{unit}</Text></Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, sub, onPress }) {
  return (
    <TouchableOpacity style={s.quickCard} onPress={onPress} activeOpacity={0.7}>
      <Text style={s.quickIcon}>{icon}</Text>
      <Text style={s.quickLabel}>{label}</Text>
      <Text style={s.quickSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

function RoutineCard({ routine, index, onStart }) {
  const ids = routine.exercise_ids || [];
  const nameLower = (routine.name || '').toLowerCase();
  
  // Detectar qué tipo de reto es
  const isAbs = routine.is_challenge && (routine.challenge_type === 'abs' || nameLower.includes('abs'));
  const isHipertrofiaAvanzada = routine.is_challenge && (routine.challenge_type === 'hipertrofia_avanzada' || nameLower.includes('avanzada'));
  const isHipertrofia30Dias = routine.is_challenge && nameLower.includes('hipertrofia') && nameLower.includes('30');
  
  // Si es reto, usar nombres hardcodeados
  const exerciseNames = isAbs
    ? ['Plancha frontal', 'Crunch inverso', 'Russian twist']
    : isHipertrofiaAvanzada || isHipertrofia30Dias
    ? ['Press banca', 'Sentadilla', 'Peso muerto']
    : ids.slice(0, 3).map(id => getExercise(id)?.name || '?');
  
  const extra = routine.is_challenge ? 3 : Math.max(0, ids.length - 3);
  const accents = ['#C0FF3E', '#3EE5FF', '#FF6B3E', '#FF3EAA'];
  const dot = accents[index % accents.length];

  let daysRemaining = null;
  if (routine.is_challenge && routine.challenge_start_date) {
    const startDate = new Date(routine.challenge_start_date);
    const today = new Date();
    const diffDays = Math.ceil(Math.abs(today - startDate) / (1000 * 60 * 60 * 24));
    daysRemaining = Math.max(0, 30 - diffDays);
  }

  // ✅ FUNCIÓN DE NAVEGACIÓN CORREGIDA
  const handlePress = () => {
    if (isAbs) {
      router.push('/explore/abs-challenge');
    } else if (isHipertrofiaAvanzada) {
      router.push('/explore/hipertrofia-challenge'); // ← Va a la pantalla de Hipertrofia Avanzada
    } else if (isHipertrofia30Dias) {
      router.push('/explore/challenge-detail'); // ← Va a la pantalla de Hipertrofia 30 días
    } else {
      onStart();
    }
  };

  return (
    <TouchableOpacity style={s.routineCard} onPress={handlePress} activeOpacity={0.75}>
      <View style={[s.routineAccentBar, { backgroundColor: routine.is_challenge ? '#FF6B3E' : dot }]} />
      <View style={s.routineInner}>
        <View style={s.routineTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.routineName}>{routine.name}</Text>
            {routine.is_challenge ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Text style={[s.routineMeta, { color: '#FF6B3E' }]}>🔥 Reto activo</Text>
                <Text style={s.routineMeta}>· {daysRemaining} días</Text>
              </View>
            ) : (
              <Text style={s.routineMeta}>{ids.length} ejercicios</Text>
            )}
          </View>
          <TouchableOpacity style={s.startBtn} onPress={handlePress} activeOpacity={0.8}>
            <Text style={s.startBtnText}>
              {routine.is_challenge ? 'Ver' : '▶ Iniciar'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.chipRow}>
          {exerciseNames.map((n, i) => (
            <View key={i} style={s.chip}>
              <Text style={s.chipText}>{n}</Text>
            </View>
          ))}
          {extra > 0 && (
            <View style={[s.chip, s.chipMore]}>
              <Text style={[s.chipText, s.chipMoreText]}>+{extra} más</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyRoutines({ onPress }) {
  return (
    <View style={s.emptyCard}>
      <Text style={s.emptyIcon}>🏗️</Text>
      <Text style={s.emptyTitle}>Sin rutinas todavía</Text>
      <Text style={s.emptyText}>Crea tu primera rutina y empieza a registrar tu progreso.</Text>
      <TouchableOpacity style={s.emptyBtn} onPress={onPress} activeOpacity={0.8}>
        <Text style={s.emptyBtnText}>Crear rutina</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [stats, setStats] = useState({ workouts: 0, sets: 0, volume: 0 });
  const [todayCalories, setTodayCalories] = useState(0);
const [tapCount, setTapCount] = useState(0);
useEffect(() => {
    if (tapCount >= 5) {
      router.push('/admin/login');
      setTapCount(0);
    }
    const timeout = setTimeout(() => setTapCount(0), 2000);
    return () => clearTimeout(timeout);
  }, [tapCount]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    setRefreshing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setRefreshing(false);
      return;
    }

    const { data: rData, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error cargando rutinas:", error);
      setRefreshing(false);
      return;
    }

    if (rData) {
      const today = new Date();
      const expiredIds = [];

      const activeRoutines = rData.filter(r => {
        if (r.is_challenge && r.challenge_start_date) {
          const startDate = new Date(r.challenge_start_date);
          const diffTime = today - startDate;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 30) {
            expiredIds.push(r.id);
            return false;
          }
        }
        return true;
      });

      setRoutines(activeRoutines);

      if (expiredIds.length > 0) {
        supabase.from('routines').delete().in('id', expiredIds).then(({ error: deleteError }) => {
          if (deleteError) console.error("Error eliminando retos expirados:", deleteError);
        });
      }
    }

    // Calorías de hoy
    const todayLogDate = new Date().toISOString().split('T')[0];
    const { data: nutData } = await supabase
      .from('nutrition_logs')
      .select('calories')
      .eq('user_id', user.id)
      .eq('logged_date', todayLogDate);

    const todayCal = (nutData || []).reduce((a, r) => a + (r.calories || 0), 0);
    setTodayCalories(Math.round(todayCal));

    // Estadísticas del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: sData, error: statsError } = await supabase
      .from('workout_sessions')
      .select('total_sets, total_volume_kg')
      .eq('user_id', user.id)
      .not('finished_at', 'is', null)
      .gte('finished_at', startOfMonth);

    if (statsError) {
      console.error("Error cargando estadísticas:", statsError);
      setStats({ workouts: 0, sets: 0, volume: 0 });
    } else if (sData) {
      const totalSets = sData.reduce((a, s) => a + (s.total_sets || 0), 0);
      const totalVol = sData.reduce((a, s) => a + (s.total_volume_kg || 0), 0);
      setStats({ workouts: sData.length, sets: totalSets, volume: Math.round(totalVol) });
    } else {
      setStats({ workouts: 0, sets: 0, volume: 0 });
    }

    setRefreshing(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

    async function startRoutine(routine) {
    let routineToStart = { ...routine };
    const nameLower = (routine.name || '').toLowerCase();

    if (routine.is_challenge) {
      if (routine.challenge_type === 'abs' || nameLower.includes('abs')) {
        routineToStart.exercises = [
          { name: 'Plancha frontal', sets: 3, reps: '45s' },
          { name: 'Crunch inverso', sets: 4, reps: '15' },
          { name: 'Russian twist', sets: 3, reps: '20' },
          { name: 'Mountain climbers', sets: 4, reps: '30s' },
          { name: 'Plancha lateral', sets: 3, reps: '30s/lado' },
          { name: 'Bicycle crunch', sets: 3, reps: '20' },
        ];
      } else if (routine.challenge_type === 'hipertrofia' || routine.challenge_type === 'hipertrofia_avanzada' || nameLower.includes('hipertrofia')) {
        routineToStart.exercises = [
          { name: 'Press banca plano', sets: 4, reps: '8-10' },
          { name: 'Sentadilla trasera', sets: 4, reps: '8-10' },
          { name: 'Peso muerto rumano', sets: 4, reps: '10-12' },
          { name: 'Press militar mancuernas', sets: 3, reps: '10-12' },
          { name: 'Dominadas lastradas', sets: 3, reps: '8-10' },
          { name: 'Curl bíceps con barra', sets: 3, reps: '12-15' },
        ];
      } else {
        // ✅ AQUÍ ESTÁ LA CLAVE: Para retos nuevos (Full Body, PPL, Upper, 5x5, o creados desde el móvil)
        // Buscamos los ejercicios reales en la tabla 'challenges' por nombre
        const challengeName = routine.name.replace(/^Reto:\s*/i, '').trim();
        
        try {
          const { data: challenge } = await supabase
            .from('challenges')
            .select('days')
            .eq('name', challengeName)
            .maybeSingle();

          if (challenge && challenge.days && challenge.days.length > 0) {
            // Usamos el primer día como predeterminado
            const firstDay = challenge.days[0];
            routineToStart.exercises = firstDay.exercises.map(ex => ({
              name: ex.name,
              sets: parseInt(ex.sets) || 3,
              reps: ex.reps,
            }));
          } else {
            // Fallback si no se encuentra el reto en la BD
            routineToStart.exercises = [
              { name: 'Ejercicio 1', sets: 3, reps: '10' },
              { name: 'Ejercicio 2', sets: 3, reps: '12' },
              { name: 'Ejercicio 3', sets: 3, reps: '15' },
            ];
          }
        } catch (err) {
          console.error('Error cargando ejercicios del reto:', err);
          routineToStart.exercises = [
            { name: 'Ejercicio 1', sets: 3, reps: '10' },
            { name: 'Ejercicio 2', sets: 3, reps: '12' },
            { name: 'Ejercicio 3', sets: 3, reps: '15' },
          ];
        }
      }
    } else {
      // ✅ Para rutinas normales (No son retos)
      if (routine.exercise_ids && routine.exercise_ids.length > 0) {
        routineToStart.exercises = routine.exercise_ids.map(id => {
          const ex = getExercise(id);
          return {
            name: ex?.name || 'Ejercicio',
            sets: 3,
            reps: '10',
          };
        });
      } else {
        // Fallback para rutinas sin ejercicios
        routineToStart.exercises = [
          { name: 'Ejercicio 1', sets: 3, reps: '10' },
          { name: 'Ejercicio 2', sets: 3, reps: '12' },
          { name: 'Ejercicio 3', sets: 3, reps: '15' },
        ];
      }
    }

    router.push({
      pathname: '/workout',
      params: { routine: JSON.stringify(routineToStart) }
    });
  }

  const today  = new Date();
  const days   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const dayName  = days[today.getDay()];
  const dateStr  = `${today.getDate()} ${months[today.getMonth()]}`;
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.accent} />}
      >
        {/* ── TOP BAR ── */}
<View style={s.topBar}>
  
  {/* Botón secreto en el título con tu código */}
  <TouchableOpacity
    onPress={() => setTapCount(c => c + 1)}
    activeOpacity={0.7}
  >
    <Text style={s.appName}>MyGym<Text style={s.appNameAccent}>Coach</Text></Text>
  </TouchableOpacity>
  
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    <TouchableOpacity onPress={handleSignOut} style={s.signOutBtn}>
      <Text style={s.signOutText}>Salir</Text>
    </TouchableOpacity>
  </View>
</View>

        {/* ── HERO ── */}
        <View style={s.hero}>
          <View style={s.heroGlow} />
          <Text style={s.heroDay}>{dayName} · {dateStr}</Text>
          <Text style={s.heroGreeting}>{greeting}, atleta 💪</Text>
          <Text style={s.heroSub}>Cada rep cuenta. Sigue adelante.</Text>
        </View>

        {/* ── STATS ROW ── */}
        <View style={s.statsRow}>
          <StatCard label="Entrenos del mes"  value={stats.workouts} unit=""   icon="🏋️" />
          <StatCard label="Series del mes"    value={stats.sets}     unit=""   icon="📊" />
          <StatCard label="Volumen del mes"   value={`${stats.volume}`} unit="kg" icon="⚡" />
        </View>

        {/* ── STEPS CARD ── */}
        <TouchableOpacity onPress={() => router.push('/Steps')} style={s.stepsCardFull} activeOpacity={0.8}>
          <View style={s.stepsCardGlow} />
          <View style={s.stepsCardContent}>
            <View style={s.stepsCardLeft}>
              <Text style={s.stepsCardIcon}>👟</Text>
              <View>
                <Text style={s.stepsCardTitle}>Contador de pasos</Text>
                <Text style={s.stepsCardSub}>Mantente activo hoy</Text>
              </View>
            </View>
            <View style={s.stepsCardRight}>
              <Text style={s.stepsCardArrow}>→</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── QUICK ACTIONS ── */}
        <View>
          <View style={s.quickRow}>
            <QuickAction icon="📅" label="Historial" sub="Sesiones pasadas" onPress={() => router.push('/History')} />
            <QuickAction icon="📆" label="Calendario" sub="Vista mensual" onPress={() => router.push('/calendar')} />
            <QuickAction icon="📈" label="Dashboard" sub="Tus récords" onPress={() => router.push('/dashboard')} />
          </View>
          <View style={s.quickRow}>
            <QuickAction icon="🥗" label="Nutrición" sub="Toca para ver hoy" onPress={() => router.push('/nutrition')} />
            <QuickAction icon="⚖️" label="IMC" sub="Índice de masa" onPress={() => router.push('/bmi')} />
          </View>
        </View>

        {/* ── ROUTINES ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionLabel}>MIS RUTINAS</Text>
          <TouchableOpacity onPress={() => router.push('/routines')} style={s.newBtn}>
            <Text style={s.newBtnText}>+ Nueva</Text>
          </TouchableOpacity>
        </View>

        {routines.length === 0 ? (
          <EmptyRoutines onPress={() => router.push('/routines')} />
        ) : (
          routines.map((r, idx) => (
            <RoutineCard
              key={r.id}
              routine={r}
              index={idx}
              onStart={() => startRoutine(r)}
            />
          ))
        )}
      </ScrollView>

      <BottomTabBar />
    </View>
  );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingBottom: 60 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 4 },
  appName: { fontSize: 20, fontWeight: '800', color: T1, letterSpacing: -0.5 },
  appNameAccent: { color: ACCENT },
  signOutBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: SURFACE2 },
  signOutText: { fontSize: 12, color: T2, fontWeight: '600' },
  hero: { marginHorizontal: 20, marginTop: 24, marginBottom: 28, position: 'relative', overflow: 'hidden' },
  heroGlow: { position: 'absolute', top: -60, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: ACCENT, opacity: 0.07 },
  heroDay: { fontSize: 12, fontWeight: '700', color: ACCENT, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  heroGreeting: { fontSize: 36, fontWeight: '800', color: T1, lineHeight: 42, letterSpacing: -1, marginBottom: 8 },
  heroSub: { fontSize: 14, color: T2, fontWeight: '400' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: SURFACE, borderRadius: 16, padding: 14, alignItems: 'flex-start', borderWidth: 1, borderColor: BORDER },
  statIcon: { fontSize: 18, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '800', color: T1, letterSpacing: -0.5 },
  statUnit: { fontSize: 13, fontWeight: '600', color: T2 },
  statLabel: { fontSize: 10, color: T2, fontWeight: '600', letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' },
  stepsCardFull: { marginHorizontal: 20, marginBottom: 32, backgroundColor: SURFACE, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: ACCENT + '40', overflow: 'hidden', position: 'relative' },
  stepsCardGlow: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: ACCENT, opacity: 0.1 },
  stepsCardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepsCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  stepsCardIcon: { fontSize: 32 },
  stepsCardTitle: { fontSize: 16, fontWeight: '800', color: T1, marginBottom: 4 },
  stepsCardSub: { fontSize: 12, color: T2, fontWeight: '500' },
  stepsCardRight: { width: 40, height: 40, borderRadius: 20, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  stepsCardArrow: { fontSize: 20, fontWeight: '800', color: BG },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: T3, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20, marginBottom: 12, marginTop: 8 },
  newBtn: { backgroundColor: ACCENT, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  newBtnText: { fontSize: 12, fontWeight: '800', color: '#000' },
  quickRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 32 },
  quickCard: { flex: 1, backgroundColor: SURFACE, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: BORDER, alignItems: 'flex-start' },
  quickIcon: { fontSize: 22, marginBottom: 10 },
  quickLabel: { fontSize: 13, fontWeight: '700', color: T1, marginBottom: 2 },
  quickSub: { fontSize: 10, color: T2, fontWeight: '500' },
  routineCard: { marginHorizontal: 20, marginBottom: 12, backgroundColor: SURFACE, borderRadius: 20, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', flexDirection: 'row' },
  routineAccentBar: { width: 4, borderRadius: 0 },
  routineInner: { flex: 1, padding: 16 },
  routineTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  routineName: { fontSize: 17, fontWeight: '700', color: T1, letterSpacing: -0.3 },
  routineMeta: { fontSize: 12, color: T2, marginTop: 3, fontWeight: '500' },
  startBtn: { backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start' },
  startBtnText: { fontSize: 13, fontWeight: '800', color: '#000' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: SURFACE2, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: BORDER },
  chipText: { fontSize: 11, color: T2, fontWeight: '600' },
  chipMore: { borderColor: '#FFFFFF18' },
  chipMoreText: { color: T3 },
  emptyCard: { marginHorizontal: 20, backgroundColor: SURFACE, borderRadius: 20, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: T1, marginBottom: 6 },
  emptyText: { fontSize: 13, color: T2, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn: { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 28 },
  emptyBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
});