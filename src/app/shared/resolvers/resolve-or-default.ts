import { DomainError, Result } from '@shared/result/result';

/**
 * Unwraps a Result promise for Angular route resolvers.
 * If successful, returns the value.
 * If the result is an error, returns the provided default instead of throwing.
 * This makes resolvers resilient — navigation is never blocked by a failing backend.
 */
export async function resolveOrDefault<T>(
  resultPromise: Promise<Result<T, DomainError>>,
  defaultValue: T,
): Promise<T> {
  const result = await resultPromise;
  if (!result.success) {
    // In development, log the error but don't block navigation
    if (typeof console !== 'undefined') {
      console.warn('[Resolver] Backend call failed, using default value:', result.error);
    }
    return defaultValue;
  }
  return result.value;
}
