import {
  addFoodToMealPlan,
  addFoodToNutrition,
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
