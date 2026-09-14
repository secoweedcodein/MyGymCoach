// Logging de producción sin PII, tokens ni cuerpos sensibles.

const SENSITIVE_KEY = /(password|token|authorization|apikey|api_key|secret|email|phone|jwt|refresh|anon)/i;

function scrub(value, depth = 0) {
  if (value == null || depth > 4) return value;
  if (typeof value === 'string') {
    if (value.length > 240) return `${value.slice(0, 240)}…`;
    return value;
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => scrub(v, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE_KEY.test(k) ? '[redacted]' : scrub(v, depth + 1);
    }
    return out;
  }
  return value;
}

function emit(level, event, meta) {
  const payload = {
    level,
    event,
    ts: new Date().toISOString(),
    ...(meta ? { meta: scrub(meta) } : {}),
  };
  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (event, meta) => emit('info', event, meta),
  warn: (event, meta) => emit('warn', event, meta),
  error: (event, meta) => emit('error', event, meta),
};

export { scrub };
