export const ErrorKind = {
  OFFLINE: 'offline',
  TIMEOUT: 'timeout',
  SESSION: 'session',
  SUPABASE: 'supabase',
  OPENAI: 'openai',
  PERMISSION: 'permission',
  STORAGE: 'storage',
  UNKNOWN: 'unknown',
};

const USER_MESSAGES = {
  [ErrorKind.OFFLINE]: 'Sin conexión. Revisa tu red e inténtalo de nuevo.',
  [ErrorKind.TIMEOUT]: 'La operación tardó demasiado. Inténtalo otra vez.',
  [ErrorKind.SESSION]: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  [ErrorKind.SUPABASE]: 'No se pudo contactar con el servidor. Inténtalo más tarde.',
  [ErrorKind.OPENAI]: 'El Coach no está disponible ahora. Prueba en unos minutos.',
  [ErrorKind.PERMISSION]: 'No tienes permiso para esta acción.',
  [ErrorKind.STORAGE]: 'No se pudo subir o leer la imagen.',
  [ErrorKind.UNKNOWN]: 'Algo salió mal. Inténtalo de nuevo.',
};

export function classifyError(err) {
  if (!err) return ErrorKind.UNKNOWN;
  const msg = String(err.message || err.error_description || err);
  const code = String(err.code || err.status || err.statusCode || '');
  const name = String(err.name || '');

  if (err.quota || code === 'quota') return ErrorKind.OPENAI;
  if (code === 'PGRST301' || code === '401' || /jwt|expired|not authenticated|invalid claim/i.test(msg)) {
    return ErrorKind.SESSION;
  }
  if (code === '42501' || code === '403' || /permission|rls|not authorized|no autorizado/i.test(msg)) {
    return ErrorKind.PERMISSION;
  }
  if (/network request failed|failed to fetch|offline|internet/i.test(msg) || name === 'TypeError') {
    return ErrorKind.OFFLINE;
  }
  if (/timeout|timed out|abort/i.test(msg) || code === '57014') return ErrorKind.TIMEOUT;
  if (/storage|mime|file size|bucket/i.test(msg)) return ErrorKind.STORAGE;
  if (/openai|coach-chat|generate-recipe/i.test(msg) || err.openai) return ErrorKind.OPENAI;
  if (/supabase|postgrest|pgrst/i.test(msg) || code.startsWith('PGRST') || code.startsWith('22') || code.startsWith('23')) {
    return ErrorKind.SUPABASE;
  }
  return ErrorKind.UNKNOWN;
}

export function userFacingMessage(err) {
  return USER_MESSAGES[classifyError(err)] || USER_MESSAGES[ErrorKind.UNKNOWN];
}

export function withTimeout(promise, ms = 15000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      const err = new Error('timeout');
      err.code = 'timeout';
      setTimeout(() => reject(err), ms);
    }),
  ]);
}
