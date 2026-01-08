import axios, { AxiosInstance } from 'axios';
import { IFlagRequest, IFlagResponse } from './types';
import { DEFAULT_TIMEOUT } from './variables';

export class FeatureHttpClient {
  private readonly httpClient: AxiosInstance;

  constructor(baseURL: string, timeout: number = DEFAULT_TIMEOUT) {
    if (!baseURL) throw new Error('You should provide a valid base URL');

    this.httpClient = axios.create({
      baseURL: baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: timeout,
    });
  }

  public formatPayload(payload: IFlagRequest): Required<IFlagRequest> {
    return {
      project: payload.project,
      version: payload.version || 0,
      variables: payload.variables || [],
      flags: payload.flags || [],
      values: payload.values || [],
    };
  }

  /**
   * /load - called once on client initialization (client.start())
   */
  public async callLoad(payload: IFlagRequest): Promise<IFlagResponse> {
    const formattedPayload = this.formatPayload(payload);
    
    try {
      const response = await this.httpClient.post<IFlagResponse>('/flags/load', formattedPayload);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'load');
    }
  }

  /**
   * /sync - called in a loop for synchronization
   */
  public async callSync(payload: IFlagRequest): Promise<IFlagResponse> {
    const formattedPayload = this.formatPayload(payload);
    
    try {
      const response = await this.httpClient.post<IFlagResponse>('/flags/sync', formattedPayload);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'sync');
    }
  }

  private handleError(error: unknown, operation: string): Error {
    const err = error as any;
    if (err.code === 'ECONNREFUSED') {
      return new Error(`Failed to connect to feature flags server (${operation}). Is it running?`);
    } else if (err.code === 'ECONNABORTED') {
      return new Error(`Failed to connect before the deadline (${operation})`);
    } else if (err.response) {
      return new Error(`Server responded with error (${operation}): ${err.response.status} ${err.response.statusText}`);
    } else {
      return new Error(`HTTP request failed (${operation}): ${err.message}`);
    }
  }
}