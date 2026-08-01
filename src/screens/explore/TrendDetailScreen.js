// src/screens/explore/TrendDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Dimensions, ActivityIndicator,
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

const { width } = Dimensions.get('window');

// Datos de ejemplo para las tendencias
const TRENDS_DATA = {
  t1: {
    title: 'Reto 30 días Abs',
    subtitle: 'Core de acero en un mes',
    image: require('../../../assets/wmremove-transformed.png'),
    level: 'Intermedio',
    duration: '30 días',
    calories: 350,
    rating: 4.8,
    users: '12.3k',
    description: 'Transforma tu core con este programa progresivo de 30 días. Combina ejercicios de fuerza, resistencia y estabilidad para construir un abdomen definido y funcional.',
    objectives: [
      'Aumentar fuerza del core en un 40%',
      'Mejorar estabilidad lumbar',
      'Definición abdominal visible',
      'Mejorar postura general',
    ],
    weeklyPlan: [
      { week: 'Semana 1', focus: 'Activación y técnica', sessions: 4 },
      { week: 'Semana 2', focus: 'Resistencia muscular', sessions: 5 },
      { week: 'Semana 3', focus: 'Fuerza e intensidad', sessions: 5 },
      { week: 'Semana 4', focus: 'Definición y control', sessions: 6 },
    ],
    exercises: [
      { name: 'Plancha frontal', sets: '3', time: '45s' },
      { name: 'Crunch inverso', sets: '4', reps: '15' },
      { name: 'Russian twist', sets: '3', reps: '20' },
      { name: 'Mountain climbers', sets: '4', time: '30s' },
      { name: 'Plancha lateral', sets: '3', time: '30s/lado' },
    ],
  },
  t2: {
    title: 'Hipertrofia Avanzada',
    subtitle: 'Máximo crecimiento muscular',
    image: require('../../../assets/hiperftrofia.png'),
    level: 'Avanzado',
    duration: '8 semanas',
    calories: 450,
    rating: 8.1,
    users: '12.3k',
    description: 'Programa de hipertrofia de alta intensidad para atletas experimentados. Usa técnicas avanzadas como drop sets, rest-pause y tempo training para maximizar el crecimiento muscular.',
    objectives: [
      'Ganar 2-3 kg de masa muscular',
      'Aumentar fuerza en compuestos',
      'Mejorar simetría muscular',
      'Dominar técnicas avanzadas',
    ],
    weeklyPlan: [
      { week: 'Semanas 1-2', focus: 'Volumen alto', sessions: 5 },
      { week: 'Semanas 3-4', focus: 'Intensidad', sessions: 5 },
      { week: 'Semanas 5-6', focus: 'Sobrecarga progresiva', sessions: 6 },
      { week: 'Semanas 7-8', focus: 'Pico y descarga', sessions: 4 },
    ],
    exercises: [
      { name: 'Press banca inclinado', sets: '5', reps: '8-10' },
      { name: 'Sentadilla frontal', sets: '5', reps: '8-10' },
      { name: 'Peso muerto sumo', sets: '4', reps: '6-8' },
      { name: 'Dominadas lastradas', sets: '4', reps: '8-10' },
      { name: 'Press militar', sets: '4', reps: '10-12' },
    ],
  },
  t3: {
    title: 'Fuerza Funcional',
    subtitle: 'Potencia para la vida diaria',
    image: require('../../../assets/funcional.png'),
    level: 'Principiante',
    duration: '6 semanas',
    calories: 300,
    rating: 4.6,
    users: '5.4k',
    description: 'Desarrolla fuerza útil para el día a día con ejercicios compuestos y movimientos funcionales. Ideal para principiantes que quieren una base sólida.',
    objectives: [
      'Construir base de fuerza',
      'Mejorar movilidad articular',
      'Aprender técnica correcta',
      'Aumentar resistencia general',
    ],
    weeklyPlan: [
      { week: 'Semanas 1-2', focus: 'Aprendizaje motor', sessions: 3 },
      { week: 'Semanas 3-4', focus: 'Progresión de carga', sessions: 4 },
      { week: 'Semanas 5-6', focus: 'Consolidación', sessions: 4 },
    ],
    exercises: [
      { name: 'Sentadilla goblet', sets: '4', reps: '10-12' },
      { name: 'Flexiones', sets: '4', reps: '12-15' },
      { name: 'Remo con mancuerna', sets: '4', reps: '10-12' },
      { name: 'Zancadas', sets: '3', reps: '12/pierna' },
      { name: 'Plancha', sets: '3', time: '30-45s' },
    ],
  },
};

