export interface IDictionary<TValue> {
  [key: string]: TValue;
}

export interface IGrpcCallBack {
  (err: Object | null, response: Object): void;
}

export interface IGrpcClientCall {
  (callback: IGrpcCallBack): void;
}

export interface IFeatureClient {
  instance: IFeatureClient;
}

