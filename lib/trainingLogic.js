// lib/trainingLogic.js
//
// Motor de entrenamiento (FASE 4): lógica pura y determinista.
// Nada aquí toca la red ni AsyncStorage: cada función recibe sus datos y
// devuelve resultados, de modo que es 100% testeable.

// ─── Volumen y estadísticas de sesión ─────────────────────────────────────────
export const SET_TYPES = ['N', 'W', 'D', 'F'];

/** Volumen de una serie (kg × reps). Acepta números o strings vacíos. */
export function setVolume(weightKg, reps) {
  const w = Number(weightKg);
  const r = Number(reps);
  if (!Number.isFinite(w) || !Number.isFinite(r)) return 0;
  return w * r;
}

/** Volumen total únicamente de series completadas (completed !== false). */
export function sessionVolume(sets) {
  return (sets || []).reduce((acc, s) => {
    if (s && s.completed === false) return acc;
    return acc + setVolume(s && s.weight_kg, s && s.reps);
  }, 0);
}

/** Agrega una sesión: volumen, nº de series/reps y duración en minutos. */
export function sessionStats(sets, elapsedSeconds) {
  const done = (sets || []).filter(s => !s || s.completed !== false);
  const volume = sessionVolume(done);
  const reps = done.reduce((acc, s) => acc + (Number(s && s.reps) || 0), 0);
  const durationMinutes = Math.round((Number(elapsedSeconds) || 0) / 60);
  return {
    totalSets: done.length,
    totalReps: reps,
    totalVolumeKg: Math.round(volume),
    durationMinutes,
  };
}

// ─── Fórmula de 1RM ───────────────────────────────────────────────────────────
/**
 * Estimación de 1RM (Brzycki): peso × 36/(37 - reps).
 * Respetada para reps 1..36; fuera de rango devuelve 0.
 */
export function estimate1RM(weightKg, reps) {
  const w = Number(weightKg) || 0;
  const r = Number(reps) || 0;
  if (w <= 0 || r <= 0 || r >= 37) return 0;
  return w * (36 / (37 - r));
}

/** 1RM de la serie "más fuerte" (mayor e1RM) de un conjunto de series. */
export function maxEstimated1RM(sets) {
  return (sets || []).reduce((best, s) => {
    const v = estimate1RM(s && s.weight_kg, s && s.reps);
    return v > best ? v : best;
  }, 0);
}

// ─── Récords personales (PR) ──────────────────────────────────────────────────
export const PR_METRICS = [
  'max_weight',
  'max_reps',
  'max_volume',
  'e1rm',
];

export const PR_METRIC_LABELS = {
  max_weight: 'Mejor peso',
  max_reps:   'Más reps',
  max_volume: 'Mejor volumen',
  e1rm:       '1RM estimado',
};

/** Métricas candidatas de una sola serie. */
export function candidateMetrics(weightKg, reps) {
  const w = Number(weightKg) || 0;
  const r = Number(reps) || 0;
  return {
    max_weight: w > 0 ? w : 0,
    max_reps:   w > 0 && r > 0 ? r : 0,
    max_volume: w * r,
    e1rm:       estimate1RM(w, r),
  };
}

/**
 * Compara las métricas actuales de un ejercicio contra una nueva serie.
 * Devuelve las métricas mejoradas y el listado de métricas que batieron récord.
 *
 * @param {{max_weight?:number,max_reps?:number,max_volume?:number,e1rm?:number}} current
 * @param {Object} set  serie { weight_kg, reps }
 */
export function evaluatePR(current, set) {
  const base = current && typeof current === 'object' ? current : {};
  const m = candidateMetrics(set && set.weight_kg, set && set.reps);
  const updated = {
    max_weight: Number(base.max_weight) || 0,
    max_reps:   Number(base.max_reps) || 0,
    max_volume: Number(base.max_volume) || 0,
    e1rm:       Number(base.e1rm) || 0,
  };
  const improved = [];
  for (const key of PR_METRICS) {
    if (m[key] > 0 && m[key] > updated[key]) {
      updated[key] = m[key];
      improved.push(key);
    }
  }
  return { updated, improved, metrics: m };
}

/** Totalizador de PR para un lote de series de un mismo ejercicio. */
export function summarizeBestSets(sets) {
  return (sets || []).reduce((acc, s) => {
    const { updated, improved } = evaluatePR(acc.summary, s);
    acc.summary = updated;
    if (improved.length) acc.lastImproved = { set: s, metrics: improved };
    return acc;
  }, { summary: { max_weight: 0, max_reps: 0, max_volume: 0, e1rm: 0 }, lastImproved: null });
}

// ─── Progresión ───────────────────────────────────────────────────────────────
export const PROGRESSION_ACTIONS = {
  INCREASE: 'increase',
  HOLD: 'hold',
  DELOAD: 'deload',
};

