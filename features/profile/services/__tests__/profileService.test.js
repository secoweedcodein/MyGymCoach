import { fetchUserProfile, upsertUserProfile } from '../profileService';
import { supabase } from '../../../../lib/supabase';

jest.mock('../../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('profileService', () => {
  beforeEach(() => jest.clearAllMocks());
  test('fetchUserProfile returns null on PGRST116', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    supabase.from.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: mockEq }) });
    const res = await fetchUserProfile('u1');
    expect(res).toBeNull();
  });
});
