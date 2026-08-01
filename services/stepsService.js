// src/services/stepsService.js

// ⚠️ IMPORTANTE: Eliminamos la importación normal superior 'import { Pedometer } ...'
// En su lugar, usamos un bloque try/catch para requerir el módulo de forma segura.
let Pedometer = null;
try {
  Pedometer = require('expo-pedometer').Pedometer;
} catch (e) {
  console.warn("⚠️ Advertencia: El módulo nativo ExpoPedometer no está disponible en este entorno.");
}

/**
 * Verifica si el podómetro está disponible en el hardware actual
 */
export async function checkPedometerPermission() {
  if (!Pedometer) {
    return { granted: false, canAskAgain: false };
  }
  try {
    // Verificamos disponibilidad y permisos en Expo de forma segura
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) return { granted: false };

    const permission = await Pedometer.getPermissionsAsync();
    if (permission.granted) {
      return { granted: true };
    }

    const request = await Pedometer.requestPermissionsAsync();
    return { granted: request.granted };
  } catch (error) {
    console.error("Error al comprobar permisos del podómetro:", error);
    return { granted: false };
  }
}

/**
 * Se suscribe a los pasos en tiempo real
 * Retorna una función para cancelar la suscripción (limpieza)
 */
export async function subscribeToSteps(onStepsChange) {
  if (!Pedometer) {
    console.log("Modo simulación: No hay módulo nativo de pasos.");
    return () => {}; // Devolvemos una función vacía para evitar errores al desmontar
  }

  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) return () => {};

    // Iniciamos la escucha nativa del sensor
    const subscription = Pedometer.watchStepCount(result => {
      if (result && result.steps !== undefined) {
        onStepsChange({ steps: result.steps });
      }
    });

    // Retornamos la función de limpieza estándar
    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  } catch (error) {
    console.error("Error al suscribirse al podómetro nativo:", error);
    return () => {};
  }
}

/**
 * Calcula métricas estimadas basadas en los pasos
 */
export function calculateMetrics(steps) {
  const currentSteps = steps || 0;
  // Estimación estándar: 1 paso ≈ 0.76 metros (0.00076 km)
  const distanceKm = (currentSteps * 0.00076).toFixed(2);
  // Estimación estándar: 1 paso ≈ 0.04 calorías quemadas
  const calories = Math.round(currentSteps * 0.04);
  // Estimación estándar: 1 minuto de caminata activa ≈ 100 pasos
  const activeMinutes = Math.round(currentSteps / 100);

  return {
    distanceKm,
    calories,
    activeMinutes
  };
}

/**
 * Guarda los pasos acumulados en Supabase
 */
export async function saveDailySteps({ userId, steps, goal }) {
  if (!userId) return;
  const today = new Date().toISOString().split('T')[0];

  try {
    const { error } = await supabase
      .from('daily_steps') // Ajusta al nombre exacto de tu tabla en Supabase
      .upsert({
        user_id: userId,
        date: today,
        steps: steps,
        goal: goal,
        updated_at: new Date()
      }, { onConflict: 'user_id,date' });

    if (error) throw error;
    console.log(`Pasos sincronizados exitosamente en Supabase: ${steps}`);
  } catch (error) {
    console.error("Error al guardar pasos diarios en Supabase:", error);
  }
}

/**
 * Obtiene el historial de pasos del usuario
 */
export async function getStepsHistory(userId, daysLimit = 7) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('daily_steps')
      .select('date, steps, goal')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(daysLimit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al traer historial de pasos:", error);
    return [];
  }
}

/**
 * Obtiene la meta de pasos configurada por el usuario
 */
export async function getUserStepsGoal(userId) {
  if (!userId) return 10000;
  try {
    const { data, error } = await supabase
      .from('user_profiles') // Ajusta al nombre de tu tabla de perfiles/configuración
      .select('steps_goal')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignorar si no se encuentra registro
    return data?.steps_goal || 10000;
  } catch (error) {
    console.error("Error al obtener la meta de pasos:", error);
    return 10000;
  }
}