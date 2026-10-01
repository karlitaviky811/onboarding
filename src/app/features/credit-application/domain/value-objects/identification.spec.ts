import { describe, it, expect } from 'vitest';
import { Identification, IdentificationType } from './identification';

describe('Identification', () => {
  it('should throw on empty number', () => {
    expect(() => new Identification(IdentificationType.National, '')).toThrow('Identification number cannot be empty');

    expect(() => new Identification(IdentificationType.National, '   ')).toThrow('Identification number cannot be empty');

    const a = new Identification(IdentificationType.National, '123');

    const b = new Identification(IdentificationType.National, '123');

    const id = new Identification(IdentificationType.National, '123');
    expect(id.toString()).toBe('NACIONAL:123');
  });
});
