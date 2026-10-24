// features/workout/services/__tests__/workoutQueueProcessor.test.js
const mockGetQueue = jest.fn();
const mockUpdateQueueItem = jest.fn();
const mockRemoveQueueItem = jest.fn();
const mockSyncMutation = jest.fn();

function loadProcessor() {
  jest.doMock('../../../../services/offline/mutationQueueService', () => ({
    getQueue: mockGetQueue,
    updateQueueItem: mockUpdateQueueItem,
    removeQueueItem: mockRemoveQueueItem,
    getRetryDelayMs: () => 1000,
    isRetryableError: () => true,
  }));
  jest.doMock('../workoutSyncService', () => ({ syncMutation: mockSyncMutation }));
  // eslint-disable-next-line global-require
  return require('../workoutQueueProcessor');
}

async function flushMicrotasks(times = 10) {
  for (let i = 0; i < times; i += 1) await Promise.resolve();
}

describe('workoutQueueProcessor', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockUpdateQueueItem.mockResolvedValue({});
    mockRemoveQueueItem.mockResolvedValue(undefined);
    mockSyncMutation.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('reprograma un reintento futuro aunque ahora no haya nada que procesar', async () => {
    jest.useFakeTimers();
    mockGetQueue.mockResolvedValue([
      {
        id: 'a',
        type: 'finish_session',
        state: 'failed',
        permanent: false,
        attempts: 1,
        nextRetryAt: new Date(Date.now() + 60_000).toISOString(),
      },
    ]);

    const { processQueue } = loadProcessor();
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const res = await processQueue('user-1', {});

    // No había candidatos "due", pero debe quedar programado el reintento.
    expect(res.processed).toBe(0);
    expect(mockSyncMutation).not.toHaveBeenCalled();
    expect(setTimeoutSpy).toHaveBeenCalled();
  });

  test('marca deferred y reprocesa si llega un ítem durante el procesado', async () => {
    jest.useFakeTimers();
    mockGetQueue.mockResolvedValue([
      { id: 'a', type: 'finish_session', state: 'pending', attempts: 0, permanent: false },
    ]);
    let resolveSync;
    mockSyncMutation.mockImplementation(() => new Promise((r) => { resolveSync = r; }));

    const { processQueue } = loadProcessor();
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

    const first = processQueue('user-1', {});
    await flushMicrotasks();
    expect(resolveSync).toBeDefined();

    const second = await processQueue('user-1', {});
    expect(second).toEqual(expect.objectContaining({ deferred: true }));

    resolveSync({ ok: true });
    await first;

    // El finally debe haber reprogramado una pasada inmediata (delay 0).
    expect(setTimeoutSpy).toHaveBeenCalled();
  });
});
