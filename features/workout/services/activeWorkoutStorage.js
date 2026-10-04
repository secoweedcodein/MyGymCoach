// features/workout/services/activeWorkoutStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@mygymcoach_active_workout_v2';
const LEGACY_KEY = '@mygymcoach_active_workout';

export async function saveActiveWorkout(data) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
    // La clave vieja queda obsoleta tras migrar.
    await AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});
    return true;
  } catch (e) {
    console.warn('activeWorkoutStorage.save error', e);
    return false;
  }
}

export async function loadActiveWorkout() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);

    // Migración: recupera entrenos guardados con la clave previa a FASE 3.
    const legacyRaw = await AsyncStorage.getItem(LEGACY_KEY);
    if (!legacyRaw) return null;
    const legacy = JSON.parse(legacyRaw);
    await AsyncStorage.setItem(KEY, JSON.stringify(legacy)).catch(() => {});
    await AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});
    return legacy;
  } catch (e) {
    console.warn('activeWorkoutStorage.load error', e);
    return null;
  }
}

export async function clearActiveWorkout() {
  try {
    await AsyncStorage.multiRemove([KEY, LEGACY_KEY]);
    return true;
  } catch (e) {
    console.warn('activeWorkoutStorage.clear error', e);
    return false;
  }
}
