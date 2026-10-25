import * as implementation from './routinesService.impl.js';
import type {
  Routine,
  RoutineExercise,
  RoutinePayload,
  RoutineUpdatePayload,
  SaveRoutineInput,
} from '../types/routines.types';

export type {
  Routine,
  RoutineExercise,
  RoutinePayload,
  RoutineUpdatePayload,
  SaveRoutineInput,
} from '../types/routines.types';

export function fetchUserRoutines(userId: string): Promise<Routine[]> {
  return implementation.fetchUserRoutines(userId);
}

export function fetchRoutineExercises(routineId: string): Promise<RoutineExercise[]> {
  return implementation.fetchRoutineExercises(routineId);
}

export function findUserRoutineByName(
  userId: string,
  name: string,
): Promise<{ id: string } | null> {
  return implementation.findUserRoutineByName(userId, name);
}

export function getCurrentUser(): Promise<{ id: string } | null> {
  return implementation.getCurrentUser();
}

export function createRoutine(userId: string, payload: RoutinePayload): Promise<{ id: string }> {
  return implementation.createRoutine(userId, payload);
}

export function updateRoutine(routineId: string, payload: RoutineUpdatePayload): Promise<void> {
  return implementation.updateRoutine(routineId, payload);
}

export function deleteRoutine(routineId: string): Promise<void> {
  return implementation.deleteRoutine(routineId);
}

export function deleteRoutineExercises(routineId: string): Promise<void> {
  return implementation.deleteRoutineExercises(routineId);
}

export function insertRoutineExercises(rows: RoutineExercise[]): Promise<void> {
  return implementation.insertRoutineExercises(rows);
}

export function duplicateRoutineExercises(
  routineId: string,
  rows: Partial<RoutineExercise>[],
): Promise<number> {
  return implementation.duplicateRoutineExercises(routineId, rows);
}

export function saveRoutineWithExercisesAtomic(input: SaveRoutineInput): Promise<unknown> {
  return implementation.saveRoutineWithExercisesAtomic(input);
}
