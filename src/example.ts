import { FeatureClient, Variable, Types, getFlags, getFlag, FlagContext, ILogger } from './index';

// Default Flags
export const Flags = {
  TEST_FEATURE: false,
  NODE_MONITORING: false,
  NEW_API_ENDPOINT: false,
  ENABLE_CACHE: false,
};

export type tFlagsService = Partial<typeof Flags>;

// Dictionary of variables for feature flags
export const FlagsVariables = {
  UserIp: 'user.ip',
  UserId: 'user.id',
  Username: 'user.username',
};

// Helper function to get specific flag
export const useFlag = (flag: keyof tFlagsService, ctx: FlagContext = {}): boolean | undefined => {
  return getFlags(ctx)[flag];
};

// Variables for checking conditions
const UserIp = new Variable(FlagsVariables.UserIp, Types.STRING);
const UserId = new Variable(FlagsVariables.UserId, Types.NUMBER);
const Username = new Variable(FlagsVariables.Username, Types.STRING);

// Configuration (in production this will be from config file)
interface Config {
  appName: string;
  backendUrl: string;
  isDebug?: boolean;
  interval?: number;     
  timeout?: number;       
  logger?: ILogger;
}

export const initFlags = async (config: Config) => {
  const ffClient = new FeatureClient(
    config.appName,
    config.backendUrl,
    Flags,
    [UserIp, UserId, Username],
    config.isDebug || false,
    config.interval,        // Optional: custom sync interval
    config.timeout,         // Optional: custom request timeout
    config.logger,          // Optional: custom logger (e.g. logevo)
  );

  try {
    await ffClient.start();
    console.info('[FeatureFlags] Client started successfully');
  } catch (e) {
    console.error(
      `[FeatureFlags] Error at startup. Application will use default flags: ${e}`,
    );
    throw e; // Re-throw if you want to prevent app from starting
  }

  return ffClient;
};

// Example configuration
const config: Config = {
  appName: 'vchasno',
  backendUrl: 'http://localhost:3000',
  isDebug: true,
  interval: 5 * 60 * 1000,  // 5 minutes
  timeout: 10000,            // 10 seconds
  // logger: logger,         // Optional: pass logevo or custom logger
};

// Initialize and use
initFlags(config).then(() => {
  console.log('[FeatureFlags] Initialization complete');
  
  // Example 1: Get all flags with context
  const context: FlagContext = {
    'user.ip': '192.168.97.5',
    'user.id': 12345,
    'user.username': 'john.doe',
  };
  
  const flags = getFlags(context);
  console.log('All flags:', flags);
  
  // Example 2: Get single flag
  const isTestEnabled = getFlag('TEST_FEATURE', context);
  console.log('TEST_FEATURE enabled:', isTestEnabled);
  
  // Example 3: Use helper function
  const isCacheEnabled = useFlag('ENABLE_CACHE', context);
  console.log('ENABLE_CACHE enabled:', isCacheEnabled);
  
  // Example 4: Use flags in your application logic
  if (flags.NEW_API_ENDPOINT) {
    console.log('Using new API endpoint');
  } else {
    console.log('Using legacy API endpoint');
  }
}).catch((error) => {
  console.error('[FeatureFlags] Failed to initialize:', error);
  process.exit(1);
});
