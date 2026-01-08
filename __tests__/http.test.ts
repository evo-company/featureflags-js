import { FeatureHttpClient } from '../src/http';

// Mock fetch globally
global.fetch = jest.fn();

describe('FeatureHttpClient', () => {
  const baseURL = 'http://localhost:3000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create HTTP client with correct parameters', () => {
      const client = new FeatureHttpClient(baseURL);
      expect(client).toBeInstanceOf(FeatureHttpClient);
    });

    it('should throw error if baseURL is not provided', () => {
      expect(() => new FeatureHttpClient('')).toThrow('You should provide a valid base URL');
    });
  });

  describe('formatPayload', () => {
    let httpClient: FeatureHttpClient;

    beforeEach(() => {
      httpClient = new FeatureHttpClient(baseURL);
    });

    it('should correctly format full payload', () => {
      const payload = {
        project: 'test-project',
        version: 5,
        variables: [{ name: 'user.ip', type: 1 }],
        flags: ['FLAG_1', 'FLAG_2'],
      };

      const result = httpClient.formatPayload(payload);

      expect(result).toEqual({
        project: 'test-project',
        version: 5,
        variables: [{ name: 'user.ip', type: 1 }],
        flags: ['FLAG_1', 'FLAG_2'],
        values: [],
      });
    });

    it('should use default values for missing fields', () => {
      const payload = {
        project: 'my-project',
      };

      const result = httpClient.formatPayload(payload);

      expect(result).toEqual({
        project: 'my-project',
        version: 0,
        variables: [],
        flags: [],
        values: [],
      });
    });
  });

  describe('callLoad', () => {
    let httpClient: FeatureHttpClient;

    beforeEach(() => {
      httpClient = new FeatureHttpClient(baseURL);
    });

    it('should successfully call /load endpoint and return data', async () => {
      const mockResponse = {
        version: 10,
        flags: [],
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const payload = {
        project: 'test',
        version: 5,
        variables: [],
        flags: ['FLAG_1'],
      };

      const result = await httpClient.callLoad(payload);

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseURL}/flags/load`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project: 'test',
            version: 5,
            variables: [],
            flags: ['FLAG_1'],
            values: [],
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on ECONNREFUSED', async () => {
      const error = new TypeError('fetch failed');
      Object.defineProperty(error, 'cause', {
        value: { code: 'ECONNREFUSED' },
      });
      (global.fetch as jest.Mock).mockRejectedValue(error);

      await expect(httpClient.callLoad({ project: 'test' })).rejects.toThrow(
        'Failed to connect to feature flags server (load). Is it running?'
      );
    });

    it('should throw error on timeout', async () => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      (global.fetch as jest.Mock).mockRejectedValue(error);

      await expect(httpClient.callLoad({ project: 'test' })).rejects.toThrow(
        'Failed to connect before the deadline (load)'
      );
    });

    it('should throw error on server error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
      });

      await expect(httpClient.callLoad({ project: 'test' })).rejects.toThrow(
        'Server responded with error (load): 422 Unprocessable Entity'
      );
    });

    it('should throw general error for other errors', async () => {
      const error = new Error('Network error');
      (global.fetch as jest.Mock).mockRejectedValue(error);

      await expect(httpClient.callLoad({ project: 'test' })).rejects.toThrow(
        'HTTP request failed (load): Network error'
      );
    });
  });

  describe('callSync', () => {
    let httpClient: FeatureHttpClient;

    beforeEach(() => {
      httpClient = new FeatureHttpClient(baseURL);
    });

    it('should successfully call /sync endpoint and return data', async () => {
      const mockResponse = {
        version: 10,
        flags: [],
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const payload = {
        project: 'test',
        version: 5,
        variables: [],
        flags: ['FLAG_1'],
      };

      const result = await httpClient.callSync(payload);

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseURL}/flags/sync`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project: 'test',
            version: 5,
            variables: [],
            flags: ['FLAG_1'],
            values: [],
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on connection failure', async () => {
      const error = new TypeError('fetch failed');
      (global.fetch as jest.Mock).mockRejectedValue(error);

      await expect(httpClient.callSync({ project: 'test' })).rejects.toThrow(
        'Failed to connect to feature flags server (sync). Is it running?'
      );
    });
  });
});
