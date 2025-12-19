import * as conditions from '../src/conditions';

// Helper function to test low-level condition operators
// It wraps the operator call and creates a simple context for testing
function checkOP(left: any, op: Function, right: any): boolean {
  const ctx = left !== undefined && left !== null ? { var: left } : {};
  return op('var', right)(ctx);
}

describe('Procs and conditions', () => {
  describe('equal', () => {
    it.each([
      [1, 1, true, 'equal numbers'],
      [1, 2, false, 'different numbers'],
      [1, '1', false, 'number and string with same value'],
      ['test', 'test', true, 'equal strings'],
      ['test', 'other', false, 'different strings'],
    ])('checks %s === %s (expected: %s) - %s', (left: string | number, right: string | number, expected: boolean, _description: string) => {
      expect(checkOP(left, conditions.equal, right)).toBe(expected);
    });
  });

  describe('numeric comparisons', () => {
    describe('lessThan', () => {
      it.each([
        [1, 5, true],
        [1, 0, false],
        [5, 5, false],
      ])('checks %s < %s = %s', (left: number, right: number, expected: boolean) => {
        expect(checkOP(left, conditions.lessThan, right)).toBe(expected);
      });
    });

    describe('lessOrEqual', () => {
      it.each([
        [3, 5, true],
        [5, 5, true],
        [6, 5, false],
      ])('checks %s <= %s = %s', (left: number, right: number, expected: boolean) => {
        expect(checkOP(left, conditions.lessOrEqual, right)).toBe(expected);
      });
    });

    describe('greaterThan', () => {
      it.each([
        [10, 5, true],
        [4, 5, false],
        [5, 5, false],
      ])('checks %s > %s = %s', (left: number, right: number, expected: boolean) => {
        expect(checkOP(left, conditions.greaterThan, right)).toBe(expected);
      });
    });

    describe('greaterOrEqual', () => {
      it.each([
        [10, 5, true],
        [5, 5, true],
        [4, 5, false],
      ])('checks %s >= %s = %s', (left: number, right: number, expected: boolean) => {
        expect(checkOP(left, conditions.greaterOrEqual, right)).toBe(expected);
      });
    });
  });

  describe('string operations', () => {
    describe('contains', () => {
      it.each([
        ['Praise the sun', 'sun', true, 'contains substring'],
        ['Praise the sun', 'hollow', false, 'does not contain substring'],
      ])('checks if "%s" contains "%s" = %s (%s)', (left: string, right: string, expected: boolean, _description: string) => {
        expect(checkOP(left, conditions.contains, right)).toBe(expected);
      });
    });

    describe('regexp', () => {
      it.each([
        ['Nothing horse metters', '^Nothing .* metters$', true, 'matches regex'],
        ['My big 12 ench alabi', '^Nothing .* metters$', false, 'does not match regex'],
      ])('checks if "%s" matches /%s/ = %s (%s)', (left: string, right: string, expected: boolean, _description: string) => {
        expect(checkOP(left, conditions.regexp, right)).toBe(expected);
      });
    });

    describe('wildcard', () => {
      it.each([
        ['corvus@gmail.com', 'corvus@*', true, 'matches wildcard pattern'],
        ['kurt@gmail.com', 'corvus@*', false, 'does not match wildcard pattern'],
      ])('checks if "%s" matches pattern "%s" = %s (%s)', (left: string, right: string, expected: boolean, _description: string) => {
        expect(checkOP(left, conditions.wildcard, right)).toBe(expected);
      });
    });
  });

  describe('percent', () => {
    it.each([
      [9, 10, true, '9 % 100 < 10'],
      [15, 10, false, '15 % 100 >= 10'],
      [0, 50, true, '0 % 100 < 50'],
      [99, 1, false, '99 % 100 >= 1'],
    ])('checks percent(%s, %s) = %s (%s)', (left: number, right: number, expected: boolean, _description: string) => {
      expect(checkOP(left, conditions.percent, right)).toBe(expected);
    });
  });
});
