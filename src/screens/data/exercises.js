// src/data/exercises.js
//
// ARQUITECTURA HÍBRIDA:
//   - EXERCISES → lista base local (sin internet, siempre disponible)
//   - getExercise(id) → busca primero en base local, luego en custom (Supabase)
//   - loadCustomExercises() → carga ejercicios custom del usuario desde Supabase
//   - Los ejercicios custom tienen id tipo "custom_123" para no colisionar
//
// SISTEMA DE ICONOS:
//   Usamos letras/abreviaturas cortas en lugar de emojis inconsistentes.
//   El campo `icon` es un string de 1-3 letras que la UI renderiza
//   dentro de un badge con color por músculo. Más limpio, más pro.
//   Si prefieres seguir con emojis, cambia el campo icon por el emoji
//   y ajusta el componente ExerciseIcon en la UI.

// ─── Paleta de color por músculo (para el badge de icono) ───────────────────
export const MUSCLE_COLORS = {
  'Pecho':            '#FF6B3E',
  'Espalda':          '#3EE5FF',
  'Hombros':          '#C0FF3E',
  'Tríceps':          '#FF3EAA',
  'Bíceps':           '#A78BFA',
  'Antebrazos':       '#F59E0B',
  'Piernas':          '#34D399',
  'Glúteos':          '#FB7185',
  'Gemelos':          '#6EE7B7',
  'Abductores':       '#86EFAC',
  'Aductores':        '#4ADE80',
  'Core':             '#FCD34D',
  'Trapecio':         '#7DD3FC',
  'Full Body':        '#E879F9',
  'Cardio':           '#F87171',
};

