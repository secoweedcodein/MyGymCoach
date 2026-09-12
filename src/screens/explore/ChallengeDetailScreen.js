// src/screens/explore/ChallengeDetailScreen.js
import { todayKey } from '../../../lib/dateUtils';
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
const GREEN = '#3DD68C';

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

function resolveImage(imageId) {
  if (!imageId) return CHALLENGE_IMAGES.hipertrofia;
  if (typeof imageId === 'string' && imageId.startsWith('http')) {
    return { uri: imageId };
  }
  return CHALLENGE_IMAGES[imageId] || CHALLENGE_IMAGES.hipertrofia;
}

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    try {
      let challengeId = id;
      if (!challengeId) {
        // Compat con rutas antiguas sin id: buscar el primer reto oficial
        const { data: fallback } = await supabase
          .from('challenges')
          .select('id, name')
          .eq('is_official', true)
          .ilike('name', '%hipertrofia%')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        challengeId = fallback?.id;
      }
      if (!challengeId) throw new Error('Reto no encontrado');

      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (error || !data) throw error || new Error('Reto no encontrado');
      setChallenge(data);
    } catch (error) {
      Alert.alert('❌ Error', error.message || 'No se encontró el reto', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
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
    if (!user) { Alert.alert('❌ Error', 'Debes iniciar sesión'); return; }

    if (saved) {
      if (!routineId) return;
      const { error } = await supabase.from('routines').delete().eq('id', routineId);
      if (error) { Alert.alert('❌ Error', error.message); return; }
      setSaved(false);
      setRoutineId(null);
      Alert.alert('✅ Éxito', 'Reto eliminado de tus rutinas');
      return;
    }

    setSaving(true);
    try {
      const { data: newRoutine, error } = await supabase.from('routines').insert({
        user_id: user.id,
        name: `Reto: ${challenge.name}`,
        is_challenge: true,
        challenge_type: 'custom',
        challenge_start_date: todayKey(),
        challenge_duration_days: challenge.duration_days || 30,
        description: challenge.description || '',
        exercise_ids: [],
        created_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;
      setSaved(true);
      setRoutineId(newRoutine.id);
      Alert.alert('✅ Éxito', `"${challenge.name}" guardado en tus rutinas`);
    } catch (error) {
      Alert.alert('❌ Error', error.message);
    } finally {
      setSaving(false);
    }
  }

  function handleStart() {
    if (!saved || !routineId) {
      Alert.alert('Primero guarda el reto', 'Debes guardar el reto antes de comenzar');
      return;
    }

    const currentDay = days[activeDay];
    const exercises = (currentDay?.exercises || []).map(ex => ({
      name: ex.name,
      sets: parseInt(ex.sets) || 3,
      reps: ex.reps || '10',
    })).filter(ex => ex.name);

    const routineForWorkout = {
      id: routineId,
      name: `${challenge.name}${currentDay?.name ? ` · ${currentDay.name}` : ''}`,
      description: challenge.description || '',
      is_challenge: true,
      challenge_type: 'custom',
      exercises,
    };

    router.push({ pathname: '/workout', params: { routine: JSON.stringify(routineForWorkout) } });
  }

  if (loading) {
    return <View style={s.loading}><ActivityIndicator size="large" color={ACCENT} /></View>;
  }
  if (!challenge) return null;

  const objectives = Array.isArray(challenge.objectives)
    ? challenge.objectives.filter(o => typeof o === 'string' && o.trim())
    : (typeof challenge.objective === 'string' && challenge.objective.trim()
        ? [challenge.objective]
        : []);

  const phases = (challenge.phases || []).map((p, i) => ({
    week: p.week || i + 1,
    name: p.name || p.title || `Fase ${i + 1}`,
    schedule: p.schedule || '',
    tip: p.tip || p.focus || '',
  }));

  const days = (challenge.days || []).map(d => ({
    label: d.label || d.name || 'Día',
    name: d.name || d.type || d.label || 'Día',
    exercises: d.exercises || [],
  }));

  const currentDay = days[activeDay];

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={s.heroSection}>
          <Image source={resolveImage(challenge.image_id)} style={s.heroImage} />
          <View style={s.heroGradient} />
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
          <View style={s.heroBottom}>
            <View style={s.tag}>
              <Ionicons name="trophy" size={12} color={BG} />
              <Text style={s.tagText}>RETO DEL MES · {challenge.duration_days || 30} DÍAS</Text>
            </View>
            <Text style={s.heroTitle}>{challenge.name}</Text>
            {challenge.subtitle ? <Text style={s.heroSubtitle}>{challenge.subtitle}</Text> : null}
          </View>
        </View>

        {/* STATS */}
        <View style={s.statsRow}>
          <StatBox icon="📅" label="Duración" value={`${challenge.duration_days || 30} días`} />
          <StatBox icon="🏋️" label="Frecuencia" value={challenge.frequency || '—'} />
          <StatBox icon="⏱️" label="Sesión" value={challenge.session_time || '60 min'} />
        </View>
        <View style={s.levelRow}>
          <View style={s.levelBadge}><Text style={s.levelBadgeText}>Nivel: {challenge.level || 'Intermedio'}</Text></View>
        </View>

        {/* DESCRIPCIÓN */}
        {challenge.description ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>📖 Sobre el reto</Text>
            <View style={s.descriptionCard}>
              <Text style={s.descriptionText}>{challenge.description}</Text>
            </View>
          </View>
        ) : null}

        {/* OBJETIVO */}
        {objectives.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>🎯 Objetivo del reto</Text>
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
        ) : null}

        {/* DÍAS CON SELECTOR */}
        {days.length > 0 ? (
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
                    <Text style={[s.dayBtnText, activeDay === idx && s.dayBtnTextActive]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {currentDay && (
              <>
                <View style={s.dayTypeBadge}>
                  <Text style={s.dayTypeText}>{currentDay.name}</Text>
                </View>
                <View style={s.exercisesCard}>
                  {currentDay.exercises.length === 0 ? (
                    <Text style={s.noExercises}>Este día aún no tiene ejercicios.</Text>
                  ) : (
                    currentDay.exercises.map((ex, exIdx) => (
                      <View key={exIdx} style={s.exerciseRow}>
                        <Text style={s.exerciseNumber}>{String(exIdx + 1).padStart(2, '0')}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.exerciseName}>{ex.name}</Text>
                          <Text style={s.exerciseMeta}>
                            {ex.sets} series × {ex.reps}{ex.rest ? ` · descanso ${ex.rest}` : ''}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}
          </View>
        ) : null}

        {/* PLANIFICACIÓN SEMANAL */}
        {phases.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>📆 Planificación semanal</Text>
            {phases.map((phase, idx) => (
              <View key={idx} style={s.weekCard}>
                <View style={s.weekHeader}>
                  <Text style={s.weekNumber}>S{String(phase.week).padStart(2, '0')}</Text>
                  <Text style={s.weekTitle}>{phase.name}</Text>
                </View>
                {phase.schedule ? <Text style={s.weekDays}>{phase.schedule}</Text> : null}
                {phase.tip ? (
                  <View style={s.weekNote}>
                    <Ionicons name="information-circle" size={14} color={ACCENT} />
                    <Text style={s.weekNoteText}>{phase.tip}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* BOTONES */}
        {saved ? (
          <TouchableOpacity style={s.startBtn} onPress={handleStart} activeOpacity={0.85}>
            <Ionicons name="play-circle" size={22} color={BG} />
            <Text style={s.startBtnText}>
              {days.length > 1 ? `Comenzar ${currentDay?.name || 'reto'}` : 'Comenzar reto'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={s.participateBtn}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            <Ionicons name="bookmark-outline" size={22} color={BG} />
            <Text style={s.participateBtnText}>
              {saving ? 'Guardando...' : 'Participar ahora'}
            </Text>
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
      <Text style={s.statValue} numberOfLines={1}>{value}</Text>
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
  statValue: { fontSize: 14, fontWeight: '800', color: T1, marginBottom: 2 },
  statLabel: { fontSize: 10, color: T3, fontWeight: '600' },
  levelRow: { paddingHorizontal: 20, marginTop: 12 },
  levelBadge: { alignSelf: 'flex-start', backgroundColor: SURFACE2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: BORDER },
  levelBadgeText: { fontSize: 12, fontWeight: '700', color: ACCENT },

  section: { marginTop: 28, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: T1, marginBottom: 12 },
  descriptionCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 4, borderLeftColor: ACCENT },
  descriptionText: { fontSize: 14, color: T2, lineHeight: 22 },

  objectivesCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  objectiveRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  checkmark: { width: 24, height: 24, borderRadius: 12, backgroundColor: ACCENT + '20', alignItems: 'center', justifyContent: 'center', marginTop: 0 },
  objectiveText: { flex: 1, fontSize: 13, color: T2, fontWeight: '500', lineHeight: 18 },

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
  noExercises: { fontSize: 13, color: T3, padding: 12 },

  weekCard: { backgroundColor: SURFACE, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 4, borderLeftColor: ACCENT },
  weekHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  weekNumber: { fontSize: 11, fontWeight: '800', color: BG, backgroundColor: ACCENT, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  weekTitle: { fontSize: 14, fontWeight: '800', color: T1, flex: 1 },
  weekDays: { fontSize: 12, color: T2, lineHeight: 18, marginBottom: 8 },
  weekNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: ACCENT + '10', padding: 8, borderRadius: 8 },
  weekNoteText: { fontSize: 11, color: T2, fontWeight: '500', flex: 1 },

  participateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 18, marginHorizontal: 20, marginTop: 28 },
  participateBtnText: { fontSize: 16, fontWeight: '800', color: BG },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: GREEN, borderRadius: 16, paddingVertical: 18, marginHorizontal: 20, marginTop: 28 },
  startBtnText: { fontSize: 16, fontWeight: '800', color: BG },
});