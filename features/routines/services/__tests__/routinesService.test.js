import {
  createRoutine,
  deleteRoutine,
  duplicateRoutineExercises,
  fetchRoutineExercises,
  fetchUserRoutines,
  getCurrentUser,
  saveRoutineWithExercisesAtomic,
  updateRoutine,
} from '../routinesService';
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

  test('fetchUserRoutines returns an empty array for null data', async () => {
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({ data: null, error: null });
    supabase.from.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: mockEq }) });
    mockEq.mockReturnValue({ order: mockOrder });
    await expect(fetchUserRoutines('u1')).resolves.toEqual([]);
  });

  test('fetchUserRoutines rejects an invalid user id', async () => {
    await expect(fetchUserRoutines('')).rejects.toThrow('Se requiere el usuario');
    expect(supabase.from).not.toHaveBeenCalled();
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

  test('createRoutine rejects invalid payloads without contacting Supabase', async () => {
    await expect(createRoutine('u1', { name: '  ' })).rejects.toThrow('Se requiere el nombre');
    await expect(createRoutine('u1', { name: 'Push', exerciseIds: 'e1' })).rejects.toThrow('lista');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('deleteRoutine calls delete eq', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ delete: jest.fn().mockReturnValue({ eq: mockEq }) });
    await deleteRoutine('r1');
    expect(supabase.from).toHaveBeenCalledWith('routines');
  });

  test('updateRoutine does not reset omitted fields', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    supabase.from.mockReturnValue({ update: mockUpdate });
    await updateRoutine('r1', { name: '  Pull  ' });
    expect(mockUpdate).toHaveBeenCalledWith({ name: 'Pull' });
  });

  test('updateRoutine rejects an empty patch', async () => {
    await expect(updateRoutine('r1', {})).rejects.toThrow('al menos un cambio');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('duplicateRoutineExercises returns zero without writing empty input', async () => {
    await expect(duplicateRoutineExercises('r1', [])).resolves.toBe(0);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('duplicateRoutineExercises rejects non-array input', async () => {
    await expect(duplicateRoutineExercises('r1', null)).rejects.toThrow('deben ser una lista');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('duplicateRoutineExercises assigns the new routine id and returns inserted count', async () => {
    const rows = [
      { position: 0, exercise_name: 'Press' },
      { position: 1, exercise_name: 'Fly' },
    ];
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });
    await expect(duplicateRoutineExercises('copy-id', rows)).resolves.toBe(2);
    expect(mockInsert).toHaveBeenCalledWith(rows.map((row) => ({ ...row, routine_id: 'copy-id' })));
  });

  test('duplicateRoutineExercises propagates insertion errors', async () => {
    const error = { message: 'insert failed' };
    supabase.from.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error }),
    });
    await expect(duplicateRoutineExercises('copy-id', [{ position: 0 }])).rejects.toEqual(error);
  });

  test('saveRoutineWithExercisesAtomic calls rpc', async () => {
    supabase.rpc.mockResolvedValue({ data: { routine_id: 'r1' }, error: null });
    const res = await saveRoutineWithExercisesAtomic({ routineId: null, userId: 'u1', name: 'Push', exerciseIds: [], exercises: [] });
    expect(supabase.rpc).toHaveBeenCalled();
    expect(res.routine_id).toBe('r1');
  });
});
