// lib/nutritionCalculator.js
// Calculador nutricional centralizado de MyGymCoach (funciones puras, sin UI ni BD).
//
// Fórmulas de referencia:
//   BMR (Mifflin-St Jeor unisex) = 10·peso(kg) + 6.25·altura(cm) − 5·edad + 5
//   TDEE = BMR × multiplicador(actividad)
//   Ajuste calórico por objetivo: muscle_gain +15%, fat_loss −20%, strength +10%,
//                                 endurance 0%, maintenance 0%
//   Proteína = 2 g/kg, Grasa = 25% kcal / 9, Carbos = restante / 4

import {
  GOALS,
  ACTIVITY_LEVELS,
  DEFAULT_GOAL,
  DEFAULT_ACTIVITY_LEVEL,
  resolveGoal,
  resolveActivityLevel,
} from './nutritionConstants';

// Rangos de validación de los campos del perfil (fueron decididos como contexto del proyecto).
export const VALIDATION_RANGES = {
  weightKg:   { min: 30, max: 300 },
  heightCm:   { min: 100, max: 250 },
  age:        { min: 13, max: 100 },
};

function toNumber(value) {
  return value == null || value === '' ? NaN : Number(value);
}

export function getAgeFromBirthYear(birthYear, now = new Date()) {
  const y = toNumber(birthYear);
  if (!Number.isFinite(y)) return null;
  return now.getFullYear() - Math.floor(y);
}

export function calculateBMR({ weightKg, heightCm, age }) {
  const w = toNumber(weightKg);
  const h = toNumber(heightCm);
  const a = toNumber(age);
  if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(a)) return null;
  if (w <= 0 || h <= 0 || a <= 0) return null;
  return 10 * w + 6.25 * h - 5 * a + 5;
}

export function calculateTDEE({
  weightKg,
  heightCm,
  age,
  activityLevel = DEFAULT_ACTIVITY_LEVEL,
  goal = DEFAULT_GOAL,
}) {
  const bmr = calculateBMR({ weightKg, heightCm, age });
  if (bmr == null) return null;

  const activity = resolveActivityLevel(activityLevel);
  const goalKey = resolveGoal(goal);
  const tdee = bmr * ACTIVITY_LEVELS[activity].multiplier;
  const adjusted = tdee + tdee * GOALS[goalKey].calorieAdjust;
  return Math.round(adjusted);
}

export function calculateMacrosFromCalories({ calories, weightKg }) {
  const kcal = toNumber(calories);
  const w = toNumber(weightKg);
  if (!Number.isFinite(kcal) || kcal <= 0 || !Number.isFinite(w) || w <= 0) return null;

  const protein_g = Math.round(w * 2);
  const fatCalories = kcal * 0.25;
  const fat_g = Math.round(fatCalories / 9);
  const remainingCalories = kcal - protein_g * 4 - fatCalories;
  const carbs_g = Math.max(0, Math.round(remainingCalories / 4));

  return { calories: Math.round(kcal), protein_g, carbs_g, fat_g };
}

// Cálculo completo a partir de un perfil (user_profiles).
// Devuelve null si faltan peso, altura o edad.
export function calculateDailyNutrition(profile) {
  if (!profile || !profile.weight_kg || !profile.height_cm || !profile.birth_year) return null;

  const age = getAgeFromBirthYear(profile.birth_year);
  const tdee = calculateTDEE({
    weightKg: profile.weight_kg,
    heightCm: profile.height_cm,
    age,
    activityLevel: profile.activity_level || profile.activity_level_id,
    goal: profile.goal,
  });
  if (tdee == null) return null;

  return calculateMacrosFromCalories({ calories: tdee, weightKg: profile.weight_kg });
}

// Validación del perfil nutricional. Devuelve lista de mensajes (vacía si es válido).
export function validateNutritionProfile({ weightKg, heightCm, age, goal, activityLevel }) {
  const errors = [];

  const w = toNumber(weightKg);
  if (!Number.isFinite(w) || w < VALIDATION_RANGES.weightKg.min || w > VALIDATION_RANGES.weightKg.max) {
    errors.push(`El peso debe estar entre ${VALIDATION_RANGES.weightKg.min} y ${VALIDATION_RANGES.weightKg.max} kg.`);
  }

  const h = toNumber(heightCm);
  if (!Number.isFinite(h) || h < VALIDATION_RANGES.heightCm.min || h > VALIDATION_RANGES.heightCm.max) {
    errors.push(`La altura debe estar entre ${VALIDATION_RANGES.heightCm.min} y ${VALIDATION_RANGES.heightCm.max} cm.`);
  }

  const a = toNumber(age);
  if (!Number.isFinite(a) || a < VALIDATION_RANGES.age.min || a > VALIDATION_RANGES.age.max) {
    errors.push(`La edad debe estar entre ${VALIDATION_RANGES.age.min} y ${VALIDATION_RANGES.age.max} años.`);
  }

  if (goal != null && goal !== '' && !resolveGoal(goal, null)) {
    errors.push('El objetivo seleccionado no es válido.');
  }

  if (activityLevel != null && activityLevel !== '' && !resolveActivityLevel(activityLevel, null)) {
    errors.push('El nivel de actividad seleccionado no es válido.');
  }

  return errors;
}