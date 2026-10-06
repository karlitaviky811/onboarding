import { describe, test, expect } from 'vitest';
import { DomainError, NotFoundError, NetworkError, ValidationError, ok, err } from './result';

describe('DomainError hierarchy', () => {
  test('NotFoundError sets message and code correctly', () => {
    const error = new NotFoundError('CreditApplication');
    expect(error.message).toContain('CreditApplication');
    expect(error.code).toBe('NOT_FOUND');
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });

  test('NetworkError sets message and code correctly', () => {
    const error = new NetworkError();
    expect(error.message).toContain('Network');
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error).toBeInstanceOf(DomainError);
  });

  test('ValidationError sets message and code correctly', () => {
    const error = new ValidationError('El campo es requerido');
    expect(error.message).toBe('El campo es requerido');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error).toBeInstanceOf(DomainError);
  });
});

describe('ok() and err() factory functions', () => {
  test('ok() returns success:true with the value', () => {
    const result = ok({ id: 'app-1' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({ id: 'app-1' });
    }
  });

  test('err() returns success:false with the error', () => {
    const error = new NetworkError();
    const result = err(error);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(error);
    }
  });
});
