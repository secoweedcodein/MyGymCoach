// src/screens/admin/AdminCreateChallengeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Modal, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import {
  getChallenge, createChallenge, updateChallenge,
  uploadImage, upsertFeaturedContent,
} from '../../../services/adminService';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const BORDER2 = '#FFFFFF18';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';
const RED = '#FF453A';

const LEVELS = ['Principiante', 'Intermedio', 'Avanzado'];
const FREQUENCIES = ['2 días/sem', '3 días/sem', '4 días/sem', '5 días/sem', '6 días/sem'];
const SESSION_TIMES = ['30 min', '45 min', '60 min', '75 min', '90 min'];
const DAY_LABELS = ['Día A', 'Día B', 'Día C', 'Día D', 'Día E', 'Día F'];

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
  if (typeof imageId !== 'string' || !imageId) return null;
  if (imageId.startsWith('http')) return { uri: imageId };
  return CHALLENGE_IMAGES[imageId] || null;
}

// Lista de ejercicios comunes (puedes ampliarla)
const EXERCISES_DB = [
  'Press banca', 'Press militar', 'Sentadilla', 'Peso muerto',
  'Remo con barra', 'Dominadas', 'Dominadas lastradas', 'Curl bíceps',
  'Extensión tríceps', 'Zancadas', 'Press inclinado', 'Fondos',
  'Plancha', 'Crunch', 'Russian twist', 'Hip thrust',
  'Press de hombro', 'Elevaciones laterales', 'Jalón al pecho',
  'Remo mancuerna', 'Curl martillo', 'Patada de tríceps',
];

