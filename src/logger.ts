export type LogType = 'INFO' | 'WARNING' | 'ERROR';

export function log(type: LogType, message: string, ...args: any[]): void {
  console.log(`[${type}]`, message, ...args);
}
