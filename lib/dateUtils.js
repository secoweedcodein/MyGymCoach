// lib/dateUtils.js
//
// Claves de día en zona LOCAL (YYYY-MM-DD). Las tablas guardan fechas en
// este formato; usar toISOString() las desplaza un día en zonas no UTC.

export function toDayKey(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey() {
  return toDayKey(new Date());
}

// ── Aritmética de claves (YYYY-MM-DD, zona local) ─────────────────────────────

export function parseDateKey(key) {
  const [y, m, d] = String(key || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function shiftKey(key, days) {
  const base = parseDateKey(key);
  if (!base) return null;
  base.setDate(base.getDate() + days);
  return toDayKey(base);
}

export function addDaysKey(key, days) {
  return shiftKey(key, days);
}

// Lunes como inicio de semana (compatible con el resto de la app).
export function weekStartKey(key) {
  const base = parseDateKey(key);
  if (!base) return null;
  const dow = base.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  base.setDate(base.getDate() + diff);
  return toDayKey(base);
}

// Los 7 días de la semana que contiene `key` (de Lunes a Domingo).
export function weekDateKeys(key) {
  const start = weekStartKey(key);
  const keys = [];
  for (let i = 0; i < 7; i++) keys.push(shiftKey(start, i));
  return keys;
}

// Rango { start, end } del mes al que pertenece `key`.
export function monthRangeKeys(key) {
  const base = parseDateKey(key);
  if (!base) return { start: null, end: null };
  const start = toDayKey(new Date(base.getFullYear(), base.getMonth(), 1));
  const end = toDayKey(new Date(base.getFullYear(), base.getMonth() + 1, 0));
  return { start, end };
}

// Claves completas del mes (para gráficas de 28-31 días).
export function monthDateKeys(key) {
  const { start, end } = monthRangeKeys(key);
  const keys = [];
  let cur = start;
  while (cur <= end) {
    keys.push(cur);
    cur = shiftKey(cur, 1);
  }
  return keys;
}

export function isWithinRange(key, start, end) {
  return !!key && (!start || key >= start) && (!end || key <= end);
}