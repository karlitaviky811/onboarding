import { describe, test, expect } from 'vitest';
import { unwrapResult } from './unwrap-result';
import { ok, err, NetworkError, DomainError } from '@shared/result/result';

describe('unwrapResult()', () => {
  test('returns the value when the promise resolves with success', async () => {
    const value = await unwrapResult(Promise.resolve(ok('the-value')));
    expect(value).toBe('the-value');
  });

  test('throws the domain error when the promise resolves with a failure', async () => {
    const error = new NetworkError();
    await expect(unwrapResult(Promise.resolve(err(error)))).rejects.toThrow(error);
  });

  test('the thrown error is the exact DomainError instance', async () => {
    const error = new NetworkError();
    let caught: unknown;

    try {
      await unwrapResult(Promise.resolve(err(error)));
    } catch (e) {
      caught = e;
    }

    expect(caught).toBe(error);
    expect(caught).toBeInstanceOf(DomainError);
  });

  test('returns falsy-but-defined values correctly (0, false, null)', async () => {
    expect(await unwrapResult(Promise.resolve(ok(0)))).toBe(0);
    expect(await unwrapResult(Promise.resolve(ok(false)))).toBe(false);
    expect(await unwrapResult(Promise.resolve(ok(null)))).toBe(null);
  });
});
