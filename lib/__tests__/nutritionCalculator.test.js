// lib/__tests__/nutritionCalculator.test.js
// Tests de las fórmulas nutricionales canónicas (Mifflin-St Jeor, TDEE, macros).

import {
  calculateBMR,
  calculateTDEE,
  calculateMacrosFromCalories,
  calculateDailyNutrition,
  validateNutritionProfile,
  getAgeFromBirthYear,
} from '../nutritionCalculator';
import {
  resolveGoal,
  resolveActivityLevel,
  GOALS,
  ACTIVITY_LEVELS,
} from '../nutritionConstants';

describe('resolveGoal (mapeos legacy → canónico)', () => {
  it('resuelve ids canónicos', () => {
    expect(resolveGoal('muscle_gain')).toBe('muscle_gain');
    expect(resolveGoal('fat_loss')).toBe('fat_loss');
    expect(resolveGoal('strength')).toBe('strength');
    expect(resolveGoal('endurance')).toBe('endurance');
    expect(resolveGoal('maintenance')).toBe('maintenance');
  });

  it('resuelve ids legacy del onboarding', () => {
    expect(resolveGoal('ganar_musculo')).toBe('muscle_gain');
    expect(resolveGoal('perder_peso')).toBe('fat_loss');
    expect(resolveGoal('mantenimiento')).toBe('maintenance');
  });

  it('resuelve textos legacy del perfil', () => {
    expect(resolveGoal('Ganar masa muscular')).toBe('muscle_gain');
    expect(resolveGoal('Perder grasa')).toBe('fat_loss');
    expect(resolveGoal('Fuerza máxima')).toBe('strength');
    expect(resolveGoal('Resistencia')).toBe('endurance');
    expect(resolveGoal('Mantenimiento')).toBe('maintenance');
  });

  it('usa el fallback para valores desconocidos', () => {
    expect(resolveGoal('hacer_tejados', 'maintenance')).toBe('maintenance');
    expect(resolveGoal('hacer_tejados', null)).toBeNull();
  });
});

describe('resolveActivityLevel', () => {
  it('resuelve las 5 claves canónicas', () => {
    expect(['sedentary', 'light', 'moderate', 'active', 'very_active'].every(k => resolveActivityLevel(k) === k)).toBe(true);
  });

  it('resuelve valores en español y cae al fallback para desconocidos', () => {
    expect(resolveActivityLevel('Sedentario')).toBe('sedentary');
    expect(resolveActivityLevel('Muy activa')).toBe('very_active');
    expect(resolveActivityLevel('luna_lúdica', 'moderate')).toBe('moderate');
  });
});

describe('calculateBMR (Mifflin-St Jeor)', () => {
  it('calcula el BMR de un atleta de 75 kg / 175 cm / 25 años', () => {
    // 10*75 + 6.25*175 - 5*25 + 5 = 1723.75
    expect(calculateBMR({ weightKg: 75, heightCm: 175, age: 25 })).toBeCloseTo(1723.75, 2);
  });

  it('devuelve null si faltan datos o son inválidos', () => {
    expect(calculateBMR({ weightKg: null, heightCm: 175, age: 25 })).toBeNull();
    expect(calculateBMR({ weightKg: 75, heightCm: 175, age: -5 })).toBeNull();
    expect(calculateBMR({ weightKg: 0, heightCm: 175, age: 25 })).toBeNull();
  });
});

describe('calculateTDEE', () => {
  const data = { weightKg: 75, heightCm: 175, age: 25 };

  it('aplica el multiplicador de actividad', () => {
    // 1723.75 * 1.55 ≈ 2671.81 → 2672
    expect(calculateTDEE({ ...data, activityLevel: 'moderate', goal: 'maintenance' })).toBe(2672);
  });

  it('aplica los ajustes por objetivo', () => {
    // TDEE sin redondear antes del ajuste: 1723.75 * 1.55 = 2671.8125
    const tdeeRaw = calculateBMR(data) * ACTIVITY_LEVELS.moderate.multiplier;
    expect(calculateTDEE({ ...data, activityLevel: 'moderate', goal: 'muscle_gain' })).toBe(Math.round(tdeeRaw * 1.15));
    expect(calculateTDEE({ ...data, activityLevel: 'moderate', goal: 'fat_loss' })).toBe(Math.round(tdeeRaw * 0.80));
    expect(calculateTDEE({ ...data, activityLevel: 'moderate', goal: 'strength' })).toBe(Math.round(tdeeRaw * 1.10));
    expect(calculateTDEE({ ...data, activityLevel: 'moderate', goal: 'endurance' })).toBe(Math.round(tdeeRaw));
  });

  it('resuelve objetivos legacy dentro del cálculo', () => {
    expect(calculateTDEE({ ...data, activityLevel: 'moderate', goal: 'ganar_musculo' }))
      .toBe(calculateTDEE({ ...data, activityLevel: 'moderate', goal: 'muscle_gain' }));
  });
});

