// src/screens/WorkoutScreen.js -> Ajustado para StepsScreen
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import {
  checkPedometerPermission,
  subscribeToSteps,
  calculateMetrics,
  saveDailySteps,
  getStepsHistory,
  getUserStepsGoal,
} from '../../services/stepsService';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const SRF2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const BORDER2 = '#FFFFFF18';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';

export default function StepsScreen() {
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [steps, setSteps] = useState(0);
  const [goal, setGoal] = useState(10000);
  const [userId, setUserId] = useState(null);
  const [history, setHistory] = useState([]);

  // Usamos useRef para mantener la referencia de la desuscripción entre renderizados
  const subscriptionRef = useRef(null);
  // Guardamos el timeout del debounce en un ref para evitar recrearlo
  const saveTimeoutRef = useRef(null);

  // Animación del círculo de progreso
  const progressAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    init();
    
    // Al desmontar la pantalla, limpiamos la suscripción de forma segura
    return () => {
      if (subscriptionRef.current) {
        if (typeof subscriptionRef.current === 'function') {
          subscriptionRef.current(); // Si el servicio retorna una función de limpieza
        } else if (subscriptionRef.current.remove) {
          subscriptionRef.current.remove(); // Si es un objeto de suscripción nativo tradicional
        }
      }
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  async function init() {
    setLoading(true);
    try {
      // 1. Obtener usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // 2. Verificar permisos
      const { granted } = await checkPedometerPermission();
      setPermissionGranted(granted);
      if (!granted) {
        setLoading(false);
        return;
      }

      // 3. Obtener meta del usuario
      const userGoal = await getUserStepsGoal(user.id);
      setGoal(userGoal || 10000);

      // 4. Suscribirse al contador de pasos de manera segura
      // Guardamos el resultado directamente en nuestra referencia persistente
      subscriptionRef.current = await subscribeToSteps(async (result) => {
        if (result && result.steps !== undefined) {
          setSteps(result.steps);
          
          // Guardar en Supabase cada vez que cambien los pasos (con debounce de 2 segundos)
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = setTimeout(() => {
            saveDailySteps({ userId: user.id, steps: result.steps, goal: userGoal });
          }, 2000);
        }
      });

      // 5. Cargar historial
      const hist = await getStepsHistory(user.id, 7);
      setHistory(hist || []);

    } catch (error) {
      console.error("Error inicializando el podómetro en la pantalla:", error);
    } finally {
      setLoading(false);
    }
  }

  // Animar el progreso cuando cambian los pasos
  useEffect(() => {
    const pct = goal > 0 ? Math.min(steps / goal, 1) : 0;
    Animated.timing(progressAnim, {
      toValue: pct,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [steps, goal]);

  const metrics = calculateMetrics(steps) || { distanceKm: '0.0', calories: 0, activeMinutes: 0 };
  const progress = goal > 0 ? Math.min(steps / goal, 1) : 0;
  const isComplete = steps >= goal;

  // Estadísticas del historial
  const weekStats = (() => {
    if (!history || history.length === 0) return { avg: 0, best: 0, total: 0, daysActive: 0 };
    const stepsArr = history.map(h => h.steps || 0);
    const total = stepsArr.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / history.length);
    const best = Math.max(...stepsArr);
    const daysActive = stepsArr.filter(s => s >= goal).length;
    return { avg, best, total, daysActive };
  })();

  async function requestPermission() {
    const { granted } = await checkPedometerPermission();
    setPermissionGranted(granted);
    if (granted) init();
  }

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={s.loadingText}>Cargando pasos...</Text>
      </View>
    );
  }

  if (!permissionGranted) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={s.title}>Contador de pasos</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={s.permissionCard}>
          <Text style={s.permissionIcon}>👟</Text>
          <Text style={s.permissionTitle}>Necesitamos tu permiso</Text>
          <Text style={s.permissionText}>
            Para contar tus pasos necesitamos acceso al sensor de movimiento de tu teléfono.
          </Text>
          <TouchableOpacity style={s.permissionBtn} onPress={requestPermission}>
            <Text style={s.permissionBtnText}>Conceder permiso</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={s.title}>Pasos de hoy</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Círculo de progreso */}
        <View style={s.circleCard}>
          <View style={s.circleWrap}>
            <ProgressCircle progress={progress} size={220} />
            <View style={s.circleCenter}>
              <Text style={s.stepsCount}>{steps.toLocaleString()}</Text>
              <Text style={s.stepsLabel}>pasos</Text>
              <Text style={[s.goalText, isComplete && { color: ACCENT }]}>
                {isComplete ? '¡Meta cumplida! 🎉' : `${goal.toLocaleString()} meta`}
              </Text>
            </View>
          </View>

          {/* Stats rápidas */}
          <View style={s.statsRow}>
            <StatItem icon="📍" value={`${metrics.distanceKm}`} unit="km" label="Distancia" />
            <StatItem icon="🔥" value={`${metrics.calories}`} unit="kcal" label="Quemadas" />
            <StatItem icon="⏱️" value={`${metrics.activeMinutes}`} unit="min" label="Actividad" />
          </View>
        </View>

        {/* Progreso hacia la meta */}
        <View style={s.progressCard}>
          <View style={s.progressHeader}>
            <Text style={s.progressTitle}>Progreso diario</Text>
            <Text style={s.progressPercent}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={s.progressBar}>
            <Animated.View
              style={[
                s.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={s.progressRemaining}>
            {isComplete
              ? '¡Lo lograste! Sigue así 🔥'
              : `Faltan ${(goal - steps).toLocaleString()} pasos`}
          </Text>
        </View>

        {/* Historial de la semana */}
        <Text style={s.sectionLabel}>ÚLTIMOS 7 DÍAS</Text>
        <View style={s.historyCard}>
          {history.length === 0 ? (
            <Text style={s.historyEmpty}>Aún no hay datos</Text>
          ) : (
            <>
              <View style={s.weekStats}>
                <WeekStat label="Promedio" value={weekStats.avg.toLocaleString()} icon="📊" />
                <WeekStat label="Mejor día" value={weekStats.best.toLocaleString()} icon="🏆" />
                <WeekStat label="Días cumplidos" value={`${weekStats.daysActive}/7`} icon="✅" />
              </View>

              <View style={s.daysRow}>
                {getLast7Days().map((day, idx) => {
                  const dayData = history.find(h => h.date === day.date);
                  const daySteps = dayData?.steps || 0;
                  const dayPct = goal > 0 ? Math.min(daySteps / goal, 1) : 0;

                  return (
                    <View key={idx} style={s.dayColumn}>
                      <View style={s.dayBarWrap}>
                        <View
                          style={[
                            s.dayBar,
                            {
                              height: `${Math.max(dayPct * 100, 5)}%`,
                              backgroundColor: dayPct >= 1 ? ACCENT : dayPct > 0.5 ? '#3E8EFF' : SRF2,
                            },
                          ]}
                        />
                      </View>
                      <Text style={s.dayLabel}>{day.label}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* Tips */}
        <View style={s.tipsCard}>
          <Text style={s.tipsIcon}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.tipsTitle}>Consejo del día</Text>
            <Text style={s.tipsText}>
              {steps < 5000
                ? '¡Anímate! Una caminata de 10 minutos suma ~1000 pasos.'
                : steps < goal
                ? '¡Vas bien! Te faltan pocos pasos para llegar a tu meta.'
                : '¡Increíble! Mantén este ritmo para mejorar tu salud cardiovascular.'}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Círculo de progreso ─────────────────────────────────────────────────────
function ProgressCircle({ progress, size }) {
  const color = progress >= 1 ? ACCENT : progress > 0.7 ? '#3E8EFF' : '#A78BFA';
  
  return (
    <View style={[pc.wrap, { width: size, height: size }]}>
      <View style={[pc.track, { width: size, height: size, borderRadius: size / 2 }]} />
      <View style={[pc.progress, { width: size, height: size, borderRadius: size / 2, borderColor: color }]} />
    </View>
  );
}

const pc = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  track: { position: 'absolute', borderWidth: 10, borderColor: SRF2 },
  progress: { position: 'absolute', borderWidth: 10, transform: [{ rotate: '-90deg' }] },
});

// ─── Stat Item ────────────────────────────────────────────────────────────────
function StatItem({ icon, value, unit, label }) {
  return (
    <View style={si.wrap}>
      <Text style={si.icon}>{icon}</Text>
      <Text style={si.value}>
        {value}<Text style={si.unit}>{unit}</Text>
      </Text>
      <Text style={si.label}>{label}</Text>
    </View>
  );
}

const si = StyleSheet.create({
  wrap: { alignItems: 'center', flex: 1 },
  icon: { fontSize: 20, marginBottom: 4 },
  value: { fontSize: 18, fontWeight: '800', color: T1 },
  unit: { fontSize: 11, color: T3, fontWeight: '600', marginLeft: 2 },
  label: { fontSize: 10, color: T3, marginTop: 2, fontWeight: '600' },
});

// ─── Week Stat ────────────────────────────────────────────────────────────────
function WeekStat({ label, value, icon }) {
  return (
    <View style={ws.wrap}>
      <Text style={ws.icon}>{icon}</Text>
      <Text style={ws.value}>{value}</Text>
      <Text style={ws.label}>{label}</Text>
    </View>
  );
}

const ws = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center' },
  icon: { fontSize: 18, marginBottom: 4 },
  value: { fontSize: 16, fontWeight: '800', color: T1 },
  label: { fontSize: 10, color: T3, marginTop: 2, fontWeight: '600' },
});

// ─── Helper: últimos 7 días ───────────────────────────────────────────────────
function getLast7Days() {
  const days = [];
  const labels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().split('T')[0],
      label: labels[d.getDay()],
    });
  }
  return days;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loading: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: T3, marginTop: 12, fontSize: 13 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER2, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 18, color: T1, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '800', color: T1 },
  permissionCard: { margin: 20, backgroundColor: SURFACE, borderRadius: 18, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  permissionIcon: { fontSize: 48, marginBottom: 16 },
  permissionTitle: { fontSize: 18, fontWeight: '800', color: T1, marginBottom: 8 },
  permissionText: { fontSize: 13, color: T2, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  permissionBtn: { backgroundColor: ACCENT, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permissionBtnText: { fontSize: 14, fontWeight: '800', color: BG },
  circleCard: { marginHorizontal: 20, backgroundColor: SURFACE, borderRadius: 22, padding: 24, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  circleWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  circleCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  stepsCount: { fontSize: 36, fontWeight: '800', color: T1, letterSpacing: -1 },
  stepsLabel: { fontSize: 11, color: T3, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  goalText: { fontSize: 11, color: T2, marginTop: 6, fontWeight: '600' },
  statsRow: { flexDirection: 'row', width: '100%', paddingTop: 16, borderTopWidth: 1, borderTopColor: BORDER },
  progressCard: { marginHorizontal: 20, marginTop: 12, backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressTitle: { fontSize: 13, fontWeight: '700', color: T1 },
  progressPercent: { fontSize: 13, fontWeight: '800', color: ACCENT },
  progressBar: { height: 8, backgroundColor: SRF2, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: ACCENT, borderRadius: 4 },
  progressRemaining: { fontSize: 11, color: T3, marginTop: 8, fontWeight: '600' },
  sectionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: T3, textTransform: 'uppercase', marginTop: 20, marginBottom: 10, paddingHorizontal: 20 },
  historyCard: { marginHorizontal: 20, backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  historyEmpty: { fontSize: 13, color: T3, textAlign: 'center', paddingVertical: 20 },
  weekStats: { flexDirection: 'row', paddingBottom: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  daysRow: { flexDirection: 'row', justifyContent: 'space-around', height: 100 },
  dayColumn: { alignItems: 'center', flex: 1 },
  dayBarWrap: { flex: 1, width: 20, backgroundColor: SRF2, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden', marginBottom: 6 },
  dayBar: { width: 20, borderRadius: 4 },
  dayLabel: { fontSize: 10, color: T3, fontWeight: '700' },
  tipsCard: { marginHorizontal: 20, marginTop: 12, backgroundColor: ACCENT + '10', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: ACCENT + '30', flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipsIcon: { fontSize: 28 },
  tipsTitle: { fontSize: 13, fontWeight: '800', color: ACCENT, marginBottom: 4 },
  tipsText: { fontSize: 12, color: T2, lineHeight: 18 },
});