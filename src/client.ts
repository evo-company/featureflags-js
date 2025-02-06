import { FeatureHttpClient } from './http';
import { StoreController } from './store';
import { IDictionary } from './types';

// import Timestamp = google.protobuf.Timestamp;

// export class Types {
//   public static STRING = _Variable.Type.STRING;
//   public static NUMBER = _Variable.Type.NUMBER;
//   public static TIMESTAMP = _Variable.Type.TIMESTAMP;
//   public static SET = _Variable.Type.SET;
// }

export class Variable {
  public name: string;
  public type: any;

  constructor(name: string, type: any) {
    this.name = name;
    this.type = type;
  }
}

const FIVE_MINUTES = 60 * 1 * 1000;

export class FeatureClient {
  private grpcClient: FeatureHttpClient;

  private readonly store: StoreController;
  private readonly defaultFlags: IDictionary<boolean>;
  private readonly url: string;

  private stopLoop: boolean = false;

  private minute: number = 60 * 1000;
  private retryStep: number = this.minute;
  private loopInterval: number = 0;

  private maxRetry: number = 32;
  private retries: number = 0;

  private firstLaunch: boolean = true;

  public static instance: FeatureClient;

  public isDebugg: boolean = false;
  public interval: number = FIVE_MINUTES;

  constructor(
    project: string,
    url: string,
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

    this.isDebugg = isDebugg;
    this.url = url;
    this.interval = interval;
  }

  private async exchangeLoop() {
    const _exchangeLoop = (resolve = (): any => void 0, reject = (e: Error): any => void e) => {
      setTimeout(async () => {
        this.isDebugg && console.log('Exchange task started');

        // Формування запиту на основі флагів
        const flagsUsage = Object.keys(this.defaultFlags);
        const request = this.store.getRequest(flagsUsage);
        this.isDebugg && console.log(`Exchange request: `, request);

        try {
          const reply = await this.grpcClient.callExchange(request);
          this.isDebugg && console.log(`Exchange reply: `, reply);
          this.store.applyReply(reply);

          this.retries = 0;
          this.loopInterval = this.interval;
        } catch (e) {
          if (this.retries < this.maxRetry) {
            this.loopInterval += this.retryStep;
            console.log(`Failed to exchange: ${e}, retry in ${this.loopInterval} ms`);
            this.isDebugg && console.log(e.stack);
            this.retries++;
            reject(e);
          } else {
            this.stopLoop = true;
          }
        }

        if (this.firstLaunch) {
          resolve();
          this.firstLaunch = false;
          this.loopInterval = this.interval;
        }

        !this.stopLoop && _exchangeLoop();
      }, this.loopInterval);
    };

    return new Promise((resolve, reject) => _exchangeLoop(resolve, reject));
  }

  public async start() {
    if (!this.firstLaunch) throw new Error('U can`t launch more then one update loop');

    this.grpcClient = new FeatureHttpClient(this.url);

    await this.exchangeLoop();
  }

  public stop() {
    if (this.stopLoop) throw new Error('Exchange loop is already stopped');
    this.stopLoop = true;
  }

  public flags(ctx: any) {
    const flags: IDictionary<boolean> = {};

    Object.keys(this.defaultFlags).forEach((flagRef: string) => {
      const check = this.store.getCheck(flagRef);

      const result = check(ctx);

      if (typeof check == 'undefined') {
        flags[flagRef] = this.defaultFlags[flagRef];
      } else {
        flags[flagRef] = result;
      }
    });

    return flags;
  }

  public async callExchange(payload: any): Promise<any> {
    try {
      const response = await this.grpcClient.callExchange(payload);
      return response;
    } catch (error) {
      console.log('HTTP request failed or unexpected error occurred client');
    }
  }
}

export function getFlags(ctx: object = {}) {
  console.log('Getting flags with context:', ctx);
  if (!FeatureClient.instance) throw new Error('You should init FeatureClient, before use');
  return FeatureClient.instance.flags(ctx);
}