describe('calculateMacrosFromCalories', () => {
  it('reparte proteína 2g/kg, 25% grasas y el resto en carbos', () => {
    const macros = calculateMacrosFromCalories({ calories: 3073, weightKg: 75 });
    // Proteína: 2*75 = 150 g → 600 kcal. Grasa: 25% de 3073 = 768.25 kcal → 85 g.
    // Carbos: (3073 - 600 - 768.25)/4 ≈ 426 g.
    expect(macros).toEqual({ calories: 3073, protein_g: 150, carbs_g: 426, fat_g: 85 });
  });

  it('nunca devuelve carbos negativos', () => {
    const macros = calculateMacrosFromCalories({ calories: 1000, weightKg: 200 });
    expect(macros.carbs_g).toBeGreaterThanOrEqual(0);
    expect(macros.protein_g).toBe(400);
  });

  it('devuelve null con entradas inválidas', () => {
    expect(calculateMacrosFromCalories({ calories: 0, weightKg: 75 })).toBeNull();
    expect(calculateMacrosFromCalories({ calories: 2000, weightKg: null })).toBeNull();
  });
});

describe('calculateDailyNutrition', () => {
  it('computa el plan diario desde un perfil completo', () => {
    const birthYear = new Date().getFullYear() - 25; // 25 años
    const plan = calculateDailyNutrition({
      weight_kg: 75,
      height_cm: 175,
      birth_year: birthYear,
      goal: 'muscle_gain',
      activity_level: 'moderate',
    });
    expect(plan).not.toBeNull();
    expect(plan.protein_g).toBe(150);
    expect(plan.calories).toBe(calculateTDEE({ weightKg: 75, heightCm: 175, age: 25, activityLevel: 'moderate', goal: 'muscle_gain' }));
  });

  it('devuelve null si falta peso, altura o edad', () => {
    expect(calculateDailyNutrition({ weight_kg: 75, height_cm: 175 })).toBeNull();
    expect(calculateDailyNutrition(null)).toBeNull();
  });
});

describe('validateNutritionProfile', () => {
  it('acepta un perfil válido', () => {
    expect(validateNutritionProfile({ weightKg: 75, heightCm: 175, age: 25, goal: 'muscle_gain', activityLevel: 'moderate' })).toEqual([]);
  });

  it('reporta edades, pesos y alturas fuera de rango', () => {
    const errors = validateNutritionProfile({ weightKg: 12, heightCm: 55, age: 105, goal: 'muscle_gain', activityLevel: 'moderate' });
    expect(errors.length).toBe(3);
  });

  it('reporta objetivo y actividad no válidos', () => {
    const errors = validateNutritionProfile({ weightKg: 75, heightCm: 175, age: 25, goal: 'volando_alto', activityLevel: 'modo_halcón' });
    expect(errors.join(' ')).toContain('objetivo');
    expect(errors.join(' ')).toContain('actividad');
  });
});

describe('getAgeFromBirthYear', () => {
  it('calcula la edad a partir del año de nacimiento', () => {
    expect(getAgeFromBirthYear(new Date().getFullYear() - 30)).toBe(30);
  });

  it('devuelve null sin año de nacimiento', () => {
    expect(getAgeFromBirthYear(null)).toBeNull();
    expect(getAgeFromBirthYear(undefined)).toBeNull();
  });
});

describe('catálogo canónico', () => {
  it('expone 5 objetivos y 5 niveles de actividad con todas sus claves', () => {
    expect(Object.keys(GOALS).sort()).toEqual(['endurance', 'fat_loss', 'maintenance', 'muscle_gain', 'strength']);
    expect(Object.keys(ACTIVITY_LEVELS).sort()).toEqual(['active', 'light', 'moderate', 'sedentary', 'very_active']);
  });
});