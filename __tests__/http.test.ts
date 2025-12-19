import axios from 'axios';
import { FeatureHttpClient } from '../src/http';

// Mock axios manually
jest.mock('axios');

describe('FeatureHttpClient', () => {
  const baseURL = 'http://localhost:3000';
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Create mock axios instance
    mockAxiosInstance = {
      post: jest.fn(),
    };

    // Mock axios.create
    (axios.create as any) = jest.fn().mockReturnValue(mockAxiosInstance);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create HTTP client with correct parameters', () => {
      new FeatureHttpClient(baseURL);

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: `${baseURL}/flags/load`,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 3000,
      });
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

  describe('callExchange', () => {
    let httpClient: FeatureHttpClient;

    beforeEach(() => {
      httpClient = new FeatureHttpClient(baseURL);
    });

    it('should successfully call exchange and return data', async () => {
      const mockResponse = {
        data: {
          version: 10,
          result: { flags: [] },
        },
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const payload = {
        project: 'test',
        version: 5,
        variables: [],
        flags: ['FLAG_1'],
      };

      const result = await httpClient.callExchange(payload);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('', {
        project: 'test',
        version: 5,
        variables: [],
        flags: ['FLAG_1'],
        values: [],
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error on ECONNREFUSED', async () => {
      const error = { code: 'ECONNREFUSED' };
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(httpClient.callExchange({})).rejects.toThrow(
        'Failed to connect to feature flags server. Is it running?'
      );
    });

    it('should throw error on ECONNABORTED (timeout)', async () => {
      const error = { code: 'ECONNABORTED' };
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(httpClient.callExchange({})).rejects.toThrow(
        'Failed to connect before the deadline'
      );
    });

    it('should throw error on server error response', async () => {
      const error = {
        response: {
          status: 422,
          statusText: 'Unprocessable Entity',
        },
      };
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(httpClient.callExchange({})).rejects.toThrow(
        'Server responded with error: 422 Unprocessable Entity'
      );
    });

    it('should throw general error for other errors', async () => {
      const error = { message: 'Network error' };
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(httpClient.callExchange({})).rejects.toThrow(
        'HTTP request failed: Network error'
      );
    });
  });
});
