// src/screens/hooks/useNutrition.js
import { useState, useCallback } from 'react';
import { todayKey } from '../../../lib/dateUtils';
import { calculateDailyNutrition } from '../../../lib/nutritionCalculator';
import { scaleNutrients } from '../../../services/foodService';
import { sumMacros } from '../../../lib/nutritionStats';
import {
  addNutritionLogEntry,
  fetchNutritionDashboard,
} from '../../../features/nutrition/services/nutritionService';

export function useNutrition(userId) {
  const [todayLog, setTodayLog] = useState([]);
  const [goals, setGoals]       = useState(null);
  const [profile, setProfile]   = useState(null);

  const loadToday = useCallback(async () => {
    if (!userId) return;
    const today = todayKey();

    const dashboard = await fetchNutritionDashboard(userId, today);

    setTodayLog(dashboard.logs);
    setProfile(dashboard.profile);

    // Si aún no hay metas guardadas, las calcula desde el perfil (sistema canónico).
    if (dashboard.goals) {
      setGoals(dashboard.goals);
    } else if (dashboard.profile) {
      const computed = calculateDailyNutrition(dashboard.profile);
      if (computed) setGoals(computed);
    }
  }, [userId]);

  // Totales del día
  const totals = sumMacros(todayLog);

  async function addFood({ mealType, food, grams }) {
    if (!food?.per100g || !grams) return { error: new Error('Datos del alimento inválidos') };

    const scaled = scaleNutrients(food, grams);
    try {
      await addNutritionLogEntry({
        userId,
        mealType,
        food,
        grams,
        nutrients: scaled,
        loggedDate: todayKey(),
      });
      await loadToday();
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  return { todayLog, goals, profile, totals, loadToday, addFood };
}