import { resolve } from 'path';

export function isString(value: any): boolean {
  return value && value.constructor.name === 'String';
}

export function getCurrentPath(path: string): string {
  return resolve(__dirname, path);
}

/**
 * Normalizes IP address by removing IPv6-mapped prefix
 * Converts '::ffff:192.168.1.1' to '192.168.1.1'
 * 
 * @param ip - IP address (can be IPv4, IPv6 or IPv6-mapped IPv4)
 * @returns Normalized IP address
 */
export function normalizeIP(ip: string): string {
  if (!ip) {
    return '';
  }
  
  // Remove IPv6-mapped prefix if present
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  
  return ip;
}

/**
 * Normalizes context for feature flag checks
 * Processes all IP fields (ending with '.ip' or named 'ip')
 * and removes IPv6-mapped prefix
 * 
 * @param ctx - Context with user data
 * @returns Normalized context
 */
export function normalizeContext(ctx: any): any {
  const normalizedCtx: any = {};
  
  Object.keys(ctx).forEach((key) => {
    if (key.endsWith('.ip') || key === 'ip') {
      const ip = ctx[key];
      normalizedCtx[key] = ip && typeof ip === 'string' ? normalizeIP(ip) : ip;
    } else {
      normalizedCtx[key] = ctx[key];
    }
  });
  
  return normalizedCtx;
}
