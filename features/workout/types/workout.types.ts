// features/workout/types/workout.types.ts
export type SetType = 'N' | 'W' | 'D' | 'F';

export interface WorkoutSet {
  id?: string;
  sessionId?: string;
  exerciseId: number | string;
  exerciseName: string;
  setNumber: number;
  setType?: SetType;
  weightKg?: number | null;
  reps?: number | null;
  completed?: boolean;
  loggedAt?: string;
  clientGeneratedId?: string;
  rpe?: number | null;
}

export interface WorkoutSession {
  id?: string;
  userId?: string;
  routineName: string;
  startedAt: string;
  finishedAt?: string | null;
  totalSets?: number;
  totalVolumeKg?: number;
  durationMinutes?: number;
  idempotencyKey?: string;
  clientGeneratedId?: string;
}

export interface ExerciseEntry {
  id: string | number;
  name: string;
  sets: WorkoutSet[];
  targetSets?: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  restSeconds?: number;
  rir?: number | null;
  rpeTarget?: number | null;
  notes?: string;
}

export type MutationState = 'pending' | 'syncing' | 'synced' | 'failed';

export interface QueueItem {
  id: string;
  type: 'create_session' | 'add_sets' | 'finish_session' | 'update_prs';
  state: MutationState;
  payload: any;
  attempts: number;
  maxAttempts?: number;
  error?: string | null;
  lastErrorCode?: string | null;
  lastAttemptAt?: string | null;
  queuedAt: string;
  clientGeneratedId?: string;
  userId?: string | null;
}

export interface PRMetrics {
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
  e1rm: number;
}

export interface PRImproved {
  set: WorkoutSet;
  metrics: string[];
}