// ─── Lista base (local, offline) ─────────────────────────────────────────────
export const EXERCISES = [

  // ── PECHO ──────────────────────────────────────────────────────────────────
  { id: 1,   name: 'Press de banca con barra',          muscle: 'Pecho',    type: 'Fuerza',      icon: 'PB'  },
  { id: 24,  name: 'Press inclinado con mancuernas',    muscle: 'Pecho',    type: 'Fuerza',      icon: 'PI'  },
  { id: 30,  name: 'Press inclinado con barra',         muscle: 'Pecho',    type: 'Fuerza',      icon: 'PIB' },
  { id: 31,  name: 'Press plano con mancuernas',        muscle: 'Pecho',    type: 'Hipertrofia', icon: 'PP'  },
  { id: 90,  name: 'Press declinado con barra',         muscle: 'Pecho',    type: 'Hipertrofia', icon: 'PD'  },
  { id: 91,  name: 'Press declinado con mancuernas',    muscle: 'Pecho',    type: 'Hipertrofia', icon: 'PDM' },
  { id: 10,  name: 'Fondos en paralelas',               muscle: 'Pecho',    type: 'Fuerza',      icon: 'FP'  },
  { id: 101, name: 'Flexiones',                         muscle: 'Pecho',    type: 'Funcional',   icon: 'FLX' },
  { id: 23,  name: 'Aperturas en polea',                muscle: 'Pecho',    type: 'Hipertrofia', icon: 'AP'  },
  { id: 93,  name: 'Aperturas con mancuernas',          muscle: 'Pecho',    type: 'Hipertrofia', icon: 'AM'  },
  { id: 92,  name: 'Cruce de poleas',                   muscle: 'Pecho',    type: 'Hipertrofia', icon: 'CP'  },
  { id: 37,  name: 'Vuelos en polea',                   muscle: 'Pecho',    type: 'Hipertrofia', icon: 'VP'  },
  { id: 102, name: 'Peck deck',                         muscle: 'Pecho',    type: 'Hipertrofia', icon: 'PD'  },

  // ── ESPALDA ────────────────────────────────────────────────────────────────
  { id: 2,   name: 'Peso muerto',                       muscle: 'Espalda',  type: 'Fuerza',      icon: 'PM'  },
  { id: 5,   name: 'Dominadas',                         muscle: 'Espalda',  type: 'Fuerza',      icon: 'DOM' },
  { id: 103, name: 'Chin-ups',                          muscle: 'Espalda',  type: 'Fuerza',      icon: 'CHN' },
  { id: 6,   name: 'Remo con barra',                    muscle: 'Espalda',  type: 'Fuerza',      icon: 'RB'  },
  { id: 34,  name: 'Remo con mancuernas',               muscle: 'Espalda',  type: 'Hipertrofia', icon: 'RM'  },
  { id: 81,  name: 'Remo T-Bar',                        muscle: 'Espalda',  type: 'Hipertrofia', icon: 'RTB' },
  { id: 82,  name: 'Remo en máquina Hammer',            muscle: 'Espalda',  type: 'Hipertrofia', icon: 'RMH' },
  { id: 17,  name: 'Remo en polea',                     muscle: 'Espalda',  type: 'Hipertrofia', icon: 'RP'  },
  { id: 35,  name: 'Remo sentado agarre cerrado',       muscle: 'Espalda',  type: 'Hipertrofia', icon: 'RSC' },
  { id: 36,  name: 'Remo sentado agarre abierto',       muscle: 'Espalda',  type: 'Hipertrofia', icon: 'RSA' },
  { id: 29,  name: 'Jalón al pecho',                    muscle: 'Espalda',  type: 'Hipertrofia', icon: 'JP'  },
  { id: 76,  name: 'Jalón agarre cerrado',              muscle: 'Espalda',  type: 'Hipertrofia', icon: 'JAC' },
  { id: 77,  name: 'Jalón agarre amplio',               muscle: 'Espalda',  type: 'Hipertrofia', icon: 'JAA' },
  { id: 75,  name: 'Jalón unilateral',                  muscle: 'Espalda',  type: 'Hipertrofia', icon: 'JU'  },
  { id: 21,  name: 'Pullover en polea',                 muscle: 'Espalda',  type: 'Hipertrofia', icon: 'PUL' },

  // ── HOMBROS ────────────────────────────────────────────────────────────────
  { id: 4,   name: 'Press militar con barra',           muscle: 'Hombros',  type: 'Fuerza',      icon: 'PMB' },
  { id: 85,  name: 'Press militar con mancuernas',      muscle: 'Hombros',  type: 'Hipertrofia', icon: 'PMM' },
  { id: 86,  name: 'Press militar en máquina',          muscle: 'Hombros',  type: 'Hipertrofia', icon: 'PMQ' },
  { id: 83,  name: 'Press Arnold',                      muscle: 'Hombros',  type: 'Hipertrofia', icon: 'ARN' },
  { id: 32,  name: 'Elevaciones laterales mancuernas',  muscle: 'Hombros',  type: 'Hipertrofia', icon: 'ELM' },
  { id: 16,  name: 'Elevaciones laterales en polea',    muscle: 'Hombros',  type: 'Hipertrofia', icon: 'ELP' },
  { id: 33,  name: 'Elevaciones laterales en máquina',  muscle: 'Hombros',  type: 'Hipertrofia', icon: 'ELQ' },
  { id: 84,  name: 'Elevaciones frontales',             muscle: 'Hombros',  type: 'Hipertrofia', icon: 'EF'  },
  { id: 11,  name: 'Face pull',                         muscle: 'Hombros',  type: 'Hipertrofia', icon: 'FPL' },
  { id: 38,  name: 'Vuelos posteriores en máquina',     muscle: 'Hombros',  type: 'Hipertrofia', icon: 'VPQ' },
  { id: 39,  name: 'Vuelos posteriores en polea',       muscle: 'Hombros',  type: 'Hipertrofia', icon: 'VPP' },
  { id: 40,  name: 'Vuelos posteriores sentados',       muscle: 'Hombros',  type: 'Hipertrofia', icon: 'VPS' },

  // ── TRÍCEPS ────────────────────────────────────────────────────────────────
  { id: 9,   name: 'Extensión de tríceps en polea',     muscle: 'Tríceps',  type: 'Hipertrofia', icon: 'ETP' },
  { id: 72,  name: 'Extensión de tríceps con cuerda',   muscle: 'Tríceps',  type: 'Hipertrofia', icon: 'ETC' },
  { id: 73,  name: 'Extensión sobre la cabeza',         muscle: 'Tríceps',  type: 'Hipertrofia', icon: 'ESC' },
  { id: 71,  name: 'Press francés',                     muscle: 'Tríceps',  type: 'Hipertrofia', icon: 'PRF' },
  { id: 74,  name: 'Fondos para tríceps',               muscle: 'Tríceps',  type: 'Hipertrofia', icon: 'FTR' },
  { id: 104, name: 'Patada de tríceps',                 muscle: 'Tríceps',  type: 'Hipertrofia', icon: 'PTR' },

  // ── BÍCEPS ─────────────────────────────────────────────────────────────────
  { id: 8,   name: 'Curl de bíceps con barra',          muscle: 'Bíceps',   type: 'Hipertrofia', icon: 'CBB' },
  { id: 51,  name: 'Curl de bíceps con cable',          muscle: 'Bíceps',   type: 'Hipertrofia', icon: 'CBC' },
  { id: 52,  name: 'Curl de bíceps en máquina',         muscle: 'Bíceps',   type: 'Hipertrofia', icon: 'CBQ' },
  { id: 54,  name: 'Curl predicador',                   muscle: 'Bíceps',   type: 'Hipertrofia', icon: 'CPR' },
  { id: 53,  name: 'Curl en banco declinado',           muscle: 'Bíceps',   type: 'Hipertrofia', icon: 'CBD' },
  { id: 56,  name: 'Curl en banco inclinado',           muscle: 'Bíceps',   type: 'Hipertrofia', icon: 'CBI' },
  { id: 27,  name: 'Curl araña con mancuernas',         muscle: 'Bíceps',   type: 'Hipertrofia', icon: 'CAM' },
  { id: 28,  name: 'Curl araña con barra',              muscle: 'Bíceps',   type: 'Hipertrofia', icon: 'CAB' },
  { id: 55,  name: 'Curl martillo',                     muscle: 'Bíceps',   type: 'Hipertrofia', icon: 'CMT' },
  { id: 49,  name: 'Curl detrás del cuerpo en polea',   muscle: 'Bíceps',   type: 'Hipertrofia', icon: 'CDP' },
  { id: 50,  name: 'Curl detrás del cuerpo mancuernas', muscle: 'Bíceps',   type: 'Hipertrofia', icon: 'CDM' },

  // ── ANTEBRAZOS ─────────────────────────────────────────────────────────────
  { id: 87,  name: 'Curl inverso',                      muscle: 'Antebrazos', type: 'Hipertrofia', icon: 'CI'  },
  { id: 88,  name: 'Curl de muñeca',                    muscle: 'Antebrazos', type: 'Hipertrofia', icon: 'CM'  },
  { id: 89,  name: 'Curl de muñeca inverso',            muscle: 'Antebrazos', type: 'Hipertrofia', icon: 'CMI' },

  // ── TRAPECIO ───────────────────────────────────────────────────────────────
  { id: 105, name: 'Encogimientos con barra',           muscle: 'Trapecio', type: 'Hipertrofia', icon: 'ETR' },
  { id: 106, name: 'Encogimientos con mancuernas',      muscle: 'Trapecio', type: 'Hipertrofia', icon: 'ETM' },
  { id: 107, name: 'Encogimientos en máquina Smith',    muscle: 'Trapecio', type: 'Hipertrofia', icon: 'ETS' },

  // ── PIERNAS ────────────────────────────────────────────────────────────────
  { id: 1000, name: 'Sentadilla con barra',             muscle: 'Piernas',  type: 'Fuerza',      icon: 'SQ'  },
  { id: 98,  name: 'Sentadilla frontal',                muscle: 'Piernas',  type: 'Fuerza',      icon: 'SQF' },
  { id: 65,  name: 'Sentadilla goblet',                 muscle: 'Piernas',  type: 'Hipertrofia', icon: 'SQG' },
  { id: 62,  name: 'Sentadilla búlgara',                muscle: 'Piernas',  type: 'Hipertrofia', icon: 'SQB' },
  { id: 61,  name: 'Sentadilla al cajón',               muscle: 'Piernas',  type: 'Funcional',   icon: 'SQC' },
  { id: 64,  name: 'Hack squat',                        muscle: 'Piernas',  type: 'Hipertrofia', icon: 'HCK' },
  { id: 97,  name: 'Peso muerto sumo',                  muscle: 'Piernas',  type: 'Fuerza',      icon: 'PMS' },
  { id: 22,  name: 'Romanian deadlift',                 muscle: 'Piernas',  type: 'Fuerza',      icon: 'RDL' },
  { id: 99,  name: 'Buenos días',                       muscle: 'Piernas',  type: 'Hipertrofia', icon: 'GDM' },
  { id: 20,  name: 'Prensa de piernas',                 muscle: 'Piernas',  type: 'Hipertrofia', icon: 'PRN' },
  { id: 15,  name: 'Zancadas',                          muscle: 'Piernas',  type: 'Hipertrofia', icon: 'ZAN' },
  { id: 63,  name: 'Step up',                           muscle: 'Piernas',  type: 'Hipertrofia', icon: 'STP' },
  { id: 66,  name: 'Curl femoral tumbado',              muscle: 'Piernas',  type: 'Hipertrofia', icon: 'CFT' },
  { id: 67,  name: 'Curl femoral sentado',              muscle: 'Piernas',  type: 'Hipertrofia', icon: 'CFS' },
  { id: 68,  name: 'Extensión de cuádriceps',           muscle: 'Piernas',  type: 'Hipertrofia', icon: 'EXC' },
  { id: 108, name: 'Nordic curl',                       muscle: 'Piernas',  type: 'Fuerza',      icon: 'NRD' },
  { id: 57,  name: 'Bicicleta estática',                muscle: 'Piernas',  type: 'Cardio',      icon: 'BIC' },
  { id: 58,  name: 'Máquina escalera',                  muscle: 'Piernas',  type: 'Cardio',      icon: 'ESC' },
  { id: 60,  name: 'Salto al cajón',                    muscle: 'Piernas',  type: 'Funcional',   icon: 'SCJ' },

  // ── GLÚTEOS ────────────────────────────────────────────────────────────────
  { id: 7,   name: 'Hip thrust con barra',              muscle: 'Glúteos',  type: 'Hipertrofia', icon: 'HT'  },
  { id: 109, name: 'Hip thrust en máquina',             muscle: 'Glúteos',  type: 'Hipertrofia', icon: 'HTQ' },
  { id: 26,  name: 'Patada de glúteo',                  muscle: 'Glúteos',  type: 'Hipertrofia', icon: 'PTG' },
  { id: 100, name: 'Pull through',                      muscle: 'Glúteos',  type: 'Hipertrofia', icon: 'PLT' },
  { id: 110, name: 'Peso muerto a una pierna',          muscle: 'Glúteos',  type: 'Funcional',   icon: 'PMP' },

  // ── GEMELOS ────────────────────────────────────────────────────────────────
  { id: 69,  name: 'Elevación de gemelos de pie',       muscle: 'Gemelos',  type: 'Hipertrofia', icon: 'EGP' },
  { id: 70,  name: 'Elevación de gemelos sentado',      muscle: 'Gemelos',  type: 'Hipertrofia', icon: 'EGS' },
  { id: 111, name: 'Elevación de gemelos en prensa',    muscle: 'Gemelos',  type: 'Hipertrofia', icon: 'EGQ' },

  // ── ABDUCTORES / ADUCTORES ─────────────────────────────────────────────────
  { id: 47,  name: 'Abducción de caderas en máquina',   muscle: 'Abductores', type: 'Hipertrofia', icon: 'ABD' },
  { id: 112, name: 'Abducción con cable',               muscle: 'Abductores', type: 'Hipertrofia', icon: 'ABC' },
  { id: 48,  name: 'Aducción de caderas en máquina',    muscle: 'Aductores',  type: 'Hipertrofia', icon: 'ADD' },
  { id: 113, name: 'Aducción con cable',                muscle: 'Aductores',  type: 'Hipertrofia', icon: 'ADC' },

  // ── CORE ───────────────────────────────────────────────────────────────────
  { id: 18,  name: 'Plancha',                           muscle: 'Core',     type: 'Funcional',   icon: 'PLN' },
  { id: 114, name: 'Plancha lateral',                   muscle: 'Core',     type: 'Funcional',   icon: 'PLL' },
  { id: 41,  name: 'Rueda abdominal',                   muscle: 'Core',     type: 'Hipertrofia', icon: 'RDA' },
  { id: 42,  name: 'Abdominales en máquina',            muscle: 'Core',     type: 'Hipertrofia', icon: 'ABQ' },
  { id: 43,  name: 'Abdominales en polea',              muscle: 'Core',     type: 'Hipertrofia', icon: 'ABP' },
  { id: 44,  name: 'Crunch',                            muscle: 'Core',     type: 'Hipertrofia', icon: 'CRN' },
  { id: 94,  name: 'Crunch en banco declinado',         muscle: 'Core',     type: 'Hipertrofia', icon: 'CRD' },
  { id: 46,  name: 'Elevación de piernas',              muscle: 'Core',     type: 'Hipertrofia', icon: 'EPI' },
  { id: 95,  name: 'Russian twist',                     muscle: 'Core',     type: 'Hipertrofia', icon: 'RST' },
  { id: 96,  name: 'Mountain climbers',                 muscle: 'Core',     type: 'Funcional',   icon: 'MCL' },
  { id: 115, name: 'Dead bug',                          muscle: 'Core',     type: 'Funcional',   icon: 'DBG' },
  { id: 116, name: 'Bird dog',                          muscle: 'Core',     type: 'Funcional',   icon: 'BRD' },
  { id: 117, name: 'Pallof press',                      muscle: 'Core',     type: 'Funcional',   icon: 'PAL' },
   { id: 126, name: "crunch inverso",                  muscle: 'Core',     type: 'Hipertrofia', icon: 'CRN' },
    { id: 127, name: "crunch biciclet",       muscle: 'Core',     type: 'Hipertrofia', icon: 'CRN' },

  // ── FULL BODY / FUNCIONAL ──────────────────────────────────────────────────
  { id: 13,  name: 'Kettlebell swing',                  muscle: 'Full Body', type: 'Funcional',  icon: 'KBS' },
  { id: 12,  name: 'Farmer carry',                      muscle: 'Full Body', type: 'Funcional',  icon: 'FMC' },
  { id: 14,  name: 'Burpees',                           muscle: 'Full Body', type: 'Funcional',  icon: 'BRP' },
  { id: 25,  name: 'Sprint 100m',                       muscle: 'Full Body', type: 'Cardio',     icon: 'SPR' },
  { id: 59,  name: 'Cuerdas de batalla',                muscle: 'Full Body', type: 'Cardio',     icon: 'CDB' },
  { id: 118, name: 'Clean & press',                     muscle: 'Full Body', type: 'Funcional',  icon: 'CNP' },
  { id: 119, name: 'Thruster',                          muscle: 'Full Body', type: 'Funcional',  icon: 'THR' },
  { id: 120, name: 'Turkish get-up',                    muscle: 'Full Body', type: 'Funcional',  icon: 'TGU' },

  // ── CARDIO ─────────────────────────────────────────────────────────────────
  { id: 121, name: 'Caminadora',                        muscle: 'Cardio',   type: 'Cardio',      icon: 'CAM' },
  { id: 122, name: 'Elíptica',                          muscle: 'Cardio',   type: 'Cardio',      icon: 'ELP' },
  { id: 123, name: 'Remo ergómetro',                    muscle: 'Cardio',   type: 'Cardio',      icon: 'REG' },
  { id: 124, name: 'Saltar la cuerda',                  muscle: 'Cardio',   type: 'Cardio',      icon: 'JMP' },
  { id: 125, name: 'HIIT',                              muscle: 'Cardio',   type: 'Cardio',      icon: 'HIT' },

  // Agrega esto al final de la lista de ejercicios dentro de src/screens/data/exercises.js
{ id: 'abs_plank', name: 'Plancha frontal', muscle: 'Abdomen', type: 'Fuerza' },
{ id: 'abs_crunch', name: 'Crunch inverso', muscle: 'Abdomen', type: 'Fuerza' },
{ id: 'abs_russian', name: 'Russian twist', muscle: 'Abdomen', type: 'Fuerza' },
{ id: 'abs_climbers', name: 'Mountain climbers', muscle: 'Abdomen', type: 'Fuerza' },
{ id: 'abs_lateral', name: 'Plancha lateral', muscle: 'Abdomen', type: 'Fuerza' },
];

