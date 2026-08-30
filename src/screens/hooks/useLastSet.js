import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export const useLastSet = (exerciseName) => {
  const [lastSet, setLastSet] = useState({ weight_kg: null, reps: null });

  useEffect(() => {
    if (!exerciseName) return;
    const fetchLast = async () => {
      const { data } = await supabase
        .from('workout_sets')
        .select('weight_kg, reps')
        .eq('exercise_name', exerciseName)
        .order('logged_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) setLastSet({ weight_kg: data.weight_kg, reps: data.reps });
    };
    fetchLast();
  }, [exerciseName]);

  return lastSet;
};