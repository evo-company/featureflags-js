import { FeatureGrpcClient } from './grpc';
import { StoreController } from './store';
import { IDictionary } from './types';

import { featureflags, google } from '../protostub/proto';
import _Variable = featureflags.graph.Variable;
import Timestamp = google.protobuf.Timestamp;

export class Types {
  public static STRING = _Variable.Type.STRING;
  public static NUMBER = _Variable.Type.NUMBER;
  public static TIMESTAMP = _Variable.Type.TIMESTAMP;
  public static SET = _Variable.Type.SET;
}

export class Variable {
  public name: string;
  public type: _Variable.Type;

  constructor(name: string, type: _Variable.Type) {
    this.name = name;
    this.type = type;
  }
}

const FIVE_MINUTES = 60 * 5 * 1000;

export class FeatureClient {
  private grpcClient: FeatureGrpcClient;

  private readonly store: StoreController;
  private readonly defaultFlags: IDictionary<boolean>;
  private readonly grpcUrl: string;

  private stopLoop: boolean = false;

  private minute: number = 60 * 1000;
  private retryStep: number = this.minute;
  private loopInterval: number = 0;

  private maxRetry: number = 32;
  private retries: number = 0;

  private firstLaunch: boolean = true;

  public static instance: FeatureClient;

  public isDebug: boolean = false;
  public interval: number = FIVE_MINUTES;

  constructor(
    project: string,
    grpcUrl: string,
    defaultFlags: IDictionary<boolean>,
    variables: Variable[],
    isDebugg: boolean = false,
    interval: number = FIVE_MINUTES,
  ) {
    if (FeatureClient.instance) return FeatureClient.instance;

    if (!project) throw new Error('Project name, cant be empty');

    this.defaultFlags = defaultFlags;

    this.store = new StoreController(project, variables);
    FeatureClient.instance = this;

    this.isDebug = isDebugg;
    this.grpcUrl = grpcUrl;
    this.interval = interval;
  }

  private async exchangeLoop() {
    const _exchangeLoop = (resolve = (): any => void 0, reject = (e: any): any => void e) => {
      setTimeout(async () => {
        this.isDebug && console.log('Exchange task started');

        const timeMS = Date.now();
        const timestamp = new Timestamp({
          seconds: timeMS / 1000,
          nanos: (timeMS % 1000) * 1e6,
        });

        // it`s temporary mock, until StatsController realisation, as mansioned in todo
        const flagsUsage = Object.keys(this.defaultFlags).map((flagRef) => ({
          name: flagRef,
          // google.protobuf.ITimestamp
          interval: timestamp,
          negativeCount: 0,
          positiveCount: 0,
        }));

        const request = this.store.getRequest(flagsUsage);
        this.isDebug && console.log(`Exchange request: `, request);
        try {
          const reply = await this.grpcClient.callExchange(request);
          this.isDebug && console.log(`Exchange reply: `, reply);
          this.store.applyReply(reply);

          this.retries = 0;
          this.loopInterval = this.interval;
        } catch (e) {
          if (this.retries <= this.maxRetry) {
            this.loopInterval = this.loopInterval + this.retryStep;
            console.log(`Failed to exchange: ${e}, retry in ${this.loopInterval} mls`);
            this.isDebug && console.log(e.stack);
            this.retries++;
            reject(e);
          } else this.stopLoop = true;
        }

        if (this.firstLaunch) {
          resolve();
          this.firstLaunch = false;
          this.loopInterval = this.interval;
        }

        this.isDebug && console.log(`Exchange complete, next will be in ${this.loopInterval} mls`);
        !this.stopLoop && _exchangeLoop();
      }, this.loopInterval);
    };

    // @ts-expect-error FIXME
    return new Promise((resolve, reject) => _exchangeLoop(resolve, reject));
  }

  public async start() {
    if (!this.firstLaunch) throw new Error('U can`t launch more then one update loop');

    this.grpcClient = new FeatureGrpcClient(this.grpcUrl);
    await this.grpcClient.createClient();

    await this.exchangeLoop();
  }

  public stop() {
    if (this.stopLoop) throw new Error('Exchange loop is already stopped');
    this.stopLoop = true;
  }

  public flags(ctx: object = {}) {
    const flags: IDictionary<boolean> = {};

    Object.keys(this.defaultFlags).forEach((flagRef: string) => {
      const check = this.store.getCheck(flagRef);

      let result = check && check(ctx);

      if (typeof result == 'undefined') {
        result = this.defaultFlags[flagRef];
      }

      flags[flagRef] = result;
    });

    return flags;
  }
}
