import { FeatureClient, Variable, Types } from '../src/client';

global.fetch = jest.fn();

describe('FeatureClient start behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (FeatureClient as any).instance = undefined;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves start after initial load without waiting first sync interval', async () => {
    jest.useFakeTimers();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ version: 1, flags: [] }),
    });

    const client = new FeatureClient(
      'test-project',
      'http://localhost:3000',
      { TEST: false },
      [new Variable('user.ip', Types.STRING)],
      false,
      5 * 60 * 1000,
    );

    const startPromise = client.start();

    // Allow initial /load request and related microtasks to finish.
    await Promise.resolve();
    await Promise.resolve();
    await startPromise;

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/flags/load',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
