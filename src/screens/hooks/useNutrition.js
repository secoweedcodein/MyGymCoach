// src/screens/hooks/useNutrition.js
import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { todayKey } from '../../../lib/dateUtils';
import { calculateDailyNutrition } from '../../../lib/nutritionCalculator';
import { scaleNutrients } from '../../../services/foodService';

export function useNutrition(userId) {
  const [todayLog, setTodayLog] = useState([]);
  const [goals, setGoals]       = useState(null);
  const [profile, setProfile]   = useState(null);

  const loadToday = useCallback(async () => {
    if (!userId) return;
    const today = todayKey();

    const [logsRes, goalsRes, profileRes] = await Promise.all([
      supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('logged_date', today),
      supabase
        .from('nutrition_goals')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('user_profiles')
        .select('weight_kg, height_cm, birth_year, goal, activity_level, activity_level_id')
        .eq('id', userId)
        .maybeSingle(),
    ]);

    if (logsRes.data) setTodayLog(logsRes.data);
    if (profileRes.data) setProfile(profileRes.data);

    // Si aún no hay metas guardadas, las calcula desde el perfil (sistema canónico).
    if (goalsRes.data) {
      setGoals(goalsRes.data);
    } else if (profileRes.data) {
      const computed = calculateDailyNutrition(profileRes.data);
      if (computed) setGoals(computed);
    }
  }, [userId]);

  // Totales del día
  const totals = todayLog.reduce((acc, item) => ({
    calories: acc.calories + (item.calories || 0),
    protein:  acc.protein  + (item.protein_g || 0),
    carbs:    acc.carbs    + (item.carbs_g   || 0),
    fat:      acc.fat      + (item.fat_g     || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  async function addFood({ mealType, food, grams }) {
    if (!food?.per100g || !grams) return { error: new Error('Datos del alimento inválidos') };

    const scaled = scaleNutrients(food, grams);
    const { error } = await supabase.from('nutrition_logs').insert({
      user_id:    userId,
      meal_type:  mealType,
      food_name:  food.name,
      food_id:    food?.id ?? food?.food_id ?? null,
      calories:   scaled.calories,
      protein_g:  scaled.protein,
      carbs_g:    scaled.carbs,
      fat_g:      scaled.fat,
      quantity_g: grams,
      logged_date: todayKey(),
    });

    if (!error) loadToday();
    return { error };
  }

  return { todayLog, goals, profile, totals, loadToday, addFood };
}