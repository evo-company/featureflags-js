import axios, { AxiosInstance } from 'axios';

export class FeatureHttpClient {
  private readonly httpClient: AxiosInstance;

  constructor(baseURL: string) {
    if (!baseURL) throw new Error('You should provide a valid base URL');

    this.httpClient = axios.create({
      baseURL: `${baseURL}/flags/load`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 3000,
    });
  }

  public formatPayload(payload:any):any{
    return {
      project: payload.project || "default_project", // Задайте значення за замовчуванням, якщо потрібно
      version: payload.version || 0, // Задайте значення за замовчуванням, якщо потрібно
      variables: payload.variables || [], // Переконайтеся, що це масив
      flags: payload.flags || [], // Переконайтеся, що це масив
      values: [], // Задайте значення за замовчуванням
    };
  }

  public async callExchange(payload: any): Promise<any> {
    const formattedPayload = this.formatPayload(payload);
    
    try {
      const response = await this.httpClient.post<any>('', formattedPayload);
      return response.data;
    } catch (error) {
      const err = error as any;
      if (err.code === 'ECONNREFUSED') {
        throw new Error(`Failed to connect to feature flags server. Is it running?`);
      } else if (err.code === 'ECONNABORTED') {
        throw new Error(`Failed to connect before the deadline`);
      } else if (err.response) {
        throw new Error(`Server responded with error: ${err.response.status} ${err.response.statusText}`);
      } else {
        throw new Error(`HTTP request failed: ${err.message}`);
      }
    }
  }
}