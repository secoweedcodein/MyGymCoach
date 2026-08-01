// src/screens/RoutinesScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import {
  MUSCLES,
  getExercise,
  createCustomExercise,
  loadCustomExercises,
  getAllExercises,
} from './data/exercises';
import { colors, radius, spacing } from '../../lib/theme';
import ExerciseIcon from '../../components/ExerciseIcon';
import { useAlert } from "../context/AlertContext";
const ACCENT   = '#C0FF3E';
const BG       = '#0D0D0D';
const SURFACE  = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER   = '#FFFFFF0D';
const BORDER2  = '#FFFFFF18';
const T1       = '#FFFFFF';
const T2       = '#A0A0A0';
const T3       = '#555555';
export default function RoutinesScreen() {
  const [routines, setRoutines]           = useState([]);
  const [name, setName]                   = useState('');
  const [selectedIds, setSelectedIds]     = useState([]);
  const [search, setSearch]               = useState('');
  const [muscleFilter, setMuscleFilter]   = useState('Todos');
  const [step, setStep]                   = useState('name'); // 'name' | 'exercises'
  const [allExercises, setAllExercises]   = useState([]);
const { showAlert } = useAlert();
  // ── Estado modal crear ejercicio custom ──
  const [showModal, setShowModal]           = useState(false);
  const [newExName, setNewExName]           = useState('');
  const [newExMuscle, setNewExMuscle]       = useState('Pecho');
  const [newExType, setNewExType]           = useState('Hipertrofia');
  const [savingCustom, setSavingCustom]     = useState(false);

  // ── Carga inicial y en cada foco ────────────────────────────────────────────
  useFocusEffect(useCallback(() => {
    initScreen();
  }, []));

  async function initScreen() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Cargar rutinas
    const { data } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setRoutines(data);

    // Cargar ejercicios custom y refrescar lista completa
    await loadCustomExercises(supabase);
    setAllExercises(getAllExercises());
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function toggleEx(id) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function resetForm() {
    setName('');
    setSelectedIds([]);
    setStep('name');
    setSearch('');
    setMuscleFilter('Todos');
  }

  // ── Guardar rutina ───────────────────────────────────────────────────────────
  async function saveRoutine() {
    if (!name.trim()) {
      showAlert('Falta el nombre', 'Ponle un nombre a tu rutina.');
      return;
    }
    if (!selectedIds.length) {
      showAlert('Sin ejercicios', 'Selecciona al menos un ejercicio.');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('routines')
      .insert({ user_id: user.id, name: name.trim(), exercise_ids: selectedIds })
      .select();
    if (error) { showAlert('Error', error.message); return; }
    resetForm();
    initScreen();
  }

  // ── Eliminar rutina ──────────────────────────────────────────────────────────
  async function deleteRoutine(id) {
    showAlert (
      'Eliminar rutina',
      '¿Seguro que quieres eliminarla?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('routines').delete().eq('id', id);
            initScreen();
          },
        },
      ]
    );
  }

  // ── Guardar ejercicio custom ─────────────────────────────────────────────────
  // FIX: ahora está en el scope del componente, no dentro de saveRoutine
  async function saveCustomExercise() {
    if (!newExName.trim()) {
      showAlert('Error', 'Escribe un nombre para el ejercicio.');
      return;
    }
    setSavingCustom(true);
    const created = await createCustomExercise(supabase, {
      name:   newExName.trim(),
      muscle: newExMuscle,
      type:   newExType,
    });
    setSavingCustom(false);

    if (!created) {
      showAlert('Error', 'No se pudo crear el ejercicio. Intenta de nuevo.');
      return;
    }

    // Refrescar lista de ejercicios
    await loadCustomExercises(supabase);
    setAllExercises(getAllExercises());

    // Limpiar y cerrar modal
    setNewExName('');
    setNewExMuscle('Pecho');
    setNewExType('Hipertrofia');
    setShowModal(false);
  }

  // ── Lista filtrada ───────────────────────────────────────────────────────────
  const filtered = allExercises.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = muscleFilter === 'Todos' || e.muscle === muscleFilter;
    return matchSearch && matchMuscle;
  });

  const accentColors = ['#C0FF3E', '#3EE5FF', '#FF6B3E', '#FF3EAA'];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* HEADER */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Rutinas</Text>
          <Text style={s.headerSub}>{routines.length} guardadas</Text>
        </View>

        {/* ── STEP 1: NOMBRE ── */}
        <View style={s.card}>
          <StepBadge number="1" label="NOMBRE" active />
          <Text style={s.cardTitle}>¿Cómo se llama tu rutina?</Text>

          <TextInput
            style={[s.input, name.length > 0 && s.inputActive]}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Push Day A, Full Body…"
            placeholderTextColor={T3}
            returnKeyType="next"
            onSubmitEditing={() => name.trim() && setStep('exercises')}
          />

          {step === 'name' && (
            <TouchableOpacity
              style={[s.continueBtn, !name.trim() && s.continueBtnDisabled]}
              onPress={() => name.trim() && setStep('exercises')}
              activeOpacity={0.8}
            >
              <Text style={s.continueBtnText}>Elegir ejercicios →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── STEP 2: EJERCICIOS ── */}
        {step === 'exercises' && (
          <View style={s.card}>
            <StepBadge number="2" label="EJERCICIOS" active />

            {/* Título + botón crear custom */}
            <View style={s.step2Header}>
              <Text style={s.cardTitle}>Selecciona los ejercicios</Text>
              <TouchableOpacity
                style={s.customBtn}
                onPress={() => setShowModal(true)}
                activeOpacity={0.8}
              >
                <Text style={s.customBtnText}>+ Crear</Text>
              </TouchableOpacity>
            </View>

            {/* Buscador */}
            <View style={s.searchRow}>
              <Text style={s.searchIcon}>🔍</Text>
              <TextInput
                style={s.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar ejercicio…"
                placeholderTextColor={T3}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={s.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filtro por músculo — FIX: fuera del ScrollView de ejercicios */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.filterScroll}
            >
              {MUSCLES.map(m => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMuscleFilter(m)}
                  style={[s.filterPill, muscleFilter === m && s.filterPillActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[s.filterPillText, muscleFilter === m && s.filterPillTextActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Lista de ejercicios */}
            <View style={s.exList}>
              {filtered.slice(0, 150).map(ex => {
                const sel = selectedIds.includes(ex.id);
                return (
                  <TouchableOpacity
                    key={String(ex.id)}
                    style={[s.exRow, sel && s.exRowSel]}
                    onPress={() => toggleEx(ex.id)}
                    activeOpacity={0.7}
                  >
                    <ExerciseIcon exercise={ex} size="sm" />
                    <View style={s.exInfo}>
                      <Text style={[s.exName, sel && s.exNameSel]}>{ex.name}</Text>
                      <Text style={s.exMuscle}>
                        {ex.muscle}{ex.isCustom ? '  •  Custom' : ''}
                      </Text>
                    </View>
                    <View style={[s.checkbox, sel && s.checkboxSel]}>
                      {sel && <Text style={s.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {filtered.length === 0 && (
                <View style={s.emptySearch}>
                  <Text style={s.emptySearchText}>Sin resultados para "{search}"</Text>
                  <TouchableOpacity onPress={() => setShowModal(true)} style={s.emptySearchBtn}>
                    <Text style={s.emptySearchBtnText}>Crear este ejercicio →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Barra guardar */}
            {selectedIds.length > 0 && (
              <View style={s.saveBar}>
                <Text style={s.saveBarCount}>{selectedIds.length} seleccionados</Text>
                <TouchableOpacity style={s.saveBtn} onPress={saveRoutine} activeOpacity={0.8}>
                  <Text style={s.saveBtnText}>Guardar rutina</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={resetForm} style={s.cancelLink}>
              <Text style={s.cancelLinkText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── RUTINAS GUARDADAS ── */}
        {routines.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionLabel}>GUARDADAS</Text>
            </View>

            {routines.map((r, idx) => {
              const ids   = r.exercise_ids || [];
              const shown = ids.slice(0, 3).map(id => getExercise(id)?.name || '?');
              const extra = ids.length - 3;
              const dot   = accentColors[idx % accentColors.length];

              return (
                <View key={r.id} style={s.routineCard}>
                  <View style={[s.routineBar, { backgroundColor: dot }]} />
                  <View style={s.routineInner}>
                    <View style={s.routineTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.routineName}>{r.name}</Text>
                        <Text style={s.routineMeta}>{ids.length} ejercicios</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => deleteRoutine(r.id)}
                        style={s.deleteBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={s.deleteBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={s.chipRow}>
                      {shown.map((n, i) => (
                        <View key={i} style={s.chip}>
                          <Text style={s.chipText}>{n}</Text>
                        </View>
                      ))}
                      {extra > 0 && (
                        <View style={[s.chip, s.chipMore]}>
                          <Text style={[s.chipText, s.chipMoreText]}>+{extra} más</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL CREAR EJERCICIO CUSTOM
          FIX: fuera del ScrollView, usando Modal nativo de RN
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={m.overlay}>
          <View style={m.sheet}>

            {/* Handle */}
            <View style={m.handle} />

            <Text style={m.title}>Nuevo ejercicio</Text>
            <Text style={m.subtitle}>Se guardará en tu cuenta y estará disponible en todas tus rutinas.</Text>

            {/* Nombre */}
            <Text style={m.label}>NOMBRE</Text>
            <TextInput
              style={m.input}
              value={newExName}
              onChangeText={setNewExName}
              placeholder="Ej: Curl inclinado unilateral"
              placeholderTextColor={T3}
              autoFocus
              returnKeyType="done"
            />

            {/* Músculo */}
            <Text style={m.label}>MÚSCULO</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={m.muscleScroll}
            >
              {MUSCLES.filter(m => m !== 'Todos').map(muscle => (
                <TouchableOpacity
                  key={muscle}
                  onPress={() => setNewExMuscle(muscle)}
                  style={[m.pill, newExMuscle === muscle && m.pillActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[m.pillText, newExMuscle === muscle && m.pillTextActive]}>
                    {muscle}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Tipo */}
            <Text style={m.label}>TIPO</Text>
            <View style={m.typeRow}>
              {['Fuerza', 'Hipertrofia', 'Funcional', 'Cardio'].map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setNewExType(t)}
                  style={[m.typePill, newExType === t && m.typePillActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[m.typePillText, newExType === t && m.typePillTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Botones */}
            <TouchableOpacity
              style={[m.saveBtn, savingCustom && { opacity: 0.6 }]}
              onPress={saveCustomExercise}
              activeOpacity={0.8}
              disabled={savingCustom}
            >
              <Text style={m.saveBtnText}>
                {savingCustom ? 'Guardando…' : 'Guardar ejercicio'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={m.cancelBtn}
              onPress={() => {
                setNewExName('');
                setNewExMuscle('Pecho');
                setNewExType('Hipertrofia');
                setShowModal(false);
              }}
            >
              <Text style={m.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </>
  );
}

/* ── StepBadge ── */
function StepBadge({ number, label, active }) {
  return (
    <View style={sb.row}>
      <View style={[sb.circle, active && sb.circleActive]}>
        <Text style={[sb.num, active && sb.numActive]}>{number}</Text>
      </View>
      <Text style={sb.label}>{label}</Text>
    </View>
  );
}

/* ── Styles ── */
const sb = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  circle:       { width: 22, height: 22, borderRadius: 11, backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER2, alignItems: 'center', justifyContent: 'center' },
  circleActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  num:          { fontSize: 11, fontWeight: '800', color: T3 },
  numActive:    { color: '#000' },
  label:        { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: T3 },
});

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: BG },
  scrollContent:{ padding: 20, paddingBottom: 60 },

  header:       { marginBottom: 24, paddingTop: 44 },
  headerTitle:  { fontSize: 32, fontWeight: '800', color: T1, letterSpacing: -1 },
  headerSub:    { fontSize: 13, color: T3, marginTop: 4, fontWeight: '500' },

  card:         { backgroundColor: SURFACE, borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  cardTitle:    { fontSize: 18, fontWeight: '700', color: T1, marginBottom: 16, letterSpacing: -0.4 },

  step2Header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  customBtn:    { backgroundColor: SURFACE2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: BORDER2 },
  customBtnText:{ fontSize: 12, fontWeight: '800', color: ACCENT },

  input:        { backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER2, borderRadius: 14, color: T1, fontSize: 16, paddingHorizontal: 14, paddingVertical: 13, fontWeight: '500' },
  inputActive:  { borderColor: ACCENT + '55' },

  continueBtn:         { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  continueBtnDisabled: { opacity: 0.35 },
  continueBtnText:     { fontSize: 15, fontWeight: '800', color: '#000' },

  searchRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, borderWidth: 1, borderColor: BORDER2 },
  searchIcon:   { fontSize: 14, marginRight: 8 },
  searchInput:  { flex: 1, fontSize: 14, color: T1, fontWeight: '500' },
  searchClear:  { fontSize: 13, color: T3, paddingLeft: 8 },

  filterScroll: { marginBottom: 14 },
  filterPill:         { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER2, marginRight: 7 },
  filterPillActive:   { backgroundColor: ACCENT, borderColor: ACCENT },
  filterPillText:     { fontSize: 12, fontWeight: '700', color: T2 },
  filterPillTextActive:{ color: '#000' },

  exList:       { borderTopWidth: 1, borderTopColor: BORDER },
  exRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  exRowSel:     { backgroundColor: '#C0FF3E08' },
  exInfo:       { flex: 1, marginLeft: 12 },
  exName:       { fontSize: 14, fontWeight: '600', color: T2 },
  exNameSel:    { color: T1 },
  exMuscle:     { fontSize: 11, color: T3, marginTop: 2, fontWeight: '500' },
  checkbox:     { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: T3, alignItems: 'center', justifyContent: 'center' },
  checkboxSel:  { backgroundColor: ACCENT, borderColor: ACCENT },
  checkmark:    { fontSize: 11, fontWeight: '800', color: '#000' },

  emptySearch:     { paddingVertical: 24, alignItems: 'center' },
  emptySearchText: { fontSize: 13, color: T3, marginBottom: 12 },
  emptySearchBtn:  { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: BORDER2 },
  emptySearchBtnText: { fontSize: 12, color: ACCENT, fontWeight: '700' },

  saveBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: SURFACE2, borderRadius: 14, padding: 12, marginTop: 16, borderWidth: 1, borderColor: BORDER2 },
  saveBarCount: { fontSize: 13, fontWeight: '700', color: ACCENT },
  saveBtn:      { backgroundColor: ACCENT, borderRadius: 11, paddingVertical: 9, paddingHorizontal: 18 },
  saveBtnText:  { fontSize: 14, fontWeight: '800', color: '#000' },

  cancelLink:     { alignItems: 'center', marginTop: 12, paddingVertical: 6 },
  cancelLinkText: { fontSize: 13, color: T3, fontWeight: '500' },

  sectionHeader:{ marginBottom: 12, marginTop: 8 },
  sectionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: T3, textTransform: 'uppercase' },

  routineCard:  { backgroundColor: SURFACE, borderRadius: 20, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', flexDirection: 'row', marginBottom: 10 },
  routineBar:   { width: 4 },
  routineInner: { flex: 1, padding: 16 },
  routineTop:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  routineName:  { fontSize: 16, fontWeight: '700', color: T1, letterSpacing: -0.3 },
  routineMeta:  { fontSize: 11, color: T3, marginTop: 3, fontWeight: '500' },
  deleteBtn:    { backgroundColor: SURFACE2, borderRadius: 8, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText:{ fontSize: 12, color: T3, fontWeight: '700' },

  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip:         { backgroundColor: SURFACE2, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: BORDER },
  chipText:     { fontSize: 11, color: T2, fontWeight: '600' },
  chipMore:     { borderColor: BORDER },
  chipMoreText: { color: T3 },
});

// ── Modal styles (prefijo m para no colisionar) ─────────────────────────────
const m = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: SURFACE, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  handle:       { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER2, alignSelf: 'center', marginBottom: 20 },
  title:        { fontSize: 22, fontWeight: '800', color: T1, letterSpacing: -0.5, marginBottom: 6 },
  subtitle:     { fontSize: 12, color: T3, marginBottom: 20, lineHeight: 18 },
  label:        { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: T3, marginBottom: 8, marginTop: 16 },
  input:        { backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER2, borderRadius: 14, color: T1, fontSize: 16, paddingHorizontal: 14, paddingVertical: 13, fontWeight: '500' },
  muscleScroll: { marginBottom: 4 },
  pill:         { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER2, marginRight: 7 },
  pillActive:   { backgroundColor: ACCENT, borderColor: ACCENT },
  pillText:     { fontSize: 12, fontWeight: '700', color: T2 },
  pillTextActive:{ color: '#000' },
  typeRow:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typePill:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER2 },
  typePillActive:{ backgroundColor: ACCENT + '22', borderColor: ACCENT },
  typePillText: { fontSize: 12, fontWeight: '700', color: T2 },
  typePillTextActive: { color: ACCENT },
  saveBtn:      { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText:  { fontSize: 15, fontWeight: '800', color: '#000' },
  cancelBtn:    { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  cancelBtnText:{ fontSize: 13, color: T3, fontWeight: '500' },
});