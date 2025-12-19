import { FeatureHttpClient } from './http';
import { StoreController } from './store';
import { IDictionary } from './types';
import { log } from './logger';
import { Variable, FIVE_MINUTES, ONE_MINUTE } from './variables';
import { normalizeContext } from './utils';

export { Types, Variable } from './variables';

export class FeatureClient {
  private httpClient!: FeatureHttpClient;

  private readonly store!: StoreController;
  private readonly defaultFlags!: IDictionary<boolean>;
  private readonly url!: string;
  private readonly isDebug!: boolean;

  private stopLoop: boolean = false;

  private retryStep: number = ONE_MINUTE;

  private maxRetry: number = 32;
  private retries: number = 0;

  private firstLaunch: boolean = true;

  public static instance: FeatureClient;

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
    this.isDebug = isDebugg;

    this.store = new StoreController(project, variables);
    FeatureClient.instance = this;

    this.url = url;
    this.interval = interval;

  }

  private async exchangeLoop() {
    const _exchangeLoop = (resolve?: () => void, reject?: (e: Error) => void) => {
      const retryInterval = this.retries * this.retryStep;
      const currentInterval = this.retries > 0 ? retryInterval : this.interval;
      
      setTimeout(async () => {
        const flagsUsage = Object.keys(this.defaultFlags);
        const request = this.store.getRequest(flagsUsage);

        try {
          const reply = await this.httpClient.callExchange(request);
          this.store.applyReply(reply);

          this.retries = 0;
        } catch (e) {
          if (this.retries < this.maxRetry) {
            this.retries++;
            const nextRetryInterval = this.retries * this.retryStep;
            this.isDebug && log('WARNING', `⚠️  [FeatureFlags] Connection failed, retry in ${nextRetryInterval / 1000}s (attempt ${this.retries}/${this.maxRetry})`);
            reject && reject(e as Error);
          } else {
            this.isDebug && log('ERROR', `❌ [FeatureFlags] Max retries reached. Stopped.`);
            this.stopLoop = true;
          }
        }

        if (this.firstLaunch) {
          resolve && resolve();
          this.firstLaunch = false;
          
          this.isDebug && log('INFO', `⏱️  [FeatureFlags] Next sync in ${this.interval / 1000}s`);
        }

        !this.stopLoop && _exchangeLoop();
      }, currentInterval);
    };

    return new Promise<void>((resolve, reject) => _exchangeLoop(resolve, reject));
  }

  public async start() {
    if (!this.firstLaunch) throw new Error('U can`t launch more then one update loop');

    this.httpClient = new FeatureHttpClient(this.url);

    if (this.isDebug) {
      log('INFO', `🚀 [FeatureFlags] Client starting...`);
      log('INFO', `ℹ️  [FeatureFlags] URL: ${this.url}`);
      log('INFO', `ℹ️  [FeatureFlags] Flags: ${Object.keys(this.defaultFlags).join(', ')}`);
      log('INFO', `ℹ️  [FeatureFlags] Update interval: ${this.interval / 1000}s`);
    }

    await this.exchangeLoop();
  }

  public stop() {
    if (this.stopLoop) throw new Error('Exchange loop is already stopped');
    this.stopLoop = true;
  }

  public flag(flagName: string, ctx: any = {}): boolean {
    const normalizedCtx = normalizeContext(ctx);

    this.isDebug && log('INFO', `🎯 [FeatureFlags] Getting flag "${flagName}" with context:`, normalizedCtx);

    if (!(flagName in this.defaultFlags)) {
      throw new Error(`Flag "${flagName}" is not registered in default flags`);
    }

    const check = this.store.getCheck(flagName);
    const result = check ? check(normalizedCtx) : this.defaultFlags[flagName];

    if (this.isDebug) {
      const emoji = result ? '✅' : '❌';
      log('INFO', `   ${emoji} ${flagName}`);
    }

    return result;
  }

  public flags(ctx: any) {
    const flags: IDictionary<boolean> = {};
    const normalizedCtx = normalizeContext(ctx);

    this.isDebug && log('INFO', '🎯 [FeatureFlags] Getting flags with context:', normalizedCtx);

    Object.keys(this.defaultFlags).forEach((flagRef: string) => {
      const check = this.store.getCheck(flagRef);
      const result = check ? check(normalizedCtx) : this.defaultFlags[flagRef];
      
      flags[flagRef] = result;

      if (this.isDebug) {
        const emoji = flags[flagRef] ? '✅' : '❌';
        log('INFO', `   ${emoji} ${flagRef}`);
      }
    });

    return flags;
  }

  public async callExchange(payload: any): Promise<any> {
    try {
      const response = await this.httpClient.callExchange(payload);
      return response;
    } catch (error) {
      console.log('HTTP request failed or unexpected error occurred client');
    }
  }
}

export function getFlags(ctx: object = {}) {
  if (!FeatureClient.instance) throw new Error('You should init FeatureClient, before use');
  return FeatureClient.instance.flags(ctx);
}

export function getFlag(flagName: string, ctx: object = {}): boolean {
  if (!FeatureClient.instance) throw new Error('You should init FeatureClient, before use');
  return FeatureClient.instance.flag(flagName, ctx);
}
