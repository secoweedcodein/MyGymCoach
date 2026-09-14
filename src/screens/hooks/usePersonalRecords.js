// src/hooks/usePersonalRecords.js
//
// Hook que expone el toast de récords personales durante un workout.
//
// USO:
//   const { checkRecord, newRecord, clearRecord } = usePersonalRecords(userId);
//
//   - Llama checkRecord(exercise, set) al marcar una serie como completada.
//   - La persistencia real la hace progressService.checkAndSavePR (writer único,
//     columnas reales de personal_records: weight_kg, reps, achieved_at...).
//   - newRecord es { type, exerciseName, value, unit } | null → úsalo para el toast.
//   - Llama clearRecord() para ocultar el toast.

import { useState } from 'react';
import { checkAndSavePR } from '../../../services/progressService';

export function usePersonalRecords(userId) {
  const [newRecord, setNewRecord] = useState(null);

  // ── Comprueba si una serie bate algún récord y lo persiste ──────────────────
  // exercise: { exId, name }   set: { kg: string, reps: string }
  async function checkRecord(exercise, set) {
    if (!userId) return;

    const exName = exercise.name || 'Ejercicio';
    const weight = parseFloat(set.kg) || 0;
    const reps   = parseInt(set.reps) || 0;

    const result = await checkAndSavePR(userId, exName, [{ weight_kg: weight, reps }], null);
    if (result?.isNewPR) {
      setNewRecord({
        type: result.improved?.length >= 4 ? 'pr-full' : 'weight',
        exerciseName: exName,
        value: `${weight} kg × ${reps}`,
        unit: 'reps',
        improved: result.improved || [],
      });
    }
  }

  function clearRecord() { setNewRecord(null); }

  return { checkRecord, newRecord, clearRecord };
}