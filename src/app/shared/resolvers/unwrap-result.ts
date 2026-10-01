import { DomainError, Result } from '@shared/result/result';

/**
 * Unwraps a Result promise for Angular route resolvers.
 * If the result is successful, returns the value.
 * If the result is an error, throws the error so Angular's router
 * can handle it (e.g., redirect to an error page).
 */
export async function unwrapResult<T>(
  resultPromise: Promise<Result<T, DomainError>>,
): Promise<T> {
  const result = await resultPromise;
  if (!result.success) {
    throw result.error;
  }
  return result.value;
}
