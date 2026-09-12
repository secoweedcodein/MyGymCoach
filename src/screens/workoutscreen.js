
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, FlatList, Animated, Vibration,
} from 'react-native';
import { supabase } from '../../lib/supabase.js';
import { getExercise, getAllExercises } from './data/exercises.js';
import { colors, radius, spacing } from '../../lib/theme.js';
import { router, useLocalSearchParams } from 'expo-router';
import ExerciseIcon from '../../components/ExerciseIcon.js';
import RecordToast from '../../components/RecordToast.js';
import { usePersonalRecords } from './hooks/usePersonalRecords.js';
import { useAlert } from "../context/AlertContext.js";
import { flushPendingSessions, saveWorkoutSession, enqueuePendingSession, isNetworkError } from '../../services/workoutQueueService';
import { PlateCalculatorModal } from '../../components/PlateCalculatorModal.js';
import { RPESelector } from '../../components/RPESelector.js';
import { GymKeypad } from '../../components/GymKeypad.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
// ── Design tokens ─────────────────────────────────────────────────────────────
const ACCENT   = '#C0FF3E';
const BG       = '#0D0D0D';
const SURFACE  = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER   = '#FFFFFF0D';
const BORDER2  = '#FFFFFF18';
const T1       = '#FFFFFF';
const T2       = '#A0A0A0';
const T3       = '#555555';
const RED      = '#FF453A';
const GREEN    = '#3DD68C';
const ORANGE   = '#FF9500';
const BLUE     = '#3E8EFF';
const PURPLE   = '#A78BFA';
// ── Persistencia de entrenamiento ─────────────────────────────────────────────
const ACTIVE_WORKOUT_KEY = '@mygymcoach_active_workout';

// Guardar estado actual en AsyncStorage
const saveActiveWorkout = async (exercisesData, routineData, elapsedData) => {
  try {
    const workoutData = {
      exercises: exercisesData,
      routine: routineData,
      elapsed: elapsedData,
      savedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(workoutData));
  } catch (error) {
    console.error('Error saving active workout:', error);
  }
};

// Cargar estado guardado
const loadActiveWorkout = async () => {
  try {
    const data = await AsyncStorage.getItem(ACTIVE_WORKOUT_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading active workout:', error);
    return null;
  }
};

// Eliminar estado guardado
const clearActiveWorkout = async () => {
  try {
    await AsyncStorage.removeItem(ACTIVE_WORKOUT_KEY);
  } catch (error) {
    console.error('Error clearing active workout:', error);
  }
};
// ── Colores por tipo de serie ─────────────────────────────────────────────────
const TYPE_CONFIG = {
  N: { color: BLUE,   label: 'Normal' },
  W: { color: ORANGE, label: 'Calent.' },
  D: { color: RED,    label: 'Drop' },
  F: { color: PURPLE, label: 'Fallo' },
};

// ── SVG circular timer ────────────────────────────────────────────────────────
function CircularTimer({ restLeft, restSec, running }) {
  const progress  = restSec > 0 ? restLeft / restSec : 1;
  const isWarning = restLeft <= 30 && restLeft > 10;
  const isDanger  = restLeft <= 10;

  const timerColor = isDanger ? RED : isWarning ? ORANGE : ACCENT;

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (running && isDanger) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.04, duration: 400, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,    duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.setValue(1);
    }
  }, [running, isDanger]);

  const m   = Math.floor(restLeft / 60);
  const sec = restLeft % 60;
  const timeStr = `${m}:${sec < 10 ? '0' : ''}${sec}`;

  const SIZE   = 140;
  const STROKE = 8;

  return (
    <Animated.View style={[ct.wrap, { transform: [{ scale: pulse }] }]}>
      <View style={[ct.trackBase, {
        width: SIZE, height: SIZE, borderRadius: SIZE / 2,
        borderWidth: STROKE, borderColor: SURFACE2,
      }]} />

      <ArcProgress progress={progress} color={timerColor} size={SIZE} stroke={STROKE} />

      <View style={ct.center}>
        <Text style={[ct.time, { color: timerColor }]}>{timeStr}</Text>
        <Text style={ct.label}>{running ? 'descansando' : 'en pausa'}</Text>
      </View>
    </Animated.View>
  );
}

