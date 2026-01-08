import { FeatureClient, Variable, Types, getFlags } from './index';

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
export const useFlag = (flag: keyof tFlagsService, ctx: any = {}): boolean | undefined => {
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
}

export const initFlags = async (config: Config) => {
  const ffClient = new FeatureClient(
    config.appName,
    config.backendUrl,
    Flags,
    [UserIp, UserId, Username],
    config.isDebug || false,
  );

  try {
    await ffClient.start();
    console.info(`Starting [featureFlags client]`);
  } catch (e) {
    console.error(
      `Error at FeatureFlags startup. Going to start application with default flags: Error - ${e}`,
    );
  }

  return ffClient;
};

const config: Config = {
  appName: 'vchasno',
  backendUrl: 'http://localhost:3000',
  isDebug: true,
};

initFlags(config).then(() => {
  console.log('Feature flags initialized');
  
  // Example usage with IP normalization
  // In real code req.ip might be '::ffff:192.168.1.1'
  const mockIP = '192.168.97.5';
  
  const flags = getFlags({
    'user.ip': mockIP, // Will be '192.168.97.5'
    'user.id': 12345,
  });
  
  console.log('Example flags:', flags);
});
