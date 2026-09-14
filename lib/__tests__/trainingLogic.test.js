// lib/__tests__/trainingLogic.test.js
import {
  setVolume,
  sessionVolume,
  sessionStats,
  estimate1RM,
  maxEstimated1RM,
  candidateMetrics,
  evaluatePR,
  summarizeBestSets,
  computeNextLoad,
  PROGRESSION_ACTIONS,
  detectPlateau,
  dayKeyOrdinal,
  daysBetween,
  maxAllowedGap,
  computeWorkoutStreak,
  computeNutritionStreak,
  hashString,
  createIdempotencyKey,
  dedupeQueueByKey,
  isTransientNetworkError,
  nextBackoffMs,
  roundToPlate,
} from '../trainingLogic';

describe('volumen', () => {
  test('setVolume multiplica kg × reps y tolera strings', () => {
    expect(setVolume(100, 5)).toBe(500);
    expect(setVolume('100', '5')).toBe(500);
    expect(setVolume('', '')).toBe(0);
    expect(setVolume(null, 5)).toBe(0);
  });

  test('sessionVolume suma solo series completadas', () => {
    const sets = [
      { weight_kg: 100, reps: 5, completed: true },
      { weight_kg: 80, reps: 10, completed: false },
      { weight_kg: 50, reps: 8 },
    ];
    expect(sessionVolume(sets)).toBe(500 + 400);
  });

  test('sessionStats calcula series, reps, volumen y duración', () => {
    const sets = [
      { weight_kg: 100, reps: 5 },
      { weight_kg: 90, reps: 5 },
      { weight_kg: 80, reps: 8, completed: false },
    ];
    const stats = sessionStats(sets, 3720);
    expect(stats.totalSets).toBe(2);
    expect(stats.totalReps).toBe(10);
    expect(stats.totalVolumeKg).toBe(950);
    expect(stats.durationMinutes).toBe(62);
  });

  test('sessionStats con sesión vacía devuelve ceros', () => {
    const stats = sessionStats([], 0);
    expect(stats).toEqual({ totalSets: 0, totalReps: 0, totalVolumeKg: 0, durationMinutes: 0 });
  });
});

describe('1RM (Brzycki)', () => {
  test('fórmula canónica: 100 kg × 5 reps → 112.5', () => {
    expect(estimate1RM(100, 5)).toBeCloseTo(112.5);
  });

  test('1 rep es el propio peso', () => {
    expect(estimate1RM(80, 1)).toBeCloseTo(80);
  });

  test('fuera de rango devuelve 0', () => {
    expect(estimate1RM(0, 5)).toBe(0);
    expect(estimate1RM(100, 0)).toBe(0);
    expect(estimate1RM(100, 37)).toBe(0);
    expect(estimate1RM(100, 40)).toBe(0);
  });

  test('maxEstimated1RM devuelve el mayor de varias series', () => {
    const sets = [
      { weight_kg: 60, reps: 10 },
      { weight_kg: 100, reps: 5 },
      { weight_kg: 80, reps: 1 },
    ];
    expect(maxEstimated1RM(sets)).toBeCloseTo(112.5);
  });
});

