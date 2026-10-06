import { describe, test, expect } from 'vitest';
import { Identification, IdentificationType } from './identification';

describe('Identification', () => {
  test('should throw on empty number', () => {
    expect(() => new Identification(IdentificationType.National, '')).toThrow('Identification number cannot be empty');

    expect(() => new Identification(IdentificationType.National, '   ')).toThrow('Identification number cannot be empty');

    const a = new Identification(IdentificationType.National, '123');

    const b = new Identification(IdentificationType.National, '123');

    const id = new Identification(IdentificationType.National, '123');
    expect(id.toString()).toBe('NACIONAL:123');
  });

  describe('equals', () => {
    test('is true when type AND number match', () => {
      const a = new Identification(IdentificationType.National, '123');
      const b = new Identification(IdentificationType.National, '123');
      expect(a.equals(b)).toBe(true);
    });

    test('is false when the type differs (short-circuits the number check)', () => {
      const a = new Identification(IdentificationType.National, '123');
      const b = new Identification(IdentificationType.DIMEX, '123');
      expect(a.equals(b)).toBe(false);
    });

    test('is false when the number differs', () => {
      const a = new Identification(IdentificationType.National, '123');
      const b = new Identification(IdentificationType.National, '456');
      expect(a.equals(b)).toBe(false);
    });
  });
});
