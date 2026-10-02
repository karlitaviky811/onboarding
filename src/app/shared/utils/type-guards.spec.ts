import { describe, it, expect } from 'vitest';
import { isNotNull, isDefined } from './type-guards';

describe('isNotNull()', () => {
  it('returns true for a non-null, non-undefined value', () => {
    expect(isNotNull('hello')).toBe(true);
    expect(isNotNull(0)).toBe(true);
    expect(isNotNull(false)).toBe(true);
    expect(isNotNull({})).toBe(true);
  });

  it('returns false for null', () => {
    expect(isNotNull(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isNotNull(undefined)).toBe(false);
  });

  it('acts as a type guard — narrows T | null | undefined to T', () => {
    const values: Array<string | null | undefined> = ['a', null, undefined, 'b'];
    const filtered = values.filter(isNotNull);
    expect(filtered).toEqual(['a', 'b']);
  });
});

describe('isDefined()', () => {
  it('returns true for any non-undefined value (including null)', () => {
    expect(isDefined('value')).toBe(true);
    expect(isDefined(null)).toBe(true);
    expect(isDefined(0)).toBe(true);
    expect(isDefined(false)).toBe(true);
  });

  it('returns false for undefined', () => {
    expect(isDefined(undefined)).toBe(false);
  });

  it('acts as a type guard — narrows T | undefined to T', () => {
    const values: Array<number | undefined> = [1, undefined, 2, undefined, 3];
    const filtered = values.filter(isDefined);
    expect(filtered).toEqual([1, 2, 3]);
  });
});
