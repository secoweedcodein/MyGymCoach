// Escala canónica de valoraciones: 1–5. Nunca mostrar promedios fuera de rango.

export const RATING_MIN = 1;
export const RATING_MAX = 5;

export function clampRating(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(RATING_MAX, Math.max(0, n));
}

export function formatRating(value, digits = 1) {
  const n = clampRating(value);
  if (n <= 0) return '—';
  return n.toFixed(digits);
}

export function isValidScore(score) {
  const n = Number(score);
  return Number.isInteger(n) && n >= RATING_MIN && n <= RATING_MAX;
}

export function averageRating(scores = []) {
  const valid = scores.map(Number).filter((n) => Number.isFinite(n) && n >= RATING_MIN && n <= RATING_MAX);
  if (!valid.length) return 0;
  return clampRating(valid.reduce((a, b) => a + b, 0) / valid.length);
}
