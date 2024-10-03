import { IDictionary } from './types';
import { isString } from './utils';

import { featureflags } from '../protostub/proto';

import IResult = featureflags.graph.IResult;
import Check = featureflags.graph.Check.Operator;

export function equal(name: string, value: any): Function {
  return (ctx: IDictionary<any>) => {
    if (value.constructor.name !== 'Object') return ctx[name] === value;
    return (
      value.items.length === ctx[name].length &&
      value.items.every((val: any) => ctx[name].includes(val))
    );
  };
}

export function lessThan(name: string, value: any): Function {
  return (ctx: IDictionary<any>) => ctx[name] < value;
}

export function lessOrEqual(name: string, value: any): Function {
  return (ctx: IDictionary<any>) => ctx[name] <= value;
}

export function greaterThan(name: string, value: any): Function {
  return (ctx: IDictionary<any>) => ctx[name] > value;
}

export function greaterOrEqual(name: string, value: any): Function {
  return (ctx: IDictionary<any>) => ctx[name] >= value;
}

export function contains(name: string, value: any): Function {
  return (ctx: IDictionary<any>) => {
    return isString(ctx[name]) && ctx[name].indexOf(value) >= 0;
  };
}

export function percent(name: string, value: any): Function {
  return (ctx: IDictionary<any>) => ctx[name] % 100 < value;
}

export function regexp(name: string, value: any): Function {
  return (ctx: IDictionary<any>) => {
    const compRegExp = new RegExp(String(value));
    return isString(ctx[name]) && Boolean(ctx[name].match(compRegExp));
  };
}

export function wildcard(name: string, value: any): Function {
  return (ctx: IDictionary<any>) => {
    const regExpPrefix = '(?:.*)';

    if (!isString(value)) return false;

    const regExpBody = value
      .split('*')
      .reverse()
      .reduce((val: string, accum: string) => `${accum}${val}${regExpPrefix}`, '');

    const re_ = `^${regExpBody}$`;
    const compRegExp = new RegExp(re_);

    return isString(ctx[name]) && Boolean(ctx[name].match(compRegExp));
  };
}

export function subset(name: string, value: any): Function {
  return (ctx: IDictionary<any>) => {
    if (!value) return false;

    const items = value.items;

    return Boolean(ctx[name]) && items.every((val: any) => ctx[name].includes(val));
  };
}

export function superset(name: string, value: any): Function {
  return (ctx: IDictionary<any>) => {
    if (!value) return false;

    const items = value.items;

    return Boolean(ctx[name]) && ctx[name].every((val: any) => items.includes(val));
  };
}

export const OPS = {
  [Check.EQUAL]: equal,
  [Check.LESS_THAN]: lessThan,
  [Check.LESS_OR_EQUAL]: lessOrEqual,
  [Check.GREATER_THAN]: greaterThan,
  [Check.GREATER_OR_EQUAL]: greaterOrEqual,
  [Check.CONTAINS]: contains,
  [Check.PERCENT]: percent,
  [Check.REGEXP]: regexp,
  [Check.WILDCARD]: wildcard,
  [Check.SUBSET]: subset,
  [Check.SUPERSET]: superset,
};

export function checkProc(result: IResult, checkId: string): boolean | Function {
  const check = result.Check[checkId];

  if (!check.variable.Variable) {
    console.log(`Check[${checkId}].variable is unset`);
    return false;
  }

  if (check.operator === Check.__DEFAULT__) {
    console.log(`Check[${checkId}].operator is unset`);
    return false;
  }

  const variable = result.Variable[check.variable.Variable];

  if (!variable.name) {
    console.log(`Check[${checkId}].name is unset`);
    return false;
  }

  // awesome TS realisation dont have WhichOneof method in proto, so u see this
  const value = check.valueString || check.valueNumber || check.valueSet || check.valueTimestamp;

  return OPS[check.operator](variable.name, value);
}

export function flagProc(result: IResult, flagId: string): Function {
  const flag = result.Flag[flagId];

  if (!('enabled' in flag)) {
    console.log(`Flag[${flagId}].enabled is unset`);
    return () => false;
  }

  const conditions: (Function | boolean)[][] = [];

  flag.conditions &&
    flag.conditions.forEach((conditionRef) => {
      const condition = result.Condition[conditionRef.Condition];
      const checks = condition.checks
        .map((checkRef) => {
          return checkProc(result, checkRef.Check);
        })
        .filter((v) => v);

      if (checks.length > 0) {
        conditions.push(checks);
      } else {
        console.log(`Condition[${conditionRef.Condition}].checks is empty`);
      }
    });

  let proc: Function = (): void => void 0;

  const filteredConditions = conditions.filter((checks) => {
    return checks.filter((check) => check).length > 0;
  });

  if (flag.enabled.value && filteredConditions.length > 0) {
    proc = (ctx: object) => {
      return filteredConditions.some((_checks) =>
        _checks.every((_check) => typeof _check === 'function' && _check(ctx)),
      );
    };
  } else {
    proc = () => {
      const res = flag.enabled.value;

      if (!res && flag.overridden.value) {
        return false;
      }

      return res;
    };
  }

  return proc;
}

export function loadFlags(result: IResult): IDictionary<Function> {
  const procs: IDictionary<Function> = {};

  result &&
    result.Root.flags.forEach((flagRef) => {
      const flag = result.Flag[flagRef.Flag];
      if (!flag.name) {
        console.log(`Flag[${flagRef.Flag}].name is not set`);
        return;
      }
      procs[flag.name] = flagProc(result, flagRef.Flag);
    });

  return procs;
}
