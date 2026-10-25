// features/nutrition/services/nutritionService.js
import { supabase } from '../../../lib/supabase';

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function fetchCurrentNutritionUser() {
  return getCurrentUser();
}

function requireValue(value, label) {
  if (value === undefined || value === null || value === '') {
    throw new TypeError(`Se requiere ${label}`);
  }
}

function throwQueryError(result) {
  if (result.error) throw result.error;
  return result.data;
}

export async function fetchNutritionDashboard(userId, date) {
  requireValue(userId, 'el usuario');
  requireValue(date, 'la fecha');
  const [logs, goals, recipes, profile] = await Promise.all([
    supabase.from('nutrition_logs')
      .select('id, meal_type, food_name, food_id, barcode, calories, protein_g, carbs_g, fat_g, quantity_g, logged_date, created_at')
      .eq('user_id', userId)
      .eq('logged_date', date)
      .order('created_at'),
    supabase.from('nutrition_goals')
      .select('calories, protein_g, carbs_g, fat_g')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.from('saved_recipes')
      .select('id, recipe_id, recipe_name, recipe_category, calories, protein, time, saved_at')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })
      .limit(5),
    supabase.from('user_profiles')
      .select('weight_kg, height_cm, birth_year, goal, activity_level, activity_level_id')
      .eq('id', userId)
      .maybeSingle(),
  ]);
  return {
    logs: throwQueryError(logs) || [],
    goals: throwQueryError(goals) || null,
    savedRecipes: throwQueryError(recipes) || [],
    profile: throwQueryError(profile) || null,
  };
}

export async function deleteNutritionLog(logId) {
  requireValue(logId, 'el registro');
  const result = await supabase.from('nutrition_logs').delete().eq('id', logId);
  throwQueryError(result);
}

export async function updateNutritionLog(logId, updates) {
  requireValue(logId, 'el registro');
  const result = await supabase.from('nutrition_logs').update(updates).eq('id', logId);
  throwQueryError(result);
}

export async function fetchFoodSearchData(userId) {
  requireValue(userId, 'el usuario');
  const [recent, favorites, recipes] = await Promise.all([
    supabase.from('recent_foods')
      .select('id, food_name, food_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('food_favorites')
      .select('id, food_name, food_id, calories, protein_g, carbs_g, fat_g, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('saved_recipes')
      .select('id, recipe_id, recipe_name, recipe_category, calories, protein, carbs, fat, time, saved_at')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false }),
  ]);
  return {
    recent: throwQueryError(recent) || [],
    favorites: throwQueryError(favorites) || [],
    savedRecipes: throwQueryError(recipes) || [],
  };
}

export async function addFoodToNutrition({ userId, mealType, food, grams, nutrients, loggedDate }) {
  requireValue(userId, 'el usuario');
  requireValue(mealType, 'el tipo de comida');
  requireValue(food?.name, 'el alimento');
  requireValue(loggedDate, 'la fecha');
  const recentResult = await supabase.from('recent_foods').insert({
    user_id: userId,
    food_name: food.name,
    food_id: food.id,
  });
  throwQueryError(recentResult);
  const logResult = await supabase.from('nutrition_logs').insert({
    user_id: userId,
    meal_type: mealType,
    food_name: food.name,
    food_id: food.id,
    calories: nutrients.calories,
    protein_g: nutrients.protein,
    carbs_g: nutrients.carbs,
    fat_g: nutrients.fat,
    quantity_g: grams,
    logged_date: loggedDate,
  });
  throwQueryError(logResult);
}

export async function addRecipeToNutrition({ userId, mealType, recipe, loggedDate }) {
  requireValue(userId, 'el usuario');
  requireValue(mealType, 'el tipo de comida');
  requireValue(recipe?.recipe_id, 'la receta');
  requireValue(loggedDate, 'la fecha');
  const result = await supabase.from('nutrition_logs').insert({
    user_id: userId,
    meal_type: mealType,
    food_name: `🍳 ${recipe.recipe_name}`,
    food_id: `recipe_${recipe.recipe_id}`,
    calories: recipe.calories || 0,
    protein_g: recipe.protein || 0,
    carbs_g: recipe.carbs || 0,
    fat_g: recipe.fat || 0,
    quantity_g: 1,
    logged_date: loggedDate,
  });
  throwQueryError(result);
}