function ArcProgress({ progress, color, size, stroke }) {
  const pct = Math.max(0, Math.min(1, progress));
  const q = [
    pct >= 0.25 ? 1 : pct / 0.25,
    pct >= 0.50 ? 1 : Math.max(0, (pct - 0.25) / 0.25),
    pct >= 0.75 ? 1 : Math.max(0, (pct - 0.50) / 0.25),
    Math.max(0, (pct - 0.75) / 0.25),
  ];

  const half = size / 2;

  return (
    <View style={{ position: 'absolute', width: size, height: size }}>
      {[0, 1, 2, 3].map(i => {
        if (q[i] <= 0) return null;
        const rotate = i * 90;
        const opacity = q[i];
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: half,
              height: half,
              top:  i < 2 ? 0 : half,
              left: i === 0 || i === 3 ? half : 0,
              overflow: 'hidden',
              opacity,
            }}
          >
            <View style={{
              position: 'absolute',
              width: size, height: size,
              top:  i < 2 ? 0 : -half,
              left: i === 0 || i === 3 ? -half : 0,
              borderRadius: half,
              borderWidth: stroke,
              borderColor: color,
              transform: [{ rotate: `${rotate}deg` }],
            }} />
          </View>
        );
      })}
    </View>
  );
}

const ct = StyleSheet.create({
  wrap:      { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  trackBase: { position: 'absolute' },
  center:    { position: 'absolute', alignItems: 'center' },
  time:      { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  label:     { fontSize: 10, color: T3, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },
});

function SeriesProgress({ done, total }) {
  const pct     = total > 0 ? done / total : 0;
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const barColor = pct === 1 ? GREEN : pct > 0.5 ? ACCENT : BLUE;

  return (
    <View style={sp.wrap}>
      <View style={sp.track}>
        <Animated.View
          style={[sp.fill, {
            backgroundColor: barColor,
            width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]}
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
  wrap:  { marginTop: 8 },
  track: { height: 4, backgroundColor: SURFACE2, borderRadius: 2, overflow: 'hidden', marginBottom: 5 },
  fill:  { height: 4, borderRadius: 2 },
  label: { fontSize: 11, color: T3, fontWeight: '600' },
});

// ── Componente principal ──────────────────────────────────────────────────────
export default function WorkoutScreen({ route }) {
  const { showAlert } = useAlert();

  // 💡 Leemos de useLocalSearchParams() para compatibilidad total con Expo Router
  const params = useLocalSearchParams();
  const rawRoutine = params?.routine || route?.params?.routine;

  const routine = typeof rawRoutine === 'string'
    ? JSON.parse(rawRoutine)
    : (rawRoutine || {});

  const [exercises, setExercises] = useState([]);
  const [userId, setUserId]       = useState(null);

  const { checkRecord, newRecord, clearRecord } =
    usePersonalRecords(userId);

  const [elapsed, setElapsed]         = useState(0);
  const elapsedRef                    = useRef(null);
  const [restSec, setRestSec]         = useState(120);
  const [restLeft, setRestLeft]       = useState(120);
  const [restRunning, setRestRunning] = useState(false);
  const restRef                       = useRef(null);
  const [showModal, setShowModal]     = useState(false);
  const [modalQuery, setModalQuery]   = useState('');
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveredWorkout, setRecoveredWorkout] = useState(null);
  // Estados para nuevos componentes
  const [plateModalVisible, setPlateModalVisible] = useState(false);
  const [plateWeight, setPlateWeight]             = useState(60);
  const [activeKeypad, setActiveKeypad]           = useState(null); // { ei, si, field: 'kg' | 'reps' }
  const [activeRpeKey, setActiveRpeKey]           = useState(null); // "ei-si" string

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      flushPendingSessions();

      const savedWorkout = await loadActiveWorkout();

      if (savedWorkout && savedWorkout.exercises?.length > 0) {
        setRecoveredWorkout(savedWorkout);
        setShowRecoveryModal(true);
        return;
      }

      initializeNewWorkout();
    }
    init();
  }, [rawRoutine]);

  const initializeNewWorkout = () => {
    let targetIds = [];

    if (Array.isArray(routine?.exercises) && routine.exercises.length > 0) {
      const initialExercises = routine.exercises.map((ex, idx) => {
        const numSets = ex.sets || 3;
        const sets = [];
        for (let i = 0; i < numSets; i++) {
          sets.push({ kg: '', reps: ex.reps || '', type: 'N', done: false });
        }
        return {
          exId: `challenge-${idx}`,
          name: ex.name,
          muscle: 'Core',
          sets: sets,
        };
      });
      setExercises(initialExercises);
      return;
    }

    targetIds = Array.isArray(routine?.exercise_ids) && routine.exercise_ids.length > 0
      ? routine.exercise_ids
      : ['abs_plank', 'abs_crunch', 'abs_russian'];

    const initialExercises = targetIds.map(id => ({
      exId: id,
      sets: [{ kg: '', reps: '', type: 'N', done: false }],
    }));
    setExercises(initialExercises);

    if (!userId) return;

    loadLastSessionData(userId).then(historySets => {
      if (historySets?.length > 0) {
        setExercises(
          targetIds.map(id => {
            const setsForEx = historySets.filter(s => s.exercise_id === id);
            return {
              exId: id,
              sets: setsForEx.length > 0
                ? setsForEx.map(s => ({ kg: String(s.weight_kg), reps: String(s.reps), type: s.set_type, done: false }))
                : [{ kg: '', reps: '', type: 'N', done: false }],
            };
          })
        );
      }
    }).catch(err => {
      console.log('Error cargando historial:', err);
    });
  };

  const recoverWorkout = () => {
    if (recoveredWorkout) {
      setExercises(recoveredWorkout.exercises);
      setElapsed(recoveredWorkout.elapsed || 0);
      setShowRecoveryModal(false);
      setRecoveredWorkout(null);
    }
  };

  const discardRecovery = async () => {
    await clearActiveWorkout();
    setShowRecoveryModal(false);
    setRecoveredWorkout(null);
    initializeNewWorkout();
  };
    // Guardar automáticamente cuando cambian los ejercicios o el tiempo
  useEffect(() => {
    if (exercises.length > 0 && userId) {
      // Debounce: esperar 1 segundo antes de guardar para no saturar
      const timeoutId = setTimeout(() => {
        saveActiveWorkout(exercises, routine, elapsed);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [exercises, elapsed]);

  useEffect(() => {
    elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(elapsedRef.current);
  }, []);

  useEffect(() => {
    if (restRunning) {
      restRef.current = setInterval(() => {
        setRestLeft(l => {
          if (l <= 1) {
            clearInterval(restRef.current);
            setRestRunning(false);
            Vibration.vibrate([0, 300, 100, 300, 100, 500]);
            return restSec;
          }
          return l - 1;
        });
      }, 1000);
    } else {
      clearInterval(restRef.current);
    }
    return () => clearInterval(restRef.current);
  }, [restRunning]);

  function formatTime(s) {
    const m   = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  }

  function setRestPreset(sec) {
    clearInterval(restRef.current);
    setRestRunning(false);
    setRestSec(sec);
    setRestLeft(sec);
  }

  function toggleRest() { setRestRunning(p => !p); }

  function resetRest() {
    clearInterval(restRef.current);
    setRestRunning(false);
    setRestLeft(restSec);
  }

  async function loadLastSessionData(uid) {
    if (!routine?.name) return null;
    const { data: lastSession } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', uid)
      .eq('routine_name', routine.name)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!lastSession) return null;
    const { data: sets } = await supabase
      .from('workout_sets')
      .select('*')
      .eq('session_id', lastSession.id);
    return sets;
  }

  function updateSet(ei, si, key, value) {
    setExercises(prev => {
      const next = [...prev];
      next[ei] = { ...next[ei], sets: next[ei].sets.map((s, idx) => idx === si ? { ...s, [key]: value } : s) };
      return next;
    });
  }

  async function toggleDone(ei, si) {
    const set     = exercises[ei].sets[si];
    const wasDone = set.done;

    setExercises(prev => {
      const next = [...prev];
      next[ei] = { ...next[ei], sets: next[ei].sets.map((s, idx) => idx === si ? { ...s, done: !s.done } : s) };
      return next;
    });

    if (!wasDone) {
      Vibration.vibrate(40);
      resetRest();
      setRestRunning(true);
      const ex = exercises[ei]?.name
        ? { name: exercises[ei].name }
        : getExercise(exercises[ei].exId);

      if (ex && (parseFloat(set.kg) > 0 || parseInt(set.reps) > 0)) {
        await checkRecord(
          { exId: String(exercises[ei].exId), name: ex.name },
          { kg: set.kg, reps: set.reps }
        );
      }
    }
  }

  function addSet(ei) {
    setExercises(prev => {
      const next = [...prev];
      const last = next[ei].sets[next[ei].sets.length - 1];
      next[ei] = { ...next[ei], sets: [...next[ei].sets, { kg: last?.kg || '', reps: last?.reps || '', type: 'N', done: false }] };
      return next;
    });
  }

  function removeSet(ei, si) {
    setExercises(prev => {
      const next    = [...prev];
      const newSets = next[ei].sets.filter((_, idx) => idx !== si);
      next[ei] = { ...next[ei], sets: newSets.length ? newSets : [{ kg: '', reps: '', type: 'N', done: false }] };
      return next;
    });
  }

  function removeExercise(ei) {
    setExercises(prev => prev.filter((_, idx) => idx !== ei));
  }

  function addExerciseFromModal(exId) {
    setExercises(prev => [...prev, { exId, sets: [{ kg: '', reps: '', type: 'N', done: false }] }]);
    setShowModal(false);
  }

  // ── Guardar sesión ────────────────────────────────────────────────────────
  const finishWorkout = async () => {
    Alert.alert(
      '¿Terminar entreno?',
      'Se guardará tu sesión.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          onPress: async () => {
            clearInterval(elapsedRef.current);
            clearInterval(restRef.current);
            
            if (!userId) {
              showAlert('Error', 'Usuario no autenticado');
              return;
            }

            let totalSets = 0, totalVolume = 0;
            exercises.forEach(e => e.sets.forEach(s => {
              if (s.done) {
                totalSets++;
                totalVolume += (parseFloat(s.kg) || 0) * (parseInt(s.reps) || 0);
              }
            }));

            if (totalSets === 0) {
              showAlert('Sin series', 'Completa al menos una serie antes de terminar.');
              return;
            }

            const setsToInsert = [];
            for (const e of exercises) {
              const ex = e.name 
  ? { name: e.name, muscle: e.muscle || 'Reto' } 
  : getExercise(e.exId);
              for (const [si, s] of e.sets.entries()) {
                if (s.done) {
                  setsToInsert.push({
                    exercise_id: e.exId,
                    exercise_name: ex?.name || 'Ejercicio',
                    set_number: si + 1,
                    set_type: s.type,
                    weight_kg: parseFloat(s.kg) || 0,
                    reps: parseInt(s.reps) || 0,
                    rpe: s.rpe ? Number(s.rpe) : null,
                    completed: true,
                  });
                }
              }
            }

            const payload = {
              session: {
                user_id:          userId,
                routine_name:     routine?.name || 'Entrenamiento',
                started_at:       new Date(Date.now() - elapsed * 1000).toISOString(),
                finished_at:      new Date().toISOString(),
                total_sets:       totalSets,
                total_volume_kg:  Math.round(totalVolume),
                duration_minutes: Math.round(elapsed / 60),
              },
              sets: setsToInsert,
            };

            try {
              await saveWorkoutSession(payload);
            } catch (saveError) {
              if (isNetworkError(saveError)) {
                const queued = await enqueuePendingSession({ payload });
                Vibration.vibrate([0, 200, 100, 200]);
                showAlert(
                  'Sin conexión',
                  queued
                    ? 'Tu sesión se guardó en el dispositivo y se sincronizará cuando tengas conexión.'
                    : 'No se pudo guardar la sesión. Intenta de nuevo.'
                );
                await clearActiveWorkout();
                setTimeout(() => router.back(), 1500);
                return;
              }
              showAlert('Error', saveError?.message || 'No se pudo guardar la sesión.');
              return;
            }

            Vibration.vibrate([0, 200, 100, 200]);
            showAlert('¡Sesión guardada! 💪', `${totalSets} series · ${Math.round(totalVolume)} kg`);

            // Limpiar el entrenamiento guardado
            await clearActiveWorkout();

            setTimeout(() => router.back(), 1500);
          },
        },
      ]
    );
  };

  // ── Stats tiempo real ─────────────────────────────────────────────────────
  const doneSets    = exercises.flatMap(e => e.sets).filter(s => s.done).length;
  const totalVolume = exercises.flatMap(e => e.sets)
    .filter(s => s.done)
    .reduce((a, s) => a + (parseFloat(s.kg) || 0) * (parseInt(s.reps) || 0), 0);

  const allExs   = getAllExercises();
  const modalExs = allExs.filter(
    e => !exercises.find(w => String(w.exId) === String(e.id)) &&
         e.name.toLowerCase().includes(modalQuery.toLowerCase())
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── CABECERA ── */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View>
              <Text style={s.routineName}>{routine?.name || 'Entrenamiento'}</Text>
              <Text style={s.elapsedText}>{formatTime(elapsed)}</Text>
            </View>
            <TouchableOpacity style={s.finishBtn} onPress={finishWorkout} activeOpacity={0.8}>
              <Text style={s.finishBtnText}>Terminar</Text>
            </TouchableOpacity>
          </View>

          {/* Mini stats */}
          <View style={s.miniStats}>
            <View style={s.miniStat}>
              <Text style={s.miniStatVal}>{doneSets}</Text>
              <Text style={s.miniStatLbl}>series</Text>
            </View>
            <View style={s.miniDivider} />
            <View style={s.miniStat}>
              <Text style={s.miniStatVal}>{Math.round(totalVolume)}</Text>
              <Text style={s.miniStatLbl}>kg vol.</Text>
            </View>
            
            {/* Oculta la columna de ejercicios únicamente si es 0 */}
            {exercises.length > 0 && (
              <>
                <View style={s.miniDivider} />
                <View style={s.miniStat}>
                  <Text style={s.miniStatVal}>{exercises.length}</Text>
                  <Text style={s.miniStatLbl}>ejerc.</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ── RELOJ CIRCULAR ── */}
        <View style={s.timerCard}>
          <CircularTimer
            restLeft={restLeft}
            restSec={restSec}
            running={restRunning}
          />

          {/* Presets */}
          <View style={s.presets}>
            {[60, 90, 120, 180].map(sec => (
              <TouchableOpacity
                key={sec}
                style={[s.preset, restSec === sec && s.presetActive]}
                onPress={() => setRestPreset(sec)}
                activeOpacity={0.7}
              >
                <Text style={[s.presetText, restSec === sec && s.presetTextActive]}>
                  {sec < 60 ? `${sec}s` : sec < 120 ? `${sec}s` : `${sec / 60}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Controles */}
          <View style={s.timerControls}>
            <TouchableOpacity style={s.timerBtn} onPress={resetRest} activeOpacity={0.7}>
              <Text style={s.timerBtnText}>↺</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.timerBtnMain, restRunning && s.timerBtnMainPause]}
              onPress={toggleRest}
              activeOpacity={0.8}
            >
              <Text style={s.timerBtnMainText}>
                {restRunning ? '⏸  Pausar' : '▶  Iniciar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.timerBtn} onPress={() => setRestLeft(l => l + 15)} activeOpacity={0.7}>
              <Text style={s.timerBtnText}>+15</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── EJERCICIOS ── */}
        {exercises.map((e, ei) => {
        const ex = e.name 
  ? { name: e.name, muscle: 'Reto' } 
  : getExercise(e.exId);
          const doneHere = e.sets.filter(s => s.done).length;
          const allDone  = doneHere === e.sets.length;

          return (
            <View key={ei} style={[s.exBlock, allDone && s.exBlockDone]}>

              {/* Cabecera ejercicio */}
              <View style={s.exBlockHdr}>
                <ExerciseIcon exercise={ex} size="md" />
                <View style={s.exInfo}>
                  <Text style={s.exName}>{ex?.name || 'Ejercicio'}</Text>
                  <Text style={s.exMuscleLabel}>{ex?.muscle}</Text>
                  <SeriesProgress done={doneHere} total={e.sets.length} />
                </View>
                <TouchableOpacity onPress={() => removeExercise(ei)} style={s.removeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={s.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Header tabla */}
              <View style={s.tableHdr}>
                <Text style={[s.thCell, { width: 22 }]}>#</Text>
                <Text style={[s.thCell, { width: 32 }]}>Tipo</Text>
                <Text style={[s.thCell, s.thCenter, { flex: 1 }]}>Peso kg</Text>
                <Text style={[s.thCell, s.thCenter, { flex: 1 }]}>Reps</Text>
                <Text style={[s.thCell, s.thCenter, { width: 44 }]}>RPE</Text>
                <Text style={[s.thCell, { width: 34 }]}></Text>
                <Text style={[s.thCell, { width: 22 }]}></Text>
              </View>

              {/* Filas de series */}
              {e.sets.map((set, si) => {
                const tc = TYPE_CONFIG[set.type] ?? TYPE_CONFIG.N;
                const rpeKey = `${ei}-${si}`;
                const isKeypadOpen = activeKeypad?.ei === ei && activeKeypad?.si === si;
                return (
                  <SetRow
                    key={`${ei}-${si}`}
                    set={set}
                    si={si}
                    tc={tc}
                    isRpeOpen={activeRpeKey === rpeKey}
                    isKeypadOpen={isKeypadOpen}
                    activeKeypadField={activeKeypad?.field ?? 'kg'}
                    onToggleRpe={() => setActiveRpeKey(prev => prev === rpeKey ? null : rpeKey)}
                    onOpenKeypad={(field) => {
                      setActiveKeypad({ ei, si, field });
                      setActiveRpeKey(null);
                    }}
                    onCloseKeypad={() => setActiveKeypad(null)}
                    onChangeType={() => {
                      const types = ['N', 'W', 'D', 'F'];
                      const next  = types[(types.indexOf(set.type) + 1) % types.length];
                      updateSet(ei, si, 'type', next);
                    }}
                    onChangeKg={v  => updateSet(ei, si, 'kg', v)}
                    onChangeReps={v => updateSet(ei, si, 'reps', v)}
                    onChangeRpe={v => updateSet(ei, si, 'rpe', v)}
                    onOpenPlates={kg => {
                      const w = parseFloat(kg) || 20;
                      setPlateWeight(w);
                      setPlateModalVisible(true);
                    }}
                    onToggleDone={() => toggleDone(ei, si)}
                    onRemove={() => removeSet(ei, si)}
                  />
                );
              })}

              <TouchableOpacity style={s.addSetBtn} onPress={() => addSet(ei)} activeOpacity={0.7}>
                <Text style={s.addSetBtnText}>+ Serie</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Añadir ejercicio */}
        <TouchableOpacity style={s.addExBtn} onPress={() => setShowModal(true)} activeOpacity={0.7}>
          <Text style={s.addExBtnText}>+ Añadir ejercicio</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Toast récord */}
      <RecordToast record={newRecord} onHide={clearRecord} />

      <Modal visible={showRecoveryModal} transparent animationType="fade">
        <View style={s.recoveryOverlay}>
          <View style={s.recoveryModal}>
            <Text style={s.recoveryIcon}>💪</Text>
            <Text style={s.recoveryTitle}>¿Continuar entrenamiento?</Text>
            <Text style={s.recoveryText}>
              {'Tienes un entrenamiento en curso\n'}
              {recoveredWorkout?.exercises?.length > 0 &&
                `con ${recoveredWorkout.exercises.length} ejercicios`}
            </Text>
            <View style={s.recoveryButtons}>
              <TouchableOpacity
                style={s.recoveryBtnDiscard}
                onPress={discardRecovery}
                activeOpacity={0.8}
              >
                <Text style={s.recoveryBtnDiscardText}>Empezar nuevo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.recoveryBtnContinue}
                onPress={recoverWorkout}
                activeOpacity={0.8}
              >
                <Text style={s.recoveryBtnContinueText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Calculadora de Discos */}
      <PlateCalculatorModal
        visible={plateModalVisible}
        onClose={() => setPlateModalVisible(false)}
        targetWeight={plateWeight}
      />

      {/* Modal ejercicios */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Añadir ejercicio</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={{ color: T2, fontSize: 22 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={s.modalSearch}
              value={modalQuery}
              onChangeText={setModalQuery}
              placeholder="Buscar..."
              placeholderTextColor={T3}
            />
            <FlatList
              data={modalExs}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.modalItem} onPress={() => addExerciseFromModal(item.id)} activeOpacity={0.7}>
                  <ExerciseIcon exercise={item} size="sm" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.modalItemName}>{item.name}</Text>
                    <Text style={s.modalItemSub}>{item.muscle}</Text>
                  </View>
                  <Text style={[s.typeBadge, { color: BLUE }]}>{item.type}</Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 400 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Fila de serie como componente separado ────────────────────────────────────
function SetRow({
  set,
  si,
  tc,
  isRpeOpen,
  isKeypadOpen,
  activeKeypadField,
  onToggleRpe,
  onOpenKeypad,
  onCloseKeypad,
  onChangeType,
  onChangeKg,
  onChangeReps,
  onChangeRpe,
  onOpenPlates,
  onToggleDone,
  onRemove,
}) {
  const doneAnim = useRef(new Animated.Value(set.done ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(doneAnim, {
      toValue: set.done ? 1 : 0,
      useNativeDriver: false,
      tension: 80,
    }).start();
  }, [set.done]);

  const rowBg = doneAnim.interpolate({ inputRange: [0, 1], outputRange: ['#161616', '#3DD68C0A'] });

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: BORDER }}>
      <Animated.View style={[sr.row, { backgroundColor: rowBg }]}>
        <Text style={sr.num}>{si + 1}</Text>

        <TouchableOpacity style={[sr.typePill, { borderColor: tc.color + '66' }]} onPress={onChangeType} activeOpacity={0.7}>
          <Text style={[sr.typeText, { color: tc.color }]}>{set.type}</Text>
        </TouchableOpacity>

        <View style={[sr.inputWrap, set.done && sr.inputWrapDone, isKeypadOpen && activeKeypadField === 'kg' && sr.inputWrapActive]}>
          <TextInput
            style={[sr.input, set.done && sr.inputDone]}
            value={set.kg !== undefined && set.kg !== null ? String(set.kg) : ''}
            onChangeText={onChangeKg}
            onFocus={() => onOpenKeypad('kg')}
            placeholder="—"
            placeholderTextColor={T3}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
          <TouchableOpacity onPress={() => onOpenPlates(set.kg)} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
            <Text style={sr.inputUnit}>kg 🧮</Text>
          </TouchableOpacity>
        </View>

        <View style={[sr.inputWrap, set.done && sr.inputWrapDone, isKeypadOpen && activeKeypadField === 'reps' && sr.inputWrapActive]}>
          <TextInput
            style={[sr.input, set.done && sr.inputDone]}
            value={set.reps !== undefined && set.reps !== null ? String(set.reps) : ''}
            onChangeText={onChangeReps}
            onFocus={() => onOpenKeypad('reps')}
            placeholder="—"
            placeholderTextColor={T3}
            keyboardType="number-pad"
            selectTextOnFocus
          />
          <Text style={sr.inputUnit}>reps</Text>
        </View>

        <TouchableOpacity
          style={[sr.rpeBtn, set.rpe && sr.rpeBtnActive]}
          onPress={onToggleRpe}
          activeOpacity={0.7}
        >
          <Text style={[sr.rpeBtnText, set.rpe && sr.rpeBtnTextActive]}>
            {set.rpe ? `@${set.rpe}` : 'RPE'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[sr.doneBtn, set.done && sr.doneBtnActive]}
          onPress={onToggleDone}
          activeOpacity={0.8}
        >
          <Text style={{ color: set.done ? '#000' : T3, fontSize: 14, fontWeight: '800' }}>✓</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onRemove} style={sr.removeSet} hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}>
          <Text style={{ color: T3, fontSize: 14 }}>✕</Text>
        </TouchableOpacity>
      </Animated.View>

      {isKeypadOpen && (
        <View style={sr.keypadPanel}>
          <GymKeypad
            value={activeKeypadField === 'kg' ? set.kg : set.reps}
            onChange={(val) => {
              const nextVal = val === '' ? '' : String(val);
              if (activeKeypadField === 'kg') onChangeKg(nextVal);
              else onChangeReps(nextVal);
            }}
            onDone={(val) => {
              const nextVal = String(val ?? '');
              if (activeKeypadField === 'kg') onChangeKg(nextVal);
              else onChangeReps(nextVal);
              onCloseKeypad();
            }}
            onCalculatePlates={() => {
              const targetWeight = parseFloat(activeKeypadField === 'kg' ? set.kg : set.reps) || 20;
              onOpenPlates(targetWeight);
            }}
          />
        </View>
      )}

      {isRpeOpen && (
        <View style={sr.rpeDropdown}>
          <RPESelector
            value={set.rpe}
            onChange={(val) => {
              onChangeRpe(val);
              onToggleRpe();
            }}
          />
        </View>
      )}
    </View>
  );
}

const sr = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, gap: 6 },
  num:          { width: 22, fontSize: 12, color: T3, fontWeight: '600' },
  typePill:     { width: 30, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE2 },
  typeText:     { fontSize: 11, fontWeight: '800' },
  inputWrap:    { flex: 1, backgroundColor: SURFACE2, borderRadius: 10, borderWidth: 1, borderColor: BORDER2, alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4 },
  inputWrapDone:{ borderColor: GREEN + '55', backgroundColor: GREEN + '0A' },
  inputWrapActive:{ borderColor: ACCENT + '88', backgroundColor: ACCENT + '0A' },
  input:        { fontSize: 17, fontWeight: '800', color: T1, textAlign: 'center', width: '100%' },
  inputDone:    { color: GREEN },
  inputUnit:    { fontSize: 9, color: T3, fontWeight: '600', letterSpacing: 0.5, marginTop: 1 },
  rpeBtn:       { paddingHorizontal: 6, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: BORDER2, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center', minWidth: 42 },
  rpeBtnActive: { borderColor: ACCENT, backgroundColor: 'rgba(192, 255, 62, 0.15)' },
  rpeBtnText:   { fontSize: 10, fontWeight: '700', color: T3 },
  rpeBtnTextActive: { color: ACCENT },
  keypadPanel:  { backgroundColor: '#121212', borderTopWidth: 1, borderTopColor: BORDER, overflow: 'hidden' },
  rpeDropdown:  { backgroundColor: '#121212', paddingVertical: 8, paddingHorizontal: 10 },
  doneBtn:      { width: 34, height: 34, borderRadius: 10, borderWidth: 1.5, borderColor: T3, alignItems: 'center', justifyContent: 'center' },
  doneBtnActive:{ backgroundColor: ACCENT, borderColor: ACCENT },
  removeSet:    { width: 22, alignItems: 'center' },
});

// ── Estilos globales ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: BG },
  scroll:      { padding: 18, paddingTop: 52, paddingBottom: 120 },

  header:      { marginBottom: 16 },
  headerTop:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  routineName: { fontSize: 24, fontWeight: '800', color: T1, letterSpacing: -0.6 },
  elapsedText: { fontSize: 13, color: T3, marginTop: 3, fontWeight: '600' },
  finishBtn:   { backgroundColor: RED + '18', borderWidth: 1, borderColor: RED, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16 },
  finishBtnText:{ fontSize: 13, color: RED, fontWeight: '700' },

  miniStats:   { flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  miniStat:    { flex: 1, alignItems: 'center' },
  miniStatVal: { fontSize: 20, fontWeight: '800', color: ACCENT, letterSpacing: -0.4 },
  miniStatLbl: { fontSize: 10, color: T3, fontWeight: '600', marginTop: 2 },
  miniDivider: { width: 1, height: 28, backgroundColor: BORDER2 },

  timerCard:   { backgroundColor: SURFACE, borderRadius: 22, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: BORDER, alignItems: 'center', gap: 16 },

  presets:     { flexDirection: 'row', gap: 8 },
  preset:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER2 },
  presetActive:{ backgroundColor: ACCENT + '18', borderColor: ACCENT },
  presetText:  { fontSize: 12, color: T2, fontWeight: '700' },
  presetTextActive: { color: ACCENT },

  timerControls:  { flexDirection: 'row', gap: 8, width: '100%' },
  timerBtn:       { width: 46, height: 46, borderRadius: 12, backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER2, alignItems: 'center', justifyContent: 'center' },
  timerBtnText:   { fontSize: 14, color: T2, fontWeight: '700' },
  timerBtnMain:   { flex: 1, height: 46, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  timerBtnMainPause:{ backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER2 },
  timerBtnMainText: { fontSize: 14, fontWeight: '800', color: '#000' },

  exBlock:     { backgroundColor: SURFACE, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  exBlockDone: { borderColor: GREEN + '33' },
  exBlockHdr:  { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  exInfo:      { flex: 1 },
  exName:      { fontSize: 15, fontWeight: '700', color: T1, letterSpacing: -0.3 },
  exMuscleLabel:{ fontSize: 11, color: T3, marginTop: 2, fontWeight: '500' },
  removeBtn:   { paddingTop: 2 },
  removeBtnText:{ color: T3, fontSize: 16 },

  tableHdr:    { flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 8, gap: 6, borderBottomWidth: 1, borderBottomColor: BORDER },
  thCell:      { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: T3 },
  thCenter:    { textAlign: 'center' },

  addSetBtn:    { margin: 12, backgroundColor: SURFACE2, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: BORDER2 },
  addSetBtnText:{ fontSize: 13, color: T2, fontWeight: '700' },

  addExBtn:    { backgroundColor: SURFACE, borderRadius: 16, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: BORDER2, marginTop: 4 },
  addExBtnText:{ fontSize: 14, color: T2, fontWeight: '700' },

  modalOverlay:{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modal:       { backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '78%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: T1 },
  modalSearch: { backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER2, borderRadius: 12, color: T1, fontSize: 14, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  modalItem:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  modalItemName:{ fontSize: 14, fontWeight: '600', color: T1 },
  modalItemSub: { fontSize: 12, color: T3, marginTop: 2 },
  typeBadge:   { fontSize: 11, fontWeight: '600' },
    recoveryOverlay: { 
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', 
    justifyContent: 'center', alignItems: 'center', padding: 20 
  },
  recoveryModal: { 
    backgroundColor: SURFACE, borderRadius: 24, padding: 30, 
    width: '100%', maxWidth: 340, alignItems: 'center',
    borderWidth: 1, borderColor: BORDER 
  },
  recoveryIcon: { fontSize: 48, marginBottom: 16 },
  recoveryTitle: { 
    fontSize: 20, fontWeight: '800', color: T1, 
    marginBottom: 12, textAlign: 'center' 
  },
  recoveryText: { 
    fontSize: 14, color: T2, textAlign: 'center', 
    marginBottom: 24, lineHeight: 20 
  },
  recoveryButtons: { 
    flexDirection: 'row', gap: 12, width: '100%' 
  },
  recoveryBtnDiscard: { 
    flex: 1, backgroundColor: SURFACE2, borderRadius: 14, 
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: BORDER2 
  },
  recoveryBtnDiscardText: { fontSize: 14, fontWeight: '700', color: T2 },
  recoveryBtnContinue: { 
    flex: 1, backgroundColor: ACCENT, borderRadius: 14, 
    paddingVertical: 14, alignItems: 'center' 
  },
  recoveryBtnContinueText: { fontSize: 14, fontWeight: '800', color: '#000' },
});