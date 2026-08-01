// src/hooks/useNutrition.js
import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const ACTIVITY = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9
};

// Mifflin-St Jeor → TDEE
export function calculateTDEE(profile, activityLevel = 'moderate') {
  if (!profile?.weight_kg || !profile?.height_cm || !profile?.birth_year) return null;
  const age = new Date().getFullYear() - profile.birth_year;
  // Fórmula unisex (puedes pedir género en el perfil si quieres más precisión)
  const bmr = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * age + 5;
  const tdee = Math.round(bmr * ACTIVITY[activityLevel]);

  // Ajuste por objetivo
  const goalMap = {
    'Ganar masa muscular': tdee + 300,
    'Perder grasa':        tdee - 400,
    'Fuerza máxima':       tdee + 200,
    'Resistencia':         tdee,
    'Mantenimiento':       tdee,
  };

  const calories = goalMap[profile.goal] ?? tdee;
  return {
    calories,
    protein_g: Math.round(profile.weight_kg * 2),    // 2g/kg
    carbs_g:   Math.round((calories * 0.45) / 4),    // 45% carbos
    fat_g:     Math.round((calories * 0.25) / 9),    // 25% grasas
  };
}

export function useNutrition(userId) {
  const [todayLog, setTodayLog] = useState([]);
  const [goals, setGoals]       = useState(null);

  const loadToday = useCallback(async () => {
    if (!userId) return;
    const today = new Date().toISOString().split('T')[0];

    const [logsRes, goalsRes] = await Promise.all([
      supabase.from('nutrition_logs').select('*').eq('user_id', userId).eq('logged_date', today),
      supabase.from('nutrition_goals').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    if (logsRes.data)  setTodayLog(logsRes.data);
    if (goalsRes.data) setGoals(goalsRes.data);
  }, [userId]);

  // Totales del día
  const totals = todayLog.reduce((acc, item) => ({
    calories: acc.calories + (item.calories  || 0),
    protein:  acc.protein  + (item.protein_g || 0),
    carbs:    acc.carbs    + (item.carbs_g   || 0),
    fat:      acc.fat      + (item.fat_g     || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  async function addFood({ mealType, food, grams }) {
    const scaled = scaleNutrients(food, grams);
    await supabase.from('nutrition_logs').insert({
      user_id:     userId,
      meal_type:   mealType,
      food_name:   food.name,
      food_id:     food.id,
      calories:    scaled.calories,
      protein_g:   scaled.protein,
      carbs_g:     scaled.carbs,
      fat_g:       scaled.fat,
      quantity_g:  grams,
    });
    loadToday();
  }

  return { todayLog, goals, totals, loadToday, addFood };
}