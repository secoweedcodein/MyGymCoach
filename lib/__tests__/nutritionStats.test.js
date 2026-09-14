// lib/__tests__/nutritionStats.test.js
import {
  isUuid,
  normalizeName,
  sumMacros,
  computeDailyTotals,
  computeAverages,
  computeCompliance,
  sumByMeal,
  topFoods,
  rescaleEntry,
  buildNutritionEntry,
  periodDateKeys,
  isInPeriod,
  dedupeByKey,
} from '../nutritionStats';

describe('isUuid / normalizeName', () => {
  test('detecta uuids reales', () => {
    expect(isUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });

  test('rechaza ids string de retos/recetas', () => {
    expect(isUuid('recipe_abc')).toBe(false);
    expect(isUuid('abs_plank')).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });

  test('normaliza nombres (minúsculas, acentos, espacios)', () => {
    expect(normalizeName('  PlátAno "Süper" ')).toBe('platano "super"');
  });
});

describe('sumMacros', () => {
  test('suma calorías y macros de varias entradas', () => {
    const logs = [
      { calories: 100, protein_g: 10, carbs_g: 20, fat_g: 1 },
      { calories: 50, protein_g: 5, carbs_g: 10, fat_g: 2 },
    ];
    expect(sumMacros(logs)).toEqual({ calories: 150, protein: 15, carbs: 30, fat: 3 });
  });

  test('tolera valores ausentes', () => {
    expect(sumMacros([{ calories: null }, {}])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe('computeDailyTotals', () => {
  const logs = [
    { logged_date: '2026-09-10', calories: 100, protein_g: 10, carbs_g: 5, fat_g: 1 },
    { logged_date: '2026-09-10', calories: 50,  protein_g: 5,  carbs_g: 5, fat_g: 1 },
    { logged_date: '2026-09-12', calories: 200, protein_g: 20, carbs_g: 10, fat_g: 2 },
  ];

  test('incluye días sin datos como 0 y respeta el orden', () => {
    const totals = computeDailyTotals(logs, ['2026-09-10', '2026-09-11', '2026-09-12']);
    expect(totals).toEqual([
      { date: '2026-09-10', calories: 150, protein: 15, carbs: 10, fat: 2 },
      { date: '2026-09-11', calories: 0,   protein: 0,   carbs: 0,  fat: 0 },
      { date: '2026-09-12', calories: 200, protein: 20, carbs: 10, fat: 2 },
    ]);
  });
});

describe('computeAverages', () => {
  test('promedia solo días con datos', () => {
    const dailyTotals = [
      { date: 'a', calories: 100, protein: 10, carbs: 0, fat: 0 },
      { date: 'b', calories: 0, protein: 0, carbs: 0, fat: 0 },
      { date: 'c', calories: 300, protein: 20, carbs: 0, fat: 0 },
    ];
    const avg = computeAverages(dailyTotals);
    expect(avg.calories).toBe(200);
    expect(avg.protein).toBe(15);
    expect(avg.daysWithData).toBe(2);
  });
});

describe('computeCompliance', () => {
  const goals = { calories: 2000, protein_g: 150 };
  const dailyTotals = [
    { date: 'a', calories: 1900, protein: 170, carbs: 0, fat: 0 },
    { date: 'b', calories: 2100, protein: 140, carbs: 0, fat: 0 },
    { date: 'c', calories: 500,  protein: 30,  carbs: 0, fat: 0 },
  ];

  test('calorías ±10% y proteína >= 90%', () => {
    const c = computeCompliance(dailyTotals, goals);
    expect(c.total).toBe(3);
    expect(c.calDays).toBe(2);
    expect(c.protDays).toBe(2);
    expect(c.bothDays).toBe(2);
    expect(c.adherencePct).toBe(67);
  });

  test('sin metas devuelve 0 en todas', () => {
    const c = computeCompliance(dailyTotals, {});
    expect(c).toEqual({ calDays: 0, protDays: 0, bothDays: 0, total: 3, adherencePct: 0 });
  });
});

describe('sumByMeal / topFoods', () => {
  test('reparte calorías por comida', () => {
    const logs = [
      { meal_type: 'breakfast', calories: 300 },
      { meal_type: 'lunch', calories: 500 },
      { meal_type: 'snack', calories: 100 },
      { meal_type: 'lunch', calories: 200 },
    ];
    expect(sumByMeal(logs)).toEqual({ breakfast: 300, lunch: 700, dinner: 0, snack: 100 });
  });

  test('rank foods por frecuencia', () => {
    const logs = [
      { food_name: 'Pollo' }, { food_name: 'Arroz' }, { food_name: 'Pollo' }, { food_name: 'Pollo' },
    ];
    expect(topFoods(logs, 2)).toEqual([
      { name: 'Pollo', times: 3 },
      { name: 'Arroz', times: 1 },
    ]);
  });
});

describe('rescaleEntry', () => {
  test('reescala macros proporcionalmente a la cantidad', () => {
    const entry = { quantity_g: 100, calories: 250, protein_g: 25, carbs_g: 5, fat_g: 1.5 };
    const scaled = rescaleEntry(entry, 200);
    expect(scaled.quantity_g).toBe(200);
    expect(scaled.calories).toBe(500);
    expect(scaled.protein_g).toBe(50);
    expect(scaled.fat_g).toBe(3);
  });

  test('protege de cantidad original cero', () => {
    const entry = { quantity_g: 0, calories: 100, protein_g: 10, carbs_g: 0, fat_g: 0 };
    expect(rescaleEntry(entry, 100).quantity_g).toBe(100);
  });
});

describe('buildNutritionEntry', () => {
  test('crea fila canónica con macros escaladas', () => {
    const entry = buildNutritionEntry({
      name: '  Pollo  ',
      foodId: '123e4567-e89b-12d3-a456-426614174000',
      barcode: '8410000',
      mealType: 'lunch',
      per100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      grams: 150,
      dateKey: '2026-09-13',
    });
    expect(entry.food_name).toBe('Pollo');
    expect(entry.food_id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(entry.barcode).toBe('8410000');
    expect(entry.calories).toBe(248);
    expect(entry.protein_g).toBe(46.5);
    expect(entry.quantity_g).toBe(150);
    expect(entry.logged_date).toBe('2026-09-13');
  });

  test('limpia food_id no uuid (recetas/retos)', () => {
    const entry = buildNutritionEntry({
      name: 'Receta',
      foodId: 'recipe_abc',
      per100g: { calories: 100, protein: 5, carbs: 0, fat: 0 },
      grams: 100,
      dateKey: '2026-09-13',
    });
    expect(entry.food_id).toBe(null);
  });
});

describe('periodDateKeys / isInPeriod', () => {
  test('día devuelve solo la clave de hoy', () => {
    expect(periodDateKeys('day', '2026-09-13')).toEqual(['2026-09-13']);
  });

  test('semana devuelve 7 días empezando en lunes', () => {
    expect(periodDateKeys('week', '2026-09-13')).toEqual([
      '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10',
      '2026-09-11', '2026-09-12', '2026-09-13',
    ]);
  });

  test('mes devuelve todos los días del mes', () => {
    const keys = periodDateKeys('month', '2026-07-15');
    expect(keys.length).toBe(31);
    expect(keys[0]).toBe('2026-07-01');
    expect(keys[30]).toBe('2026-07-31');
  });

  test('isInPeriod filtra por rango', () => {
    expect(isInPeriod('2026-09-08', 'week', '2026-09-07')).toBe(true);
    expect(isInPeriod('2026-09-01', 'week', '2026-09-07')).toBe(false);
  });
});

describe('dedupeByKey', () => {
  test('elimina duplicados por la clave que se pasa', () => {
    const items = [{ name: 'a' }, { name: 'b' }, { name: 'a' }];
    expect(dedupeByKey(items, x => x.name)).toEqual([{ name: 'a' }, { name: 'b' }]);
  });
});