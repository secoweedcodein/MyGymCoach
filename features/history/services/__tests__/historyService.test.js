import { fetchHistory, fetchHistoryDetail } from '../historyService';
import { supabase } from '../../../../lib/supabase';

jest.mock('../../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('historyService', () => {
  beforeEach(() => jest.clearAllMocks());
  test('fetchHistory returns [] on null', async () => {
    const mockLimit = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    supabase.from.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: mockEq }) });
    const res = await fetchHistory('u1');
    expect(res).toEqual([]);
  });
});
