import { FeatureClient } from './client';

export { Variable, FeatureClient, Types } from './client';
export { normalizeIP, normalizeContext } from './utils';

export * from './types';

// get flags in functional way
export function getFlags(ctx:any) {
  if (!FeatureClient.instance) throw new Error('You should init FeatureClient, before use');
  return FeatureClient.instance.flags(ctx);
}

// get single flag in functional way
export function getFlag(flagName: string, ctx: any = {}): boolean {
  if (!FeatureClient.instance) throw new Error('You should init FeatureClient, before use');
  return FeatureClient.instance.flag(flagName, ctx);
}
