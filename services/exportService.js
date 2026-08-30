import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const exportWorkoutHistory = async (userId, format = 'json') => {
  try {
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        workout_sets (*)
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (!sessions) return { success: false, error: 'No hay datos para exportar' };

    let content = '';
    let fileName = `mygymcoach_export_${new Date().toISOString().split('T')[0]}`;

    if (format === 'json') {
      content = JSON.stringify(sessions, null, 2);
      fileName += '.json';
    } else if (format === 'csv') {
      const headers = 'Fecha,Ejercicio,Serie,Peso (kg),Repeticiones,Completado\n';
      const rows = sessions.flatMap(session => 
        session.workout_sets.map(set => 
          `${session.started_at},${set.exercise_name},${set.set_number},${set.weight_kg},${set.reps},${set.completed}`
        )
      ).join('\n');
      content = headers + rows;
      fileName += '.csv';
    }

    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, content);

    await Sharing.shareAsync(fileUri);
    return { success: true };
  } catch (e) {
    console.error('Error exporting:', e);
    return { success: false, error: e.message };
  }
};