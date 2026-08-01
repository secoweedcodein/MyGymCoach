// src/screens/explore/AbsChallengeScreen.js
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

const { width } = Dimensions.get('window');

const CHALLENGE_DATA = {
  name: 'Reto: 30 días Abs',
  title: '30 días Abs',
  subtitle: 'Core de acero en un mes',
  description: 'Transforma tu core con este programa progresivo de 30 días. Combina ejercicios de fuerza, resistencia y estabilidad para construir un abdomen definido y funcional.',
  image: require('../../../assets/wmremove-transformed.png'),
  exercises: [
    { name: 'Plancha frontal', detail: '3 × 45 segundos' },
    { name: 'Crunch inverso', detail: '4 × 15 repeticiones' },
    { name: 'Russian twist', detail: '3 × 20 repeticiones' },
    { name: 'Mountain climbers', detail: '4 × 30 segundos' },
    { name: 'Plancha lateral', detail: '3 × 30s/lado' },
    { name: 'Bicycle crunch', detail: '3 × 20 repeticiones' },
  ],
};

export default function AbsChallengeScreen() {
  const [saved, setSaved] = useState(false);
  const [routineId, setRoutineId] = useState(null);
  const [loading, setLoading] = useState(true);

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
            challenge_type: 'abs',
            challenge_start_date: new Date().toISOString().split('T')[0],
            challenge_duration_days: 30,
            description: CHALLENGE_DATA.description,
            exercise_ids: [18, 126, 95, 96, 114, 127], 
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

  // ✅ ESTA ES LA FUNCIÓN CORRECTA QUE NO TOCA SUPABASE AL COMENZAR
  function handleStart() {
    if (!saved || !routineId) {
      Alert.alert('Primero guarda el reto', 'Debes guardar el reto antes de comenzar');
      return;
    }

    const routineForWorkout = {
      id: routineId,
      name: 'Reto: 30 días Abs',
      description: 'Core de acero en 30 días. Combina fuerza, resistencia y estabilidad.',
      is_challenge: true,
      challenge_type: 'abs',
      exercises: [
        { name: 'Plancha frontal', sets: 3, reps: '45s' },
        { name: 'Crunch inverso', sets: 4, reps: '15' },
        { name: 'Russian twist', sets: 3, reps: '20' },
        { name: 'Mountain climbers', sets: 4, reps: '30s' },
        { name: 'Plancha lateral', sets: 3, reps: '30s/lado' },
        { name: 'Bicycle crunch', sets: 3, reps: '20' },
      ],
    };

    router.push({
      pathname: '/workout',
      params: { routine: JSON.stringify(routineForWorkout) }
    });
  }

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
          <StatCircle icon="⏱️" value="15" unit="min" label="Por sesión" />
          <StatCircle icon="🔥" value="350" unit="kcal" label="Quemadas" />
          <StatCircle icon="📅" value="30" unit="días" label="Duración" />
          <StatCircle icon="⭐" value="4.8" unit="/5" label="Rating" />
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
            <ObjectiveItem text="Aumentar fuerza del core en un 40%" />
            <ObjectiveItem text="Mejorar estabilidad lumbar" />
            <ObjectiveItem text="Definición abdominal visible" />
            <ObjectiveItem text="Mejorar postura general" />
          </View>
        </View>

        {/* FASES */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Las 4 fases</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.phasesScroll}>
            <PhaseCard number="01" title="Activación" week="Semana 1" focus="Técnica y control" color={ACCENT} />
            <PhaseCard number="02" title="Resistencia" week="Semana 2" focus="Más repeticiones" color={PURPLE} />
            <PhaseCard number="03" title="Fuerza" week="Semana 3" focus="Intensidad máxima" color="#FF6B3E" />
            <PhaseCard number="04" title="Definición" week="Semana 4" focus="Control total" color="#3EE5FF" />
          </ScrollView>
        </View>

        {/* EJERCICIOS */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Ejercicios del reto</Text>
          <View style={s.exercisesCard}>
            {CHALLENGE_DATA.exercises.map((ex, idx) => (
              <ExerciseItem
                key={idx}
                number={String(idx + 1).padStart(2, '0')}
                name={ex.name}
                detail={ex.detail}
              />
            ))}
          </View>
        </View>

        {/* CALENDARIO */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Tu calendario</Text>
          <View style={s.calendarCard}>
            <Text style={s.calendarSubtitle}>30 días de entrenamiento</Text>
            <View style={s.calendarGrid}>
              {Array.from({ length: 30 }, (_, i) => (
                <View key={i} style={[s.calendarDay, (i + 1) % 7 === 0 && s.restDay]}>
                  <Text style={[s.calendarDayText, (i + 1) % 7 === 0 && s.restDayText]}>
                    {i + 1}
                  </Text>
                </View>
              ))}
            </View>
            <View style={s.calendarLegend}>
              <View style={s.legendItem}>
                <View style={s.legendDot} />
                <Text style={s.legendText}>Día de entreno</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, s.legendDotRest]} />
                <Text style={s.legendText}>Descanso</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ✅ BOTONES DE ACCIÓN CORREGIDOS */}
        {saved ? (
          // Si ya está guardado, usa handleStart (sin tocar Supabase)
          <TouchableOpacity
            style={s.startBtn}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <Ionicons name="play-circle" size={22} color={BG} />
            <Text style={s.startBtnText}>Comenzar reto</Text>
          </TouchableOpacity>
        ) : (
          // Si no está guardado, usa handleSave
          <TouchableOpacity
            style={s.actionBtn}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={loading}
          >
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

// Sub-componentes
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
  exercisesCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 8 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  exerciseNumber: { fontSize: 24, fontWeight: '800', color: ACCENT + '40', marginRight: 16, width: 30 },
  exerciseName: { fontSize: 14, fontWeight: '700', color: T1, marginBottom: 2 },
  exerciseDetail: { fontSize: 11, color: T3 },
  calendarCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16 },
  calendarSubtitle: { fontSize: 12, color: T3, marginBottom: 12, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  calendarDay: { width: 36, height: 36, borderRadius: 10, backgroundColor: ACCENT + '20', alignItems: 'center', justifyContent: 'center' },
  calendarDayText: { fontSize: 12, fontWeight: '700', color: ACCENT },
  restDay: { backgroundColor: SURFACE2 },
  restDayText: { color: T3 },
  calendarLegend: { flexDirection: 'row', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT },
  legendDotRest: { backgroundColor: SURFACE2 },
  legendText: { fontSize: 11, color: T3 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: SURFACE, borderWidth: 2, borderColor: ACCENT, borderRadius: 16, paddingVertical: 18, marginHorizontal: 20, marginTop: 28 },
  actionBtnText: { fontSize: 16, fontWeight: '800', color: ACCENT },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 18, marginHorizontal: 20, marginTop: 28 },
  startBtnText: { fontSize: 16, fontWeight: '800', color: BG },
});