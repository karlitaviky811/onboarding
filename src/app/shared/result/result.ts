export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND');
  }
}

export class NetworkError extends DomainError {
  constructor() {
    super('Network request failed', 'NETWORK_ERROR');
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export type Result<T, E extends DomainError = DomainError> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

export function err<E extends DomainError>(error: E): Result<never, E> {
  return { success: false, error };
}
