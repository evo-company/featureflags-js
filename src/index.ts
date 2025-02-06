import { FeatureClient } from './client';

export { Variable, FeatureClient } from './client';

export * from './types';

// get flags in functional way
export function getFlags(ctx:any) {
  if (!FeatureClient.instance) throw new Error('You should init FeatureClient, before use');
  return FeatureClient.instance.flags(ctx);
}
