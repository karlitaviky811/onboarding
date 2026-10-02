import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveOrDefault } from './resolve-or-default';
import { ok, err, NetworkError } from '@shared/result/result';

describe('resolveOrDefault()', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the result value when the promise resolves with success', async () => {
    const result = await resolveOrDefault(Promise.resolve(ok('the-value')), 'default');
    expect(result).toBe('the-value');
  });

  it('returns the default value when the promise resolves with a failure', async () => {
    const result = await resolveOrDefault(
      Promise.resolve(err(new NetworkError())),
      'fallback',
    );
    expect(result).toBe('fallback');
  });

  it('logs a warning to console when the result fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = new NetworkError();

    await resolveOrDefault(Promise.resolve(err(error)), 'default');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('[Resolver]');
  });

  it('does NOT call console.warn on success', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await resolveOrDefault(Promise.resolve(ok(42)), 0);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('handles an object default value on failure', async () => {
    const defaultVal = { id: 0, name: 'default' };
    const result = await resolveOrDefault(
      Promise.resolve(err(new NetworkError())),
      defaultVal,
    );
    expect(result).toBe(defaultVal);
  });
});