export default function AdminCreateChallengeScreen() {
  const { id, type } = useLocalSearchParams(); // id → edición, type → reto_mes | ejercicio_dia
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [challenge, setChallenge] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    description: '',
    duration_days: 30,
    frequency: '4 días/sem',
    session_time: '60 min',
    level: 'Intermedio',
    image_id: '',
    objective: '',
    days: [
      { label: 'Día A', name: 'Upper Fuerza', exercises: [] },
      { label: 'Día B', name: 'Lower Fuerza', exercises: [] },
      { label: 'Día C', name: 'Upper Hipertrofia', exercises: [] },
      { label: 'Día D', name: 'Lower Hipertrofia', exercises: [] },
    ],
    phases: [
      { week: 1, name: 'Adaptación', schedule: '', tip: '' },
      { week: 2, name: 'Carga', schedule: '', tip: '' },
      { week: 3, name: 'Intensificación', schedule: '', tip: '' },
      { week: 4, name: 'Pico', schedule: '', tip: '' },
    ],
  });

  const [exerciseModal, setExerciseModal] = useState({ visible: false, dayIndex: -1 });
  const [newExercise, setNewExercise] = useState({ name: '', sets: '', reps: '' });

  useEffect(() => {
    if (id) loadChallenge();
  }, [id]);

  const loadChallenge = async () => {
    setLoading(true);
    try {
      const data = await getChallenge(id);

      // Normalizar datos por si el reto fue creado con otro formulario (tendencias)
      const days = (data.days || []).map(d => ({
        label: d.label || 'Día',
        name: d.name || d.type || '',
        exercises: (d.exercises || []).map(e => ({
          name: e.name || '',
          sets: e.sets != null ? String(e.sets) : '3',
          reps: e.reps != null ? String(e.reps) : '8-12',
        })),
      }));
      const phases = (data.phases || []).map((p, i) => ({
        week: p.week || i + 1,
        name: p.name || p.title || '',
        schedule: p.schedule || '',
        tip: p.tip || p.focus || '',
      }));

      setChallenge(data);
      setFormData({
        name: data.name || '',
        subtitle: data.subtitle || '',
        description: data.description || '',
        duration_days: data.duration_days || 30,
        frequency: data.frequency || '4 días/sem',
        session_time: data.session_time || '60 min',
        level: data.level || 'Intermedio',
        image_id: data.image_id || '',
        objective:
          typeof data.objective === 'string'
            ? data.objective
            : Array.isArray(data.objectives)
            ? data.objectives.join('\n')
            : '',
        days: days.length >= 4 ? days : formData.days,
        phases: phases.length >= 4 ? phases : formData.phases,
      });
    } catch (error) {
      Alert.alert('❌ Error', error.message || 'No se pudo cargar el reto');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        const imageUrl = await uploadImage(result.assets[0].uri, 'challenges');
        setFormData({ ...formData, image_id: imageUrl });
        Alert.alert('✅ Éxito', 'Imagen subida correctamente');
      } catch (error) {
        Alert.alert('❌ Error', error.message || 'No se pudo subir la imagen');
      }
    }
  };

  const addExerciseToDay = (dayIndex) => {
    if (!newExercise.name.trim()) {
      Alert.alert('❌ Error', 'Ingresa el nombre del ejercicio');
      return;
    }
    const updatedDays = [...formData.days];
    updatedDays[dayIndex].exercises = [
      ...updatedDays[dayIndex].exercises,
      {
        name: newExercise.name,
        sets: newExercise.sets || '3',
        reps: newExercise.reps || '8-12',
      },
    ];
    setFormData({ ...formData, days: updatedDays });
    setNewExercise({ name: '', sets: '', reps: '' });
    setExerciseModal({ visible: false, dayIndex: -1 });
  };

  const removeExercise = (dayIndex, exIndex) => {
    const updatedDays = [...formData.days];
    updatedDays[dayIndex].exercises = updatedDays[dayIndex].exercises.filter((_, i) => i !== exIndex);
    setFormData({ ...formData, days: updatedDays });
  };

  const updatePhase = (index, field, value) => {
    const updatedPhases = [...formData.phases];
    updatedPhases[index] = { ...updatedPhases[index], [field]: value };
    setFormData({ ...formData, phases: updatedPhases });
  };

  const handleSave = async () => {
    // Validaciones
    if (!formData.name.trim()) {
      Alert.alert('❌ Error', 'El nombre es obligatorio');
      return;
    }

    const dayWithNoExercises = formData.days.find(d => !d.exercises.length);
    if (dayWithNoExercises) {
      Alert.alert('❌ Error', `El ${dayWithNoExercises.label} no tiene ejercicios. Añade al menos 1.`);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        subtitle: formData.subtitle,
        description: formData.description,
        duration_days: parseInt(formData.duration_days) || 30,
        frequency: formData.frequency,
        session_time: formData.session_time,
        level: formData.level,
        image_id: formData.image_id,
        objective: formData.objective,
        days: formData.days,
        phases: formData.phases,
        is_official: true,
        status: 'active',
        updated_at: new Date().toISOString(),
      };

      if (id) {
        // Actualizar existente
        await updateChallenge(id, payload);
        Alert.alert('✅ Éxito', 'Reto actualizado correctamente', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        // Crear nuevo
        const data = await createChallenge(payload);

        // Si viene con tipo (reto_mes / ejercicio_dia), lo asignamos como destacado
        if (type === 'reto_mes' || type === 'ejercicio_dia') {
          try {
            await upsertFeaturedContent({
              id: type,
              target_id: data.id,
              target_type: 'challenge',
              title: data.name,
              subtitle: data.subtitle || `${data.duration_days} días · ${data.frequency}`,
              image_id: data.image_id || '',
              route: '/explore/challenge-detail',
              participants: '',
              updated_at: new Date().toISOString(),
            });
          } catch (featureError) {
            // El reto se creó, el fallo de destacado no lo revierte
            Alert.alert('❌ Error', featureError.message || 'El reto se creó pero no se pudo asignar como destacado');
          }
        }

        Alert.alert('✅ Éxito', 'Reto creado correctamente', [
          { text: 'OK', onPress: () => router.replace(`/admin/featured?newId=${data.id}`) },
        ]);
        return;
      }
    } catch (error) {
      Alert.alert('❌ Error', error.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{id ? 'Editar Reto' : 'Crear Reto'}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Información básica */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Información básica</Text>

          <Text style={s.label}>Nombre *</Text>
          <TextInput
            style={s.input}
            value={formData.name}
            onChangeText={(t) => setFormData({ ...formData, name: t })}
            placeholder="Ej: Hipertrofia Total"
            placeholderTextColor={T3}
          />

          <Text style={s.label}>Subtítulo</Text>
          <TextInput
            style={s.input}
            value={formData.subtitle}
            onChangeText={(t) => setFormData({ ...formData, subtitle: t })}
            placeholder="Ej: Plan de 30 días para ganar masa muscular"
            placeholderTextColor={T3}
          />

          <Text style={s.label}>Descripción larga</Text>
          <TextInput
            style={[s.input, s.textArea]}
            value={formData.description}
            onChangeText={(t) => setFormData({ ...formData, description: t })}
            placeholder="Describe el reto en detalle..."
            placeholderTextColor={T3}
            multiline
            numberOfLines={4}
          />

          <Text style={s.label}>Imagen de portada</Text>
          <TouchableOpacity style={s.imagePicker} onPress={pickImage}>
            {resolveImage(formData.image_id) ? (
              <Image source={resolveImage(formData.image_id)} style={s.previewImage} />
            ) : (
              <View style={s.imagePlaceholder}>
                <Text style={s.imageIcon}>📷</Text>
                <Text style={s.imageText}>Toca para subir imagen</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Estadísticas</Text>

          <Text style={s.label}>Duración (días)</Text>
          <TextInput
            style={s.input}
            value={String(formData.duration_days)}
            onChangeText={(t) => setFormData({ ...formData, duration_days: t })}
            keyboardType="number-pad"
            placeholderTextColor={T3}
          />

          <Text style={s.label}>Frecuencia</Text>
          <View style={s.optionsRow}>
            {FREQUENCIES.map(f => (
              <TouchableOpacity
                key={f}
                style={[s.optionBtn, formData.frequency === f && s.optionBtnActive]}
                onPress={() => setFormData({ ...formData, frequency: f })}
              >
                <Text style={[s.optionText, formData.frequency === f && s.optionTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Duración de sesión</Text>
          <View style={s.optionsRow}>
            {SESSION_TIMES.map(t => (
              <TouchableOpacity
                key={t}
                style={[s.optionBtn, formData.session_time === t && s.optionBtnActive]}
                onPress={() => setFormData({ ...formData, session_time: t })}
              >
                <Text style={[s.optionText, formData.session_time === t && s.optionTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Nivel</Text>
          <View style={s.optionsRow}>
            {LEVELS.map(l => (
              <TouchableOpacity
                key={l}
                style={[s.optionBtn, formData.level === l && s.optionBtnActive]}
                onPress={() => setFormData({ ...formData, level: l })}
              >
                <Text style={[s.optionText, formData.level === l && s.optionTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Objetivo */}
        <View style={s.section}>
          <Text style={s.sectionTitle}> Objetivo del reto</Text>
          <TextInput
            style={[s.input, s.textArea]}
            value={formData.objective}
            onChangeText={(t) => setFormData({ ...formData, objective: t })}
            placeholder="Describe el objetivo principal del reto..."
            placeholderTextColor={T3}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Días de entrenamiento */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>🏋️ Días de entrenamiento</Text>
          <Text style={s.sectionSubtext}>Define los ejercicios de cada día</Text>

          {formData.days.map((day, dayIndex) => (
            <View key={dayIndex} style={s.dayCard}>
              <View style={s.dayHeader}>
                <Text style={s.dayLabel}>{day.label}</Text>
                <TextInput
                  style={s.dayNameInput}
                  value={day.name}
                  onChangeText={(t) => {
                    const updated = [...formData.days];
                    updated[dayIndex] = { ...updated[dayIndex], name: t };
                    setFormData({ ...formData, days: updated });
                  }}
                  placeholder="Nombre del día"
                  placeholderTextColor={T3}
                />
              </View>

              {day.exercises.map((ex, exIndex) => (
                <View key={exIndex} style={s.exerciseRow}>
                  <View style={s.exerciseNumber}>
                    <Text style={s.exerciseNumberText}>{exIndex + 1}</Text>
                  </View>
                  <View style={s.exerciseInfo}>
                    <Text style={s.exerciseName}>{ex.name}</Text>
                    <Text style={s.exerciseSets}>{ex.sets} × {ex.reps} repeticiones</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeExercise(dayIndex, exIndex)}>
                    <Text style={s.removeEx}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={s.addExerciseBtn}
                onPress={() => {
                  setExerciseModal({ visible: true, dayIndex });
                  setNewExercise({ name: '', sets: '', reps: '' });
                }}
              >
                <Text style={s.addExerciseText}>+ Añadir ejercicio</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Planificación semanal */}
        <View style={s.section}>
          <Text style={s.sectionTitle}> Planificación por semanas</Text>

          {formData.phases.map((phase, index) => (
            <View key={index} style={s.phaseCard}>
              <Text style={s.phaseTitle}>Semana {phase.week}</Text>

              <Text style={s.label}>Nombre de la fase</Text>
              <TextInput
                style={s.input}
                value={phase.name}
                onChangeText={(t) => updatePhase(index, 'name', t)}
                placeholder="Ej: Adaptación"
                placeholderTextColor={T3}
              />

              <Text style={s.label}>Horario semanal</Text>
              <TextInput
                style={s.input}
                value={phase.schedule}
                onChangeText={(t) => updatePhase(index, 'schedule', t)}
                placeholder="Ej: Lun: A · Mar: B · Mié: Descanso..."
                placeholderTextColor={T3}
              />

              <Text style={s.label}>Consejo/tip</Text>
              <TextInput
                style={s.input}
                value={phase.tip}
                onChangeText={(t) => updatePhase(index, 'tip', t)}
                placeholder="Ej: Usa pesos moderados. Enfócate en la técnica."
                placeholderTextColor={T3}
              />
            </View>
          ))}
        </View>

        {/* Botón guardar */}
        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={s.saveBtnText}>
            {saving ? 'Guardando...' : (id ? 'Actualizar Reto' : 'Crear Reto')}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal para añadir ejercicio */}
      <Modal visible={exerciseModal.visible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Añadir ejercicio a {formData.days[exerciseModal.dayIndex]?.label}</Text>
              <TouchableOpacity onPress={() => setExerciseModal({ visible: false, dayIndex: -1 })}>
                <Text style={s.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Nombre del ejercicio</Text>
            <TextInput
              style={s.input}
              value={newExercise.name}
              onChangeText={(t) => setNewExercise({ ...newExercise, name: t })}
              placeholder="Ej: Press banca"
              placeholderTextColor={T3}
            />

            {/* Sugerencias rápidas */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.suggestionsScroll}>
              {EXERCISES_DB.filter(e => e.toLowerCase().includes(newExercise.name.toLowerCase()) && e !== newExercise.name).slice(0, 8).map(ex => (
                <TouchableOpacity
                  key={ex}
                  style={s.suggestionChip}
                  onPress={() => setNewExercise({ ...newExercise, name: ex })}
                >
                  <Text style={s.suggestionText}>{ex}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Series</Text>
                <TextInput
                  style={s.input}
                  value={newExercise.sets}
                  onChangeText={(t) => setNewExercise({ ...newExercise, sets: t })}
                  placeholder="3"
                  placeholderTextColor={T3}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.label}>Repeticiones</Text>
                <TextInput
                  style={s.input}
                  value={newExercise.reps}
                  onChangeText={(t) => setNewExercise({ ...newExercise, reps: t })}
                  placeholder="8-12"
                  placeholderTextColor={T3}
                />
              </View>
            </View>

            <TouchableOpacity
              style={s.modalSaveBtn}
              onPress={() => addExerciseToDay(exerciseModal.dayIndex)}
            >
              <Text style={s.modalSaveBtnText}>Añadir ejercicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loading: { flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 60, paddingBottom: 20, gap: 16,
  },
  backBtn: { paddingVertical: 8 },
  backBtnText: { color: ACCENT, fontSize: 16, fontWeight: '700' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: T1 },
  scrollContent: { paddingHorizontal: 20 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: T1, marginBottom: 12 },
  sectionSubtext: { fontSize: 12, color: T3, marginTop: -8, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', color: T2, marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: SURFACE2, borderRadius: 12, padding: 14, color: T1,
    fontSize: 15, borderWidth: 1, borderColor: BORDER2,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  imagePicker: {
    backgroundColor: SURFACE2, borderRadius: 12, borderWidth: 1,
    borderColor: BORDER2, overflow: 'hidden', marginTop: 8,
  },
  imagePlaceholder: {
    paddingVertical: 40, alignItems: 'center', justifyContent: 'center',
  },
  imageIcon: { fontSize: 32, marginBottom: 8 },
  imageText: { color: T3, fontSize: 14 },
  previewImage: { width: '100%', height: 180, resizeMode: 'cover' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER2,
  },
  optionBtnActive: { backgroundColor: ACCENT + '20', borderColor: ACCENT },
  optionText: { color: T2, fontWeight: '600', fontSize: 13 },
  optionTextActive: { color: ACCENT },
  dayCard: {
    backgroundColor: SURFACE, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: BORDER,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  dayLabel: {
    backgroundColor: ACCENT, color: '#000', fontWeight: '800',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, fontSize: 12,
  },
  dayNameInput: {
    flex: 1, backgroundColor: SURFACE2, borderRadius: 8, padding: 8,
    color: T1, fontSize: 14,
  },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BORDER, gap: 12,
  },
  exerciseNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: ACCENT + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  exerciseNumberText: { color: ACCENT, fontWeight: '800', fontSize: 12 },
  exerciseInfo: { flex: 1 },
  exerciseName: { color: T1, fontWeight: '700', fontSize: 14 },
  exerciseSets: { color: T3, fontSize: 12, marginTop: 2 },
  removeEx: { color: RED, fontSize: 16, fontWeight: '700' },
  addExerciseBtn: {
    marginTop: 12, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: BORDER2, borderRadius: 10,
  },
  addExerciseText: { color: ACCENT, fontWeight: '700', fontSize: 13 },
  phaseCard: {
    backgroundColor: SURFACE, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: BORDER,
    borderLeftWidth: 4, borderLeftColor: ACCENT,
  },
  phaseTitle: { color: ACCENT, fontWeight: '800', fontSize: 14, marginBottom: 12 },
  saveBtn: {
    backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 20,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: T1, flex: 1 },
  closeBtn: { fontSize: 24, color: T2 },
  suggestionsScroll: { marginVertical: 8 },
  suggestionChip: {
    backgroundColor: SURFACE2, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: BORDER,
  },
  suggestionText: { color: T2, fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', marginTop: 12 },
  modalSaveBtn: {
    backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 20,
  },
  modalSaveBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
});