describe('PR (4 métricas)', () => {
  test('candidateMetrics calcula peso, reps, volumen y e1rm', () => {
    const m = candidateMetrics(100, 5);
    expect(m.max_weight).toBe(100);
    expect(m.max_reps).toBe(5);
    expect(m.max_volume).toBe(500);
    expect(m.e1rm).toBeCloseTo(112.5);
  });

  test('candidateMetrics ignora serie sin peso', () => {
    const m = candidateMetrics(0, 5);
    expect(m.max_reps).toBe(0);
    expect(m.max_volume).toBe(0);
  });

  test('evaluatePR actualiza solo métricas mejoradas', () => {
    const current = { max_weight: 100, max_reps: 5, max_volume: 500, e1rm: 112.5 };
    const set = { weight_kg: 105, reps: 5 };
    const { updated, improved } = evaluatePR(current, set);
    expect(improved).toContain('max_weight');
    expect(improved).toContain('max_volume');
    expect(improved).toContain('e1rm');
    expect(updated.max_weight).toBe(105);
    expect(updated.max_reps).toBe(5);
    expect(improved).not.toContain('max_reps');
  });

  test('evaluatePR detecta récord de reps con menos peso', () => {
    const current = { max_weight: 100, max_reps: 5, max_volume: 500, e1rm: 112.5 };
    const { updated, improved } = evaluatePR(current, { weight_kg: 60, reps: 20 });
    expect(improved).toContain('max_reps');
    expect(updated.max_reps).toBe(20);
    expect(updated.max_weight).toBe(100);
  });

  test('evaluatePR combina: peso y reps suben a la vez', () => {
    const current = { max_weight: 100, max_reps: 5, max_volume: 500, e1rm: 112.5 };
    const { improved } = evaluatePR(current, { weight_kg: 105, reps: 8 });
    expect(improved).toEqual(expect.arrayContaining(['max_weight', 'max_reps', 'max_volume', 'e1rm']));
  });

  test('summarizeBestSets agrega todas las series de una sesión', () => {
    const sets = [
      { weight_kg: 80, reps: 8 },
      { weight_kg: 100, reps: 5 },
      { weight_kg: 60, reps: 15 },
    ];
    const { summary } = summarizeBestSets(sets);
    expect(summary.max_weight).toBe(100);
    expect(summary.max_reps).toBe(15);
    expect(summary.max_volume).toBe(900); // 60×15
    expect(summary.e1rm).toBeCloseTo(112.5);
  });
});

describe('progresión', () => {
  test('sin historial sugiere empezar conservador', () => {
    const r = computeNextLoad({});
    expect(r.action).toBe(PROGRESSION_ACTIONS.HOLD);
    expect(r.weightKg).toBe(0);
  });

  test('al alcanzar el rango alto sube el peso', () => {
    const r = computeNextLoad({
      history: [{ weightKg: 100, reps: 12 }],
      targetRepsMin: 6,
      targetRepsMax: 10,
      incrementKg: 2.5,
    });
    expect(r.action).toBe(PROGRESSION_ACTIONS.INCREASE);
    expect(r.weightKg).toBe(102.5);
    expect(r.reps).toBe(6);
  });

  test('dentro del rango mantiene peso y suma 1 rep', () => {
    const r = computeNextLoad({
      history: [{ weightKg: 100, reps: 8 }],
      targetRepsMin: 6,
      targetRepsMax: 10,
    });
    expect(r.action).toBe(PROGRESSION_ACTIONS.HOLD);
    expect(r.weightKg).toBe(100);
    expect(r.reps).toBe(9);
  });

  test('dos fallos seguidos disparan descarga del 10%', () => {
    const r = computeNextLoad({
      history: [
        { weightKg: 100, reps: 5 },
        { weightKg: 100, reps: 4 },
      ],
      targetRepsMin: 8,
      targetRepsMax: 12,
      deloadFraction: 0.1,
    });
    expect(r.action).toBe(PROGRESSION_ACTIONS.DELOAD);
    expect(r.weightKg).toBe(90);
    expect(r.reps).toBe(8);
  });

  test('un solo fallo no dispara descarga', () => {
    const r = computeNextLoad({
      history: [{ weightKg: 100, reps: 5 }],
      targetRepsMin: 8,
      targetRepsMax: 12,
    });
    expect(r.action).toBe(PROGRESSION_ACTIONS.HOLD);
  });
});

describe('estancamiento', () => {
  test('con datos insuficientes no declara plateau', () => {
    expect(detectPlateau([{ weightKg: 100, reps: 5 }]).plateau).toBe(false);
  });

  test('declara plateau cuando no hay mejora', () => {
    const history = Array.from({ length: 6 }, () => ({ weightKg: 100, reps: 5 }));
    const r = detectPlateau(history);
    expect(r.plateau).toBe(true);
    expect(r.changePct).toBe(0);
  });

  test('no declara plateau cuando hay progreso claro', () => {
    const history = [
      { weightKg: 80, reps: 5 },
      { weightKg: 80, reps: 5 },
      { weightKg: 80, reps: 5 },
      { weightKg: 90, reps: 5 },
      { weightKg: 90, reps: 5 },
      { weightKg: 100, reps: 5 },
    ];
    const r = detectPlateau(history);
    expect(r.plateau).toBe(false);
    expect(r.changePct).toBeGreaterThan(3);
  });
});

