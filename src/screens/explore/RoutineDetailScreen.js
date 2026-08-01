// src/screens/explore/RoutineDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Dimensions, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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

// ─────────────────────────────────────────────────────────────────────────────
// BASE DE DATOS DE RUTINAS (100% basadas en ciencia)
// ─────────────────────────────────────────────────────────────────────────────
const ROUTINES_DATA = {
  funcional: {
    name: 'Fuerza Funcional',
    subtitle: 'Potencia para la vida diaria',
    description: 'Desarrolla fuerza útil con patrones de movimiento fundamentales: squat, hinge, push, pull, carry y anti-rotación. Basado en principios de entrenamiento funcional (Boyle, 2016).',
    image: require('../../../assets/funcional.png'),
    level: 'Principiante',
    duration: '6 semanas',
    frequency: '3 días/sem',
    sessionTime: '45 min',
    objectives: [
      'Mejorar patrones de movimiento básicos',
      'Aumentar estabilidad del core',
      'Desarrollar fuerza aplicable al día a día',
      'Prevenir lesiones con movilidad',
    ],
    phases: [
      { number: '01', title: 'Aprendizaje', week: 'Semanas 1-2', focus: 'Técnica perfecta', color: ACCENT },
      { number: '02', title: 'Progresión', week: 'Semanas 3-4', focus: 'Más carga', color: PURPLE },
      { number: '03', title: 'Consolidación', week: 'Semanas 5-6', focus: 'Fuerza real', color: ORANGE },
    ],
    // ✅ 3 DÍAS - Patrones de movimiento
    days: {
      'DÍA A': {
        type: 'Squat + Push',
        exercises: [
          { name: 'Sentadilla goblet', sets: 4, reps: '10-12', rest: '90s' },
          { name: 'Flexiones', sets: 4, reps: '8-12', rest: '90s' },
          { name: 'Zancadas traseras', sets: 3, reps: '10/pierna', rest: '75s' },
          { name: 'Press Arnold', sets: 3, reps: '10-12', rest: '60s' },
          { name: 'Plancha frontal', sets: 3, reps: '40s', rest: '60s' },
        ]
      },
      'DÍA B': {
        type: 'Hinge + Pull',
        exercises: [
          { name: 'Peso muerto rumano', sets: 4, reps: '10-12', rest: '90s' },
          { name: 'Remo con mancuerna', sets: 4, reps: '10-12/lado', rest: '75s' },
          { name: 'Hip thrust', sets: 3, reps: '12-15', rest: '75s' },
          { name: 'Face pulls', sets: 3, reps: '15', rest: '60s' },
          { name: 'Bird dog', sets: 3, reps: '10/lado', rest: '60s' },
        ]
      },
      'DÍA C': {
        type: 'Full Body + Core',
        exercises: [
          { name: 'Sentadilla búlgara', sets: 3, reps: '10/pierna', rest: '90s' },
          { name: 'Press inclinado mancuernas', sets: 3, reps: '10-12', rest: '75s' },
          { name: 'Jalón al pecho', sets: 3, reps: '10-12', rest: '75s' },
          { name: 'Swing con kettlebell', sets: 3, reps: '15', rest: '60s' },
          { name: 'Pallof press', sets: 3, reps: '12/lado', rest: '60s' },
        ]
      }
    }
  },

  powerbuilding: {
    name: 'Powerbuilding',
    subtitle: 'Fuerza máxima + Hipertrofia',
    description: 'Combina lo mejor del powerlifting (fuerza en los 3 grandes) con el culturismo (volumen para hipertrofia). Basado en el modelo de Chad Wesley Smith y la periodización ondulante.',
    image: require('../../../assets/hiperftrofia.png'),
    level: 'Avanzado',
    duration: '8 semanas',
    frequency: '4 días/sem',
    sessionTime: '90 min',
    objectives: [
      'Aumentar 1RM en squat, bench y deadlift',
      'Ganar masa muscular significativa',
      'Mejorar eficiencia neural',
      'Desarrollar fuerza y estética',
    ],
    phases: [
      { number: '01', title: 'Hipertrofia', week: 'Semanas 1-3', focus: '8-12 reps', color: ACCENT },
      { number: '02', title: 'Fuerza', week: 'Semanas 4-6', focus: '4-6 reps', color: PURPLE },
      { number: '03', title: 'Pico', week: 'Semanas 7-8', focus: '1-3 reps', color: ORANGE },
    ],
    // ✅ 4 DÍAS - Upper/Lower con énfasis fuerza/hipertrofia
    days: {
      'DÍA A': {
        type: 'Upper Fuerza',
        exercises: [
          { name: 'Press banca plano', sets: 5, reps: '3-5', rest: '3min' },
          { name: 'Remo con barra', sets: 4, reps: '5-6', rest: '2-3min' },
          { name: 'Press militar', sets: 4, reps: '5-6', rest: '2min' },
          { name: 'Dominadas lastradas', sets: 4, reps: '5-6', rest: '2min' },
          { name: 'Curl barra Z', sets: 3, reps: '8-10', rest: '90s' },
          { name: 'Press francés', sets: 3, reps: '8-10', rest: '90s' },
        ]
      },
      'DÍA B': {
        type: 'Lower Fuerza',
        exercises: [
          { name: 'Sentadilla trasera', sets: 5, reps: '3-5', rest: '3-4min' },
          { name: 'Peso muerto', sets: 3, reps: '3-5', rest: '3-4min' },
          { name: 'Prensa de piernas', sets: 4, reps: '6-8', rest: '2min' },
          { name: 'Peso muerto rumano', sets: 3, reps: '8-10', rest: '2min' },
          { name: 'Elevación talones', sets: 4, reps: '10-12', rest: '75s' },
          { name: 'Plancha con peso', sets: 3, reps: '45s', rest: '75s' },
        ]
      },
      'DÍA C': {
        type: 'Upper Hipertrofia',
        exercises: [
          { name: 'Press inclinado mancuernas', sets: 4, reps: '8-12', rest: '90s' },
          { name: 'Jalón al pecho', sets: 4, reps: '8-12', rest: '90s' },
          { name: 'Aperturas en polea', sets: 3, reps: '12-15', rest: '75s' },
          { name: 'Remo en polea baja', sets: 3, reps: '10-12', rest: '75s' },
          { name: 'Elevaciones laterales', sets: 4, reps: '15-20', rest: '60s' },
          { name: 'Curl martillo', sets: 3, reps: '12-15', rest: '60s' },
          { name: 'Extensión tríceps polea', sets: 3, reps: '12-15', rest: '60s' },
        ]
      },
      'DÍA D': {
        type: 'Lower Hipertrofia',
        exercises: [
          { name: 'Sentadilla frontal', sets: 4, reps: '8-10', rest: '2min' },
          { name: 'Hip thrust', sets: 4, reps: '10-12', rest: '2min' },
          { name: 'Sentadilla búlgara', sets: 3, reps: '10/pierna', rest: '90s' },
          { name: 'Curl femoral', sets: 3, reps: '12-15', rest: '75s' },
          { name: 'Extensión cuádriceps', sets: 3, reps: '12-15', rest: '75s' },
          { name: 'Gemelo sentado', sets: 4, reps: '15-20', rest: '60s' },
        ]
      }
    }
  },

  upper: {
    name: 'Hipertrofia Upper',
    subtitle: 'Enfoque en torso completo',
    description: 'Rutina de hipertrofia optimizada para torso. Siguiendo las recomendaciones de Mike Israetel (Renaissance Periodization): volumen de 12-20 series semanales por músculo, con énfasis en estímulo mecánico.',
    image: require('../../../assets/upper.png'),
    level: 'Intermedio',
    duration: 'Continuo',
    frequency: '2 veces/sem',
    sessionTime: '60 min',
    objectives: [
      'Maximizar crecimiento de torso',
      'Mejorar proporción pecho/espalda',
      'Desarrollar hombros 3D',
      'Brazos más grandes y definidos',
    ],
    phases: [
      { number: '01', title: 'Acumulación', week: 'Semanas 1-4', focus: 'Alto volumen', color: ACCENT },
      { number: '02', title: 'Intensificación', week: 'Semanas 5-6', focus: 'Más peso', color: PURPLE },
      { number: '03', title: 'Descarga', week: 'Semana 7', focus: 'Deload', color: ORANGE },
    ],
    // ❌ 1 DÍA (se repite 2 veces por semana) - NO necesita selector
    exercises: [
      { name: 'Press banca plano', sets: 4, reps: '6-10', rest: '2-3min' },
      { name: 'Remo con barra', sets: 4, reps: '6-10', rest: '2-3min' },
      { name: 'Press inclinado mancuernas', sets: 3, reps: '8-12', rest: '90s' },
      { name: 'Jalón al pecho', sets: 3, reps: '8-12', rest: '90s' },
      { name: 'Elevaciones laterales', sets: 4, reps: '12-20', rest: '60s' },
      { name: 'Face pulls', sets: 3, reps: '15-20', rest: '60s' },
      { name: 'Curl bíceps barra', sets: 3, reps: '8-12', rest: '75s' },
      { name: 'Extensión tríceps polea', sets: 3, reps: '10-15', rest: '75s' },
    ]
  },

  ppl: {
    name: 'Push Pull Legs',
    subtitle: 'La división clásica',
    description: 'División Push/Pull/Legs basada en evidencia: frecuencia 2x por semana, agrupación por función muscular, y volumen óptimo por sesión (10-12 series). Modelo popularizado por científicos como Dr. Mike Israetel.',
    image: require('../../../assets/PPL.png'),
    level: 'Intermedio',
    duration: 'Continuo',
    frequency: '6 días/sem',
    sessionTime: '70 min',
    objectives: [
      'Máximo volumen por grupo muscular',
      'Recuperación óptima entre sesiones',
      'Simetría muscular perfecta',
      'Frecuencia 2x por semana',
    ],
    phases: [
      { number: '01', title: 'Push', week: 'Día 1 y 4', focus: 'Pecho/Hombro/Tríceps', color: ACCENT },
      { number: '02', title: 'Pull', week: 'Día 2 y 5', focus: 'Espalda/Bíceps', color: PURPLE },
      { number: '03', title: 'Legs', week: 'Día 3 y 6', focus: 'Piernas completas', color: ORANGE },
    ],
    // ✅ 3 DÍAS - Push/Pull/Legs
    days: {
      'PUSH': {
        type: 'Pecho · Hombros · Tríceps',
        exercises: [
          { name: 'Press banca plano', sets: 4, reps: '6-10', rest: '2-3min' },
          { name: 'Press inclinado mancuernas', sets: 3, reps: '8-12', rest: '90s' },
          { name: 'Aperturas en polea', sets: 3, reps: '12-15', rest: '75s' },
          { name: 'Press militar mancuernas', sets: 3, reps: '8-12', rest: '2min' },
          { name: 'Elevaciones laterales', sets: 4, reps: '12-20', rest: '60s' },
          { name: 'Press francés', sets: 3, reps: '10-12', rest: '75s' },
          { name: 'Extensión tríceps overhead', sets: 3, reps: '12-15', rest: '60s' },
        ]
      },
      'PULL': {
        type: 'Espalda · Bíceps · Rear Delt',
        exercises: [
          { name: 'Dominadas', sets: 4, reps: '6-10', rest: '2-3min' },
          { name: 'Remo con barra', sets: 4, reps: '6-10', rest: '2min' },
          { name: 'Jalón al pecho', sets: 3, reps: '10-12', rest: '90s' },
          { name: 'Remo en polea baja', sets: 3, reps: '10-12', rest: '90s' },
          { name: 'Face pulls', sets: 4, reps: '15-20', rest: '60s' },
          { name: 'Curl barra Z', sets: 3, reps: '8-12', rest: '75s' },
          { name: 'Curl martillo', sets: 3, reps: '10-12', rest: '60s' },
        ]
      },
      'LEGS': {
        type: 'Cuádriceps · Isquios · Glúteos',
        exercises: [
          { name: 'Sentadilla trasera', sets: 4, reps: '6-10', rest: '3min' },
          { name: 'Peso muerto rumano', sets: 4, reps: '8-10', rest: '2-3min' },
          { name: 'Prensa de piernas', sets: 3, reps: '10-12', rest: '2min' },
          { name: 'Curl femoral', sets: 3, reps: '12-15', rest: '75s' },
          { name: 'Sentadilla búlgara', sets: 3, reps: '10/pierna', rest: '90s' },
          { name: 'Extensión cuádriceps', sets: 3, reps: '12-15', rest: '60s' },
          { name: 'Gemelo de pie', sets: 4, reps: '12-15', rest: '60s' },
        ]
      }
    }
  },

  fullbody: {
    name: 'Full Body 3 Días',
    subtitle: 'Eficiencia total',
    description: 'Entrena todo el cuerpo 3 veces por semana con énfasis diferentes cada día. Basado en el Starting Strength de Mark Rippetoe y el StrongLifts 5x5, pero con volumen ajustado para hipertrofia óptima.',
    image: require('../../../assets/fullbody.png'),
    level: 'Principiante',
    duration: 'Continuo',
    frequency: '3 días/sem',
    sessionTime: '50 min',
    objectives: [
      'Frecuencia alta por grupo muscular',
      'Aprender los movimientos básicos',
      'Ganar fuerza general',
      'Optimizar tiempo de entreno',
    ],
    phases: [
      { number: '01', title: 'Adaptación', week: 'Semanas 1-2', focus: 'Técnica', color: ACCENT },
      { number: '02', title: 'Progresión', week: 'Semanas 3-6', focus: '+2.5kg/sesión', color: PURPLE },
      { number: '03', title: 'Consolidación', week: 'Semanas 7+', focus: 'Fuerza real', color: ORANGE },
    ],
    // ✅ 3 DÍAS - Full Body con énfasis diferentes
    days: {
      'DÍA A': {
        type: 'Énfasis Squat + Push horizontal',
        exercises: [
          { name: 'Sentadilla trasera', sets: 3, reps: '6-8', rest: '2-3min' },
          { name: 'Press banca plano', sets: 3, reps: '6-8', rest: '2min' },
          { name: 'Remo con barra', sets: 3, reps: '8-10', rest: '2min' },
          { name: 'Sentadilla búlgara', sets: 2, reps: '10/pierna', rest: '90s' },
          { name: 'Curl bíceps', sets: 2, reps: '10-12', rest: '60s' },
        ]
      },
      'DÍA B': {
        type: 'Énfasis Hinge + Pull vertical',
        exercises: [
          { name: 'Peso muerto', sets: 3, reps: '5', rest: '3min' },
          { name: 'Press militar', sets: 3, reps: '6-8', rest: '2min' },
          { name: 'Dominadas', sets: 3, reps: '6-10', rest: '2min' },
          { name: 'Hip thrust', sets: 3, reps: '10-12', rest: '90s' },
          { name: 'Extensión tríceps', sets: 2, reps: '10-12', rest: '60s' },
        ]
      },
      'DÍA C': {
        type: 'Énfasis Squat frontal + Push vertical',
        exercises: [
          { name: 'Sentadilla frontal', sets: 3, reps: '6-8', rest: '2-3min' },
          { name: 'Press inclinado', sets: 3, reps: '6-8', rest: '2min' },
          { name: 'Remo mancuerna', sets: 3, reps: '8-10/lado', rest: '90s' },
          { name: 'Zancadas', sets: 2, reps: '10/pierna', rest: '90s' },
          { name: 'Face pulls', sets: 3, reps: '15', rest: '60s' },
        ]
      }
    }
  },

  '5x5': {
    name: 'Fuerza 5x5',
    subtitle: 'Fuerza pura y simple',
    description: 'El programa de fuerza más efectivo para principiantes e intermedios. Alternas 2 workouts (A y B) 3 veces por semana. Basado en el método StrongLifts de Mehdi Hadim y el Starting Strength de Mark Rippetoe.',
    image: require('../../../assets/5x5.png'),
    level: 'Intermedio',
    duration: '12 semanas',
    frequency: '3 días/sem (A-B-A, B-A-B)',
    sessionTime: '60 min',
    objectives: [
      'Construir fuerza máxima',
      'Dominar los 5 grandes',
      'Progresión lineal constante (+2.5kg)',
      'Base sólida para cualquier deporte',
    ],
    phases: [
      { number: '01', title: 'Workout A', week: 'Lun/Mié/Vie', focus: 'Squat/Bench/Row', color: ACCENT },
      { number: '02', title: 'Workout B', week: 'Alternado', focus: 'Squat/OHP/Deadlift', color: PURPLE },
      { number: '03', title: 'Progresión', week: 'Cada sesión', focus: '+2.5 kg', color: ORANGE },
    ],
    // ✅ 2 DÍAS - Workout A y B (alternados)
    days: {
      'WORKOUT A': {
        type: 'Squat · Bench · Row',
        exercises: [
          { name: 'Sentadilla trasera', sets: 5, reps: '5', rest: '3min' },
          { name: 'Press banca plano', sets: 5, reps: '5', rest: '3min' },
          { name: 'Remo con barra', sets: 5, reps: '5', rest: '2-3min' },
        ]
      },
      'WORKOUT B': {
        type: 'Squat · OHP · Deadlift',
        exercises: [
          { name: 'Sentadilla trasera', sets: 5, reps: '5', rest: '3min' },
          { name: 'Press militar', sets: 5, reps: '5', rest: '3min' },
          { name: 'Peso muerto', sets: 5, reps: '5', rest: '3min' },
        ]
      }
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams();
  const routineData = ROUTINES_DATA[id] || ROUTINES_DATA.upper;
  
  // ✅ Detectar si la rutina tiene selector de días
  const hasDaySelector = !!routineData.days;
  const dayKeys = hasDaySelector ? Object.keys(routineData.days) : [];
  const [activeDay, setActiveDay] = useState(dayKeys[0] || null);
  
  const [saved, setSaved] = useState(false);
  const [routineId, setRoutineId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkIfSaved();
  }, [id]);

  // ✅ Obtener ejercicios del día activo (o los únicos si no hay selector)
  const currentExercises = hasDaySelector 
    ? routineData.days[activeDay].exercises 
    : routineData.exercises;

  async function checkIfSaved() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('routines')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', routineData.name)
      .maybeSingle();

    if (data) {
      setSaved(true);
      setRoutineId(data.id);
    }
    setLoading(false);
  }

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { Alert.alert('Error', 'Debes iniciar sesión'); return; }

    if (saved) {
      if (routineId) {
        const { error } = await supabase.from('routines').delete().eq('id', routineId);
        if (error) Alert.alert('Error', error.message);
        else {
          setSaved(false);
          setRoutineId(null);
          Alert.alert('Rutina eliminada', 'Se eliminó de tus rutinas');
        }
      }
    } else {
      try {
        const { data: newRoutine, error } = await supabase
          .from('routines')
          .insert({
            user_id: user.id,
            name: routineData.name,
            is_challenge: false,
            description: routineData.description,
            exercise_ids: [],
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) Alert.alert('Error', error.message);
        else {
          setSaved(true);
          setRoutineId(newRoutine.id);
          Alert.alert('¡Rutina guardada!', 'Aparecerá en tu HomeScreen.');
        }
      } catch (err) {
        Alert.alert('Error', err.message);
      }
    }
  }

  function handleStart() {
    if (!saved || !routineId) {
      Alert.alert('Primero guarda la rutina', 'Debes guardarla antes de comenzar');
      return;
    }

    const routineForWorkout = {
      id: routineId,
      name: hasDaySelector ? `${routineData.name} · ${activeDay}` : routineData.name,
      description: routineData.description,
      is_challenge: false,
      day_selected: hasDaySelector ? activeDay : null,
      exercises: currentExercises,
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
          <Image source={routineData.image} style={s.heroImage} />
          <View style={s.heroGradient} />
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
          <View style={s.heroBottom}>
            <View style={s.levelBadge}>
              <Ionicons name="barbell" size={12} color={BG} />
              <Text style={s.levelBadgeText}>{routineData.level}</Text>
            </View>
            <Text style={s.heroTitle}>{routineData.name}</Text>
            <Text style={s.heroSubtitle}>{routineData.subtitle}</Text>
          </View>
        </View>

        {/* STATS */}
        <View style={s.statsRow}>
          <StatBox icon="⏱️" label="Sesión" value={routineData.sessionTime} />
          <StatBox icon="📅" label="Frecuencia" value={routineData.frequency} />
          <StatBox icon="🏋️" label="Ejercicios" value={String(currentExercises.length)} />
        </View>

        {/* DESCRIPCIÓN */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Descripción</Text>
          <View style={s.descriptionCard}>
            <Text style={s.descriptionText}>{routineData.description}</Text>
          </View>
        </View>

        {/* OBJETIVOS */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Lo que lograrás</Text>
          <View style={s.objectivesCard}>
            {routineData.objectives.map((obj, idx) => (
              <View key={idx} style={s.objectiveRow}>
                <View style={s.checkmark}>
                  <Ionicons name="checkmark" size={12} color={ACCENT} />
                </View>
                <Text style={s.objectiveText}>{obj}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FASES */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Fases del programa</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.phasesScroll}>
            {routineData.phases.map((phase, idx) => (
              <View key={idx} style={[s.phaseCard, { borderLeftColor: phase.color }]}>
                <Text style={[s.phaseNumber, { color: phase.color }]}>{phase.number}</Text>
                <Text style={s.phaseTitle}>{phase.title}</Text>
                <Text style={s.phaseWeek}>{phase.week}</Text>
                <Text style={s.phaseFocus}>{phase.focus}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ✅ SELECTOR DE DÍAS - Solo si la rutina tiene más de 1 día */}
        {hasDaySelector && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Selecciona tu día</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.daySelector}>
              {dayKeys.map(day => (
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
                {routineData.days[activeDay]?.type || ''}
              </Text>
            </View>
          </View>
        )}

        {/* EJERCICIOS */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            {hasDaySelector ? `Ejercicios de ${activeDay}` : 'Ejercicios principales'}
          </Text>
          <View style={s.exercisesCard}>
            {currentExercises.map((ex, idx) => (
              <View key={idx} style={s.exerciseRow}>
                <Text style={s.exerciseNumber}>{String(idx + 1).padStart(2, '0')}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.exerciseName}>{ex.name}</Text>
                  <Text style={s.exerciseDetail}>
                    {ex.sets} series × {ex.reps} · descanso {ex.rest}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={T3} />
              </View>
            ))}
          </View>
        </View>

        {/* BOTONES */}
        {saved ? (
          <TouchableOpacity style={s.startBtn} onPress={handleStart} activeOpacity={0.85}>
            <Ionicons name="play-circle" size={22} color={BG} />
            <Text style={s.startBtnText}>
              {hasDaySelector ? `Comenzar ${activeDay}` : 'Comenzar rutina'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.actionBtn} onPress={handleSave} activeOpacity={0.85} disabled={loading}>
            <Ionicons name="bookmark-outline" size={24} color={ACCENT} />
            <Text style={s.actionBtnText}>{loading ? 'Verificando...' : 'Guardar en mis rutinas'}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBCOMPONENTES
// ─────────────────────────────────────────────────────────────────────────────
function StatBox({ icon, label, value }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  heroSection: { width: '100%', height: 340, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, backgroundColor: 'rgba(13,13,13,0.95)' },
  backBtn: { position: 'absolute', top: 56, left: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroBottom: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  levelBadge: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12, gap: 6, alignItems: 'center' },
  levelBadgeText: { fontSize: 11, fontWeight: '800', color: BG },
  heroTitle: { fontSize: 32, fontWeight: '800', color: T1, marginBottom: 6, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 16, color: T2, fontWeight: '500' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginTop: 24, marginBottom: 8, gap: 10 },
  statBox: { flex: 1, alignItems: 'center', backgroundColor: SURFACE, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 15, fontWeight: '800', color: T1, marginBottom: 2 },
  statLabel: { fontSize: 10, color: T3, fontWeight: '600' },
  section: { marginTop: 28, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: T1, marginBottom: 12 },
  descriptionCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 4, borderLeftColor: ACCENT },
  descriptionText: { fontSize: 14, color: T2, lineHeight: 22 },
  objectivesCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  objectiveRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  checkmark: { width: 24, height: 24, borderRadius: 12, backgroundColor: ACCENT + '20', alignItems: 'center', justifyContent: 'center' },
  objectiveText: { flex: 1, fontSize: 13, color: T2, fontWeight: '500' },
  phasesScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  phaseCard: { width: 150, backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginRight: 12, borderLeftWidth: 4, borderWidth: 1, borderColor: BORDER },
  phaseNumber: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  phaseTitle: { fontSize: 15, fontWeight: '800', color: T1, marginBottom: 4 },
  phaseWeek: { fontSize: 11, color: T3, marginBottom: 6 },
  phaseFocus: { fontSize: 12, color: T2, fontWeight: '600' },
  
  // ✅ SELECTOR DE DÍAS
  daySelector: { marginHorizontal: -20, paddingHorizontal: 20, marginBottom: 12 },
  dayBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, marginRight: 10 },
  dayBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  dayBtnText: { fontSize: 13, fontWeight: '700', color: T2 },
  dayBtnTextActive: { color: BG },
  dayTypeBadge: { alignSelf: 'flex-start', backgroundColor: ORANGE + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 12 },
  dayTypeText: { fontSize: 12, fontWeight: '700', color: ORANGE },
  
  exercisesCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 8, borderWidth: 1, borderColor: BORDER },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  exerciseNumber: { fontSize: 22, fontWeight: '800', color: ACCENT + '40', marginRight: 16, width: 30 },
  exerciseName: { fontSize: 14, fontWeight: '700', color: T1, marginBottom: 2 },
  exerciseDetail: { fontSize: 11, color: T3 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: SURFACE, borderWidth: 2, borderColor: ACCENT, borderRadius: 16, paddingVertical: 18, marginHorizontal: 20, marginTop: 28 },
  actionBtnText: { fontSize: 16, fontWeight: '800', color: ACCENT },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 18, marginHorizontal: 20, marginTop: 28 },
  startBtnText: { fontSize: 16, fontWeight: '800', color: BG },
});