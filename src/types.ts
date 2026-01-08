export interface IDictionary<TValue> {
  [key: string]: TValue;
}

export interface IFeatureClient {
  instance: IFeatureClient;
}

export enum Check {
  __DEFAULT__ = 0,
  EQUAL = 1,
  LESS_THAN = 2,
  LESS_OR_EQUAL = 3,
  GREATER_THAN = 4,
  GREATER_OR_EQUAL = 5,
  CONTAINS = 6,
  PERCENT = 7,
  REGEXP = 8,
  WILDCARD = 9,
  SUBSET = 10,
  SUPERSET = 11,
}

export interface IFlagRequest {
  project: string;
  version?: number;
  variables?: any[];
  flags?: string[];
  values?: any[];
}

export interface IFlagResponse {
  version: number;
  flags: any[];
}

