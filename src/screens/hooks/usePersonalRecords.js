// src/hooks/usePersonalRecords.js
//
// Hook que gestiona los récords personales durante un workout.
//
// USO:
//   const { recordsCache, loadRecords, checkRecord, newRecord, clearRecord } =
//     usePersonalRecords(userId);
//
//   - Llama loadRecords() al inicio del workout (carga todos los récords del usuario).
//   - Llama checkRecord(exercise, set) al marcar una serie como completada.
//   - newRecord es { type, exerciseName, value, unit } | null  → úsalo para mostrar el toast.
//   - Llama clearRecord() para ocultar el toast.

import { useState, useRef } from 'react';
import { supabase } from '../../../lib/supabase.js';

export function usePersonalRecords(userId) {
  // Cache local: { [exerciseId]: { record_weight, record_reps, record_volume } }
  const cache    = useRef({});
  const [newRecord, setNewRecord] = useState(null); // el récord que se acaba de romper

  // ── Carga todos los récords del usuario de una vez ──────────────────────────
  async function loadRecords() {
    if (!userId) return;
    const { data, error } = await supabase
      .from('personal_records')
      .select('exercise_id, record_weight, record_reps, record_volume')
      .eq('user_id', userId);
    if (error) { console.warn('loadRecords error:', error.message); return; }

    const map = {};
    (data || []).forEach(r => { map[String(r.exercise_id)] = r; });
    cache.current = map;
  }

  // ── Comprueba si una serie bate algún récord y actualiza si procede ─────────
  // exercise: { exId, name }   set: { kg: string, reps: string }
  async function checkRecord(exercise, set) {
    if (!userId) return;

    const exId    = String(exercise.exId);
    const exName  = exercise.name || 'Ejercicio';
    const weight  = parseFloat(set.kg)  || 0;
    const reps    = parseInt(set.reps)  || 0;
    const volume  = weight * reps;

    const prev = cache.current[exId] || { record_weight: 0, record_reps: 0, record_volume: 0 };

    // ¿Qué récords se baten?
    const beatsWeight = weight  > (prev.record_weight  || 0);
    const beatsReps   = reps    > (prev.record_reps    || 0);
    const beatsVolume = volume  > (prev.record_volume  || 0);

    if (!beatsWeight && !beatsReps && !beatsVolume) return; // nada nuevo

    // Actualiza cache local inmediatamente
    cache.current[exId] = {
      record_weight: beatsWeight ? weight  : prev.record_weight,
      record_reps:   beatsReps   ? reps    : prev.record_reps,
      record_volume: beatsVolume ? volume  : prev.record_volume,
    };

    // Persiste en Supabase (upsert por user_id + exercise_id)
    const upsertData = {
      user_id:       userId,
      exercise_id:   exId,
      exercise_name: exName,
      updated_at:    new Date().toISOString(),
    };
    if (beatsWeight) upsertData.record_weight = weight;
    if (beatsReps)   upsertData.record_reps   = reps;
    if (beatsVolume) upsertData.record_volume  = volume;

    const { error } = await supabase
      .from('personal_records')
      .upsert(upsertData, { onConflict: 'user_id,exercise_id' });

    if (error) { console.warn('checkRecord upsert error:', error.message); }

    // Elige el récord más impresionante para mostrar en el toast
    // Prioridad: peso > volumen > reps
    let toastType, toastValue, toastUnit;
    if (beatsWeight) {
      toastType  = 'weight';
      toastValue = `${weight} kg × ${reps}`;
      toastUnit  = 'reps';
    } else if (beatsVolume) {
      toastType  = 'volume';
      toastValue = `${Math.round(volume)} kg`;
      toastUnit  = 'volumen';
    } else {
      toastType  = 'reps';
      toastValue = `${reps}`;
      toastUnit  = 'reps';
    }

    setNewRecord({ type: toastType, exerciseName: exName, value: toastValue, unit: toastUnit });
  }

  function clearRecord() { setNewRecord(null); }

  return { loadRecords, checkRecord, newRecord, clearRecord, cache: cache.current };
}