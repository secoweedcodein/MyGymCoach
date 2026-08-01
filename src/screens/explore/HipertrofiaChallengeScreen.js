// src/screens/explore/HipertrofiaChallengeScreen.js
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
const PURPLE = '#8B7CFF';
const ORANGE = '#FF6B3E';
const CYAN = '#3EE5FF';

const { width } = Dimensions.get('window');

// ⚠️ NOMBRE ÚNICO - Diferente al reto del HeroCard
const CHALLENGE_DATA = {
  name: 'Reto: Hipertrofia Avanzada',
  title: 'Hipertrofia Avanzada',
  subtitle: 'Técnicas de intensidad',
  description: 'Programa con técnicas avanzadas: drop sets, rest-pause, tempo training. División Push/Pull/Legs/Full Body para atletas experimentados.',
  image: require('../../../assets/hiperftrofia.png'),
  exercises: [
    // DÍA A - PUSH (Pecho, Hombros, Tríceps)
    { day: 'DÍA A', type: 'Push', name: 'Press banca con drop set', detail: '3 × 8-6-4 repeticiones' },
    { day: 'DÍA A', type: 'Push', name: 'Press inclinado rest-pause', detail: '3 × 10 + fallo' },
    { day: 'DÍA A', type: 'Push', name: 'Aperturas con mancuernas', detail: '4 × 12-15 repeticiones' },
    { day: 'DÍA A', type: 'Push', name: 'Elevaciones laterales mecánicas', detail: '3 × 15-10-8' },
    { day: 'DÍA A', type: 'Push', name: 'Fondos lastrados', detail: '3 × 8-10 repeticiones' },
    { day: 'DÍA A', type: 'Push', name: 'Extensiones tríceps overhead', detail: '4 × 12-15 repeticiones' },
    
    // DÍA B - PULL (Espalda, Bíceps)
    { day: 'DÍA B', type: 'Pull', name: 'Dominadas lastradas', detail: '4 × 6-8 repeticiones' },
    { day: 'DÍA B', type: 'Pull', name: 'Remo Pendlay', detail: '4 × 6-8 repeticiones' },
    { day: 'DÍA B', type: 'Pull', name: 'Jalón agarre cerrado', detail: '3 × 10-12 repeticiones' },
    { day: 'DÍA B', type: 'Pull', name: 'Face pulls', detail: '4 × 15-20 repeticiones' },
    { day: 'DÍA B', type: 'Pull', name: 'Curl barra Z (21s)', detail: '3 × 21 repeticiones' },
    { day: 'DÍA B', type: 'Pull', name: 'Curl martillo', detail: '3 × 12-15 repeticiones' },
    
    // DÍA C - LEGS (Piernas)
    { day: 'DÍA C', type: 'Legs', name: 'Sentadilla pausa 3s', detail: '4 × 6-8 repeticiones' },
    { day: 'DÍA C', type: 'Legs', name: 'Peso muerto sumo', detail: '4 × 8-10 repeticiones' },
    { day: 'DÍA C', type: 'Legs', name: 'Prensa pies altos (drop set)', detail: '3 × 12-8-6' },
    { day: 'DÍA C', type: 'Legs', name: 'Zancadas caminando', detail: '3 × 20 pasos' },
    { day: 'DÍA C', type: 'Legs', name: 'Hip thrust pesado', detail: '4 × 10-12 repeticiones' },
    { day: 'DÍA C', type: 'Legs', name: 'Gemelo sentado', detail: '4 × 15-20 repeticiones' },
    
    // DÍA D - FULL BODY INTENSIDAD
    { day: 'DÍA D', type: 'Full Body', name: 'Push press', detail: '4 × 6-8 repeticiones' },
    { day: 'DÍA D', type: 'Full Body', name: 'Peso muerto rumano', detail: '4 × 8-10 repeticiones' },
    { day: 'DÍA D', type: 'Full Body', name: 'Press Arnold', detail: '3 × 10-12 repeticiones' },
    { day: 'DÍA D', type: 'Full Body', name: 'Remo mancuerna', detail: '3 × 10-12 repeticiones' },
    { day: 'DÍA D', type: 'Full Body', name: 'Curl concentrado', detail: '3 × 12-15 repeticiones' },
    { day: 'DÍA D', type: 'Full Body', name: 'Extensión tríceps francés', detail: '3 × 12-15 repeticiones' },
  ],
};

