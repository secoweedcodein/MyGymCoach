import { supabase } from '../../lib/supabase';
import { deleteAdminTrend, listAdminTrends, updateAdminTrend } from '../adminService';

jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

function mockQuery(result) {
  const query = {};
  ['select', 'order', 'delete', 'update', 'eq'].forEach((method) => {
    query[method] = jest.fn(() => query);
  });
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  supabase.from.mockReturnValue(query);
  return query;
}

describe('adminService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('lists trends in position order', async () => {
    const rows = [{ id: 'trend-1', position: 1 }];
    const query = mockQuery({ data: rows, error: null });

    await expect(listAdminTrends()).resolves.toBe(rows);
    expect(supabase.from).toHaveBeenCalledWith('trends');
    expect(query.order).toHaveBeenCalledWith('position', { ascending: true });
  });

  test('updates and deletes trends through the service', async () => {
    const query = mockQuery({ error: null });
    await updateAdminTrend('trend-1', { is_active: false });
    expect(query.update).toHaveBeenCalledWith({ is_active: false });
    expect(query.eq).toHaveBeenCalledWith('id', 'trend-1');

    mockQuery({ error: null });
    await expect(deleteAdminTrend('trend-1')).resolves.toBeUndefined();
    expect(supabase.from).toHaveBeenCalledWith('trends');
  });

  test('propagates failed admin requests', async () => {
    const error = { message: 'forbidden' };
    mockQuery({ data: null, error });

    await expect(listAdminTrends()).rejects.toEqual(error);
  });
});
