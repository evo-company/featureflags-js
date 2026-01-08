import { FeatureClient } from './client';
import { FlagContext } from './types';

export { Variable, FeatureClient, Types } from './client';

export * from './types';

// get flags in functional way
export function getFlags(ctx: FlagContext = {}) {
  if (!FeatureClient.instance) throw new Error('You should init FeatureClient, before use');
  return FeatureClient.instance.flags(ctx);
}

// get single flag in functional way
export function getFlag(flagName: string, ctx: FlagContext = {}): boolean {
  if (!FeatureClient.instance) throw new Error('You should init FeatureClient, before use');
  return FeatureClient.instance.flag(flagName, ctx);
}