describe('días y timezone-safe', () => {
  test('dayKeyOrdinal es consistente entre días consecutivos', () => {
    expect(dayKeyOrdinal('2026-01-31') + 1).toBe(dayKeyOrdinal('2026-02-01'));
    expect(dayKeyOrdinal('2024-02-28') + 1).toBe(dayKeyOrdinal('2024-02-29')); // bisiesto
    expect(dayKeyOrdinal('2023-12-31') + 1).toBe(dayKeyOrdinal('2024-01-01'));
  });

  test('daysBetween respeta el orden y el signo', () => {
    expect(daysBetween('2026-02-01', '2026-01-31')).toBe(1);
    expect(daysBetween('2026-01-31', '2026-02-01')).toBe(-1);
    expect(daysBetween('2026-03-01', '2026-03-01')).toBe(0);
  });

  test('claves inválidas devuelven NaN', () => {
    expect(Number.isNaN(dayKeyOrdinal('foo'))).toBe(true);
    expect(Number.isNaN(dayKeyOrdinal('2026-13-01'))).toBe(true);
    expect(Number.isNaN(dayKeyOrdinal(''))).toBe(true);
  });

  test('maxAllowedGap deriva del plan semanal', () => {
    expect(maxAllowedGap(7)).toBe(1);
    expect(maxAllowedGap(4)).toBe(2);
    expect(maxAllowedGap(3)).toBe(2);
    expect(maxAllowedGap(1)).toBe(7);
    expect(maxAllowedGap(0)).toBe(1);
  });
});

describe('streak por consistencia', () => {
  test('sin entreno todo a cero', () => {
    const s = computeWorkoutStreak([], { plannedDaysPerWeek: 4, today: '2026-02-10' });
    expect(s.current).toBe(0);
    expect(s.longest).toBe(0);
    expect(s.today).toBe(false);
  });

  test('racha seguida cuenta cada día', () => {
    const days = ['2026-02-08', '2026-02-07', '2026-02-06', '2026-02-05'];
    const s = computeWorkoutStreak(days, { plannedDaysPerWeek: 7, today: '2026-02-08' });
    expect(s.current).toBe(4);
    expect(s.longest).toBe(4);
    expect(s.today).toBe(true);
  });

  test('con 3 días planificados un hueco de 2 días no rompe la racha', () => {
    const days = ['2026-02-10', '2026-02-08', '2026-02-06'];
    const s = computeWorkoutStreak(days, { plannedDaysPerWeek: 3, today: '2026-02-10' });
    // gap entre 10 y 8 = 2 (permitido), entre 8 y 6 = 2 (permitido)
    expect(s.current).toBe(3);
    expect(s.longest).toBe(3);
  });

  test('con 7 días planificados un hueco de 2 días rompe la racha', () => {
    const days = ['2026-02-10', '2026-02-08'];
    const s = computeWorkoutStreak(days, { plannedDaysPerWeek: 7, today: '2026-02-10' });
    expect(s.current).toBe(1);
  });

  test('hueco mayor al permitido resetea la racha actual', () => {
    const days = ['2026-02-10', '2026-02-01'];
    const s = computeWorkoutStreak(days, { plannedDaysPerWeek: 7, today: '2026-02-10' });
    expect(s.current).toBe(1);
    expect(s.longest).toBe(1);
  });

  test('sin entrenar hoy pero dentro del hueco, la racha se mantiene', () => {
    const days = ['2026-02-08', '2026-02-07', '2026-02-06'];
    const s = computeWorkoutStreak(days, { plannedDaysPerWeek: 5, today: '2026-02-10' });
    // maxGap(5) = max(1, round(7/5)=1) = 1 → último entreno hace 2 días > 1 → a cero
    expect(s.current).toBe(0);
  });

  test('la racha más larga se calcula aunque no sea la actual', () => {
    const days = ['2026-02-10', '2026-02-09', '2026-02-01', '2026-01-31', '2026-01-30'];
    const s = computeWorkoutStreak(days, { plannedDaysPerWeek: 7, today: '2026-02-10' });
    expect(s.current).toBe(2);
    expect(s.longest).toBe(3);
  });

  test('nutrition streak cuenta días conformes consecutivos', () => {
    const s = computeNutritionStreak([
      { key: '2026-02-10', ok: true },
      { key: '2026-02-09', ok: true },
      { key: '2026-02-08', ok: false },
      { key: '2026-02-07', ok: true },
    ], { today: '2026-02-10' });
    expect(s.current).toBe(2);
    expect(s.longest).toBe(2);
    expect(s.today).toBe(true);
  });
});

