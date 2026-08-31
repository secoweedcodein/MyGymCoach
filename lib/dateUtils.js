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