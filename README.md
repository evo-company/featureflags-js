# Feature Flags client

Node.js HTTP client for the [featureflags](https://github.com/evo-company/featureflags) service.
It provides graceful fallback to default values and periodic flag synchronization.

## Installation

```
npm i @evo/featureflags-client
```

Package is available on [npm](https://www.npmjs.com/package/@evo/featureflags-client).

Requirements:

- Node.js `>=16.0.0`
- npm `>=8.0.0`

## Setup

```js
import { FeatureClient, Variable, Types } from '@evo/featureflags-client';

// Default flags dict
const Flags = {
  TEST: false,
  NODE: false
};

const UserIp = new Variable('user.ip', Types.STRING);

const variables = [
    UserIp,
];

const featureClient = new FeatureClient(
  // project name
  'my-cool-project',
  // featureflags HTTP base url
  'http://localhost:3000',
  // default flags
  Flags,
  // variables are used to conditionally enable flags
  variables,
  // isDebug mode (default: false)
  true,
  // Optional argument for set interval in milliseconds for fetching flags
  // from service. By default set to 5 min (5 * 60 * 1000).
  1000 * 10,
  // Optional request timeout in milliseconds (default: 10000)
  10000,
);
```

### Start

Start the client and run initial HTTP load + sync loop.

On startup client calls:

- `POST /flags/load` - initial flag snapshot
- `POST /flags/sync` - periodic updates (every `interval`)

```js
try {
    await featureClient.start();
} catch(e) {
    console.log('[FeatureFlags] client failed to start:', e);
}
```

### Usage

In your app code (controllers, handlers, tasks), call `getFlags` and provide `context = {}`.
Context is an object with `Variable` name as a key and a value for condition checks.

```js
import { getFlags } from '@evo/featureflags-client';

// ready to use object with proceeded checks
const flags = getFlags({ 'user.ip': '127.0.0.1' });

if (flags.TEST) doSomeThing();
```

### Retries

There are 2 options if featureflags client fails to connect to featureflags server:

1. Application will not start (`client.start()` throws).

   This may be desired behavior if application must not work with default flags.

2. Application starts with default flags and retries until it can connect.

   This behavior is preferable if your application can work with default flags. It will allow you to server requests
   until featureflags server will be available again.

   Here is some example of what retry may look like. In this example we are relying on assumption that there is a small outage
   and server will become available asap. But if server is down for a long time, we will increse retry delay.

   This is just an example and you are free to implement a much simpler or must complex solution.

   ```js
    /**
     * Use short delay if connection error probably a temporal issue
     */
    const SHORT_RETRY_DELAY = 10000; // 10 sec
    /**
     * Use long delay if connection error probably a long term issue.
     */
    const LONG_RETRY_DELAY = 60000; // 60 sec
    const MAX_SHORT_RETRIES = 5;

    /**
     * Try to connect to feature flags server with a small amount of short retries.
     * If short retries failed, keep retrying with long retries with a hope
     * featureflags will be repaired.
     */
    const startWithRetry = (client: FeatureClient) => {
        let retries = 1;
        let delay = SHORT_RETRY_DELAY;

        const doRetry = async () => {
            if (retries === MAX_SHORT_RETRIES) {
                logger.error(
                    `[FeatureFlags] reached max amount of short retries: ${MAX_SHORT_RETRIES}. Keep retrying with ${LONG_RETRY_DELAY} ms interval`,
                );
                delay = LONG_RETRY_DELAY;
            }

            try {
                await client.start();
                logger.info(`[FeatureFlags] Connected after retry`);
            } catch (e) {
                logger.error(`[FeatureFlags] failed to connect to server - ${retries} attempt, delay ${delay} ms: ${e}`);
                setTimeout(async () => doRetry(), delay);
            } finally {
                retries += 1;
            }
        };

        setTimeout(async () => doRetry(), SHORT_RETRY_DELAY);
    };

    try {
        await featureClient.start();
    } catch(e) {
        console.log(`[FeatureFlags] failed to connect to server. Start application with default flags and keep retrying: Error - ${e}`,);
        startWithRetry(featureClient);
    }
   ```
