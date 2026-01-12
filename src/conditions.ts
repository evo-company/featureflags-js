import { IDictionary, Check } from './types';
import { isString } from './utils';

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
    const compRegExp = new RegExp(value);
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

export function checkProc(check: any): boolean | Function {
  if (!check) {
    console.log(`Check variable is unset`);
    return false;
  }

  if (check.operator === Check.__DEFAULT__) {
    console.log(`Check[${check.name}].operator is unset`);
    return false;
  }

  const variable = check.variable;

  if (!variable.name) {
    console.log(`Check.name is unset`);
    return false;
  }

  const value = check.value;

  // @ts-ignore
  return OPS[check.operator](variable.name, value);
}

export function flagProc(flag: any): Function {
  if (!flag || !flag.enabled) {
    return () => false;
  }

  const conditions: (Function | Boolean)[] = [];


  flag.conditions &&
    flag.conditions.forEach((condition: any) => {
      condition.checks.forEach((checkRef: any) => {
        const resCheck = checkProc(checkRef);
        if (resCheck ) {
          conditions.push(resCheck);
        }
      });
    });

  const result = (ctx:any) => conditions.every((condition) => {
    if(typeof condition === 'function'){
      return condition(ctx);
    }
    return condition;
  })

  return result;
}

export function loadFlags(result: any): IDictionary<Function> {
  const procs: IDictionary<Function> = {};

  result.forEach((element: any) => {
    if (element.conditions && element.conditions[0]) {
      procs[element.name] = flagProc(element);
    } else {
      procs[element.name] = () => element.enabled;
    }
  });
  return procs;
}
