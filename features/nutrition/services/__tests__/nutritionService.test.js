import {
  addFoodToMealPlan,
  addFoodToNutrition,
  copyMealPlanDayToNutrition,
  fetchFoodSearchData,
  fetchNutritionDashboard,
  fetchNutritionHistory,
  toggleFoodFavorite,
} from '../nutritionService';
import { supabase } from '../../../../lib/supabase';

jest.mock('../../../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}));

function queryWith(result) {
  const query = {};
  ['select', 'eq', 'order', 'limit', 'gte', 'delete', 'insert', 'update'].forEach((method) => {
    query[method] = jest.fn(() => query);
  });
  query.maybeSingle = jest.fn(() => Promise.resolve(result));
  query.single = jest.fn(() => Promise.resolve(result));
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return query;
}

describe('nutritionService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('fetchNutritionDashboard returns consistent empty values for missing data', async () => {
    supabase.from.mockImplementation(() => queryWith({ data: null, error: null }));
    await expect(fetchNutritionDashboard('u1', '2026-10-24')).resolves.toEqual({
      logs: [],
      goals: null,
      savedRecipes: [],
      profile: null,
    });
    expect(supabase.from).toHaveBeenCalledTimes(4);
  });

  test('fetchNutritionDashboard surfaces query errors', async () => {
    const error = { message: 'nutrition query failed' };
    supabase.from.mockImplementationOnce(() => queryWith({ data: null, error }));
    await expect(fetchNutritionDashboard('u1', '2026-10-24')).rejects.toEqual(error);
  });

  test('fetchFoodSearchData returns empty lists for no saved data', async () => {
    supabase.from.mockImplementation(() => queryWith({ data: null, error: null }));
    await expect(fetchFoodSearchData('u1')).resolves.toEqual({
      recent: [],
      favorites: [],
      savedRecipes: [],
    });
  });

  test('fetchNutritionHistory validates arguments and propagates query errors', async () => {
    await expect(fetchNutritionHistory('', '2026-10-01')).rejects.toThrow('Se requiere el usuario');
    const error = { message: 'history query failed' };
    supabase.from.mockReturnValue(queryWith({ data: null, error }));
    await expect(fetchNutritionHistory('u1', '2026-10-01')).rejects.toEqual(error);
  });

  test('addFoodToNutrition writes a recent item and nutrition log', async () => {
    const queries = [];
    supabase.from.mockImplementation(() => {
      const query = queryWith({ data: null, error: null });
      queries.push(query);
      return query;
    });
    await expect(addFoodToNutrition({
      userId: 'u1',
      mealType: 'lunch',
      food: { id: 'f1', name: 'Avena' },
      grams: 50,
      nutrients: { calories: 190, protein: 6, carbs: 30, fat: 4 },
      loggedDate: '2026-10-24',
    })).resolves.toBeUndefined();
    expect(supabase.from).toHaveBeenNthCalledWith(1, 'recent_foods');
    expect(supabase.from).toHaveBeenNthCalledWith(2, 'nutrition_logs');
    expect(queries[1].insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'u1',
      quantity_g: 50,
      logged_date: '2026-10-24',
    }));
  });

  test('addFoodToMealPlan rejects invalid weekdays and forwards database failures', async () => {
    await expect(addFoodToMealPlan({
      userId: 'u1',
      weekStart: '2026-10-19',
      dayOfWeek: '7',
      mealType: 'lunch',
      food: { name: 'Avena' },
      nutrients: {},
    })).rejects.toThrow('entre 0 y 6');
    const error = { message: 'insert failed' };
    supabase.from.mockReturnValue(queryWith({ data: null, error }));
    await expect(addFoodToMealPlan({
      userId: 'u1',
      weekStart: '2026-10-19',
      dayOfWeek: 1,
      mealType: 'lunch',
      food: { name: 'Avena' },
      nutrients: {},
    })).rejects.toEqual(error);
  });

  test('addFoodToMealPlan persists quantity_g from grams parameter', async () => {
    const query = queryWith({ data: null, error: null });
    supabase.from.mockReturnValue(query);
    await addFoodToMealPlan({
      userId: 'u1',
      weekStart: '2026-10-19',
      dayOfWeek: 2,
      mealType: 'lunch',
      food: { name: 'Arroz' },
      nutrients: { calories: 260, protein: 5, carbs: 58, fat: 0.6 },
      grams: 200,
    });
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({
      food_name: 'Arroz',
      quantity_g: 200,
      calories: 260,
    }));
  });

  test('addFoodToMealPlan defaults quantity_g to 100 when grams is omitted', async () => {
    const query = queryWith({ data: null, error: null });
    supabase.from.mockReturnValue(query);
    await addFoodToMealPlan({
      userId: 'u1',
      weekStart: '2026-10-19',
      dayOfWeek: 0,
      mealType: 'breakfast',
      food: { name: 'Pan' },
      nutrients: { calories: 100, protein: 3, carbs: 20, fat: 1 },
    });
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({
      quantity_g: 100,
    }));
  });

  test('copyMealPlanDayToNutrition preserves original quantity_g from meal plan items', async () => {
    const query = queryWith({ data: null, error: null });
    supabase.from.mockReturnValue(query);
    const items = [
      { meal_type: 'lunch', food_name: 'Arroz', food_id: 'f1', calories: 260, protein_g: 5, carbs_g: 58, fat_g: 0.6, quantity_g: 200 },
      { meal_type: 'lunch', food_name: 'Pollo', food_id: 'f2', calories: 330, protein_g: 62, carbs_g: 0, fat_g: 7, quantity_g: 250 },
    ];
    await copyMealPlanDayToNutrition({ userId: 'u1', items, loggedDate: '2026-10-24' });
    const insertedRows = query.insert.mock.calls[0][0];
    expect(insertedRows).toHaveLength(2);
    expect(insertedRows[0].quantity_g).toBe(200);
    expect(insertedRows[0].calories).toBe(260);
    expect(insertedRows[1].quantity_g).toBe(250);
    expect(insertedRows[1].calories).toBe(330);
  });

  test('copyMealPlanDayToNutrition falls back to 100 when quantity_g is null', async () => {
    const query = queryWith({ data: null, error: null });
    supabase.from.mockReturnValue(query);
    const items = [
      { meal_type: 'snack', food_name: 'Galleta', calories: 50, protein_g: 1, carbs_g: 8, fat_g: 2 },
    ];
    await copyMealPlanDayToNutrition({ userId: 'u1', items, loggedDate: '2026-10-24' });
    const insertedRows = query.insert.mock.calls[0][0];
    expect(insertedRows[0].quantity_g).toBe(100);
  });

  test('copyMealPlanDayToNutrition skips empty item lists gracefully', async () => {
    await copyMealPlanDayToNutrition({ userId: 'u1', items: [], loggedDate: '2026-10-24' });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('toggleFoodFavorite returns inserted favorite and removes existing favorite', async () => {
    const favorite = { id: 'fav1', food_id: 'f1' };
    supabase.from.mockReturnValue(queryWith({ data: favorite, error: null }));
    await expect(toggleFoodFavorite({
      userId: 'u1',
      food: { id: 'f1', name: 'Avena', per100g: { calories: 100, protein: 3, carbs: 20, fat: 2 } },
      existingFavorite: null,
    })).resolves.toEqual(favorite);

    const deleteQuery = queryWith({ data: null, error: null });
    supabase.from.mockReturnValue(deleteQuery);
    await expect(toggleFoodFavorite({
      userId: 'u1',
      food: { id: 'f1', name: 'Avena', per100g: { calories: 100, protein: 3, carbs: 20, fat: 2 } },
      existingFavorite: { id: 'fav1' },
    })).resolves.toBeNull();
    expect(deleteQuery.eq).toHaveBeenCalledWith('id', 'fav1');
  });
});
