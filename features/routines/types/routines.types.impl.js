export const ROUTINE_STEPS = {
  NAME: 'name',
  EXERCISES: 'exercises',
  CONFIG: 'config',
};

export const DEFAULT_EXERCISE_CONFIG = {
  sets: 3,
  repsMin: 8,
  repsMax: 12,
  rest: 90,
  rir: 2,
  rpe: '',
  notes: '',
};

export function normalizeExerciseForSave(ex, index) {
  return {
    exercise_id: String(ex.id),
    exercise_name: ex.name,
    target_sets: ex.sets || 1,
    target_reps_min: ex.repsMin ?? null,
    target_reps_max: ex.repsMax ?? null,
    rest_seconds: ex.rest ?? null,
    rir: ex.rir ?? null,
    rpe: ex.rpe ? Number(ex.rpe) : null,
    notes: ex.notes?.trim() || null,
    position: index,
  };
}
