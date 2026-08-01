// src/screens/admin/AdminFeaturedScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';
const PURPLE = '#8B7CFF';
const ORANGE = '#FF6B3E';
const CYAN = '#3EE5FF';

const AVAILABLE_IMAGES = [
  { id: 'abs', label: 'Abs', source: require('../../../assets/wmremove-transformed.png') },
  { id: 'hipertrofia', label: 'Hipertrofia', source: require('../../../assets/hiperftrofia.png') },
  { id: 'funcional', label: 'Funcional', source: require('../../../assets/funcional.png') },
  { id: 'upper', label: 'Upper', source: require('../../../assets/upper.png') },
  { id: 'ppl', label: 'PPL', source: require('../../../assets/PPL.png') },
  { id: 'fullbody', label: 'Full Body', source: require('../../../assets/fullbody.png') },
  { id: '5x5', label: '5x5', source: require('../../../assets/5x5.png') },
  { id: '30dias', label: '30 Días', source: require('../../../assets/30diashipertrofia.png') },
];

const LEVELS = ['Principiante', 'Intermedio', 'Avanzado'];

export default function AdminFeaturedScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState('create'); // 'create' o 'link'

  // Datos del HeroCard
  const [heroData, setHeroData] = useState({
    title: '', subtitle: '', image_id: '30dias',
    route: '', participants: '0',
  });

  // ✅ Datos completos del reto nuevo
  const [challengeData, setChallengeData] = useState({
    description: '', duration: '30', frequency: '4 días/sem',
    session_time: '60 min', level: 'Intermedio',
    objectives: [''],
    phases: [{ title: '', week: '', focus: '', color: ACCENT }],
    days: [{
      name: 'DÍA A', type: '',
      exercises: [{ name: '', sets: '3', reps: '10', rest: '60s' }]
    }],
  });

  // Ejercicio del día
  const [exerciseData, setExerciseData] = useState({
    title: '', subtitle: '', image_id: 'hipertrofia', route: '/explore/exercise-day',
  });

  useEffect(() => { loadFeatured(); }, []);

  async function loadFeatured() {
    setLoading(true);
    const { data } = await supabase.from('featured_content').select('*');
    if (data) {
      const hero = data.find(d => d.id === 'hero_challenge');
      const ex = data.find(d => d.id === 'exercise_of_day');
      if (hero) setHeroData({
        title: hero.title, subtitle: hero.subtitle || '',
        image_id: hero.image_id || '30dias', route: hero.route,
        participants: hero.participants || '0',
      });
      if (ex) setExerciseData({
        title: ex.title, subtitle: ex.subtitle || '',
        image_id: ex.image_id || 'hipertrofia', route: ex.route,
      });
    }
    setLoading(false);
  }

  // ✅ FUNCIONES PARA OBJETIVOS
  function addObjective() {
    setChallengeData(p => ({ ...p, objectives: [...p.objectives, ''] }));
  }
  function updateObjective(idx, value) {
    setChallengeData(p => {
      const o = [...p.objectives]; o[idx] = value;
      return { ...p, objectives: o };
    });
  }
  function deleteObjective(idx) {
    setChallengeData(p => ({ ...p, objectives: p.objectives.filter((_, i) => i !== idx) }));
  }

  // ✅ FUNCIONES PARA FASES
  function addPhase() {
    setChallengeData(p => ({ ...p, phases: [...p.phases, { title: '', week: '', focus: '', color: ACCENT }] }));
  }
  function updatePhase(idx, field, value) {
    setChallengeData(p => {
      const ph = [...p.phases]; ph[idx] = { ...ph[idx], [field]: value };
      return { ...p, phases: ph };
    });
  }
  function deletePhase(idx) {
    setChallengeData(p => ({ ...p, phases: p.phases.filter((_, i) => i !== idx) }));
  }

  // ✅ FUNCIONES PARA DÍAS
  function addDay() {
    const letter = String.fromCharCode(65 + challengeData.days.length);
    setChallengeData(p => ({
      ...p,
      days: [...p.days, { name: `DÍA ${letter}`, type: '', exercises: [{ name: '', sets: '3', reps: '10', rest: '60s' }] }]
    }));
  }
  function updateDay(idx, field, value) {
    setChallengeData(p => {
      const d = [...p.days]; d[idx] = { ...d[idx], [field]: value };
      return { ...p, days: d };
    });
  }
  function deleteDay(idx) {
    setChallengeData(p => ({ ...p, days: p.days.filter((_, i) => i !== idx) }));
  }

  // ✅ FUNCIONES PARA EJERCICIOS
  function addExercise(dayIdx) {
    setChallengeData(p => {
      const d = [...p.days];
      d[dayIdx] = { ...d[dayIdx], exercises: [...d[dayIdx].exercises, { name: '', sets: '3', reps: '10', rest: '60s' }] };
      return { ...p, days: d };
    });
  }
  function updateExercise(dayIdx, exIdx, field, value) {
    setChallengeData(p => {
      const d = [...p.days];
      const ex = [...d[dayIdx].exercises];
      ex[exIdx] = { ...ex[exIdx], [field]: value };
      d[dayIdx] = { ...d[dayIdx], exercises: ex };
      return { ...p, days: d };
    });
  }
  function deleteExercise(dayIdx, exIdx) {
    setChallengeData(p => {
      const d = [...p.days];
      d[dayIdx] = { ...d[dayIdx], exercises: d[dayIdx].exercises.filter((_, i) => i !== exIdx) };
      return { ...p, days: d };
    });
  }

  // ✅ GUARDAR RETO DEL MES (CREA RETO NUEVO + ACTUALIZA HEROCARD)
  async function saveHeroChallenge() {
    if (mode === 'create') {
      // MODO CREAR: Crea reto completo en challenges + actualiza featured
      if (!heroData.title.trim()) return Alert.alert('Error', 'Título obligatorio');
      if (!challengeData.description.trim()) return Alert.alert('Error', 'Descripción obligatoria');

      setSaving(true);
      try {
        // 1. Crear el reto en la tabla challenges
        const { data: newChallenge, error: challengeError } = await supabase
          .from('challenges')
          .insert({
            name: heroData.title.trim(),
            subtitle: heroData.subtitle.trim(),
            description: challengeData.description.trim(),
            duration_days: parseInt(challengeData.duration) || 30,
            level: challengeData.level,
            frequency: challengeData.frequency,
            session_time: challengeData.session_time,
            image_id: heroData.image_id,
            status: 'active',
            exercise_ids: [],
            objectives: challengeData.objectives.filter(o => o.trim()),
            phases: challengeData.phases.filter(p => p.title.trim()),
            days: challengeData.days.map(d => ({
              ...d,
              exercises: d.exercises.filter(e => e.name.trim())
            })).filter(d => d.exercises.length > 0),
          })
          .select()
          .single();

        if (challengeError) throw challengeError;

        // 2. Actualizar el HeroCard con la ruta del nuevo reto
        const route = `/explore/challenge-dynamic?id=${newChallenge.id}`;
        const { error: featuredError } = await supabase
          .from('featured_content')
          .upsert({
            id: 'hero_challenge',
            title: heroData.title.trim(),
            subtitle: heroData.subtitle.trim(),
            image_id: heroData.image_id,
            route: route,
            participants: heroData.participants,
            updated_at: new Date().toISOString(),
          });

        if (featuredError) throw featuredError;

        Alert.alert('¡Éxito!', 'Reto creado y establecido como Reto del Mes');
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setSaving(false);
      }
    } else {
      // MODO ENLACE: Solo actualiza el HeroCard
      if (!heroData.title.trim() || !heroData.route.trim()) {
        return Alert.alert('Error', 'Título y ruta obligatorios');
      }
      setSaving(true);
      const { error } = await supabase.from('featured_content').upsert({
        id: 'hero_challenge',
        title: heroData.title.trim(),
        subtitle: heroData.subtitle.trim(),
        image_id: heroData.image_id,
        route: heroData.route,
        participants: heroData.participants,
        updated_at: new Date().toISOString(),
      });
      setSaving(false);
      if (error) Alert.alert('Error', error.message);
      else Alert.alert('¡Éxito!', 'Reto del Mes actualizado');
    }
  }

  // GUARDAR EJERCICIO DEL DÍA
  async function saveExercise() {
    if (!exerciseData.title.trim()) return Alert.alert('Error', 'Título obligatorio');
    setSaving(true);
    const { error } = await supabase.from('featured_content').upsert({
      id: 'exercise_of_day',
      title: exerciseData.title.trim(),
      subtitle: exerciseData.subtitle.trim(),
      image_id: exerciseData.image_id,
      route: exerciseData.route,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('¡Éxito!', 'Ejercicio del día actualizado');
  }

  if (loading) return <View style={s.loading}><ActivityIndicator size="large" color={ACCENT} /></View>;

  const heroImage = AVAILABLE_IMAGES.find(i => i.id === heroData.image_id);
  const exImage = AVAILABLE_IMAGES.find(i => i.id === exerciseData.image_id);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={T1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>⭐ Contenido Destacado</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ═══════════════════════════════════════════ */}
        {/* RETO DEL MES */}
        {/* ═══════════════════════════════════════════ */}
        <Text style={s.sectionLabel}>🏆 RETO DEL MES</Text>

        {/* Selector de modo */}
        <View style={s.modeRow}>
          <TouchableOpacity
            style={[s.modeBtn, mode === 'create' && s.modeBtnActive]}
            onPress={() => setMode('create')}
          >
            <Ionicons name="add-circle" size={18} color={mode === 'create' ? ACCENT : T3} />
            <Text style={[s.modeBtnText, mode === 'create' && s.modeBtnTextActive]}>Crear nuevo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.modeBtn, mode === 'link' && s.modeBtnActive]}
            onPress={() => setMode('link')}
          >
            <Ionicons name="link" size={18} color={mode === 'link' ? ACCENT : T3} />
            <Text style={[s.modeBtnText, mode === 'link' && s.modeBtnTextActive]}>Enlazar existente</Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        {heroImage && (
          <View style={s.previewWrap}>
            <Image source={heroImage.source} style={s.previewImage} />
            <View style={s.previewOverlay}>
              <Text style={s.previewTitle}>{heroData.title || 'Título del reto'}</Text>
              <Text style={s.previewSub}>{heroData.participants || '0'} participantes</Text>
            </View>
          </View>
        )}

        {/* Info básica (siempre visible) */}
        <Input label="Título del reto *" value={heroData.title} onChangeText={v => setHeroData(p => ({ ...p, title: v }))} placeholder="Ej: Reto 30 días Abs" />
        <Input label="Subtítulo" value={heroData.subtitle} onChangeText={v => setHeroData(p => ({ ...p, subtitle: v }))} placeholder="Ej: Core de acero en un mes" />
        <Input label="Participantes" value={heroData.participants} onChangeText={v => setHeroData(p => ({ ...p, participants: v }))} placeholder="12.548" />

        <Text style={s.miniLabel}>Imagen</Text>
        <View style={s.imageGrid}>
          {AVAILABLE_IMAGES.map(img => (
            <TouchableOpacity
              key={img.id}
              style={[s.imageOption, heroData.image_id === img.id && s.imageOptionActive]}
              onPress={() => setHeroData(p => ({ ...p, image_id: img.id }))}
            >
              <Image source={img.source} style={s.imageOptionImg} />
              <Text style={[s.imageOptionLabel, heroData.image_id === img.id && s.imageOptionLabelActive]}>{img.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* MODO ENLACE: Solo ruta */}
        {mode === 'link' && (
          <Input label="Ruta *" value={heroData.route} onChangeText={v => setHeroData(p => ({ ...p, route: v }))} placeholder="/explore/challenge-dynamic?id=..." autoCapitalize="none" />
        )}

        {/* MODO CREAR: Formulario completo del reto */}
        {mode === 'create' && (
          <>
            <Text style={s.sectionLabel}>📋 DATOS DEL RETO</Text>
            <TextArea label="Descripción *" value={challengeData.description} onChangeText={v => setChallengeData(p => ({ ...p, description: v }))} placeholder="¿De qué trata el reto?" height={100} />

            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Input label="Duración (días)" value={challengeData.duration} onChangeText={v => setChallengeData(p => ({ ...p, duration: v }))} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Frecuencia" value={challengeData.frequency} onChangeText={v => setChallengeData(p => ({ ...p, frequency: v }))} placeholder="4 días/sem" />
              </View>
            </View>
            <Input label="Tiempo por sesión" value={challengeData.session_time} onChangeText={v => setChallengeData(p => ({ ...p, session_time: v }))} placeholder="60 min" />

            <Text style={s.miniLabel}>Nivel</Text>
            <View style={s.optionsRow}>
              {LEVELS.map(level => (
                <TouchableOpacity
                  key={level}
                  style={[s.optionBtn, challengeData.level === level && s.optionBtnActive]}
                  onPress={() => setChallengeData(p => ({ ...p, level }))}
                >
                  <Text style={[s.optionBtnText, challengeData.level === level && s.optionBtnTextActive]}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* OBJETIVOS */}
            <Text style={s.sectionLabel}>🎯 LO QUE LOGRARÁS</Text>
            {challengeData.objectives.map((obj, idx) => (
              <View key={idx} style={s.itemRow}>
                <TextInput style={[s.input, { flex: 1 }]} value={obj} onChangeText={v => updateObjective(idx, v)} placeholder="Ej: Aumentar fuerza del core" placeholderTextColor={T3} />
                <TouchableOpacity onPress={() => deleteObjective(idx)}><Ionicons name="close-circle" size={22} color="#FF453A" /></TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={s.addBtn} onPress={addObjective}>
              <Ionicons name="add-circle" size={18} color={ACCENT} />
              <Text style={s.addBtnText}>Agregar objetivo</Text>
            </TouchableOpacity>

            {/* FASES */}
            <Text style={s.sectionLabel}>📊 FASES</Text>
            {challengeData.phases.map((phase, idx) => (
              <View key={idx} style={s.phaseCard}>
                <View style={s.phaseHeader}>
                  <Text style={s.phaseTitle}>Fase {idx + 1}</Text>
                  <TouchableOpacity onPress={() => deletePhase(idx)}><Ionicons name="trash" size={18} color="#FF453A" /></TouchableOpacity>
                </View>
                <Input label="Título" value={phase.title} onChangeText={v => updatePhase(idx, 'title', v)} placeholder="Ej: Activación" />
                <View style={s.row}>
                  <View style={{ flex: 1 }}><Input label="Semana" value={phase.week} onChangeText={v => updatePhase(idx, 'week', v)} placeholder="Semana 1" /></View>
                  <View style={{ flex: 1 }}><Input label="Enfoque" value={phase.focus} onChangeText={v => updatePhase(idx, 'focus', v)} placeholder="Técnica" /></View>
                </View>
                <Text style={s.miniLabel}>Color</Text>
                <View style={s.colorRow}>
                  {[ACCENT, PURPLE, ORANGE, CYAN].map(color => (
                    <TouchableOpacity key={color} style={[s.colorDot, { backgroundColor: color }, phase.color === color && s.colorDotActive]} onPress={() => updatePhase(idx, 'color', color)} />
                  ))}
                </View>
              </View>
            ))}
            <TouchableOpacity style={s.addBtn} onPress={addPhase}>
              <Ionicons name="add-circle" size={18} color={ACCENT} />
              <Text style={s.addBtnText}>Agregar fase</Text>
            </TouchableOpacity>

            {/* DÍAS CON EJERCICIOS */}
            <Text style={s.sectionLabel}>💪 DÍAS DE ENTRENAMIENTO</Text>
            {challengeData.days.map((day, dayIdx) => (
              <View key={dayIdx} style={s.dayCard}>
                <View style={s.dayHeader}>
                  <TextInput style={[s.dayNameInput, { flex: 1 }]} value={day.name} onChangeText={v => updateDay(dayIdx, 'name', v)} placeholderTextColor={T3} />
                  <TouchableOpacity onPress={() => deleteDay(dayIdx)}><Ionicons name="trash" size={18} color="#FF453A" /></TouchableOpacity>
                </View>
                <Input label="Tipo" value={day.type} onChangeText={v => updateDay(dayIdx, 'type', v)} placeholder="Ej: Upper Fuerza" />
                <Text style={s.miniLabel}>Ejercicios</Text>
                {day.exercises.map((ex, exIdx) => (
                  <View key={exIdx} style={s.exerciseCard}>
                    <View style={s.exerciseHeader}>
                      <Text style={s.exerciseTitle}>#{exIdx + 1}</Text>
                      <TouchableOpacity onPress={() => deleteExercise(dayIdx, exIdx)}><Ionicons name="close-circle" size={18} color={T3} /></TouchableOpacity>
                    </View>
                    <Input label="Nombre" value={ex.name} onChangeText={v => updateExercise(dayIdx, exIdx, 'name', v)} placeholder="Press banca" />
                    <View style={s.exerciseRow}>
                      <View style={{ flex: 1 }}><Input label="Series" value={ex.sets} onChangeText={v => updateExercise(dayIdx, exIdx, 'sets', v)} /></View>
                      <View style={{ flex: 1 }}><Input label="Reps" value={ex.reps} onChangeText={v => updateExercise(dayIdx, exIdx, 'reps', v)} /></View>
                      <View style={{ flex: 1 }}><Input label="Descanso" value={ex.rest} onChangeText={v => updateExercise(dayIdx, exIdx, 'rest', v)} /></View>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={s.addExerciseBtn} onPress={() => addExercise(dayIdx)}>
                  <Ionicons name="add" size={14} color={ACCENT} />
                  <Text style={s.addExerciseBtnText}>Agregar ejercicio</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={s.addBtn} onPress={addDay}>
              <Ionicons name="add-circle" size={18} color={ACCENT} />
              <Text style={s.addBtnText}>Agregar día</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={saveHeroChallenge} disabled={saving}>
          <Text style={s.saveBtnText}>
            {saving ? 'Guardando...' : (mode === 'create' ? '🚀 Crear reto y establecer como Reto del Mes' : 'Guardar Reto del Mes')}
          </Text>
        </TouchableOpacity>

        {/* ═══════════════════════════════════════════ */}
        {/* EJERCICIO DEL DÍA */}
        {/* ═══════════════════════════════════════════ */}
        <Text style={s.sectionLabel}>⭐ EJERCICIO DEL DÍA</Text>

        {exImage && (
          <View style={s.previewWrap}>
            <Image source={exImage.source} style={s.previewImage} />
            <View style={s.previewOverlay}>
              <Text style={s.previewTitle}>{exerciseData.title || 'Nombre del ejercicio'}</Text>
              <Text style={s.previewSub}>{exerciseData.subtitle || 'Músculo · Nivel'}</Text>
            </View>
          </View>
        )}

        <Input label="Nombre *" value={exerciseData.title} onChangeText={v => setExerciseData(p => ({ ...p, title: v }))} placeholder="Dominadas lastradas" />
        <Input label="Músculo · Nivel" value={exerciseData.subtitle} onChangeText={v => setExerciseData(p => ({ ...p, subtitle: v }))} placeholder="Espalda y bíceps · Avanzado" />
        <Input label="Ruta" value={exerciseData.route} onChangeText={v => setExerciseData(p => ({ ...p, route: v }))} autoCapitalize="none" />

        <Text style={s.miniLabel}>Imagen</Text>
        <View style={s.imageGrid}>
          {AVAILABLE_IMAGES.map(img => (
            <TouchableOpacity
              key={img.id}
              style={[s.imageOption, exerciseData.image_id === img.id && s.imageOptionActive]}
              onPress={() => setExerciseData(p => ({ ...p, image_id: img.id }))}
            >
              <Image source={img.source} style={s.imageOptionImg} />
              <Text style={[s.imageOptionLabel, exerciseData.image_id === img.id && s.imageOptionLabelActive]}>{img.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={saveExercise} disabled={saving}>
          <Text style={s.saveBtnText}>{saving ? 'Guardando...' : 'Guardar Ejercicio del Día'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function Input({ label, value, onChangeText, placeholder, keyboardType = 'default', autoCapitalize = 'sentences' }) {
  return (
    <View style={s.inputWrap}>
      <Text style={s.inputLabel}>{label}</Text>
      <TextInput style={s.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={T3} keyboardType={keyboardType} autoCapitalize={autoCapitalize} />
    </View>
  );
}

function TextArea({ label, value, onChangeText, placeholder, height = 80 }) {
  return (
    <View style={s.inputWrap}>
      <Text style={s.inputLabel}>{label}</Text>
      <TextInput style={[s.input, { height, textAlignVertical: 'top' }]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={T3} multiline />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loading: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, gap: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: T1 },
  scroll: { padding: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '800', color: ACCENT, marginTop: 24, marginBottom: 10 },
  miniLabel: { fontSize: 11, color: T3, fontWeight: '600', marginBottom: 6, marginTop: 8 },

  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: SURFACE, borderRadius: 12, paddingVertical: 12, borderWidth: 2, borderColor: BORDER },
  modeBtnActive: { borderColor: ACCENT, backgroundColor: ACCENT + '10' },
  modeBtnText: { fontSize: 12, fontWeight: '700', color: T3 },
  modeBtnTextActive: { color: ACCENT },

  previewWrap: { width: '100%', height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 14, position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  previewOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, backgroundColor: 'rgba(0,0,0,0.7)' },
  previewTitle: { fontSize: 18, fontWeight: '800', color: T1, marginBottom: 4 },
  previewSub: { fontSize: 12, color: T2 },

  inputWrap: { marginBottom: 10 },
  inputLabel: { fontSize: 12, color: T2, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: SURFACE, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: T1, fontSize: 14, borderWidth: 1, borderColor: BORDER },

  row: { flexDirection: 'row', gap: 10 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  optionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  optionBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  optionBtnText: { fontSize: 12, fontWeight: '700', color: T2 },
  optionBtnTextActive: { color: BG },

  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  imageOption: { width: 80, alignItems: 'center', backgroundColor: SURFACE, borderRadius: 12, padding: 8, borderWidth: 2, borderColor: BORDER },
  imageOptionActive: { borderColor: ACCENT },
  imageOptionImg: { width: 64, height: 64, borderRadius: 8, marginBottom: 4 },
  imageOptionLabel: { fontSize: 10, color: T2, fontWeight: '600' },
  imageOptionLabelActive: { color: ACCENT },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: SURFACE, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: ACCENT + '40', marginBottom: 14 },
  addBtnText: { fontSize: 13, color: ACCENT, fontWeight: '700' },

  phaseCard: { backgroundColor: SURFACE, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: BORDER },
  phaseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  phaseTitle: { fontSize: 13, fontWeight: '700', color: ACCENT },
  colorRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: T1 },

  dayCard: { backgroundColor: SURFACE, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: BORDER },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayNameInput: { backgroundColor: BG, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, color: ACCENT, fontSize: 14, fontWeight: '800', borderWidth: 1, borderColor: BORDER },

  exerciseCard: { backgroundColor: BG, borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: BORDER },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  exerciseTitle: { fontSize: 11, color: T3, fontWeight: '600' },
  exerciseRow: { flexDirection: 'row', gap: 6 },
  addExerciseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 },
  addExerciseBtnText: { fontSize: 11, color: ACCENT, fontWeight: '600' },

  saveBtn: { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20, marginBottom: 10 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: BG },
});