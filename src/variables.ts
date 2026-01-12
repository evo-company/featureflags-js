export class Types {
  public static STRING = 1;
  public static NUMBER = 2;
  public static TIMESTAMP = 3;
  public static SET = 4;
}

export class Variable {
  public name: string;
  public type: any;

  constructor(name: string, type: any) {
    this.name = name;
    this.type = type;
  }
}

export const FIVE_MINUTES = 5 * 60 * 1000;
export const ONE_MINUTE = 60 * 1000;
export const DEFAULT_TIMEOUT = 10 * 1000; // 10 seconds