export default function HipertrofiaChallengeScreen() {
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

    // ⚠️ Busca SOLO por este nombre único
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
            name: CHALLENGE_DATA.name, // ⚠️ Nombre único
            is_challenge: true,
            challenge_type: 'hipertrofia_avanzada', // ⚠️ Tipo diferente
            challenge_start_date: new Date().toISOString().split('T')[0],
            challenge_duration_days: 30,
            description: CHALLENGE_DATA.description,
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

    const filteredExercises = CHALLENGE_DATA.exercises.filter(ex => ex.day === activeDay);

    const routineForWorkout = {
      id: routineId,
      name: CHALLENGE_DATA.name,
      description: CHALLENGE_DATA.description,
      is_challenge: true,
      challenge_type: 'hipertrofia_avanzada',
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

  const filteredExercises = CHALLENGE_DATA.exercises.filter(ex => ex.day === activeDay);
  const days = ['DÍA A', 'DÍA B', 'DÍA C', 'DÍA D'];

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={s.heroSection}>
          <Image source={CHALLENGE_DATA.image} style={s.heroImage} />
          <View style={s.heroGradient} />
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
          <View style={s.heroBottom}>
            <View style={s.heroBadge}>
              <Ionicons name="flame" size={14} color={BG} />
              <Text style={s.heroBadgeText}>TRENDING</Text>
            </View>
            <Text style={s.heroTitle}>{CHALLENGE_DATA.title}</Text>
            <Text style={s.heroSubtitle}>{CHALLENGE_DATA.subtitle}</Text>
          </View>
        </View>

        {/* STATS */}
        <View style={s.statsRow}>
          <StatCircle icon="⏱️" value="75" unit="min" label="Por sesión" />
          <StatCircle icon="🔥" value="550" unit="kcal" label="Quemadas" />
          <StatCircle icon="📅" value="30" unit="días" label="Duración" />
          <StatCircle icon="⭐" value="4.9" unit="/5" label="Rating" />
        </View>

        {/* DESCRIPCIÓN */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Sobre el reto</Text>
          <View style={s.descriptionCard}>
            <Text style={s.descriptionText}>{CHALLENGE_DATA.description}</Text>
          </View>
        </View>

        {/* OBJETIVOS */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Lo que lograrás</Text>
          <View style={s.objectivesCard}>
            <ObjectiveItem text="Dominar técnicas avanzadas de intensidad" />
            <ObjectiveItem text="Romper estancamientos de fuerza" />
            <ObjectiveItem text="Máxima hipertrofia metabólica" />
            <ObjectiveItem text="Mejorar conexión mente-músculo" />
          </View>
        </View>

        {/* FASES */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Las 4 fases</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.phasesScroll}>
            <PhaseCard number="01" title="Push" week="Día A" focus="Pecho y hombros" color={ACCENT} />
            <PhaseCard number="02" title="Pull" week="Día B" focus="Espalda y bíceps" color={PURPLE} />
            <PhaseCard number="03" title="Legs" week="Día C" focus="Piernas completas" color={ORANGE} />
            <PhaseCard number="04" title="Full Body" week="Día D" focus="Intensidad total" color={CYAN} />
          </ScrollView>
        </View>

        {/* SELECTOR DE DÍAS */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Ejercicios del reto</Text>
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

          <View style={s.dayTypeBadge}>
            <Text style={s.dayTypeText}>
              {filteredExercises[0]?.type || 'Push'}
            </Text>
          </View>

          <View style={s.exercisesCard}>
            {filteredExercises.map((ex, idx) => (
              <ExerciseItem
                key={idx}
                number={String(idx + 1).padStart(2, '0')}
                name={ex.name}
                detail={ex.detail}
              />
            ))}
          </View>
        </View>

        {/* BOTONES */}
        {saved ? (
          <TouchableOpacity style={s.startBtn} onPress={handleStart} activeOpacity={0.85}>
            <Ionicons name="play-circle" size={22} color={BG} />
            <Text style={s.startBtnText}>Comenzar reto</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.actionBtn} onPress={handleSave} activeOpacity={0.85} disabled={loading}>
            <Ionicons name="bookmark-outline" size={24} color={ACCENT} />
            <Text style={s.actionBtnText}>
              {loading ? 'Verificando...' : 'Guardar en mis rutinas'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

function StatCircle({ icon, value, unit, label }) {
  return (
    <View style={s.statCircle}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statUnit}>{unit}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function ObjectiveItem({ text }) {
  return (
    <View style={s.objectiveRow}>
      <View style={s.checkmark}>
        <Ionicons name="checkmark" size={12} color={ACCENT} />
      </View>
      <Text style={s.objectiveText}>{text}</Text>
    </View>
  );
}

function PhaseCard({ number, title, week, focus, color }) {
  return (
    <View style={[s.phaseCard, { borderLeftColor: color }]}>
      <Text style={[s.phaseNumber, { color }]}>{number}</Text>
      <Text style={s.phaseTitle}>{title}</Text>
      <Text style={s.phaseWeek}>{week}</Text>
      <Text style={s.phaseFocus}>{focus}</Text>
    </View>
  );
}

function ExerciseItem({ number, name, detail }) {
  return (
    <View style={s.exerciseRow}>
      <Text style={s.exerciseNumber}>{number}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.exerciseName}>{name}</Text>
        <Text style={s.exerciseDetail}>{detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={T3} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  heroSection: { width: '100%', height: 380, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 250, backgroundColor: 'rgba(13,13,13,0.95)' },
  backBtn: { position: 'absolute', top: 56, left: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroBottom: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 12 },
  heroBadgeText: { fontSize: 11, fontWeight: '800', color: BG },
  heroTitle: { fontSize: 36, fontWeight: '800', color: T1, marginBottom: 6 },
  heroSubtitle: { fontSize: 16, color: T2, fontWeight: '500' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginTop: 24, marginBottom: 8 },
  statCircle: { alignItems: 'center', width: 70 },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: T1 },
  statUnit: { fontSize: 10, color: T3, fontWeight: '600' },
  statLabel: { fontSize: 9, color: T3, marginTop: 2, textAlign: 'center' },
  section: { marginTop: 28, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: T1, marginBottom: 12 },
  descriptionCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: ACCENT },
  descriptionText: { fontSize: 14, color: T2, lineHeight: 22 },
  objectivesCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16 },
  objectiveRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  checkmark: { width: 24, height: 24, borderRadius: 12, backgroundColor: ACCENT + '20', alignItems: 'center', justifyContent: 'center' },
  objectiveText: { flex: 1, fontSize: 13, color: T2, fontWeight: '500' },
  phasesScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  phaseCard: { width: 160, backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginRight: 12, borderLeftWidth: 4 },
  phaseNumber: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  phaseTitle: { fontSize: 16, fontWeight: '800', color: T1, marginBottom: 4 },
  phaseWeek: { fontSize: 11, color: T3, marginBottom: 6 },
  phaseFocus: { fontSize: 12, color: T2, fontWeight: '600' },
  daySelector: { marginHorizontal: -20, paddingHorizontal: 20, marginBottom: 12 },
  dayBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, marginRight: 10 },
  dayBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  dayBtnText: { fontSize: 13, fontWeight: '700', color: T2 },
  dayBtnTextActive: { color: BG },
  dayTypeBadge: { alignSelf: 'flex-start', backgroundColor: ORANGE + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 12 },
  dayTypeText: { fontSize: 12, fontWeight: '700', color: ORANGE },
  exercisesCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 8 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  exerciseNumber: { fontSize: 24, fontWeight: '800', color: ACCENT + '40', marginRight: 16, width: 30 },
  exerciseName: { fontSize: 14, fontWeight: '700', color: T1, marginBottom: 2 },
  exerciseDetail: { fontSize: 11, color: T3 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: SURFACE, borderWidth: 2, borderColor: ACCENT, borderRadius: 16, paddingVertical: 18, marginHorizontal: 20, marginTop: 28 },
  actionBtnText: { fontSize: 16, fontWeight: '800', color: ACCENT },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 18, marginHorizontal: 20, marginTop: 28 },
  startBtnText: { fontSize: 16, fontWeight: '800', color: BG },
});