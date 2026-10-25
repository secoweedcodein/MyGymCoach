import { supabase } from '../../lib/supabase';
import { listSeeAllTrends, listCommunityUserRecipes } from '../exploreService';

jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('../../lib/errors', () => ({
  withTimeout: (promise) => promise,
}));

function mockQuery(result) {
  const query = {};
  ['select', 'eq', 'in', 'order', 'range', 'limit', 'ilike', 'maybeSingle'].forEach((method) => {
    query[method] = jest.fn(() => query);
  });
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  supabase.from.mockReturnValue(query);
  return query;
}

describe('exploreService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('lists only active trends enabled for the see-all screen', async () => {
    const rows = [{ id: 'trend-1', title: 'Fuerza' }];
    const query = mockQuery({ data: rows, error: null });

    await expect(listSeeAllTrends()).resolves.toBe(rows);
    expect(supabase.from).toHaveBeenCalledWith('trends');
    expect(query.eq).toHaveBeenNthCalledWith(1, 'is_active', true);
    expect(query.eq).toHaveBeenNthCalledWith(2, 'show_in_see_all', true);
    expect(query.order).toHaveBeenCalledWith('position', { ascending: true });
  });

  test('lists community recipes with both supported publication states', async () => {
    const query = mockQuery({ data: [], error: null });

    await expect(listCommunityUserRecipes()).resolves.toEqual([]);
    expect(supabase.from).toHaveBeenCalledWith('user_recipes');
    expect(query.in).toHaveBeenCalledWith('status', ['approved', 'published']);
  });

  test('propagates query errors to the screen', async () => {
    const error = { message: 'database unavailable' };
    mockQuery({ data: null, error });

    await expect(listSeeAllTrends()).rejects.toEqual(error);
  });
});
