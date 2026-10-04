// features/workout/screens/WorkoutScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Animated,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { getExercise, getAllExercises } from '../../../src/screens/data/exercises';
import { router, useLocalSearchParams } from 'expo-router';
import RecordToast from '../../../components/RecordToast';
import { usePersonalRecords } from '../../../src/screens/hooks/usePersonalRecords';
import { useAlert } from '../../../src/context/AlertContext';
import { useFocusEffect } from '@react-navigation/native';
import TimerFloating from '../components/TimerFloating';
import ExerciseCard from '../components/ExerciseCard';
import SetEditorModal from '../components/SetEditorModal';
import ExerciseSelectorModal from '../components/ExerciseSelectorModal';
import RestTimerModal from '../components/RestTimerModal';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { useWorkoutTimer } from '../hooks/useWorkoutTimer';
import { useRestTimer } from '../hooks/useRestTimer';
import { useWorkoutRecovery } from '../hooks/useWorkoutRecovery';

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
const GREEN = '#3DD68C';
const ORANGE = '#FF9500';
const BLUE = '#3E8EFF';
const PURPLE = '#A78BFA';



function SeriesProgress({ done, total }) {
  const pct = total > 0 ? done / total : 0;
  const widthAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(widthAnim, { toValue: pct, duration: 400, useNativeDriver: false }).start();
  }, [pct]);
  const barColor = pct === 1 ? GREEN : pct > 0.5 ? ACCENT : BLUE;
  return (
    <View style={sp.wrap}>
      <View style={sp.track}>
        <Animated.View
          style={[sp.fill, { backgroundColor: barColor, width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
        />
      </View>
      <Text style={[sp.label, pct === 1 && { color: GREEN }]}>
        {done}/{total} series
        {pct === 1 ? '  ✓' : ''}
      </Text>
    </View>
  );
}

const sp = StyleSheet.create({
  wrap: { marginTop: 8 },
  track: { height: 4, backgroundColor: SURFACE2, borderRadius: 2, overflow: 'hidden', marginBottom: 5 },
  fill: { height: 4, borderRadius: 2 },
  label: { fontSize: 11, color: T3, fontWeight: '600' },
});

export default function WorkoutScreen({ route }) {
  const { showAlert } = useAlert();
  const params = useLocalSearchParams();
  const rawRoutine = params?.routine || route?.params?.routine;
  const routine = typeof rawRoutine === 'string' ? JSON.parse(rawRoutine) : (rawRoutine || {});
  const [userId, setUserId] = useState(null);
  const pr = usePersonalRecords(userId) || {};
  const checkRecord = pr.checkRecord;
  const newRecord = pr.newRecord;
  const clearRecord = pr.clearRecord;

  const { hasRecovery, recovery, check, clear } = useWorkoutRecovery();

  const {
    exercises,
    routineName,
    startedAt,
    isActive,
    isPaused,
    hydrated,
    startSession,
    pauseSession,
    resumeSession,
    addExercise,
    addSet,
    toggleSetComplete,
    removeSet,
    finishSession,
    resetSession,
    setExercises,
  } = useWorkoutSession(userId);

  const { elapsed } = useWorkoutTimer({ isActive, isPaused, startedAt });

  const { active: restActive, seconds: restSec, start: startRest, skip: skipRest, stop: stopRest } = useRestTimer();

  const savingRef = useRef(false);
  const [showModal, setShowModal] = useState(false);
  const [modalQuery, setModalQuery] = useState('');
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showSetModal, setShowSetModal] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [editingExId, setEditingExId] = useState(null);
  const [showPlateModal, setShowPlateModal] = useState(false);
  const [plateWeight, setPlateWeight] = useState(0);
  const [showRpeModal, setShowRpeModal] = useState(false);
  const [rpeSetCtx, setRpeSetCtx] = useState({ exId: null, set: null });
  const [allExercises, setAllExercises] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUserId(data?.user?.id || null);
      } catch {
        setUserId(null);
      }
    })();
  }, []);

  useEffect(() => {
    try {
      setAllExercises(getAllExercises());
    } catch (e) {
      setAllExercises([]);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (recovery?.isActive && !isActive) {
      setShowRecoveryModal(true);
    }
  }, [hydrated, recovery, isActive]);

  useFocusEffect(React.useCallback(() => { check(); }, [check]));

  useEffect(() => {
    if (routine?.name && !isActive) {
      startSession({ routineName: routine.name });
      const exList = (routine.exercises || []).map((re, i) => {
      let ex;
      try {
        ex = getExercise(re.exercise_id);
      } catch {
        ex = null;
      }
      return {
        id: `ex-${i}`,
        name: ex?.name || re.exercise_name || 'Ejercicio',
        exerciseId: re.exercise_id,
        sets: [],
        targetSets: re.target_sets || 3,
        targetRepsMin: re.target_reps_min,
        targetRepsMax: re.target_reps_max,
        restSeconds: re.rest_seconds || 120,
        rir: re.rir || null,
        rpeTarget: re.rpe || null,
      };
      });
      setExercises(exList);
    }
  }, [routine, isActive, startSession, setExercises]);

  const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = exercises.reduce((a, e) => a + e.sets.filter(s => s.completed !== false).length, 0);

  const handleAddSet = (exId) => {
    const ex = exercises.find(e => e.id === exId);
    if (!ex) return;
    addSet(exId, { setType: 'N', weightKg: 0, reps: ex.targetRepsMin || 8, completed: true });
    const rest = ex.restSeconds || 120;
    startRest(rest);
  };

  const handleSetPress = (exId, set) => {
    setEditingExId(exId);
    setEditingSet(set);
    setShowSetModal(true);
  };

  const handleSaveSet = (s) => {
    setExercises(prev => prev.map(e => (e.id !== editingExId ? e : {
      ...e,
      sets: e.sets.map(st => (st.id === s.id ? { ...s } : st)),
    })));
    setShowSetModal(false);
    setEditingSet(null);
    setEditingExId(null);
  };

  const handleDeleteSet = (s) => {
    removeSet(editingExId, s.id);
    setShowSetModal(false);
    setEditingSet(null);
    setEditingExId(null);
  };

  const handleFinish = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const allSets = exercises.flatMap(e => e.sets.map(st => ({ ...st, exerciseName: e.name, exerciseId: e.exerciseId })));
      if (allSets.length === 0) {
        showAlert('Atención', 'Añade al menos una serie antes de finalizar.');
        savingRef.current = false;
        return;
      }
      // finishSession() encola la sesión en la cola offline (idempotente) y limpia el estado.
      await finishSession();
      showAlert('Entreno guardado', 'Se sincronizará automáticamente cuando haya conexión.');
      router.replace('/home');
    } catch (e) {
      showAlert('Error', e.message || 'No se pudo finalizar');
    } finally {
      savingRef.current = false;
    }
  };

  const handleDiscardRecovery = () => {
    clear();
    resetSession();
    setShowRecoveryModal(false);
  };

  const handleResumeRecovery = () => {
    clear();
    setShowRecoveryModal(false);
  };

  const filteredExercises = allExercises.filter(e => {
    const s = modalQuery.toLowerCase();
    if (!s) return true;
    return (e.name || '').toLowerCase().includes(s) || (e.muscle || '').toLowerCase().includes(s);
  });

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>← Atrás</Text>
          </TouchableOpacity>
          <Text style={s.title}>{routineName || 'Entreno'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <SeriesProgress done={doneSets} total={totalSets} />

        {exercises.map(ex => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            onAddSet={() => handleAddSet(ex.id)}
            onSetPress={(st) => handleSetPress(ex.id, st)}
            onSetLongPress={(st) => handleSetPress(ex.id, st)}
            onToggleSetComplete={(setId) => toggleSetComplete(ex.id, setId)}
          />
        ))}

        <TouchableOpacity style={s.addExBtn} onPress={() => setShowModal(true)}>
          <Text style={s.addExText}>+ Añadir ejercicio</Text>
        </TouchableOpacity>
      </ScrollView>

      <TimerFloating
        elapsed={elapsed}
        isPaused={isPaused}
        onPause={pauseSession}
        onResume={resumeSession}
        onFinish={handleFinish}
      />

      <RestTimerModal visible={restActive} seconds={restSec} onSkip={skipRest} onDone={skipRest} />

      <SetEditorModal
        visible={showSetModal}
        set={editingSet}
        onClose={() => setShowSetModal(false)}
        onSave={handleSaveSet}
        onDelete={handleDeleteSet}
      />

      <ExerciseSelectorModal
        visible={showModal}
        exercises={filteredExercises}
        onClose={() => setShowModal(false)}
        onSelect={(e) => {
          addExercise({ id: e.id, name: e.name, exerciseId: e.id });
          setShowModal(false);
          setModalQuery('');
        }}
      />

      <Modal visible={showRecoveryModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Entreno en curso</Text>
            <Text style={s.modalSub}>Detectamos un entrenamiento sin finalizar.</Text>
            <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={handleResumeRecovery}>
              <Text style={s.btnPrimaryText}>Reanudar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={handleDiscardRecovery}>
              <Text style={s.btnGhostText}>Descartar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {newRecord && <RecordToast record={newRecord} onDismiss={clearRecord} />}
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  back: { color: T2, fontWeight: '700' },
  title: { color: T1, fontWeight: '800', fontSize: 18 },
  addExBtn: { marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  addExText: { color: T1, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: BG, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: BORDER },
  modalTitle: { color: T1, fontWeight: '800', fontSize: 16, textAlign: 'center' },
  modalSub: { color: T2, textAlign: 'center', marginVertical: 8 },
  btn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnPrimary: { backgroundColor: ACCENT },
  btnPrimaryText: { color: '#000', fontWeight: '800' },
  btnGhost: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  btnGhostText: { color: T1, fontWeight: '800' },
});
