import { describe, it, expect } from 'vitest';
import { mapVerdict, VerdictOutcome } from './verdict.map';

/**
 * Exhaustive spec for the pure mapVerdict function.
 * Each status + triesLeft combination is asserted independently.
 * This is the single source of truth for backend-status → UI-state translation.
 */
describe('mapVerdict', () => {
  // ── Status mapping ─────────────────────────────────────────────────────────

  describe('status: verified', () => {
    it('maps to approved with /request/result route', () => {
      const result = mapVerdict('verified', 2);
      expect(result.state).toBe('approved');
      expect(result.route).toBe('/request/result');
    });
  });

  describe('status: validated', () => {
    it('maps to approved with /request/result route', () => {
      const result = mapVerdict('validated', 1);
      expect(result.state).toBe('approved');
      expect(result.route).toBe('/request/result');
    });
  });

  describe('status: rejected', () => {
    it('maps to rejected state (no route)', () => {
      const result = mapVerdict('rejected', 1);
      expect(result.state).toBe('rejected');
      expect(result.route).toBeUndefined();
    });
  });

  describe('status: support', () => {
    it('maps to manual_review state', () => {
      const result = mapVerdict('support', 0);
      expect(result.state).toBe('manual_review');
      expect(result.route).toBeUndefined();
    });
  });

  describe('status: identificationNoMatch', () => {
    it('maps to rejected state', () => {
      const result = mapVerdict('identificationNoMatch', 1);
      expect(result.state).toBe('rejected');
      expect(result.route).toBeUndefined();
    });
  });

  describe('status: limitReached', () => {
    it('maps to failed when triesLeft > 0', () => {
      const result = mapVerdict('limitReached', 2);
      expect(result.state).toBe('failed');
    });

    it('maps to failed when triesLeft === 0 (normalization: 3 - 0 = 3 remaining)', () => {
      const result = mapVerdict('limitReached', 0);
      expect(result.state).toBe('failed');
      // Backend triesLeft=0 means 0 used → 3 - 0 = 3 remaining (still failed because limitReached status)
      expect(result.triesLeft).toBe(3);
    });
  });

  describe('unknown status (default branch)', () => {
    it('maps to rejected for completely unknown status', () => {
      const result = mapVerdict('someFutureStatus', 1);
      expect(result.state).toBe('rejected');
    });

    it('maps empty string to rejected', () => {
      const result = mapVerdict('', null);
      expect(result.state).toBe('rejected');
    });
  });


  describe('triesLeft normalization', () => {
    it.each([
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

  // ── Return shape invariants ────────────────────────────────────────────────

  it('always returns a VerdictOutcome with required fields', () => {
    const result: VerdictOutcome = mapVerdict('verified', 1);
    expect(result).toHaveProperty('state');
    expect(result).toHaveProperty('triesLeft');
  });
});
