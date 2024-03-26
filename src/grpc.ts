import { loadSync, PackageDefinition } from '@grpc/proto-loader';
import * as grpcLibrary from '@grpc/grpc-js';

import { featureflags } from '../protostub/proto';

import { getCurrentPath, promisify } from './utils';

import FeatureFlags = featureflags.service.FeatureFlags;
import ExchangeRequest = featureflags.service.ExchangeRequest;
import IExchangeRequest = featureflags.service.IExchangeRequest;
import IExchangeReply = featureflags.service.IExchangeReply;

const initConnectionWaitTimeMs: number = 3000;

export class FeatureGrpcClient {
  private readonly grpcServerUrl: string;
  private grpcFlagsClient: FeatureFlags;
  private initConnectionFailed: Boolean;

  constructor(url: string) {
    if (!url) throw new Error('You should provide correct grpc url');

    this.grpcServerUrl = url;
    this.initConnectionFailed = false;
  }

  public createClient() {
    // be sure to use relative path, absolute path will changed on packege install
    // personal advise, dont ever touch it, some deep dark magic in .proto imports
    // same about .proto files, dir structure
    const packageDefinition: PackageDefinition = loadSync(
      getCurrentPath('../protobuf/featureflags/protobuf/service.proto'),
      { includeDirs: [getCurrentPath('../protobuf')] },
    );
    // "any" used, coz of wrong defined types in @grpc/grpc-js, remove when possible
    const packegaObj: any = grpcLibrary.loadPackageDefinition(packageDefinition);

    // client should contain all service methods from main proto
    const serviceClient = new packegaObj.featureflags.service.FeatureFlags(
      this.grpcServerUrl,
      grpcLibrary.credentials.createInsecure(),
    );

    // when grpc client cant reach server, connection hangs out
    // and block main app start up or base flow, we should prevent that case
    // by closing connection, and let app continue with default values
    return new Promise((resolve, reject) => {
      const currentStartTime = new Date().getTime();
      serviceClient.waitForReady(currentStartTime + initConnectionWaitTimeMs, (err: Error) => {
        if (err) {
          this.initConnectionFailed = true;
          reject(err);
          serviceClient.close();
        } else {
          this.grpcFlagsClient = serviceClient;
          resolve(serviceClient);
        }
      });
    });
  }

  public callExchange(msgBody: IExchangeRequest): Promise<IExchangeReply> {
    if (!this.grpcFlagsClient) throw new Error('GRPC client failed to init');
    if (this.initConnectionFailed) throw new Error('GRPC connection hang out');

    const exchangeRequest = ExchangeRequest.create(msgBody);

    return promisify(this.grpcFlagsClient.exchange.bind(this.grpcFlagsClient, exchangeRequest));
  }
}
