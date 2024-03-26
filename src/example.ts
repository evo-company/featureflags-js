import { FeatureClient, Variable, Types } from './client';

// Ur default flags dict
const Flags = {
  TEST: false,
  NODE: false,
};

const featureClient = new FeatureClient(
  'vchasno', // project name
  'grpc.featureflags.svc.olympus.evo:50051', // grpc-url
  Flags, // default flags
  [
    new Variable('username', Types.STRING), // ur controll values for Checks
  ],
  true, // isDebugg mode
);

// This will start infinite loop, to update flags values every 5 min
// assume u will get flags for features in ur controller
// u cant get actual val on application start-up, basicly u can, but they`ll in default
featureClient
  .start()
  .then()
  .catch((err) => console.log(`FF client start fail ${err}`));
