import { FeatureHttpClient } from './http';
import { StoreController } from './store';
import { IDictionary, FlagContext, ILogger } from './types';
import { defaultLogger } from './logger';
import { Variable, FIVE_MINUTES, ONE_MINUTE, DEFAULT_TIMEOUT, MAX_RETRY_INTERVAL } from './variables';

export { Types, Variable } from './variables';

export interface FeatureClientOptions {
  isDebug?: boolean;
  interval?: number;
  timeout?: number;
  logger?: ILogger;
  maxExchangeRetries?: number;
}

export class FeatureClient {
  private httpClient: FeatureHttpClient | null = null;

  private store!: StoreController;
  private defaultFlags!: IDictionary<boolean>;
  private url!: string;
  private isDebug!: boolean;
  private timeout!: number;
  private logger!: ILogger;

  private stopLoop: boolean = false;

  private retryStep: number = ONE_MINUTE;

  private maxExchangeRetries: number = -1;
  private retries: number = 0;

  private isInitialized: boolean = false;
  private isStarting: boolean = false;

  public static instance: FeatureClient;

  public interval: number = FIVE_MINUTES;

  constructor(
    project: string,
    url: string,
    defaultFlags: IDictionary<boolean>,
    variables: Variable[],
    options: FeatureClientOptions = {},
  ) {
    if (FeatureClient.instance) return FeatureClient.instance;

    if (!project) throw new Error('Project name cannot be empty');

    const {
      isDebug = false,
      interval = FIVE_MINUTES,
      timeout = DEFAULT_TIMEOUT,
      logger = defaultLogger,
      maxExchangeRetries = -1,
    } = options;

    this.defaultFlags = defaultFlags;
    this.isDebug = isDebug;
    this.timeout = timeout;
    this.url = url;
    this.interval = interval;
    this.logger = logger;
    this.maxExchangeRetries = maxExchangeRetries;

    this.store = new StoreController(project, variables);
    FeatureClient.instance = this;
  }

  private exchangeLoop() {
    const retryInterval = Math.min(this.retries * this.retryStep, MAX_RETRY_INTERVAL);
    const currentInterval = this.retries > 0 ? retryInterval : this.interval;

    setTimeout(async () => {
      if (this.stopLoop) return;

      const flagsUsage = Object.keys(this.defaultFlags);
      const request = this.store.getRequest(flagsUsage);

      try {
        if (!this.httpClient) {
          throw new Error('HTTP client not initialized');
        }
        const reply = await this.httpClient.callSync(request);
        this.store.applyReply(reply);
        this.retries = 0;
      } catch (e) {
        const hasRetryLimit = this.maxExchangeRetries >= 0;
        if (!hasRetryLimit || this.retries < this.maxExchangeRetries) {
          this.retries++;
          const nextRetryInterval = this.retries * this.retryStep;
          const retriesLabel = hasRetryLimit ? this.maxExchangeRetries : 'infinite';
          this.logger.warn(`[FeatureFlags] Connection failed, retry in ${nextRetryInterval / 1000}s (attempt ${this.retries}/${retriesLabel})`);
        } else {
          this.logger.error(`[FeatureFlags] Max retries reached in exchangeLoop (${this.maxExchangeRetries}). Stopped.`);
          this.stopLoop = true;
        }
      }

      if (!this.stopLoop) {
        this.exchangeLoop();
      }
    }, currentInterval);
  }

  public async start() {
    if (this.isInitialized || this.isStarting) throw new Error('You cannot launch more than one update loop');

    this.isStarting = true;
    this.stopLoop = false;

    this.httpClient = new FeatureHttpClient(this.url, this.timeout);

    if (this.isDebug) {
      this.logger.debug(`[FeatureFlags] Client starting...`);
      this.logger.debug(`[FeatureFlags] URL: ${this.url}`);
      this.logger.debug(`[FeatureFlags] Flags: ${Object.keys(this.defaultFlags).join(', ')}`);
      this.logger.debug(`[FeatureFlags] Update interval: ${this.interval / 1000}s`);
      this.logger.debug(`[FeatureFlags] Timeout: ${this.timeout / 1000}s`);
      this.logger.debug(`[FeatureFlags] Max exchange retries: ${this.maxExchangeRetries < 0 ? 'infinite' : this.maxExchangeRetries}`);
    }

    // Initial load via /load
    const flagsUsage = Object.keys(this.defaultFlags);
    const request = this.store.getRequest(flagsUsage);

    try {
      this.isDebug && this.logger.debug(`[FeatureFlags] Initial load...`);
      const reply = await this.httpClient.callLoad(request);
      this.store.applyReply(reply);
      this.isDebug && this.logger.debug(`[FeatureFlags] Initial load successful`);
    } catch (e) {
      this.isStarting = false;
      this.httpClient = null;
      this.logger.error(`[FeatureFlags] Initial load failed: ${(e as Error).message}`);
      throw e;
    }

    // Start cyclic synchronization via /sync
    this.isInitialized = true;
    this.isStarting = false;
    this.isDebug && this.logger.debug(`[FeatureFlags] Sync loop initialized. Next sync in ${this.interval / 1000}s`);
    this.exchangeLoop();
  }

  public stop() {
    if (this.stopLoop) throw new Error('Exchange loop is already stopped');
    this.stopLoop = true;
  }

  public flag(flagName: string, ctx: FlagContext = {}): boolean {
    this.isDebug && this.logger.debug(`[FeatureFlags] Getting flag "${flagName}" with context:`, ctx);

    if (!(flagName in this.defaultFlags)) {
      throw new Error(`Flag "${flagName}" is not registered in default flags`);
    }

    const check = this.store.getCheck(flagName);
    const result = check ? check(ctx) : this.defaultFlags[flagName];

    if (this.isDebug) {
      this.logger.debug(`   ${result} ${flagName}`);
    }

    return result;
  }

  public flags(ctx: FlagContext = {}): IDictionary<boolean> {
    const flags: IDictionary<boolean> = {};

    this.isDebug && this.logger.debug('[FeatureFlags] Getting flags with context:', ctx);

    Object.keys(this.defaultFlags).forEach((flagRef: string) => {
      const check = this.store.getCheck(flagRef);
      const result = check ? check(ctx) : this.defaultFlags[flagRef];

      flags[flagRef] = result;

      if (this.isDebug) {
        this.logger.debug(`   ${result} ${flagRef}`);
      }
    });

    return flags;
  }
}

export function getFlags(ctx: FlagContext = {}): IDictionary<boolean> {
  if (!FeatureClient.instance) throw new Error('You should init FeatureClient, before use');
  return FeatureClient.instance.flags(ctx);
}

export function getFlag(flagName: string, ctx: FlagContext = {}): boolean {
  if (!FeatureClient.instance) throw new Error('You should init FeatureClient, before use');
  return FeatureClient.instance.flag(flagName, ctx);
}
