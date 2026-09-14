// src/screens/RoutinesScreen.js
// FASE 4: rutinas completas — crear / editar / duplicar / eliminar / reordenar,
// con programación por ejercicio (series, rango de reps, descanso, RIR/RPE, notas)
// persistida en la tabla routine_exercises y botón "Entrenar" que abre el workout.
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
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

const REST_PRESETS = [45, 60, 90, 120, 180];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function RoutinesScreen() {
  const [routines, setRoutines]           = useState([]);
  const [name, setName]                   = useState('');
  const [selected, setSelected]           = useState([]); // [{id,name,muscle,isCustom,sets,repsMin,repsMax,rest,rir,rpe,notes}]
  const [editId, setEditId]               = useState(null);
  const [search, setSearch]               = useState('');
  const [muscleFilter, setMuscleFilter]   = useState('Todos');
  const [step, setStep]                   = useState('name'); // 'name' | 'exercises' | 'config'
  const [allExercises, setAllExercises]   = useState([]);
  const [saving, setSaving]               = useState(false);
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

  // Sempre que el paso cambie a config, subir al tope.
  useEffect(() => {
    if (step === 'config') scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);
  const scrollRef = React.useRef(null);

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
    setSelected(prev => {
      const exists = prev.some(x => x.id === id);
      if (exists) return prev.filter(x => x.id !== id);
      const ex = getExercise(id);
      return [...prev, {
        id,
        name: ex?.name || 'Ejercicio',
        muscle: ex?.muscle || '',
        isCustom: !!ex?.isCustom,
        sets: 3,
        repsMin: 8,
        repsMax: 12,
        rest: 90,
        rir: 2,
        rpe: '',
        notes: '',
      }];
    });
  }

  function updateSelected(id, patch) {
    setSelected(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  function moveSelected(id, dir) {
    setSelected(prev => {
      const i = prev.findIndex(x => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function resetForm() {
    setName('');
    setSelected([]);
    setEditId(null);
    setStep('name');
    setSearch('');
    setMuscleFilter('Todos');
  }

  // ── Guardar rutina (crear o actualizar) ────────────────────────────────────
  async function saveRoutine() {
    if (!name.trim()) {
      showAlert('Falta el nombre', 'Ponle un nombre a tu rutina.');
      return;
    }
    if (!selected.length) {
      showAlert('Sin ejercicios', 'Selecciona al menos un ejercicio.');
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); showAlert('Error', 'Inicia sesión para guardar.'); return; }

    const routinePayload = {
      user_id: user.id,
      name: name.trim(),
      exercise_ids: selected.map(x => x.id),
    };

    let routineId = editId;
    if (editId) {
      const { error } = await supabase.from('routines').update(routinePayload).eq('id', editId).select('id').single();
      if (error) { setSaving(false); showAlert('Error', error.message); return; }
    } else {
      const { data, error } = await supabase.from('routines').insert(routinePayload).select('id').single();
      if (error) { setSaving(false); showAlert('Error', error.message); return; }
      routineId = data.id;
    }

    // Persistir la programación completa (sustituye la anterior).
    await supabase.from('routine_exercises').delete().eq('routine_id', routineId);

    const rows = selected.map((x, i) => ({
      routine_id: routineId,
      position: i,
      exercise_id: String(x.id),
      exercise_name: x.name,
      target_sets: x.sets || 1,
      target_reps_min: x.repsMin || null,
      target_reps_max: x.repsMax || null,
      rest_seconds: x.rest || null,
      rir: x.rir ?? null,
      rpe: x.rpe ? Number(x.rpe) : null,
      notes: x.notes?.trim() || null,
    }));
    const { error: insErr } = await supabase.from('routine_exercises').insert(rows);
    setSaving(false);
    if (insErr) { showAlert('Error', insErr.message); return; }

    resetForm();
    initScreen();
    showAlert(editId ? 'Rutina actualizada' : 'Rutina creada', 'Se guardó correctamente.');
  }

  // ── Editar rutina ───────────────────────────────────────────────────────────
  async function editRoutine(r) {
    const { data } = await supabase
      .from('routine_exercises')
      .select('exercise_id, exercise_name, position, target_sets, target_reps_min, target_reps_max, rest_seconds, rir, rpe, notes')
      .eq('routine_id', r.id)
      .order('position', { ascending: true });

    const ids = r.exercise_ids || [];
    let items;
    if (Array.isArray(data) && data.length > 0) {
      items = data.map(row => {
        const ex = getExercise(row.exercise_id);
        return {
          id: row.exercise_id,
          name: row.exercise_name || ex?.name || 'Ejercicio',
          muscle: ex?.muscle || '',
          isCustom: !!ex?.isCustom,
          sets: row.target_sets || 1,
          repsMin: row.target_reps_min ?? 8,
          repsMax: row.target_reps_max ?? 12,
          rest: row.rest_seconds ?? 90,
          rir: row.rir ?? 2,
          rpe: row.rpe != null ? String(row.rpe) : '',
          notes: row.notes || '',
        };
      });
    } else {
      items = ids.map(id => {
        const ex = getExercise(id);
        return {
          id,
          name: ex?.name || 'Ejercicio',
          muscle: ex?.muscle || '',
          isCustom: !!ex?.isCustom,
          sets: 3,
          repsMin: 8,
          repsMax: 12,
          rest: 90,
          rir: 2,
          rpe: '',
          notes: '',
        };
      });
    }

    setName(r.name);
    setSelected(items);
    setEditId(r.id);
    setStep('config');
  }

  // ── Duplicar rutina ─────────────────────────────────────────────────────────
  async function duplicateRoutine(r) {
    const { data: rows } = await supabase
      .from('routine_exercises')
      .select('exercise_id, exercise_name, target_sets, target_reps_min, target_reps_max, rest_seconds, rir, rpe, notes')
      .eq('routine_id', r.id)
      .order('position', { ascending: true });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const copyName = `${r.name} (copia)`;
    const { data: newR, error: insErr } = await supabase
      .from('routines')
      .insert({ user_id: user.id, name: copyName, exercise_ids: r.exercise_ids || [] })
      .select('id')
      .single();
    if (insErr) { showAlert('Error', insErr.message); return; }

    if (Array.isArray(rows) && rows.length > 0) {
      const newRows = rows.map((row, i) => ({
        routine_id: newR.id,
        position: i,
        exercise_id: row.exercise_id,
        exercise_name: row.exercise_name,
        target_sets: row.target_sets,
        target_reps_min: row.target_reps_min,
        target_reps_max: row.target_reps_max,
        rest_seconds: row.rest_seconds,
        rir: row.rir,
        rpe: row.rpe,
        notes: row.notes,
      }));
      await supabase.from('routine_exercises').insert(newRows);
    }

    initScreen();
    showAlert('Rutina duplicada', copyName);
  }

  // ── Eliminar rutina ─────────────────────────────────────────────────────────
  function deleteRoutine(id) {
    showAlert(
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

  // ── Entrenar ────────────────────────────────────────────────────────────────
  function startWorkout(r) {
    const routineObj = {
      id: r.is_challenge ? undefined : r.id,
      name: r.name,
      exercise_ids: r.exercise_ids || [],
    };
    router.push(`/workout?routine=${encodeURIComponent(JSON.stringify(routineObj))}`);
  }

  // ── Guardar ejercicio custom ─────────────────────────────────────────────────
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
    showAlert('Ejercicio creado', 'Tu ejercicio se guardó en tu cuenta.');
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
        ref={scrollRef}
        style={s.container}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* HEADER */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Rutinas</Text>
          <Text style={s.headerSub}>{routines.length} guardadas · {editId ? 'editando' : 'nueva'}</Text>
        </View>

        {/* ── STEP 1: NOMBRE ── */}
        <View style={s.card}>
          <StepBadge number="1" label="NOMBRE" active={step === 'name'} />
          <Text style={s.cardTitle}>{editId ? 'Renombrar rutina' : '¿Cómo se llama tu rutina?'}</Text>

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

            {/* Filtro por músculo */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.filterScroll}
              keyboardShouldPersistTaps="handled"
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
                const sel = selected.some(x => x.id === ex.id);
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
                  <Text style={s.emptySearchText}>{`Sin resultados para "${search}"`}</Text>
                  <TouchableOpacity onPress={() => setShowModal(true)} style={s.emptySearchBtn}>
                    <Text style={s.emptySearchBtnText}>Crear este ejercicio →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Barra configurar */}
            {selected.length > 0 && (
              <View style={s.saveBar}>
                <Text style={s.saveBarCount}>{selected.length} seleccionados</Text>
                <TouchableOpacity style={s.saveBtn} onPress={() => setStep('config')} activeOpacity={0.8}>
                  <Text style={s.saveBtnText}>Configurar →</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={resetForm} style={s.cancelLink}>
              <Text style={s.cancelLinkText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 3: CONFIGURACIÓN POR EJERCICIO ── */}
        {step === 'config' && (
          <View style={s.card}>
            <StepBadge number="3" label="PROGRAMACIÓN" active />

            <View style={s.step2Header}>
              <Text style={s.cardTitle}>Ajusta cada ejercicio</Text>
              <TouchableOpacity onPress={() => setStep('exercises')} style={s.backBtn} activeOpacity={0.7}>
                <Text style={s.backBtnText}>← Ejercicios</Text>
              </TouchableOpacity>
            </View>

            {selected.map((ex, idx) => (
              <View key={String(ex.id)} style={s.configCard}>
                {/* Cabecera: orden + nombre + acciones */}
                <View style={s.configHdr}>
                  <View style={s.configIdx}>
                    <Text style={s.configIdxText}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.configName}>{ex.name}</Text>
                    {ex.muscle ? <Text style={s.configMuscle}>{ex.muscle}</Text> : null}
                  </View>
                  <View style={s.reorderBtns}>
                    <TouchableOpacity
                      onPress={() => moveSelected(ex.id, -1)}
                      disabled={idx === 0}
                      style={[s.reorderBtn, idx === 0 && { opacity: 0.3 }]}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Text style={s.reorderBtnText}>↑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveSelected(ex.id, 1)}
                      disabled={idx === selected.length - 1}
                      style={[s.reorderBtn, idx === selected.length - 1 && { opacity: 0.3 }]}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Text style={s.reorderBtnText}>↓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => toggleEx(ex.id)}
                      style={[s.reorderBtn, { borderColor: RED }]}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Text style={[s.reorderBtnText, { color: RED }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Series */}
                <View style={s.configRow}>
                  <Text style={s.configLabel}>SERIES</Text>
                  <View style={s.stepper}>
                    <TouchableOpacity style={s.stepperBtn} onPress={() => updateSelected(ex.id, { sets: Math.max(1, (ex.sets || 3) - 1) })}>
                      <Text style={s.stepperBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={s.stepperVal}>{ex.sets}</Text>
                    <TouchableOpacity style={s.stepperBtn} onPress={() => updateSelected(ex.id, { sets: Math.min(12, (ex.sets || 3) + 1) })}>
                      <Text style={s.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Rango de reps */}
                <View style={s.configRow}>
                  <Text style={s.configLabel}>REPS</Text>
                  <View style={{ flex: 1 }} />
                  <TextInput
                    style={[s.miniInput, { width: 54 }]}
                    value={ex.repsMin != null ? String(ex.repsMin) : ''}
                    onChangeText={v => updateSelected(ex.id, { repsMin: v.replace(/[^0-9]/g, '') })}
                    keyboardType="number-pad"
                    placeholder="min"
                    placeholderTextColor={T3}
                  />
                  <Text style={s.configHint}>a</Text>
                  <TextInput
                    style={[s.miniInput, { width: 54 }]}
                    value={ex.repsMax != null ? String(ex.repsMax) : ''}
                    onChangeText={v => updateSelected(ex.id, { repsMax: v.replace(/[^0-9]/g, '') })}
                    keyboardType="number-pad"
                    placeholder="máx"
                    placeholderTextColor={T3}
                  />
                </View>

                {/* Descanso */}
                <View style={s.configRow}>
                  <Text style={s.configLabel}>DESCANSO</Text>
                  <View style={{ flex: 1 }} />
                  <View style={s.restPills}>
                    {REST_PRESETS.map(sec => (
                      <TouchableOpacity
                        key={sec}
                        onPress={() => updateSelected(ex.id, { rest: sec })}
                        style={[s.restPill, ex.rest === sec && s.restPillActive]}
                      >
                        <Text style={[s.restPillText, ex.rest === sec && s.restPillTextActive]}>
                          {sec >= 120 ? `${sec / 60}′` : `${sec}″`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* RIR */}
                <View style={s.configRow}>
                  <Text style={s.configLabel}>RIR</Text>
                  <View style={{ flex: 1 }} />
                  <View style={s.stepper}>
                    <TouchableOpacity style={s.stepperBtn} onPress={() => updateSelected(ex.id, { rir: Math.max(0, (ex.rir ?? 2) - 1) })}>
                      <Text style={s.stepperBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={s.stepperVal}>{ex.rir ?? 0}</Text>
                    <TouchableOpacity style={s.stepperBtn} onPress={() => updateSelected(ex.id, { rir: Math.min(5, (ex.rir ?? 0) + 1) })}>
                      <Text style={s.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* RPE */}
                <View style={s.configRow}>
                  <Text style={s.configLabel}>RPE</Text>
                  <View style={{ flex: 1 }} />
                  <TextInput
                    style={[s.miniInput, { width: 54 }]}
                    value={ex.rpe}
                    onChangeText={v => updateSelected(ex.id, { rpe: v.replace(/[^0-9.]/g, '') })}
                    keyboardType="decimal-pad"
                    placeholder="opcional"
                    placeholderTextColor={T3}
                  />
                </View>

                {/* Notas */}
                <View style={s.configRow}>
                  <Text style={s.configLabel}>NOTAS</Text>
                  <View style={{ flex: 1 }} />
                </View>
                <TextInput
                  style={s.notesInput}
                  value={ex.notes}
                  onChangeText={v => updateSelected(ex.id, { notes: v })}
                  placeholder="Ej: parar 2 reps antes del fallo…"
                  placeholderTextColor={T3}
                  multiline
                />
              </View>
            ))}

            {/* Guardar */}
            <View style={s.saveBar}>
              <Text style={s.saveBarCount}>{selected.length} ejercicios</Text>
              <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={saveRoutine} activeOpacity={0.8} disabled={saving}>
                <Text style={s.saveBtnText}>{saving ? 'Guardando…' : (editId ? 'Actualizar rutina' : 'Guardar rutina')}</Text>
              </TouchableOpacity>
            </View>

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
              const isUuid = r.id && UUID_RE.test(String(r.id));

              return (
                <View key={r.id} style={s.routineCard}>
                  <View style={[s.routineBar, { backgroundColor: dot }]} />
                  <View style={s.routineInner}>
                    <View style={s.routineTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.routineName}>{r.name}</Text>
                        <Text style={s.routineMeta}>{ids.length} ejercicios</Text>
                      </View>
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

                    {/* Acciones */}
                    <View style={s.routineActions}>
                      {isUuid && (
                        <TouchableOpacity style={s.actionBtnPrimary} onPress={() => startWorkout(r)} activeOpacity={0.8}>
                          <Text style={s.actionBtnPrimaryText}>▶ Entrenar</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={s.actionBtn} onPress={() => editRoutine(r)} activeOpacity={0.7}>
                        <Text style={s.actionBtnText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.actionBtn} onPress={() => duplicateRoutine(r)} activeOpacity={0.7}>
                        <Text style={s.actionBtnText}>Duplicar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.actionBtnDelete}
                        onPress={() => deleteRoutine(r.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                        activeOpacity={0.7}
                      >
                        <Text style={s.actionBtnDeleteText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Si no hay rutinas y no está creando, mostrar invitación */}
        {routines.length === 0 && step === 'name' && (
          <View style={s.emptyAll}>
            <Text style={s.emptyAllTitle}>Crea tu primera rutina</Text>
            <Text style={s.emptyAllText}>Nombre, ejercicios y programación: series, reps, descanso, RIR y notas.</Text>
          </View>
        )}

      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL CREAR EJERCICIO CUSTOM
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

const RED = '#FF4D4D';

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
  backBtn:      { backgroundColor: SURFACE2, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: BORDER2 },
  backBtnText:  { fontSize: 12, fontWeight: '700', color: T2 },

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

  // ── Config por ejercicio ──
  configCard:  { backgroundColor: SURFACE2, borderRadius: 16, borderWidth: 1, borderColor: BORDER2, padding: 14, marginBottom: 12 },
  configHdr:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  configIdx:   { width: 28, height: 28, borderRadius: 14, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  configIdxText: { fontSize: 13, fontWeight: '800', color: '#000' },
  configName:  { fontSize: 15, fontWeight: '700', color: T1, letterSpacing: -0.2 },
  configMuscle:{ fontSize: 11, color: T3, marginTop: 2, fontWeight: '500' },
  reorderBtns: { flexDirection: 'row', gap: 6 },
  reorderBtn:  { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: BORDER2, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE },
  reorderBtnText: { fontSize: 14, fontWeight: '700', color: T2 },
  configRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  configLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: T3, width: 76 },
  configHint:  { fontSize: 12, color: T3, marginHorizontal: 8, fontWeight: '700' },
  miniInput:   { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER2, borderRadius: 10, color: T1, fontSize: 15, fontWeight: '700', textAlign: 'center', paddingVertical: 8, paddingHorizontal: 6 },
  notesInput:  { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER2, borderRadius: 12, color: T1, fontSize: 13, paddingHorizontal: 12, paddingVertical: 10, minHeight: 48, marginBottom: 4 },
  stepper:     { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER2, borderRadius: 10, overflow: 'hidden' },
  stepperBtn:  { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontSize: 18, fontWeight: '800', color: T2 },
  stepperVal:  { minWidth: 34, textAlign: 'center', fontSize: 15, fontWeight: '800', color: T1 },
  restPills:   { flexDirection: 'row', gap: 5 },
  restPill:         { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER2 },
  restPillActive:   { backgroundColor: ACCENT + '22', borderColor: ACCENT },
  restPillText:     { fontSize: 11, fontWeight: '700', color: T2 },
  restPillTextActive:{ color: ACCENT },

  // ── Acciones de rutina ──
  routineActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  actionBtnPrimary: { backgroundColor: ACCENT, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, flexGrow: 1 },
  actionBtnPrimaryText: { fontSize: 13, fontWeight: '800', color: '#000' },
  actionBtn:  { backgroundColor: SURFACE2, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: BORDER2 },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: T2 },
  actionBtnDelete: { width: 32, height: 34, borderRadius: 10, backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER2, alignItems: 'center', justifyContent: 'center' },
  actionBtnDeleteText: { fontSize: 12, color: RED, fontWeight: '700' },

  // ── Fila de rutinas guardadas ──
  sectionHeader:{ marginBottom: 12, marginTop: 8 },
  sectionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: T3, textTransform: 'uppercase' },

  routineCard:  { backgroundColor: SURFACE, borderRadius: 20, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', flexDirection: 'row', marginBottom: 10 },
  routineBar:   { width: 4 },
  routineInner: { flex: 1, padding: 16 },
  routineTop:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  routineName:  { fontSize: 16, fontWeight: '700', color: T1, letterSpacing: -0.3 },
  routineMeta:  { fontSize: 11, color: T3, marginTop: 3, fontWeight: '500' },

  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip:         { backgroundColor: SURFACE2, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: BORDER },
  chipText:     { fontSize: 11, color: T2, fontWeight: '600' },
  chipMore:     { borderColor: BORDER },
  chipMoreText: { color: T3 },

  emptyAll:     { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 },
  emptyAllTitle:{ fontSize: 16, fontWeight: '700', color: T1 },
  emptyAllText: { fontSize: 13, color: T3, textAlign: 'center', marginTop: 8, lineHeight: 20 },
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