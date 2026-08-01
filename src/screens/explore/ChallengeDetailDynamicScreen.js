// src/screens/explore/ChallengeDetailDynamicScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert,
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
const ORANGE = '#FF6B3E';

const CHALLENGE_IMAGES = {
  abs: require('../../../assets/wmremove-transformed.png'),
  hipertrofia: require('../../../assets/hiperftrofia.png'),
  funcional: require('../../../assets/funcional.png'),
  upper: require('../../../assets/upper.png'),
  ppl: require('../../../assets/PPL.png'),
  fullbody: require('../../../assets/fullbody.png'),
  '5x5': require('../../../assets/5x5.png'),
  '30dias': require('../../../assets/30diashipertrofia.png'),
};

export default function ChallengeDetailDynamicScreen() {
  const { id } = useLocalSearchParams();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [routineId, setRoutineId] = useState(null);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    loadChallenge();
  }, [id]);

  useEffect(() => {
    if (challenge) checkIfSaved();
  }, [challenge]);

  async function loadChallenge() {
    setLoading(true);
    const { data, error } = await supabase.from('challenges').select('*').eq('id', id).single();
    if (error || !data) { Alert.alert('Error', 'No se encontró el reto'); router.back(); return; }
    setChallenge(data);
    setLoading(false);
  }

  async function checkIfSaved() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('routines').select('id')
      .eq('user_id', user.id).eq('name', `Reto: ${challenge.name}`).maybeSingle();
    if (data) { setSaved(true); setRoutineId(data.id); }
  }

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { Alert.alert('Error', 'Debes iniciar sesión'); return; }

    if (saved) {
      const { error } = await supabase.from('routines').delete().eq('id', routineId);
      if (error) Alert.alert('Error', error.message);
      else { setSaved(false); setRoutineId(null); Alert.alert('Reto eliminado'); }
    } else {
      const { data: newRoutine, error } = await supabase.from('routines').insert({
        user_id: user.id, name: `Reto: ${challenge.name}`, is_challenge: true,
        challenge_type: 'custom',
        challenge_start_date: new Date().toISOString().split('T')[0],
        challenge_duration_days: challenge.duration_days || 30,
        description: challenge.description || '', exercise_ids: [],
        created_at: new Date().toISOString(),
      }).select().single();

      if (error) Alert.alert('Error', error.message);
      else { setSaved(true); setRoutineId(newRoutine.id); Alert.alert('¡Reto guardado!'); }
    }
  }

  function handleStart() {
    if (!saved || !routineId) { Alert.alert('Primero guarda el reto'); return; }

    const currentDay = challenge.days?.[activeDay];
    const exercises = currentDay?.exercises?.map(ex => ({
      name: ex.name, sets: parseInt(ex.sets) || 3, reps: ex.reps
    })) || [];

    const routineForWorkout = {
      id: routineId,
      name: `Reto: ${challenge.name}${currentDay ? ` · ${currentDay.name}` : ''}`,
      description: challenge.description || '',
      is_challenge: true, challenge_type: 'custom',
      exercises: exercises,
    };

    router.push({ pathname: '/workout', params: { routine: JSON.stringify(routineForWorkout) } });
  }

  if (loading) return <View style={s.loading}><ActivityIndicator size="large" color={ACCENT} /></View>;
  if (!challenge) return null;

  const imageSource = CHALLENGE_IMAGES[challenge.image_id] || CHALLENGE_IMAGES.hipertrofia;
  const objectives = challenge.objectives || [];
  const phases = challenge.phases || [];
  const days = challenge.days || [];
  const currentDay = days[activeDay];

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={s.heroSection}>
          <Image source={imageSource} style={s.heroImage} />
          <View style={s.heroGradient} />
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
          <View style={s.heroBottom}>
            <View style={s.tag}>
              <Ionicons name="trophy" size={12} color={BG} />
              <Text style={s.tagText}>RETO · {challenge.duration_days || 30} DÍAS</Text>
            </View>
            <Text style={s.heroTitle}>{challenge.name}</Text>
            {challenge.subtitle && <Text style={s.heroSubtitle}>{challenge.subtitle}</Text>}
          </View>
        </View>

        {/* STATS */}
        <View style={s.statsRow}>
          <StatBox icon="📅" label="Duración" value={`${challenge.duration_days || 30} días`} />
          <StatBox icon="⏱️" label="Sesión" value={challenge.session_time || '60 min'} />
          <StatBox icon="🏋️" label="Nivel" value={challenge.level || 'Intermedio'} />
        </View>

        {/* DESCRIPCIÓN */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Sobre el reto</Text>
          <View style={s.descriptionCard}>
            <Text style={s.descriptionText}>{challenge.description || 'Sin descripción.'}</Text>
          </View>
        </View>

        {/* OBJETIVOS */}
        {objectives.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>🎯 Lo que lograrás</Text>
            <View style={s.objectivesCard}>
              {objectives.map((obj, idx) => (
                <View key={idx} style={s.objectiveRow}>
                  <View style={s.checkmark}>
                    <Ionicons name="checkmark" size={12} color={ACCENT} />
                  </View>
                  <Text style={s.objectiveText}>{obj}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* FASES */}
        {phases.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>📊 Fases del programa</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.phasesScroll}>
              {phases.map((phase, idx) => (
                <View key={idx} style={[s.phaseCard, { borderLeftColor: phase.color || ACCENT }]}>
                  <Text style={[s.phaseNumber, { color: phase.color || ACCENT }]}>{String(idx + 1).padStart(2, '0')}</Text>
                  <Text style={s.phaseTitle}>{phase.title}</Text>
                  <Text style={s.phaseWeek}>{phase.week}</Text>
                  <Text style={s.phaseFocus}>{phase.focus}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* DÍAS CON SELECTOR */}
        {days.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>💪 Días de entrenamiento</Text>
            
            {days.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.daySelector}>
                {days.map((day, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[s.dayBtn, activeDay === idx && s.dayBtnActive]}
                    onPress={() => setActiveDay(idx)}
                  >
                    <Text style={[s.dayBtnText, activeDay === idx && s.dayBtnTextActive]}>{day.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {currentDay && (
              <>
                {currentDay.type && (
                  <View style={s.dayTypeBadge}>
                    <Text style={s.dayTypeText}>{currentDay.type}</Text>
                  </View>
                )}
                <View style={s.exercisesCard}>
                  {currentDay.exercises.map((ex, idx) => (
                    <View key={idx} style={s.exerciseRow}>
                      <Text style={s.exerciseNumber}>{String(idx + 1).padStart(2, '0')}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.exerciseName}>{ex.name}</Text>
                        <Text style={s.exerciseMeta}>{ex.sets} series × {ex.reps} · descanso {ex.rest}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* BOTONES */}
        {saved ? (
          <TouchableOpacity style={s.startBtn} onPress={handleStart} activeOpacity={0.85}>
            <Ionicons name="play-circle" size={22} color={BG} />
            <Text style={s.startBtnText}>
              {days.length > 1 ? `Comenzar ${currentDay?.name || ''}` : 'Comenzar reto'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.actionBtn} onPress={handleSave} activeOpacity={0.85}>
            <Ionicons name="bookmark-outline" size={24} color={ACCENT} />
            <Text style={s.actionBtnText}>Guardar en mis rutinas</Text>
          </TouchableOpacity>
        )}

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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loading: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  heroSection: { width: '100%', height: 340, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, backgroundColor: 'rgba(13,13,13,0.95)' },
  backBtn: { position: 'absolute', top: 56, left: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroBottom: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  tag: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12, gap: 6, alignItems: 'center' },
  tagText: { fontSize: 11, fontWeight: '800', color: BG },
  heroTitle: { fontSize: 32, fontWeight: '800', color: T1, marginBottom: 6, letterSpacing: -0.5, lineHeight: 38 },
  heroSubtitle: { fontSize: 15, color: T2, fontWeight: '500' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginTop: 24, gap: 10 },
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
  exerciseMeta: { fontSize: 11, color: T3 },

  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: SURFACE, borderWidth: 2, borderColor: ACCENT, borderRadius: 16, paddingVertical: 18, marginHorizontal: 20, marginTop: 28 },
  actionBtnText: { fontSize: 16, fontWeight: '800', color: ACCENT },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 18, marginHorizontal: 20, marginTop: 28 },
  startBtnText: { fontSize: 16, fontWeight: '800', color: BG },
});