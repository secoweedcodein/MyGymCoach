// features/workout/utils/metrics.js
import {
  sessionVolume as baseSessionVolume,
  sessionStats as baseSessionStats,
  estimate1RM,
  maxEstimated1RM,
  evaluatePR,
  summarizeBestSets,
  computeNextLoad,
  detectPlateau,
  computeWorkoutStreak,
  computeNutritionStreak,
  roundToPlate,
} from '../../../lib/trainingLogic';

export {
  baseSessionVolume,
  baseSessionStats,
  estimate1RM,
  maxEstimated1RM,
  evaluatePR,
  summarizeBestSets,
  computeNextLoad,
  detectPlateau,
  computeWorkoutStreak,
  computeNutritionStreak,
  roundToPlate,
};

export function setVolume(weightKg, reps) {
  const w = Number(weightKg);
  const r = Number(reps);
  if (!Number.isFinite(w) || !Number.isFinite(r)) return 0;
  return w * r;
}

export function sessionVolume(sets) {
  return baseSessionVolume(sets);
}

export function sessionStats(sets, elapsedSeconds) {
  return baseSessionStats(sets, elapsedSeconds);
}
