import { resolve } from 'path';

import { IGrpcClientCall } from './types';

export function isString(value: any): boolean {
  return value && value.constructor.name === 'String';
}

export function getCurrentPath(path: string): string {
  return resolve(__dirname, path);
}

// i bet, u like this; same function from 'util', is totaly broken for Types in .ts
export function promisify<GrpcProtoResp>(func: IGrpcClientCall): Promise<GrpcProtoResp> {
  return new Promise((resolve, reject) => {
    func((err, respose) => {
      if (err === null) {
        resolve(<GrpcProtoResp>respose);
      } else {
        reject(err);
      }
    });
  });
}
