import {
  fetchProfileDashboardData,
  fetchUserProfile,
  saveProfileData,
  upsertUserProfile,
} from '../profileService';
import { supabase } from '../../../../lib/supabase';

jest.mock('../../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

function mockQuery(result) {
  const query = {};
  ['select', 'eq', 'not', 'gte', 'upsert'].forEach((method) => {
    query[method] = jest.fn(() => query);
  });
  query.maybeSingle = jest.fn(() => Promise.resolve(result));
  query.single = jest.fn(() => Promise.resolve(result));
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return query;
}

describe('profileService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('fetchUserProfile returns null when the user profile is absent', async () => {
    const query = mockQuery({ data: null, error: null });
    supabase.from.mockReturnValue(query);
    await expect(fetchUserProfile('u1')).resolves.toBeNull();
    expect(query.eq).toHaveBeenCalledWith('id', 'u1');
  });

  test('fetchUserProfile accepts the no-row Supabase response', async () => {
    supabase.from.mockReturnValue(mockQuery({
      data: null,
      error: { code: 'PGRST116' },
    }));
    await expect(fetchUserProfile('u1')).resolves.toBeNull();
  });

  test('fetchUserProfile propagates other Supabase errors', async () => {
    const error = { code: 'XX000', message: 'read failed' };
    supabase.from.mockReturnValue(mockQuery({ data: null, error }));
    await expect(fetchUserProfile('u1')).rejects.toEqual(error);
  });

  test('upsertUserProfile uses the profile primary key and returns the row', async () => {
    const profile = { id: 'u1', full_name: 'Ana' };
    const query = mockQuery({ data: profile, error: null });
    supabase.from.mockReturnValue(query);
    await expect(upsertUserProfile('u1', { full_name: 'Ana' })).resolves.toEqual(profile);
    expect(query.upsert).toHaveBeenCalledWith(
      { full_name: 'Ana', id: 'u1' },
      { onConflict: 'id' },
    );
  });

  test('fetchProfileDashboardData returns normalized dashboard data', async () => {
    const results = [
      { data: { id: 'u1' }, error: null },
      { data: [{ total_sets: 4, total_volume_kg: 100 }], error: null },
      { data: [{ calories: 2000 }], error: null },
      { data: { calories: 2200 }, error: null },
    ];
    supabase.from.mockImplementation(() => mockQuery(results.shift()));
    await expect(fetchProfileDashboardData('u1', '2026-10-01')).resolves.toEqual({
      profile: { id: 'u1' },
      sessions: [{ total_sets: 4, total_volume_kg: 100 }],
      nutritionLogs: [{ calories: 2000 }],
      nutritionGoals: { calories: 2200 },
    });
    expect(supabase.from).toHaveBeenCalledTimes(4);
  });

  test('fetchProfileDashboardData rejects invalid parameters and query errors', async () => {
    await expect(fetchProfileDashboardData('', '2026-10-01')).rejects.toThrow('El usuario es obligatorio');
    await expect(fetchProfileDashboardData('u1', '')).rejects.toThrow('La fecha inicial');

    const error = { message: 'dashboard query failed' };
    supabase.from.mockImplementation(() => mockQuery({ data: null, error }));
    await expect(fetchProfileDashboardData('u1', '2026-10-01')).rejects.toEqual(error);
  });

  test('saveProfileData writes the profile and optional weight/goals rows', async () => {
    const queries = new Map();
    supabase.from.mockImplementation((table) => {
      const query = mockQuery({ error: null });
      queries.set(table, query);
      return query;
    });
    await expect(saveProfileData('u1', {
      profile: { full_name: 'Ana' },
      weightLog: { weight_kg: 60, logged_date: '2026-10-24' },
      nutritionGoals: { calories: 2000 },
    })).resolves.toBeUndefined();
    expect(queries.get('user_profiles').upsert).toHaveBeenCalledWith(
      { full_name: 'Ana', id: 'u1' },
      { onConflict: 'id' },
    );
    expect(queries.get('weight_logs').upsert).toHaveBeenCalledWith(
      { weight_kg: 60, logged_date: '2026-10-24', user_id: 'u1' },
      { onConflict: 'user_id,logged_date' },
    );
    expect(queries.get('nutrition_goals').upsert).toHaveBeenCalledWith({
      calories: 2000,
      user_id: 'u1',
    });
  });

  test('saveProfileData surfaces failures from each write', async () => {
    const error = { message: 'write failed' };
    supabase.from.mockReturnValue(mockQuery({ error }));
    await expect(saveProfileData('u1', { profile: {} })).rejects.toEqual(error);
    await expect(saveProfileData('u1', {
      profile: {},
      weightLog: { weight_kg: 60 },
    })).rejects.toEqual(error);
    await expect(saveProfileData('u1', {
      profile: {},
      nutritionGoals: { calories: 2000 },
    })).rejects.toEqual(error);
  });
});