/**
 * Recomienda el siguiente peso/reps según la última sesión.
 *
 * @param {Object} opts
 * @param {Array<{weightKg?:number,reps?:number}>} opts.history  sesiones del ejercicio, última primero o al final
 * @param {number} opts.targetRepsMin
 * @param {number} opts.targetRepsMax
 * @param {number} opts.incrementKg   incremento de peso al subir
 * @param {number} opts.deloadFraction  fracción a restar al descargar
 */
export function computeNextLoad({
  history = [],
  targetRepsMin = 6,
  targetRepsMax = 12,
  incrementKg = 2.5,
  deloadFraction = 0.1,
} = {}) {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      action: PROGRESSION_ACTIONS.HOLD,
      weightKg: 0,
      reps: targetRepsMin,
      reason: 'Sin historial: empieza con un peso conservador.',
    };
  }

  // Serie más fuerte de la sesión más reciente (la última del array o la que más e1RM tuvo).
  const last = history[history.length - 1];
  const b = candidateMetrics(last && last.weightKg, last && last.reps);
  const w = b.max_weight;
  const r = b.max_reps;

  if (!w || !r) {
    return {
      action: PROGRESSION_ACTIONS.HOLD,
      weightKg: 0,
      reps: targetRepsMin,
      reason: 'Falta registro de la última sesión.',
    };
  }

  if (r >= targetRepsMax) {
    return {
      action: PROGRESSION_ACTIONS.INCREASE,
      weightKg: Math.round((w + incrementKg) * 10) / 10,
      reps: targetRepsMin,
      reason: `Cumpliste el rango alto (${r} reps). Sube a ${w + incrementKg} kg e inicia en ${targetRepsMin} reps.`,
    };
  }

  if (r >= targetRepsMin) {
    return {
      action: PROGRESSION_ACTIONS.HOLD,
      weightKg: w,
      reps: r + 1,
      reason: `Dentro del rango (${r} reps). Repite el peso e intenta ${Math.min(r + 1, targetRepsMax)} reps.`,
    };
  }

  // Por debajo del rango: si llevas varias sesiones fallando, descarga.
  const recentFails = history.slice(-2).filter(h => (h.reps || 0) < targetRepsMin).length;
  if (recentFails >= 2) {
    const deloaded = Math.max(0, Math.round(w * (1 - deloadFraction) * 10) / 10);
    return {
      action: PROGRESSION_ACTIONS.DELOAD,
      weightKg: deloaded,
      reps: targetRepsMin,
      reason: `Dos sesiones seguidas bajo el rango (${r} reps). Descarga a ${deloaded} kg y vuelve a la técnica.`,
    };
  }

  return {
    action: PROGRESSION_ACTIONS.HOLD,
    weightKg: w,
    reps: targetRepsMin,
    reason: `Por debajo del rango (${r} reps). Fija la técnica con el mismo peso antes de subir.`,
  };
}

/**
 * Detecta estancamiento comparando la media de e1RM de la ventana reciente
 * contra la ventana anterior equivalente.
 *
 * @param {Array<{weightKg?:number,reps?:number}>} history ordenado por fecha
 * @param {Object} opts { windowSize, tolerance }
 * @returns {{plateau:boolean, average:number, changePct:number, sampleSize:number}}
 */
export function detectPlateau(history = [], { windowSize = 3, tolerance = 0.03 } = {}) {
  const rows = (Array.isArray(history) ? history : [])
    .map(h => candidateMetrics(h && h.weightKg, h && h.reps).e1rm)
    .filter(v => v > 0);

  if (rows.length < windowSize * 2) {
    return { plateau: false, average: rows.length ? rows.reduce((a, b) => a + b, 0) / rows.length : 0, changePct: 0, sampleSize: rows.length };
  }

  const recent = rows.slice(-windowSize);
  const older = rows.slice(0, windowSize);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / windowSize;
  const olderAvg = older.reduce((a, b) => a + b, 0) / windowSize;
  const changePct = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) : 0;
  const plateau = Math.abs(changePct) < tolerance;

  return {
    plateau,
    average: Math.round(recentAvg * 10) / 10,
    changePct: Math.round(changePct * 1000) / 10,
    sampleSize: rows.length,
  };
}

// ─── Racha (streak) ───────────────────────────────────────────────────────────
/**
 * Días entre dos claves YYYY-MM-DD (aritmética civil, sin tocar Date → inmune
 * a desfases de timezone). Devuelve un ordinal entero.
 */
