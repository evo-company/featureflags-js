import { FeatureHttpClient } from './http';
import { StoreController } from './store';
import { IDictionary } from './types';
import { logger } from '@evo/logevo';
import { Variable, FIVE_MINUTES, ONE_MINUTE, DEFAULT_TIMEOUT } from './variables';

export { Types, Variable } from './variables';

export class FeatureClient {
  private httpClient!: FeatureHttpClient;

  private readonly store!: StoreController;
  private readonly defaultFlags!: IDictionary<boolean>;
  private readonly url!: string;
  private readonly isDebug!: boolean;
  private readonly timeout!: number;

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
    timeout: number = DEFAULT_TIMEOUT,
  ) {
    if (FeatureClient.instance) return FeatureClient.instance;
    
    if (!project) throw new Error('Project name, cant be empty');

    this.defaultFlags = defaultFlags;
    this.isDebug = isDebugg;
    this.timeout = timeout;

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
          // Use callSync for cyclic synchronization
          const reply = await this.httpClient.callSync(request);
          this.store.applyReply(reply);

          this.retries = 0;
        } catch (e) {
          if (this.retries < this.maxRetry) {
            this.retries++;
            const nextRetryInterval = this.retries * this.retryStep;
            this.isDebug && logger.warn(`[FeatureFlags] Connection failed, retry in ${nextRetryInterval / 1000}s (attempt ${this.retries}/${this.maxRetry})`);
            reject && reject(e as Error);
          } else {
            this.isDebug && logger.error(`[FeatureFlags] Max retries reached. Stopped.`);
            this.stopLoop = true;
          }
        }

        if (this.firstLaunch) {
          resolve && resolve();
          this.firstLaunch = false;
          
          this.isDebug && logger.debug(`[FeatureFlags] Next sync in ${this.interval / 1000}s`);
        }

        !this.stopLoop && _exchangeLoop();
      }, currentInterval);
    };

    return new Promise<void>((resolve, reject) => _exchangeLoop(resolve, reject));
  }

  public async start() {
    if (!this.firstLaunch) throw new Error('U can`t launch more then one update loop');

    this.httpClient = new FeatureHttpClient(this.url, this.timeout);

    if (this.isDebug) {
      logger.debug(`[FeatureFlags] Client starting...`);
      logger.debug(`[FeatureFlags] URL: ${this.url}`);
      logger.debug(`[FeatureFlags] Flags: ${Object.keys(this.defaultFlags).join(', ')}`);
      logger.debug(`[FeatureFlags] Update interval: ${this.interval / 1000}s`);
      logger.debug(`[FeatureFlags] Timeout: ${this.timeout / 1000}s`);
    }

    // Initial load via /load
    const flagsUsage = Object.keys(this.defaultFlags);
    const request = this.store.getRequest(flagsUsage);
    
    try {
      this.isDebug && logger.debug(`[FeatureFlags] Initial load...`);
      const reply = await this.httpClient.callLoad(request);
      this.store.applyReply(reply);
      this.isDebug && logger.debug(`[FeatureFlags] Initial load successful`);
    } catch (e) {
      this.isDebug && logger.error(`[FeatureFlags] Initial load failed: ${(e as Error).message}`);
      throw e;
    }

    // Start cyclic synchronization via /sync
    await this.exchangeLoop();
  }

  public stop() {
    if (this.stopLoop) throw new Error('Exchange loop is already stopped');
    this.stopLoop = true;
  }

  public flag(flagName: string, ctx: any = {}): boolean {
    this.isDebug && logger.debug(`[FeatureFlags] Getting flag "${flagName}" with context:`, ctx);

    if (!(flagName in this.defaultFlags)) {
      throw new Error(`Flag "${flagName}" is not registered in default flags`);
    }

    const check = this.store.getCheck(flagName);
    const result = check ? check(ctx) : this.defaultFlags[flagName];

    if (this.isDebug) {
      logger.debug(`   ${result} ${flagName}`);
    }

    return result;
  }

  public flags(ctx: any) {
    const flags: IDictionary<boolean> = {};

    this.isDebug && logger.debug('[FeatureFlags] Getting flags with context:', ctx);

    Object.keys(this.defaultFlags).forEach((flagRef: string) => {
      const check = this.store.getCheck(flagRef);
      const result = check ? check(ctx) : this.defaultFlags[flagRef];
      
      flags[flagRef] = result;

      if (this.isDebug) {
        logger.debug(`   ${result} ${flagRef}`);
      }
    });

    return flags;
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
