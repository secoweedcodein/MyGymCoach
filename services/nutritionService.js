import { supabase } from '../lib/supabase';
import { toDayKey, todayKey } from '../lib/dateUtils';

export const copyYesterdayMeals = async (userId) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toDayKey(yesterday);
    const todayStr = todayKey();

    // 1. Obtener comidas de ayer
    const { data: yesterdayLogs, error: fetchError } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('logged_date', yesterdayStr);

    if (fetchError || !yesterdayLogs || yesterdayLogs.length === 0) {
      return { success: false, message: 'No hay comidas registradas ayer.' };
    }

    // 2. Preparar datos para hoy (nuevos IDs, misma info, fecha actualizada)
    const todayLogs = yesterdayLogs.map(log => ({
      user_id: userId,
      logged_date: todayStr,
      meal_type: log.meal_type,
      food_name: log.food_name,
      food_id: log.food_id,
      calories: log.calories,
      protein_g: log.protein_g,
      carbs_g: log.carbs_g,
      fat_g: log.fat_g,
      quantity_g: log.quantity_g,
    }));

    // 3. Insertar en la base de datos
    const { error: insertError } = await supabase
      .from('nutrition_logs')
      .insert(todayLogs);

    if (insertError) {
      console.error('Error al copiar:', insertError);
      return { success: false, message: 'Error al copiar las comidas.' };
    }
    
    return { success: true, message: `¡${todayLogs.length} comidas copiadas a hoy!` };
  } catch (e) {
    console.error('Error en copyYesterdayMeals:', e);
    return { success: false, message: 'Error inesperado.' };
  }
};