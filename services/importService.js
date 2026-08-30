/**
 * importService.js
 * Servicio para importar datos de aplicaciones competidoras (Hevy, Strong).
 */

/**
 * Analiza un CSV simple manualmente, sin depender de librerías.
 * @param {string} text - Contenido CSV.
 * @returns {Array} Array de filas.
 */
const parseSimpleCSV = (text) => {
  if (!text) return [];
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    // Regex rudimentario para soportar comas dentro de comillas
    const matches = lines[i].match(/(?!\s*$)\s*(?:'([^'\\]*(?:\\[\s\S][^'\\]*)*)'|"([^"\\]*(?:\\[\s\S][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g);
    if (!matches) continue;
    const row = matches.map(m => {
      let val = m.replace(/,$/, '').trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      return val;
    });
    
    const obj = {};
    headers.forEach((h, index) => {
      obj[h] = row[index] || '';
    });
    result.push(obj);
  }
  return result;
};

/**
 * Parsea el JSON exportado de Hevy.
 * @param {string} jsonString - Cadena JSON exportada desde Hevy.
 * @returns {Array} Array de objetos normalizados { session, sets }.
 */
export const parseHevyExport = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !data.workouts) return [];

    return data.workouts.map(workout => {
      const session = {
        title: workout.title || 'Workout',
        start_time: workout.start_time,
        end_time: workout.end_time
      };

      const sets = [];
      if (workout.exercises) {
        workout.exercises.forEach(exercise => {
          if (exercise.sets) {
            exercise.sets.forEach((set, index) => {
              sets.push({
                exercise_name: exercise.name,
                set_order: index + 1,
                weight: set.weight || 0,
                reps: set.reps || 0,
                rpe: set.rpe || null
              });
            });
          }
        });
      }

      return { session, sets };
    });
  } catch (error) {
    console.error('Error parseando JSON de Hevy:', error);
    return [];
  }
};

/**
 * Parsea el CSV exportado de Strong.
 * @param {string} csvString - Cadena CSV exportada desde Strong.
 * @returns {Array} Array de objetos normalizados { session, sets }.
 */
export const parseStrongExport = (csvString) => {
  const rows = parseSimpleCSV(csvString);
  const workoutsMap = new Map();

  rows.forEach(row => {
    const date = row['Date'];
    const workoutName = row['Workout Name'] || 'Strong Workout';
    const workoutKey = `${date}-${workoutName}`;

    if (!workoutsMap.has(workoutKey)) {
      workoutsMap.set(workoutKey, {
        session: {
          title: workoutName,
          start_time: date,
          end_time: date // Strong a veces no da end time
        },
        sets: []
      });
    }

    const currentWorkout = workoutsMap.get(workoutKey);
    currentWorkout.sets.push({
      exercise_name: row['Exercise Name'],
      set_order: parseInt(row['Set Order'], 10) || 1,
      weight: parseFloat(row['Weight']) || 0,
      reps: parseInt(row['Reps'], 10) || 0,
      rpe: row['RPE'] ? parseFloat(row['RPE']) : null,
      notes: row['Notes'] || ''
    });
  });

  return Array.from(workoutsMap.values());
};

/**
 * Inserta los datos importados en Supabase en lotes.
 * @param {Object} supabase - Cliente de Supabase.
 * @param {string} userId - ID del usuario.
 * @param {Array} parsedData - Datos parseados devueltos por los parsers.
 * @returns {Promise<Object>} { imported: number, errors: string[] }
 */
export const importToSupabase = async (supabase, userId, parsedData) => {
  let imported = 0;
  const errors = [];

  for (const { session, sets } of parsedData) {
    try {
      // 1. Insertar la sesión (workout)
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert([{
          user_id: userId,
          title: session.title,
          start_time: session.start_time,
          end_time: session.end_time
        }])
        .select()
        .single();

      if (sessionError) {
        errors.push(`Error al insertar sesión "${session.title}": ${sessionError.message}`);
        continue;
      }

      // 2. Insertar los sets asociados a la sesión
      const setsToInsert = sets.map(set => ({
        session_id: sessionData.id,
        user_id: userId,
        exercise_name: set.exercise_name,
        set_order: set.set_order,
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe
      }));

      if (setsToInsert.length > 0) {
        const { error: setsError } = await supabase
          .from('sets')
          .insert(setsToInsert);

        if (setsError) {
          errors.push(`Error al insertar sets de "${session.title}": ${setsError.message}`);
        } else {
          imported++;
        }
      } else {
        imported++; // Sesión vacía importada
      }
    } catch (err) {
      errors.push(`Error inesperado procesando sesión: ${err.message}`);
    }
  }

  return { imported, errors };
};
