import { IFlagRequest, IFlagResponse } from './types';
import { DEFAULT_TIMEOUT } from './variables';

export class FeatureHttpClient {
  private readonly baseURL: string;
  private readonly timeout: number;

  constructor(baseURL: string, timeout: number = DEFAULT_TIMEOUT) {
    if (!baseURL) throw new Error('You should provide a valid base URL');

    this.baseURL = baseURL;
    this.timeout = timeout;
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
    return this.makeRequest('/flags/load', payload, 'load');
  }

  /**
   * /sync - called in a loop for synchronization
   */
  public async callSync(payload: IFlagRequest): Promise<IFlagResponse> {
    return this.makeRequest('/flags/sync', payload, 'sync');
  }

  private async makeRequest(
    endpoint: string,
    payload: IFlagRequest,
    operation: string
  ): Promise<IFlagResponse> {
    const formattedPayload = this.formatPayload(payload);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server responded with error (${operation}): ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as IFlagResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.handleError(error, operation);
    }
  }

  private handleError(error: unknown, operation: string): Error {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new Error(`Failed to connect before the deadline (${operation})`);
      }
      
      // Check for connection refused (fetch will throw TypeError for network errors)
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        return new Error(`Failed to connect to feature flags server (${operation}). Is it running?`);
      }

      // Return the error as is if it already has a proper message
      if (error.message.startsWith('Server responded with error')) {
        return error;
      }

      return new Error(`HTTP request failed (${operation}): ${error.message}`);
    }
    
    return new Error(`HTTP request failed (${operation}): Unknown error`);
  }
}