export function dayKeyOrdinal(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''));
  if (!m) return NaN;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return NaN;
  // Algoritmo de Howard Hinnant (días desde 1970-01-01).
  const yy = y - (mo <= 2 ? 1 : 0);
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const mp = (mo + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** Diferencia de días entre dos claves v1 - v2 (a - b). */
export function daysBetween(a, b) {
  return dayKeyOrdinal(a) - dayKeyOrdinal(b);
}

/**
 * Separación máxima permitida entre entrenamientos según los días planificados
 * por semana (consistencia, no obligación de entrenar a diario).
 * Ej.: 3 días/semana → tope de 2 días sin entrenar.
 */
export function maxAllowedGap(plannedDaysPerWeek) {
  const p = Number(plannedDaysPerWeek);
  if (!Number.isFinite(p) || p <= 0) return 1;
  return Math.max(1, Math.round(7 / Math.min(p, 7)));
}

/**
 * Racha de entrenamiento basada en consistencia:
 * cuenta días entrenados consecutivos y permite huecos de hasta maxGap días,
 * derivado de los días planificados por semana.
 *
 * @param {string[]} workoutDayKeys claves YYYY-MM-DD (zona local) con entreno
 * @param {Object} opts { plannedDaysPerWeek, today }
 * @returns {{current:number, longest:number, today:boolean, maxGap:number, lastWorkoutDay:string|null}}
 */
export function computeWorkoutStreak(workoutDayKeys = [], { plannedDaysPerWeek = 3, today } = {}) {
  const days = [...new Set((Array.isArray(workoutDayKeys) ? workoutDayKeys : [])
    .filter(k => /^\d{4}-\d{2}-\d{2}$/.test(String(k || ''))))
  ].sort();

  const maxGap = maxAllowedGap(plannedDaysPerWeek);

  if (days.length === 0) {
    return { current: 0, longest: 0, today: false, maxGap, lastWorkoutDay: null };
  }

  const todayKey = today || null;
  const last = days[days.length - 1];

  // Si el último entreno está más lejos que el hueco permitido, racha a cero.
  if (todayKey && daysBetween(todayKey, last) > maxGap) {
    return { current: 0, longest: 0, today: false, maxGap, lastWorkoutDay: last };
  }

  let current = 1;
  for (let i = days.length - 2; i >= 0; i--) {
    if (daysBetween(days[i + 1], days[i]) <= maxGap) current++;
    else break;
  }

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (daysBetween(days[i], days[i - 1]) <= maxGap) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  return {
    current,
    longest,
    today: todayKey ? days.includes(todayKey) : false,
    maxGap,
    lastWorkoutDay: last,
  };
}

/** Racha para nutrición: días consecutivos cumpliendo los umbrales de metas. */
export function computeNutritionStreak(dailyCompliance = [], { today } = {}) {
  const days = (Array.isArray(dailyCompliance) ? dailyCompliance : [])
    .map(d => ({
      key: String(d.key || ''),
      ok: Boolean(d.ok),
    }))
    .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d.key))
    .sort((a, b) => dayKeyOrdinal(a.key) - dayKeyOrdinal(b.key));

  if (!days.length) return { current: 0, longest: 0, today: false };

  let current = 0;
  for (let i = days.length - 1; i >= 0 && days[i].ok; i--) current++;

  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.ok ? run + 1 : 0;
    if (run > longest) longest = run;
  }

  return {
    current,
    longest,
    today: today ? (days[days.length - 1].key === String(today || '') && days[days.length - 1].ok) : days[days.length - 1].ok,
  };
}

// ─── Sincronización offline (helpers puros) ───────────────────────────────────
/** Hash corto determinista (djb2) para generar claves de idempotencia. */
export function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36).padStart(8, '0');
}

/** Clave de idempotencia estable para una sesión (userId + instante de inicio). */
export function createIdempotencyKey(userId, startedAt) {
  const t = startedAt || new Date().toISOString();
  return `wk_${hashString(`${userId}:${t}`).slice(0, 20)}`;
}

/** Elimina duplicados de la cola por idempotency_key (se queda con la primera). */
export function dedupeQueueByKey(items = []) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = item && (item.idempotency_key || (item.payload && item.payload.session && item.payload.session.idempotency_key));
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    out.push(item);
  }
  return out;
}

/** ¿El error es de red transitoria (reintentable)? */
export function isTransientNetworkError(error) {
  if (!error) return true;
  const code = error.code || error.error;
  return !code
    || code === 'FETCH_ERROR'
    || code === 'NETWORK_ERROR'
    || code === 'REQUEST_TIMEOUT'
    || (typeof error.message === 'string' && /network|fetch|timeout|socket/i.test(error.message));
}

/** Backoff exponencial con tope (ms). */
export function nextBackoffMs(attempt, { baseMs = 1000, capMs = 60000 } = {}) {
  return Math.min(capMs, baseMs * (2 ** Math.max(0, attempt)));
}

/** Convierte `e1rm` de candidato a peso recomendado redondeado a 2.5 kg. */
export function roundToPlate(weightKg) {
  const w = Number(weightKg) || 0;
  return Math.round(w / 2.5) * 2.5;
}