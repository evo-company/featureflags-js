import * as conditions from '../src/conditions';

function checkOP(left: any, op: Function, right: any): Boolean {
  return op('var', right)(left ? { var: left } : {});
}

describe('Procs and constions', () => {
  it('Test equlity', () => {
    expect(checkOP(1, conditions.equal, 1)).toBe(true);
    expect(checkOP(1, conditions.equal, 2)).toBe(false);
    expect(checkOP(1, conditions.equal, '1')).toBe(false);
    expect(checkOP(['y', 'z', 't'], conditions.equal, { items: ['y', 'z', 't'] })).toBe(true);
    expect(checkOP(['y', 't', 'u', 'b'], conditions.equal, { items: ['y', 'z', 't'] })).toBe(false);
  });
  it('Test lessThan', () => {
    expect(checkOP(1, conditions.lessThan, 5)).toBe(true);
    expect(checkOP(1, conditions.lessThan, 0)).toBe(false);
  });
  it('Test lessOrEqual', () => {
    expect(checkOP(3, conditions.lessOrEqual, 5)).toBe(true);
    expect(checkOP(5, conditions.lessOrEqual, 5)).toBe(true);
    expect(checkOP(6, conditions.lessOrEqual, 5)).toBe(false);
  });
  it('Test greaterThan', () => {
    expect(checkOP(10, conditions.greaterThan, 5)).toBe(true);
    expect(checkOP(4, conditions.greaterThan, 5)).toBe(false);
  });
  it('Test greaterOrEqual', () => {
    expect(checkOP(10, conditions.greaterOrEqual, 5)).toBe(true);
    expect(checkOP(5, conditions.greaterOrEqual, 5)).toBe(true);
    expect(checkOP(4, conditions.greaterOrEqual, 5)).toBe(false);
  });
  it('Test contains', () => {
    expect(checkOP('Praise the sun', conditions.contains, 'sun')).toBe(true);
    expect(checkOP('Praise the sun', conditions.contains, 'hollow')).toBe(false);
  });
  it('Test percent', () => {
    expect(checkOP(9, conditions.percent, 10)).toBe(true);
    expect(checkOP(15, conditions.percent, 10)).toBe(false);
  });
  it('Test regexp', () => {
    expect(checkOP('Nothing horse metters', conditions.regexp, '^Nothing .* metters$')).toBe(true);
    expect(checkOP('My big 12 ench alabi', conditions.regexp, '^Nothing .* metters$')).toBe(false);
  });
  it('Test wildcard', () => {
    expect(checkOP('corvus@gmail.com', conditions.wildcard, 'corvus@*')).toBe(true);
    expect(checkOP('kurt@gmail.com', conditions.wildcard, 'corvus@*')).toBe(false);
  });
  it('Test subset', () => {
    expect(checkOP(['z', 'y', 'o', 'x', 'p'], conditions.subset, { items: ['x', 'y', 'z'] })).toBe(
      true,
    );
    expect(checkOP(['z', 'h', 'o', 'x', 'p'], conditions.subset, { items: ['x', 'y', 'z'] })).toBe(
      false,
    );
  });
  it('Test superset', () => {
    expect(checkOP(['q', 'x'], conditions.superset, { items: ['x', 'y', 'z', 'q'] })).toBe(true);
    expect(checkOP(['z', 'k', 'p'], conditions.superset, { items: ['x', 'y', 'z', 'q'] })).toBe(
      false,
    );
  });
});
