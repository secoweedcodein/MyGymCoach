import { fetchUserRoutines, fetchRoutineExercises, getCurrentUser, createRoutine, updateRoutine, deleteRoutine, saveRoutineWithExercisesAtomic } from '../routinesService';
import { supabase } from '../../../../lib/supabase';

jest.mock('../../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: { getUser: jest.fn() },
  },
}));

describe('routinesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetchUserRoutines returns data', async () => {
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
    supabase.from.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: mockEq }) });
    mockEq.mockReturnValue({ order: mockOrder });
    const res = await fetchUserRoutines('u1');
    expect(res).toEqual([{ id: '1' }]);
  });

  test('fetchUserRoutines throws on error', async () => {
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({ data: null, error: { message: 'err' } });
    supabase.from.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: mockEq }) });
    mockEq.mockReturnValue({ order: mockOrder });
    await expect(fetchUserRoutines('u1')).rejects.toEqual({ message: 'err' });
  });

  test('fetchRoutineExercises returns ordered data', async () => {
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({ data: [{ position: 0 }], error: null });
    supabase.from.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: mockEq }) });
    mockEq.mockReturnValue({ order: mockOrder });
    const res = await fetchRoutineExercises('r1');
    expect(res).toEqual([{ position: 0 }]);
  });

  test('getCurrentUser returns user', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const user = await getCurrentUser();
    expect(user.id).toBe('u1');
  });

  test('createRoutine inserts and returns data', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: { id: 'r1' }, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    supabase.from.mockReturnValue({ insert: jest.fn().mockReturnValue({ select: mockSelect }) });
    const res = await createRoutine('u1', { name: 'Push', exerciseIds: ['e1'] });
    expect(res.id).toBe('r1');
  });

  test('deleteRoutine calls delete eq', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ delete: jest.fn().mockReturnValue({ eq: mockEq }) });
    await deleteRoutine('r1');
    expect(supabase.from).toHaveBeenCalledWith('routines');
  });

  test('saveRoutineWithExercisesAtomic calls rpc', async () => {
    supabase.rpc.mockResolvedValue({ data: { routine_id: 'r1' }, error: null });
    const res = await saveRoutineWithExercisesAtomic({ routineId: null, userId: 'u1', name: 'Push', exerciseIds: [], exercises: [] });
    expect(supabase.rpc).toHaveBeenCalled();
    expect(res.routine_id).toBe('r1');
  });
});
