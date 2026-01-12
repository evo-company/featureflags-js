export function isString(value: any): boolean {
  return value && value.constructor.name === 'String';
}
