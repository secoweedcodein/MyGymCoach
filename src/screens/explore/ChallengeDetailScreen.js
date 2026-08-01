// src/screens/explore/ChallengeDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Dimensions, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import BottomTabBar from '../../../components/BottomTabBar';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';
const ORANGE = '#FF6B3E';
const PURPLE = '#8B7CFF';
const CYAN = '#3EE5FF';

const { width } = Dimensions.get('window');

const CHALLENGE_DATA = {
  name: 'Reto: Hipertrofia 30 días',
  exercises: [
    // DÍA A - UPPER FUERZA
    { day: 'DÍA A', type: 'Upper Fuerza', name: 'Press banca', detail: '4 × 6-8 repeticiones' },
    { day: 'DÍA A', type: 'Upper Fuerza', name: 'Remo con barra', detail: '4 × 6-8 repeticiones' },
    { day: 'DÍA A', type: 'Upper Fuerza', name: 'Press militar', detail: '3 × 8-10 repeticiones' },
    { day: 'DÍA A', type: 'Upper Fuerza', name: 'Dominadas lastradas', detail: '3 × 6-8 repeticiones' },
    { day: 'DÍA A', type: 'Upper Fuerza', name: 'Curl bíceps', detail: '3 × 10-12 repeticiones' },
    { day: 'DÍA A', type: 'Upper Fuerza', name: 'Extensión tríceps', detail: '3 × 10-12 repeticiones' },
    
    // DÍA B - LOWER FUERZA
    { day: 'DÍA B', type: 'Lower Fuerza', name: 'Sentadilla trasera', detail: '4 × 6-8 repeticiones' },
    { day: 'DÍA B', type: 'Lower Fuerza', name: 'Peso muerto rumano', detail: '4 × 6-8 repeticiones' },
    { day: 'DÍA B', type: 'Lower Fuerza', name: 'Prensa de piernas', detail: '3 × 10-12 repeticiones' },
    { day: 'DÍA B', type: 'Lower Fuerza', name: 'Curl femoral', detail: '3 × 10-12 repeticiones' },
    { day: 'DÍA B', type: 'Lower Fuerza', name: 'Elevación de talones', detail: '4 × 12-15 repeticiones' },
    { day: 'DÍA B', type: 'Lower Fuerza', name: 'Plancha abdominal', detail: '3 × 45 segundos' },
    
    // DÍA C - UPPER HIPERTROFIA
    { day: 'DÍA C', type: 'Upper Hipertrofia', name: 'Press inclinado mancuernas', detail: '4 × 10-12 repeticiones' },
    { day: 'DÍA C', type: 'Upper Hipertrofia', name: 'Jalón al pecho', detail: '4 × 10-12 repeticiones' },
    { day: 'DÍA C', type: 'Upper Hipertrofia', name: 'Elevaciones laterales', detail: '4 × 12-15 repeticiones' },
    { day: 'DÍA C', type: 'Upper Hipertrofia', name: 'Remo en polea baja', detail: '3 × 12-15 repeticiones' },
    { day: 'DÍA C', type: 'Upper Hipertrofia', name: 'Curl martillo', detail: '3 × 12-15 repeticiones' },
    { day: 'DÍA C', type: 'Upper Hipertrofia', name: 'Fondos en paralelas', detail: '3 × 10-12 repeticiones' },
    
    // DÍA D - LOWER HIPERTROFIA
    { day: 'DÍA D', type: 'Lower Hipertrofia', name: 'Sentadilla búlgara', detail: '4 × 10-12 repeticiones' },
    { day: 'DÍA D', type: 'Lower Hipertrofia', name: 'Hip thrust', detail: '4 × 10-12 repeticiones' },
    { day: 'DÍA D', type: 'Lower Hipertrofia', name: 'Extensión cuádriceps', detail: '3 × 12-15 repeticiones' },
    { day: 'DÍA D', type: 'Lower Hipertrofia', name: 'Curl femoral sentado', detail: '3 × 12-15 repeticiones' },
    { day: 'DÍA D', type: 'Lower Hipertrofia', name: 'Gemelo en máquina', detail: '4 × 15-20 repeticiones' },
    { day: 'DÍA D', type: 'Lower Hipertrofia', name: 'Crunch con polea', detail: '3 × 15-20 repeticiones' },
  ],
};

