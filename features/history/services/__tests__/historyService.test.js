import {
  deleteHistorySession,
  fetchCurrentUserHistory,
  fetchHistory,
  fetchHistoryDetail,
} from '../historyService';
import { supabase } from '../../../../lib/supabase';

jest.mock('../../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
  },
}));

function mockQuery(result) {
  const query = {};
  ['select', 'eq', 'order', 'limit', 'delete'].forEach((method) => {
    query[method] = jest.fn(() => query);
  });
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return query;
}

describe('historyService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('fetchHistory returns an empty array on null data and orders by finish time', async () => {
    const query = mockQuery({ data: null, error: null });
    supabase.from.mockReturnValue(query);
    await expect(fetchHistory('u1')).resolves.toEqual([]);
    expect(query.order).toHaveBeenCalledWith('finished_at', { ascending: false });
    expect(query.limit).not.toHaveBeenCalled();
  });

  test('fetchHistory applies an explicit limit', async () => {
    const query = mockQuery({ data: [{ id: 's1' }], error: null });
    supabase.from.mockReturnValue(query);
    await expect(fetchHistory('u1', 5)).resolves.toEqual([{ id: 's1' }]);
    expect(query.limit).toHaveBeenCalledWith(5);
  });

  test('fetchHistory propagates Supabase errors', async () => {
    const error = { message: 'query failed' };
    supabase.from.mockReturnValue(mockQuery({ data: null, error }));
    await expect(fetchHistory('u1')).rejects.toEqual(error);
  });

  test('fetchHistory rejects invalid user and limit inputs', async () => {
    await expect(fetchHistory('')).rejects.toThrow('Se requiere el usuario');
    await expect(fetchHistory('u1', 0)).rejects.toThrow('entero positivo');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('fetchCurrentUserHistory returns no rows when no user is signed in', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(fetchCurrentUserHistory()).resolves.toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('fetchHistoryDetail rejects errors and requires a session id', async () => {
    const error = { message: 'query failed' };
    supabase.from.mockReturnValue(mockQuery({ data: null, error }));
    await expect(fetchHistoryDetail('s1')).rejects.toEqual(error);
    await expect(fetchHistoryDetail('')).rejects.toThrow('Se requiere la sesión');
  });

  test('fetchHistoryDetail returns an empty list when the session has no sets', async () => {
    const query = mockQuery({ data: null, error: null });
    supabase.from.mockReturnValue(query);
    await expect(fetchHistoryDetail('s1')).resolves.toEqual([]);
    expect(query.eq).toHaveBeenCalledWith('session_id', 's1');
  });

  test('deleteHistorySession deletes the requested session and surfaces errors', async () => {
    const successQuery = mockQuery({ error: null });
    supabase.from.mockReturnValue(successQuery);
    await expect(deleteHistorySession('s1')).resolves.toBeUndefined();
    expect(successQuery.eq).toHaveBeenCalledWith('id', 's1');

    const error = { message: 'delete failed' };
    supabase.from.mockReturnValue(mockQuery({ error }));
    await expect(deleteHistorySession('s1')).rejects.toEqual(error);
  });
});