export default function TrendDetailScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const trend = TRENDS_DATA[id] || TRENDS_DATA.t1;

  useEffect(() => {
    // Verificar si ya está guardada
    checkIfSaved();
    setTimeout(() => setLoading(false), 500);
  }, []);

  async function checkIfSaved() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('routines')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', `Tendencia: ${trend.title}`)
      .maybeSingle();

    if (data) setSaved(true);
  }

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Debes iniciar sesión');
      return;
    }

    if (saved) {
      // Eliminar
      const { data: existing } = await supabase
        .from('routines')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', `Tendencia: ${trend.title}`)
        .maybeSingle();

      if (existing) {
        await supabase.from('routines').delete().eq('id', existing.id);
        setSaved(false);
      }
    } else {
      // Guardar
      const { error } = await supabase.from('routines').insert({
        user_id: user.id,
        name: `Tendencia: ${trend.title}`,
        is_trending: true,
        trend_id: id,
        description: trend.description,
        exercise_ids: [],
        created_at: new Date().toISOString(),
      });

      if (error) {
        alert('Error: ' + error.message);
      } else {
        setSaved(true);
        alert('¡Rutina guardada! Aparecerá en tu HomeScreen.');
      }
    }
  }

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header con imagen */}
        <View style={s.heroSection}>
          <Image source={trend.image} style={s.heroImage} />
          <View style={s.heroOverlay} />
          
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>

          <View style={s.heroContent}>
            <View style={s.levelBadge}>
              <Text style={s.levelBadgeText}>{trend.level}</Text>
            </View>
            <Text style={s.heroTitle}>{trend.title}</Text>
            <Text style={s.heroSubtitle}>{trend.subtitle}</Text>
          </View>
        </View>

        {/* Stats horizontales */}
        <View style={s.statsContainer}>
          <StatBox icon="⏱️" label="Duración" value={trend.duration} />
          <StatBox icon="🔥" label="Calorías" value={`${trend.calories}`} />
          <StatBox icon="⭐" label="Rating" value={trend.rating} />
          <StatBox icon="" label="Usuarios" value={trend.users} />
        </View>

        {/* Descripción */}
        <SectionHeader icon="" title="Descripción" />
        <View style={s.card}>
          <Text style={s.descriptionText}>{trend.description}</Text>
        </View>

        {/* Objetivos */}
        <SectionHeader icon="🎯" title="Objetivos" />
        <View style={s.card}>
          {trend.objectives.map((obj, idx) => (
            <View key={idx} style={s.objectiveRow}>
              <View style={s.objectiveDot} />
              <Text style={s.objectiveText}>{obj}</Text>
            </View>
          ))}
        </View>

        {/* Plan semanal */}
        <SectionHeader icon="📆" title="Plan de entrenamiento" />
        <View style={s.card}>
          {trend.weeklyPlan.map((week, idx) => (
            <View key={idx} style={s.weekRow}>
              <View style={s.weekNumber}>
                <Text style={s.weekNumberText}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.weekTitle}>{week.week}</Text>
                <Text style={s.weekFocus}>{week.focus}</Text>
              </View>
              <View style={s.weekSessions}>
                <Text style={s.weekSessionsText}>{week.sessions}x</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Ejercicios principales */}
        <SectionHeader icon="🏋️" title="Ejercicios clave" />
        <View style={s.card}>
          {trend.exercises.map((ex, idx) => (
            <View key={idx} style={s.exerciseRow}>
              <View style={s.exerciseNumber}>
                <Text style={s.exerciseNumberText}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.exerciseName}>{ex.name}</Text>
                <Text style={s.exerciseMeta}>
                  {ex.sets} series × {ex.reps || ex.time}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Botones de acción */}
        <View style={s.actionButtons}>
          <TouchableOpacity
            style={[s.actionBtn, s.saveBtn, saved && s.savedBtn]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Ionicons 
              name={saved ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color={saved ? BG : ACCENT} 
            />
            <Text style={[s.actionBtnText, saved && s.savedBtnText]}>
              {saved ? 'Guardada' : 'Guardar rutina'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
  style={s.actionBtn}
  onPress={() => {
    // Crear un objeto de rutina falso para pasarlo a la pantalla de workout
    const fakeRoutine = {
      id: 'abs-challenge',
      name: 'Reto: 30 días Abs',
      description: 'Core de acero en 30 días.',
      exercise_ids: [], // Aquí irían los IDs reales cuando los conectemos a Supabase
    };

    // Navegar a la pantalla de entrenamiento
    router.push({
      pathname: '/workout',
      params: { routine: JSON.stringify(fakeRoutine) }
    });
  }}
  activeOpacity={0.85}
>
  <Ionicons name="play-circle" size={20} color={BG} />
  <Text style={s.actionBtnText}>Comenzar</Text>
</TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomTabBar />
    </View>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionIcon}>{icon}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loadingContainer: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },

  heroSection: { width: '100%', height: 320, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(13,13,13,0.9)',
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  levelBadgeText: { fontSize: 11, fontWeight: '800', color: BG },
  heroTitle: { fontSize: 32, fontWeight: '800', color: T1, marginBottom: 6, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 16, color: T2, fontWeight: '500' },

  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: T1, marginBottom: 2 },
  statLabel: { fontSize: 9, color: T3, fontWeight: '600' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: T1 },

  card: {
    marginHorizontal: 20,
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },

  descriptionText: {
    fontSize: 14,
    color: T2,
    lineHeight: 22,
  },

  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  objectiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT,
    marginTop: 7,
  },
  objectiveText: {
    flex: 1,
    fontSize: 13,
    color: T2,
    lineHeight: 20,
  },

  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  weekNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ACCENT + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  weekNumberText: { fontSize: 12, fontWeight: '800', color: ACCENT },
  weekTitle: { fontSize: 13, fontWeight: '700', color: T1, marginBottom: 2 },
  weekFocus: { fontSize: 11, color: T3 },
  weekSessions: {
    backgroundColor: SURFACE2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  weekSessionsText: { fontSize: 11, fontWeight: '700', color: ACCENT },

  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  exerciseNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ACCENT + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseNumberText: { fontSize: 12, fontWeight: '800', color: ACCENT },
  exerciseName: { fontSize: 14, fontWeight: '700', color: T1, marginBottom: 2 },
  exerciseMeta: { fontSize: 11, color: T3 },

  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 28,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 14,
  },
  saveBtn: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  savedBtn: {
    backgroundColor: ACCENT,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: BG,
  },
  savedBtnText: {
    color: BG,
  },
});