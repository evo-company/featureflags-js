import { featureflags } from '../protostub/proto';
import Variable = featureflags.graph.Variable;

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

export type VarTypes =
  | Variable.Type.STRING
  | Variable.Type.NUMBER
  | Variable.Type.TIMESTAMP
  | Variable.Type.SET;
