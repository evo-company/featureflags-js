import { ILogger } from './types';

/**
 * Helper function to format objects for better readability
 */
function formatArgs(args: any[]): any[] {
  return args.map((arg) => {
    if (arg === null || arg === undefined) {
      return arg;
    }
    
    // Format objects and arrays using JSON.stringify for better readability
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (error) {
        // If JSON.stringify fails (circular refs, functions, etc.), 
        // return object as-is - console will handle it
        return arg;
      }
    }
    
    return arg;
  });
}

/**
 * Default logger implementation using console
 * Compatible with logevo interface
 * Automatically formats objects for better readability
 */
export class ConsoleLogger implements ILogger {
  info(message: string, ...args: any[]): void {
    const formattedArgs = formatArgs(args);
    console.log(message, ...formattedArgs);
  }

  warn(message: string, ...args: any[]): void {
    const formattedArgs = formatArgs(args);
    console.warn(message, ...formattedArgs);
  }

  error(message: string, ...args: any[]): void {
    const formattedArgs = formatArgs(args);
    console.error(message, ...formattedArgs);
  }

  debug(message: string, ...args: any[]): void {
    const formattedArgs = formatArgs(args);
    console.debug(message, ...formattedArgs);
  }
}

export const defaultLogger = new ConsoleLogger();