// ─── Músculos para el filtro ─────────────────────────────────────────────────
export const MUSCLES = [
  'Todos',
  'Pecho',
  'Espalda',
  'Hombros',
  'Tríceps',
  'Bíceps',
  'Antebrazos',
  'Trapecio',
  'Piernas',
  'Glúteos',
  'Gemelos',
  'Abductores',
  'Aductores',
  'Core',
  'Full Body',
  'Cardio',
];

// ─── Tipos de serie (sin cambios) ────────────────────────────────────────────
export const SET_TYPES = [
  { key: 'N', label: 'Normal',        color: '#4d9fff' },
  { key: 'W', label: 'Calentamiento', color: '#ff9a3c' },
  { key: 'D', label: 'Drop-set',      color: '#ff4d4d' },
  { key: 'F', label: 'Al fallo',      color: '#a78bfa' },
];

// ─── Cache de ejercicios custom (se llena con loadCustomExercises) ────────────
let _customExercises = [];

/**
 * Carga los ejercicios custom del usuario desde Supabase.
 * Llama esto una vez al iniciar la app (en App.js o en el layout raíz).
 *
 * Tabla Supabase necesaria:
 *   custom_exercises (
 *     id          uuid primary key default gen_random_uuid(),
 *     user_id     uuid references auth.users not null,
 *     name        text not null,
 *     muscle      text not null,
 *     type        text not null default 'Hipertrofia',
 *     icon        text default 'CUS',
 *     created_at  timestamptz default now()
 *   )
 *   -- RLS: users can only see/edit their own rows
 */
