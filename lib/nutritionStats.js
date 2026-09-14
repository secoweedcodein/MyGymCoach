// lib/nutritionStats.js
//
// Estadísticas y utilidades puras del módulo de nutrición (FASE 5).
// Sin dependencias de RN/Supabase: 100% testeable en Node.
//
// Contrato de campos que usan estas funciones (nutrition_logs):
//   meal_type, food_name, food_id (uuid o null), barcode,
//   calories, protein_g, carbs_g, fat_g, quantity_g, logged_date (YYYY-MM-DD).

import {
  weekDateKeys,
  monthDateKeys,
  isWithinRange,
} from './dateUtils';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return !!value && UUID_RE.test(String(value));
}

// Normaliza texto para comparaciones/dedup (minúsculas y sin acentos).
export function normalizeName(name) {
  return String(name ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// ── Totales ──────────────────────────────────────────────────────────────────
export function sumMacros(logs = []) {
  return logs.reduce(
    (acc, log) => ({
      calories: acc.calories + toNum(log.calories),
      protein:  acc.protein  + toNum(log.protein_g),
      carbs:    acc.carbs    + toNum(log.carbs_g),
      fat:      acc.fat      + toNum(log.fat_g),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// Totales por día respetando el orden de dayKeys (días sin datos => 0).
export function computeDailyTotals(logs = [], dayKeys = []) {
  return dayKeys.map(date => {
    const dayLogs = logs.filter(l => l.logged_date === date);
    const t = sumMacros(dayLogs);
    return {
      date,
      calories: Math.round(t.calories),
      protein:  Math.round(t.protein),
      carbs:    Math.round(t.carbs),
      fat:      Math.round(t.fat),
    };
  });
}

// Promedio sobre los días CON datos (no divide entre días vacíos).
export function computeAverages(dailyTotals = []) {
  const days = dailyTotals.filter(d => d.calories > 0);
  const n = days.length || 1;
  return {
    calories: Math.round(days.reduce((a, d) => a + d.calories, 0) / n),
    protein:  Math.round(days.reduce((a, d) => a + d.protein,  0) / n),
    carbs:    Math.round(days.reduce((a, d) => a + d.carbs,    0) / n),
    fat:      Math.round(days.reduce((a, d) => a + d.fat,      0) / n),
    daysWithData: days.length,
  };
}

// Cumplimiento: calorías dentro de ±10% de la meta; proteína >= 90%.
export function computeCompliance(dailyTotals = [], goals = {}) {
  const days = dailyTotals.filter(d => d.calories > 0);
  const calGoal = toNum(goals.calories);
  const protGoal = toNum(goals.protein_g);
  let calDays = 0;
  let protDays = 0;
  let bothDays = 0;

  for (const d of days) {
    const calOk = calGoal > 0 && d.calories >= calGoal * 0.9 && d.calories <= calGoal * 1.1;
    const protOk = protGoal > 0 && d.protein >= protGoal * 0.9;
    if (calOk) calDays++;
    if (protOk) protDays++;
    if (calOk && protOk) bothDays++;
  }

  return {
    calDays,
    protDays,
    bothDays,
    total: days.length,
    adherencePct: days.length > 0 ? Math.round((bothDays / days.length) * 100) : 0,
  };
}

// Distribución de calorías por comida.
export function sumByMeal(logs = []) {
  const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
  const base = meals.reduce((acc, m) => ({ ...acc, [m]: 0 }), {});
  logs.forEach(l => {
    if (base[l.meal_type] !== undefined) base[l.meal_type] += toNum(l.calories);
  });
  return base;
}

// Ranking de alimentos más consumidos (frecuencia).
export function topFoods(logs = [], limit = 5) {
  const count = {};
  logs.forEach(l => {
    const name = l.food_name || 'Sin nombre';
    count[name] = (count[name] || 0) + 1;
  });
  return Object.entries(count)
    .map(([name, times]) => ({ name, times }))
    .sort((a, b) => b.times - a.times)
    .slice(0, limit);
}

// ── Edición de registros ─────────────────────────────────────────────────────
// Recalcula macros proporcionalmente al cambiar la cantidad (mismo alimento).
export function rescaleEntry(entry, newQuantityG) {
  const oldQ = toNum(entry.quantity_g);
  if (oldQ <= 0) return { ...entry, quantity_g: newQuantityG };
  const factor = toNum(newQuantityG) / oldQ;
  return {
    ...entry,
    quantity_g: toNum(newQuantityG),
    calories: Math.round(toNum(entry.calories) * factor),
    protein_g: Math.round(toNum(entry.protein_g) * factor * 10) / 10,
    carbs_g:   Math.round(toNum(entry.carbs_g)   * factor * 10) / 10,
    fat_g:     Math.round(toNum(entry.fat_g)     * factor * 10) / 10,
  };
}

// ── Registro canónico ────────────────────────────────────────────────────────
// Crea la fila de nutrition_logs desde un alimento + gramos, con limpieza:
//  - food_id solo se persiste si es un uuid válido (los retos/recetas usan ids string).
//  - food_name normalizado y recortado al valor real.
export function buildNutritionEntry({
  name,
  foodId = null,
  barcode = null,
  mealType = 'snack',
  per100g = {},
  grams = 100,
  dateKey,
}) {
  const factor = toNum(grams) / 100;
  return {
    meal_type: mealType,
    food_name: String(name ?? 'Alimento').trim().slice(0, 200),
    food_id: isUuid(foodId) ? String(foodId) : null,
    barcode: barcode || null,
    calories:  Math.round(toNum(per100g.calories) * factor),
    protein_g: Math.round(toNum(per100g.protein)   * factor * 10) / 10,
    carbs_g:   Math.round(toNum(per100g.carbs)     * factor * 10) / 10,
    fat_g:     Math.round(toNum(per100g.fat)       * factor * 10) / 10,
    quantity_g: toNum(grams),
    logged_date: dateKey,
  };
}

// ── Períodos de historial (día/semana/mes) con claves locales ────────────────
export function periodDateKeys(period = 'week', todayKeyToday) {
  const today = todayKeyToday || new Date().toISOString().slice(0, 10);
  switch (period) {
    case 'day':
      return [today];
    case 'month':
      return monthDateKeys(today);
    case 'week':
    default:
      return weekDateKeys(today);
  }
}

export function isInPeriod(loggedDate, period, todayKeyToday) {
  const keys = periodDateKeys(period, todayKeyToday);
  return isWithinRange(loggedDate, keys[0], keys[keys.length - 1]);
}

// ── Dedupe genérico ──────────────────────────────────────────────────────────
export function dedupeByKey(items = [], keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const k = keyFn(item);
    if (k == null || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}