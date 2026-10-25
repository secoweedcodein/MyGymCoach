export interface Routine {
  id: string;
  user_id: string;
  name: string;
  exercise_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface RoutineExercise {
  id?: string;
  routine_id?: string;
  position: number;
  exercise_id: string | null;
  exercise_name: string;
  target_sets?: number;
  target_reps_min?: number | null;
  target_reps_max?: number | null;
  rest_seconds?: number | null;
  rir?: number | null;
  rpe?: number | null;
  notes?: string | null;
}

export interface RoutinePayload {
  name: string;
  exerciseIds?: string[];
  exercise_ids?: string[];
  description?: string;
  is_challenge?: boolean;
  challenge_type?: string;
  challenge_start_date?: string;
  created_at?: string;
}

export interface RoutineUpdatePayload {
  name?: string;
  exerciseIds?: string[];
}

export interface SaveRoutineInput {
  routineId?: string | null;
  userId: string;
  name: string;
  exerciseIds?: string[];
  exercises?: Omit<RoutineExercise, 'id' | 'routine_id'>[];
}

export interface ExerciseConfig {
  id: string | number;
  name: string;
  sets?: number;
  repsMin?: number | null;
  repsMax?: number | null;
  rest?: number | null;
  rir?: number | null;
  rpe?: string | number | null;
  notes?: string | null;
}

export {
  ROUTINE_STEPS,
  DEFAULT_EXERCISE_CONFIG,
  normalizeExerciseForSave,
} from './routines.types.impl.js';