export default function ChallengeDetailScreen() {
  const [saved, setSaved] = useState(false);
  const [routineId, setRoutineId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState('DÍA A');

  useEffect(() => {
    checkIfSaved();
  }, []);

  async function checkIfSaved() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('routines')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', CHALLENGE_DATA.name)
      .maybeSingle();

    if (data) {
      setSaved(true);
      setRoutineId(data.id);
    }
    setLoading(false);
  }

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión');
      return;
    }

    if (saved) {
      if (routineId) {
        const { error } = await supabase.from('routines').delete().eq('id', routineId);
        if (error) {
          Alert.alert('Error', error.message);
        } else {
          setSaved(false);
          setRoutineId(null);
          Alert.alert('Reto eliminado', 'Se eliminó de tus rutinas');
        }
      }
    } else {
      try {
        const { data: newRoutine, error } = await supabase
          .from('routines')
          .insert({
            user_id: user.id,
            name: CHALLENGE_DATA.name,
            is_challenge: true,
            challenge_type: 'hipertrofia',
            challenge_start_date: new Date().toISOString().split('T')[0],
            challenge_duration_days: 30,
            description: 'Plan de 30 días para ganar masa muscular con progresión inteligente.',
            exercise_ids: [],
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          Alert.alert('Error', error.message);
        } else {
          setSaved(true);
          setRoutineId(newRoutine.id);
          Alert.alert('¡Reto guardado!', 'Aparecerá en tu HomeScreen.');
        }
      } catch (err) {
        Alert.alert('Error', err.message);
      }
    }
  }

  async function handleStart() {
    if (!saved || !routineId) {
      Alert.alert('Primero guarda el reto', 'Debes guardar el reto antes de comenzar');
      return;
    }

    // ✅ Filtrar ejercicios del día activo
    const filteredExercises = CHALLENGE_DATA.exercises.filter(ex => ex.day === activeDay);

    const routineForWorkout = {
      id: routineId,
      name: `${CHALLENGE_DATA.name} · ${activeDay}`,
      description: 'Plan de 30 días para ganar masa muscular.',
      is_challenge: true,
      challenge_type: 'hipertrofia',
      day_selected: activeDay,
      exercises: filteredExercises.map(ex => ({
        name: ex.name,
        sets: parseInt(ex.detail.split('×')[0].trim()),
        reps: ex.detail.split('×')[1].trim(),
      })),
    };

    router.push({
      pathname: '/workout',
      params: { routine: JSON.stringify(routineForWorkout) }
    });
  }

  // ✅ Filtrar ejercicios por día activo
  const filteredExercises = CHALLENGE_DATA.exercises.filter(ex => ex.day === activeDay);
  const days = ['DÍA A', 'DÍA B', 'DÍA C', 'DÍA D'];

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroImageWrap}>
          <Image source={require('../../../assets/30diashipertrofia.png')} style={s.heroImage} />
          <View style={s.heroOverlay} />
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
        </View>

        <View style={s.content}>
          <View style={s.tag}>
            <Text style={s.tagText}>RETO 30 DÍAS</Text>
          </View>

          <Text style={s.title}>Hipertrofia Total</Text>
          <Text style={s.subtitle}>
            Plan de 30 días para ganar masa muscular con progresión inteligente.
          </Text>

          <View style={s.statsRow}>
            <StatItem icon="📅" label="Duración" value="30 días" />
            <StatItem icon="🏋️" label="Frecuencia" value="4 días/sem" />
            <StatItem icon="⏱️" label="Sesión" value="60 min" />
          </View>

          <SectionTitle icon="🎯" title="Objetivo del reto" />
          <Text style={s.text}>
            Aumentar tu masa muscular en 30 días mediante sobrecarga progresiva.
            Cada semana subirás el volumen de entrenamiento un 10-15% para forzar
            la adaptación muscular.
          </Text>

          <SectionTitle icon="🏋️" title="La rutina (Upper / Lower)" />
          <Text style={s.text}>
            Usaremos una división Upper/Lower de 4 días. Esto permite entrenar
            cada músculo 2 veces por semana, la frecuencia óptima para hipertrofia.
          </Text>

          {/* ✅ SELECTOR DE DÍAS - NUEVO */}
          <View style={s.daySelectorWrap}>
            <Text style={s.daySelectorTitle}>Selecciona tu día de entrenamiento</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.daySelector}>
              {days.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[s.dayBtn, activeDay === day && s.dayBtnActive]}
                  onPress={() => setActiveDay(day)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.dayBtnText, activeDay === day && s.dayBtnTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Badge del tipo de día */}
            <View style={s.dayTypeBadge}>
              <Text style={s.dayTypeText}>
                {filteredExercises[0]?.type || 'Upper Fuerza'}
              </Text>
            </View>

            {/* ✅ EJERCICIOS DEL DÍA ACTIVO */}
            <View style={s.routineDay}>
              {filteredExercises.map((ex, idx) => (
                <View key={idx} style={s.exerciseRow}>
                  <View style={s.exerciseNumber}>
                    <Text style={s.exerciseNumberText}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.exerciseName}>{ex.name}</Text>
                    <Text style={s.exerciseMeta}>{ex.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <SectionTitle icon="📆" title="Planificación de 30 días" />
          <WeekCard week="SEMANA 1 — Adaptación" days="Lun: A · Mar: B · Mié: Descanso · Jue: C · Vie: D · Sáb-Dom: Descanso" note="Usa pesos moderados. Enfócate en la técnica." />
          <WeekCard week="SEMANA 2 — Carga" days="Lun: A · Mar: B · Mié: Descanso · Jue: C · Vie: D · Sáb-Dom: Descanso" note="Sube un 5-10% el peso en los ejercicios principales." />
          <WeekCard week="SEMANA 3 — Volumen" days="Lun: A · Mar: B · Mié: Descanso · Jue: C · Vie: D · Sáb: A (ligero) · Dom: Descanso" note="Añade 1 serie extra en los 2 primeros ejercicios." />
          <WeekCard week="SEMANA 4 — Descarga" days="Lun: A · Mar: B · Mié: Descanso · Jue: C · Vie: D · Sáb-Dom: Descanso" note="Baja el peso un 20%. Recupera para el siguiente ciclo." />

          <SectionTitle icon="🥗" title="Nutrición para el reto" />
          <Text style={s.text}>Sin superávit calórico no hay hipertrofia. Sigue estas reglas:</Text>
          <TipItem text="Come 300-500 kcal por encima de tu mantenimiento." />
          <TipItem text="Proteína: 2g por kg de peso corporal al día." />
          <TipItem text="Carbohidratos altos los días de entreno." />
          <TipItem text="Duerme mínimo 7-8 horas." />

          {/* BOTONES */}
          {saved ? (
            <TouchableOpacity style={s.startBtn} onPress={handleStart} activeOpacity={0.85}>
              <Ionicons name="play-circle" size={22} color={BG} />
              <Text style={s.startBtnText}>Comenzar {activeDay}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.participateBtn} onPress={handleSave} activeOpacity={0.85} disabled={loading}>
              <Text style={s.participateBtnText}>
                {loading ? 'Verificando...' : 'Participar ahora'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

function StatItem({ icon, label, value }) {
  return (
    <View style={s.statItem}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <View style={s.sectionTitleWrap}>
      <Text style={s.sectionIcon}>{icon}</Text>
      <Text style={s.sectionTitleText}>{title}</Text>
    </View>
  );
}

function WeekCard({ week, days, note }) {
  return (
    <View style={s.weekCard}>
      <Text style={s.weekTitle}>{week}</Text>
      <Text style={s.weekDays}>{days}</Text>
      <View style={s.weekNote}>
        <Ionicons name="information-circle" size={14} color={ACCENT} />
        <Text style={s.weekNoteText}>{note}</Text>
      </View>
    </View>
  );
}

function TipItem({ text }) {
  return (
    <View style={s.tipItem}>
      <View style={s.tipDot} />
      <Text style={s.tipText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  heroImageWrap: { width: '100%', height: 260, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 140, backgroundColor: 'rgba(13,13,13,0.85)' },
  backBtn: { position: 'absolute', top: 56, left: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  tag: { alignSelf: 'flex-start', backgroundColor: ACCENT, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginBottom: 12 },
  tagText: { fontSize: 11, fontWeight: '800', color: BG, letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: '800', color: T1, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, color: T2, lineHeight: 20, marginBottom: 20 },
  statsRow: { flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: BORDER },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statLabel: { fontSize: 10, color: T3, fontWeight: '600', marginBottom: 2 },
  statValue: { fontSize: 13, fontWeight: '700', color: T1 },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12 },
  sectionIcon: { fontSize: 18 },
  sectionTitleText: { fontSize: 18, fontWeight: '800', color: T1, letterSpacing: -0.3 },
  text: { fontSize: 14, color: T2, lineHeight: 22, marginBottom: 16 },
  
  // ✅ NUEVOS ESTILOS - Selector de días
  daySelectorWrap: { marginBottom: 24 },
  daySelectorTitle: { fontSize: 13, color: T2, fontWeight: '600', marginBottom: 12 },
  daySelector: { marginHorizontal: -20, paddingHorizontal: 20, marginBottom: 12 },
  dayBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, marginRight: 10 },
  dayBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  dayBtnText: { fontSize: 13, fontWeight: '700', color: T2 },
  dayBtnTextActive: { color: BG },
  dayTypeBadge: { alignSelf: 'flex-start', backgroundColor: ORANGE + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 12 },
  dayTypeText: { fontSize: 12, fontWeight: '700', color: ORANGE },
  
  routineDay: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  exerciseNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: ACCENT + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  exerciseNumberText: { fontSize: 12, fontWeight: '800', color: ACCENT },
  exerciseName: { fontSize: 14, fontWeight: '700', color: T1, marginBottom: 2 },
  exerciseMeta: { fontSize: 11, color: T3, fontWeight: '500' },
  
  weekCard: { backgroundColor: SURFACE, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 4, borderLeftColor: ACCENT },
  weekTitle: { fontSize: 13, fontWeight: '800', color: T1, marginBottom: 6 },
  weekDays: { fontSize: 12, color: T2, lineHeight: 18, marginBottom: 8 },
  weekNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ACCENT + '10', padding: 8, borderRadius: 8 },
  weekNoteText: { fontSize: 11, color: T2, fontWeight: '500', flex: 1 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT, marginTop: 7 },
  tipText: { flex: 1, fontSize: 13, color: T2, lineHeight: 20 },
  participateBtn: { backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  participateBtnText: { fontSize: 16, fontWeight: '800', color: BG },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 16, marginTop: 28 },
  startBtnText: { fontSize: 16, fontWeight: '800', color: BG },
});