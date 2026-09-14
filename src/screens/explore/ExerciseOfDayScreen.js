// src/screens/explore/ExerciseOfDayScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
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

const EXERCISE_IMAGES = {
  dominadas: require('../../../assets/dominadas.png'),
  abs: require('../../../assets/wmremove-transformed.png'),
  hipertrofia: require('../../../assets/hiperftrofia.png'),
  funcional: require('../../../assets/funcional.png'),
  upper: require('../../../assets/upper.png'),
  fullbody: require('../../../assets/fullbody.png'),
};

function resolveImage(ex) {
  if (ex.image_url && typeof ex.image_url === 'string' && ex.image_url.startsWith('http')) {
    return { uri: ex.image_url };
  }
  return EXERCISE_IMAGES[ex.image_id] || EXERCISE_IMAGES.dominadas;
}

export default function ExerciseOfDayScreen() {
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadExercise = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('featured_content')
        .select('id, title, subtitle, image_id, image_url, target_id')
        .eq('id', 'ejercicio_dia')
        .maybeSingle();
      if (error) throw error;
      setExercise(data || null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExercise();
    }, [loadExercise])
  );

  function handleStart() {
    if (!exercise) return;
    const routineForWorkout = {
      id: 'ejercicio-del-dia',
      name: `Ejercicio del día: ${exercise.title}`,
      description: exercise.subtitle || 'Ejercicio destacado de hoy',
      exercises: [{ name: exercise.title, sets: 3, reps: '10' }],
    };
    router.push({ pathname: '/workout', params: { routine: JSON.stringify(routineForWorkout) } });
  }

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
          <Text style={s.title}>Ejercicio del Día</Text>
          <View style={{ width: 44 }} />
        </View>

        {loading ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
        ) : error || !exercise ? (
          <View style={s.centerBox}>
            <Ionicons name="cloud-offline-outline" size={40} color={T3} />
            <Text style={s.emptyText}>No se pudo cargar el ejercicio del día</Text>
            <TouchableOpacity style={s.retryBtn} onPress={loadExercise} activeOpacity={0.8}>
              <Text style={s.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Image source={resolveImage(exercise)} style={s.heroImage} />

            <View style={s.content}>
              <Text style={s.exerciseName}>{exercise.title}</Text>

              {exercise.subtitle ? (
                <View style={s.badgeRow}>
                  <View style={s.badge}>
                    <Ionicons name="fitness" size={14} color={ACCENT} />
                    <Text style={s.badgeText}>{exercise.subtitle}</Text>
                  </View>
                </View>
              ) : null}

              <View style={s.section}>
                <Text style={s.sectionTitle}>Guía del día</Text>
                <View style={s.infoCard}>
                  <Ionicons name="information-circle" size={18} color={ACCENT} />
                  <Text style={s.sectionText}>
                    Ejecuta este ejercicio con la técnica correcta e incorpóralo a tu rutina de hoy.
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={s.startBtn} activeOpacity={0.8} onPress={handleStart}>
                <Ionicons name="play-circle" size={20} color={BG} />
                <Text style={s.startBtnText}>Comenzar ejercicio</Text>
              </TouchableOpacity>

              <View style={{ height: 100 }} />
            </View>
          </View>
        )}
      </ScrollView>

      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: T1 },
  heroImage: { width: '100%', height: 280 },
  content: { padding: 20 },
  centerBox: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '700', color: T2 },
  retryBtn: { marginTop: 8, backgroundColor: ACCENT, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  retryText: { fontSize: 13, fontWeight: '800', color: BG },
  exerciseName: { fontSize: 28, fontWeight: '800', color: T1, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: SURFACE, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  badgeText: { fontSize: 12, fontWeight: '700', color: T1, flexShrink: 1 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: T1, marginBottom: 8 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: SURFACE, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER },
  sectionText: { flex: 1, fontSize: 13, color: T2, lineHeight: 20 },
  startBtn: { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10 },
  startBtnText: { fontSize: 15, fontWeight: '800', color: BG },
});