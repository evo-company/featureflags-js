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
    try {
      const response = await this.httpClient.post<any>('', this.formatPayload(payload));
      return response.data;
    } catch (error) {
      console.log('HTTP request failed or unexpected error occurred http');
    }
  }
}