describe('sincronización offline', () => {
  test('createIdempotencyKey es estable para mismo user+instante', () => {
    const a = createIdempotencyKey('u1', '2026-02-10T10:00:00Z');
    const b = createIdempotencyKey('u1', '2026-02-10T10:00:00Z');
    expect(a).toBe(b);
    expect(a.startsWith('wk_')).toBe(true);
  });

  test('distintas instancias generan claves distintas', () => {
    const a = createIdempotencyKey('u1', '2026-02-10T10:00:00Z');
    const b = createIdempotencyKey('u1', '2026-02-10T10:01:00Z');
    expect(a).not.toBe(b);
  });

  test('hashString es determinista', () => {
    expect(hashString('hola')).toBe(hashString('hola'));
    expect(hashString('a')).not.toBe(hashString('b'));
  });

  test('dedupeQueueByKey elimina duplicados y conserva items sin clave', () => {
    const q = [
      { idempotency_key: 'k1', payload: { session: {} } },
      { idempotency_key: 'k1', payload: { session: {} } },
      { idempotency_key: 'k2', payload: {} },
      { payload: { session: { idempotency_key: 'k3' } } },
      { payload: { session: { idempotency_key: 'k3' } } },
      { foo: 1 },
    ];
    const out = dedupeQueueByKey(q);
    expect(out.length).toBe(4);
    const keyOf = o => o.idempotency_key || (o.payload && o.payload.session && o.payload.session.idempotency_key);
    expect(out.map(keyOf)).toEqual(['k1', 'k2', 'k3', undefined]);
    expect(out[3].foo).toBe(1);
  });

  test('isTransientNetworkError clasifica errores de red', () => {
    expect(isTransientNetworkError({ code: 'FETCH_ERROR' })).toBe(true);
    expect(isTransientNetworkError({ code: 'NETWORK_ERROR' })).toBe(true);
    expect(isTransientNetworkError({ message: 'Network request failed' })).toBe(true);
    expect(isTransientNetworkError({ code: '23505' })).toBe(false);
    expect(isTransientNetworkError({ code: '22P02' })).toBe(false);
    expect(isTransientNetworkError(null)).toBe(true);
  });

  test('nextBackoffMs crece exponencialmente con tope', () => {
    expect(nextBackoffMs(0)).toBe(1000);
    expect(nextBackoffMs(1)).toBe(2000);
    expect(nextBackoffMs(10)).toBe(60000);
  });

  test('roundToPlate redondea a paso de 2.5 kg', () => {
    expect(roundToPlate(102.5)).toBe(102.5);
    expect(roundToPlate(103)).toBe(102.5);
    expect(roundToPlate(104)).toBe(105);
  });
});

describe('simulación de semanas de entrenamiento', () => {
  // FASE 4 "simula": entrenamiento normal, without conexión (reducer puro),
  // reconexión con reintento seguro.
  test('una semana normal con 3 días planificados da racha completa', () => {
    const days = ['2026-02-09', '2026-02-11', '2026-02-13'];
    const s = computeWorkoutStreak(days, { plannedDaysPerWeek: 3, today: '2026-02-13' });
    expect(s.current).toBe(3);
    expect(s.longest).toBe(3);
  });

  test('doble pulsación de finalizar se neutraliza por idempotency', () => {
    const entry = { payload: { session: { idempotency_key: 'wk_x', started_at: '2026-02-13T10:00:00Z' }, sets: [] } };
    const queue = [entry, { ...entry }, { ...entry }];
    expect(dedupeQueueByKey(queue).length).toBe(1);
  });

  test('volumen total de una sesión normal coincide a mano', () => {
    const sets = [
      { weight_kg: 100, reps: 5 },
      { weight_kg: 100, reps: 5 },
      { weight_kg: 100, reps: 5 },
      { weight_kg: 60, reps: 12 },
    ];
    expect(sessionVolume(sets)).toBe(1500 + 720);
  });
});