export async function addFoodToMealPlan({ userId, weekStart, dayOfWeek, mealType, food, nutrients }) {
  requireValue(userId, 'el usuario');
  requireValue(weekStart, 'el inicio de semana');
  const day = Number(dayOfWeek);
  if (!Number.isInteger(day) || day < 0 || day > 6) {
    throw new TypeError('El día de la semana debe estar entre 0 y 6');
  }
  const result = await supabase.from('meal_plans').insert({
    user_id: userId,
    week_start: weekStart,
    day_of_week: day,
    meal_type: mealType,
    food_name: food.name,
    calories: nutrients.calories,
    protein_g: nutrients.protein,
    carbs_g: nutrients.carbs,
    fat_g: nutrients.fat,
  });
  throwQueryError(result);
}

export async function fetchMealPlanData(userId, weekStart) {
  requireValue(userId, 'el usuario');
  requireValue(weekStart, 'el inicio de semana');
  const [plan, goals] = await Promise.all([
    supabase.from('meal_plans').select('id, day_of_week, meal_type, food_name, calories, protein_g, carbs_g, fat_g, quantity_g')
      .eq('user_id', userId).eq('week_start', weekStart).order('day_of_week').order('meal_type'),
    supabase.from('nutrition_goals').select('calories, protein_g, carbs_g, fat_g').eq('user_id', userId).maybeSingle(),
  ]);
  if (plan.error) throw plan.error;
  if (goals.error) throw goals.error;
  return { plan: plan.data || [], goals: goals.data || null };
}

export async function deleteMealPlanItem(itemId) {
  requireValue(itemId, 'el alimento planificado');
  const result = await supabase.from('meal_plans').delete().eq('id', itemId);
  throwQueryError(result);
}

export async function copyMealPlanDayToNutrition({ userId, items, loggedDate }) {
  requireValue(userId, 'el usuario');
  requireValue(loggedDate, 'la fecha');
  if (!Array.isArray(items)) throw new TypeError('Los alimentos deben ser una lista');
  if (items.length === 0) return;
  const result = await supabase.from('nutrition_logs').insert(items.map((item) => ({
    user_id: userId,
    meal_type: item.meal_type,
    food_name: item.food_name,
    calories: item.calories,
    protein_g: item.protein_g,
    carbs_g: item.carbs_g,
    fat_g: item.fat_g,
    quantity_g: 100,
    logged_date: loggedDate,
  })));
  throwQueryError(result);
}

export async function addNutritionLogEntry({ userId, mealType, food, grams, nutrients, loggedDate }) {
  requireValue(userId, 'el usuario');
  requireValue(mealType, 'el tipo de comida');
  requireValue(food?.name, 'el alimento');
  requireValue(loggedDate, 'la fecha');
  const result = await supabase.from('nutrition_logs').insert({
    user_id: userId,
    meal_type: mealType,
    food_name: food.name,
    food_id: food.id ?? food.food_id ?? null,
    calories: nutrients.calories,
    protein_g: nutrients.protein,
    carbs_g: nutrients.carbs,
    fat_g: nutrients.fat,
    quantity_g: grams,
    logged_date: loggedDate,
  });
  throwQueryError(result);
}

export async function toggleFoodFavorite({ userId, food, existingFavorite }) {
  requireValue(userId, 'el usuario');
  requireValue(food?.id, 'el alimento');
  if (existingFavorite) {
    const result = await supabase.from('food_favorites').delete().eq('id', existingFavorite.id);
    throwQueryError(result);
    return null;
  }
  const result = await supabase.from('food_favorites').insert({
    user_id: userId,
    food_name: food.name,
    food_id: food.id,
    calories: food.per100g.calories,
    protein_g: food.per100g.protein,
    carbs_g: food.per100g.carbs,
    fat_g: food.per100g.fat,
  }).select('id, food_name, food_id, calories, protein_g, carbs_g, fat_g').single();
  const favorite = throwQueryError(result);
  if (!favorite) throw new Error('No se recibió el favorito guardado');
  return favorite;
}

export async function fetchNutritionGoals(userId) {
  requireValue(userId, 'el usuario');
  const result = await supabase.from('nutrition_goals')
    .select('calories, protein_g, carbs_g, fat_g')
    .eq('user_id', userId)
    .maybeSingle();
  return throwQueryError(result) || null;
}

export async function fetchNutritionHistory(userId, startDate) {
  requireValue(userId, 'el usuario');
  requireValue(startDate, 'la fecha de inicio');
  const result = await supabase.from('nutrition_logs')
    .select('logged_date, meal_type, food_name, calories, protein_g, carbs_g, fat_g, quantity_g')
    .eq('user_id', userId)
    .gte('logged_date', startDate)
    .order('logged_date', { ascending: true });
  return throwQueryError(result) || [];
}
