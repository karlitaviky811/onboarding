import { describe, test, expect } from 'vitest';
import { mapVerdict, VerdictOutcome } from './verdict.map';

describe('mapVerdict', () => {
  describe('status: verified', () => {
    test('maps to approved with /request/result route', () => {
      const result = mapVerdict('verified', 2);
      expect(result.state).toBe('approved');
      expect(result.route).toBe('/request/result');
    });
  });

  describe('status: validated', () => {
    test('maps to approved with /request/result route', () => {
      const result = mapVerdict('validated', 1);
      expect(result.state).toBe('approved');
      expect(result.route).toBe('/request/result');
    });
  });

  describe('status: rejected', () => {
    test('maps to rejected state (no route)', () => {
      const result = mapVerdict('rejected', 1);
      expect(result.state).toBe('rejected');
      expect(result.route).toBeUndefined();
    });
  });

  describe('status: support', () => {
    test('maps to manual_review state', () => {
      const result = mapVerdict('support', 0);
      expect(result.state).toBe('manual_review');
      expect(result.route).toBeUndefined();
    });
  });

  describe('status: identificationNoMatch', () => {
    test('maps to rejected state', () => {
      const result = mapVerdict('identificationNoMatch', 1);
      expect(result.state).toBe('rejected');
      expect(result.route).toBeUndefined();
    });
  });

  describe('status: limitReached', () => {
    test('maps to failed when triesLeft > 0', () => {
      const result = mapVerdict('limitReached', 2);
      expect(result.state).toBe('failed');
    });

    test('maps to failed when triesLeft === 0 (normalization: 3 - 0 = 3 remaining)', () => {
      const result = mapVerdict('limitReached', 0);
      expect(result.state).toBe('failed');

      expect(result.triesLeft).toBe(3);
    });
  });

  describe('unknown status (default branch)', () => {
    test('maps to rejected for completely unknown status', () => {
      const result = mapVerdict('someFutureStatus', 1);
      expect(result.state).toBe('rejected');
    });

    test('maps empty string to rejected', () => {
      const result = mapVerdict('', null);
      expect(result.state).toBe('rejected');
    });
  });

  describe('triesLeft normalization', () => {
    test.each([
      [-1, null],
      [null, null],
      [undefined, null],
      [0, 3],
      [1, 2],
      [2, 1],
      [3, 0],
    ] as Array<[number | null | undefined, number | null]>)(
      'input %s → normalizedTriesLeft %s',
      (input, expected) => {
        const result = mapVerdict('rejected', input);
        expect(result.triesLeft).toBe(expected);
      },
    );
  });

  test('always returns a VerdictOutcome with required fields', () => {
    const result: VerdictOutcome = mapVerdict('verified', 1);
    expect(result).toHaveProperty('state');
    expect(result).toHaveProperty('triesLeft');
  });
});