export async function loadCustomExercises(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('custom_exercises')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) { console.warn('loadCustomExercises error:', error.message); return; }

  // Prefijamos el id con "custom_" para nunca colisionar con los IDs numéricos base
  _customExercises = (data || []).map(e => ({
    ...e,
    id: `custom_${e.id}`,
    isCustom: true,
  }));
}

/**
 * Guarda un ejercicio custom en Supabase y lo agrega al cache local.
 * Devuelve el ejercicio creado (con id prefijado) o null si hay error.
 */
export async function createCustomExercise(supabase, { name, muscle, type = 'Hipertrofia', icon = 'CUS' }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('custom_exercises')
    .insert({ user_id: user.id, name, muscle, type, icon })
    .select()
    .single();

  if (error) { console.warn('createCustomExercise error:', error.message); return null; }

  const newEx = { ...data, id: `custom_${data.id}`, isCustom: true };
  _customExercises.push(newEx);
  return newEx;
}

/**
 * Elimina un ejercicio custom.
 * Pasa el id prefijado: "custom_<uuid>"
 */
export async function deleteCustomExercise(supabase, prefixedId) {
  const realId = prefixedId.replace('custom_', '');
  const { error } = await supabase
    .from('custom_exercises')
    .delete()
    .eq('id', realId);

  if (!error) {
    _customExercises = _customExercises.filter(e => e.id !== prefixedId);
  }
  return !error;
}

/**
 * Lista completa = base local + custom del usuario.
 * Úsala en el selector de ejercicios en lugar de EXERCISES directamente.
 */
export function getAllExercises() {
  return [...EXERCISES, ..._customExercises];
}

/**
 * Busca un ejercicio por id (número o string "custom_<uuid>").
 * Siempre busca primero en base local (más rápido), luego en custom.
 */
export function getExercise(id) {
  return (
    EXERCISES.find(e => e.id === id) ??
    _customExercises.find(e => e.id === id) ??
    null
  );
}