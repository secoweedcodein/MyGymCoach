// lib/nutritionConstants.js
// Vocabulario canónico del sistema nutricional de MyGymCoach.
// Autopista oficial: los valores persistentes (user_profiles.goal,
// user_profiles.activity_level, nutrition_goals.goal, nutrition_goals.activity_level)
// SIEMPRE usan estos ids. Los valores legacy se resuelven con resolveGoal /
// resolveActivityLevel (ver nutritionCalculator.js).

export const GOALS = {
  muscle_gain: { label: 'Ganar masa muscular', calorieAdjust: 0.15, description: 'Hipertrofia y fuerza' },
  fat_loss:    { label: 'Perder grasa',        calorieAdjust: -0.20, description: 'Quemar grasa' },
  strength:    { label: 'Fuerza máxima',       calorieAdjust: 0.10, description: 'Potencia y rendimiento' },
  endurance:   { label: 'Resistencia',         calorieAdjust: 0, description: 'Aguante y cardio' },
  maintenance: { label: 'Mantenimiento',       calorieAdjust: 0, description: 'Mantenerme en forma' },
};

export const ACTIVITY_LEVELS = {
  sedentary:   { label: 'Sedentario', multiplier: 1.2 },
  light:       { label: 'Ligera',     multiplier: 1.375 },
  moderate:    { label: 'Moderada',   multiplier: 1.55 },
  active:      { label: 'Activa',     multiplier: 1.725 },
  very_active: { label: 'Muy activa', multiplier: 1.9 },
};

export const DEFAULT_GOAL = 'maintenance';
export const DEFAULT_ACTIVITY_LEVEL = 'moderate';

// Mapeos de valores legacy (onboarding antiguo, textos de perfil) → ids canónicos.
export const LEGACY_GOAL_MAP = {
  'ganar_musculo': 'muscle_gain',
  'Ganar masa muscular': 'muscle_gain',
  'perder_peso': 'fat_loss',
  'Perder grasa': 'fat_loss',
  'mantenimiento': 'maintenance',
  'Mantenimiento': 'maintenance',
  'Fuerza máxima': 'strength',
  'Resistencia': 'endurance',
};

export const LEGACY_ACTIVITY_MAP = {
  'sedentario': 'sedentary',
  'ligera': 'light',
  'moderada': 'moderate',
  'activa': 'active',
  'muy activa': 'very_active',
  'Sedentario': 'sedentary',
  'Ligera': 'light',
  'Moderada': 'moderate',
  'Activa': 'active',
  'Muy activa': 'very_active',
};

export function resolveGoal(value, fallback = DEFAULT_GOAL) {
  if (value && Object.prototype.hasOwnProperty.call(GOALS, value)) return value;
  if (value && Object.prototype.hasOwnProperty.call(LEGACY_GOAL_MAP, value)) return LEGACY_GOAL_MAP[value];
  return fallback;
}

export function resolveActivityLevel(value, fallback = DEFAULT_ACTIVITY_LEVEL) {
  if (value && Object.prototype.hasOwnProperty.call(ACTIVITY_LEVELS, value)) return value;
  if (value && Object.prototype.hasOwnProperty.call(LEGACY_ACTIVITY_MAP, value)) return LEGACY_ACTIVITY_MAP[value];
  return fallback;
}

export function goalLabel(goal) {
  const resolved = resolveGoal(goal, null);
  return resolved ? GOALS[resolved].label : null;
}

export function activityLabel(level) {
  const resolved = resolveActivityLevel(level, null);
  return resolved ? ACTIVITY_LEVELS[resolved].label : null;
}