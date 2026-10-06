import { describe, test, expect } from 'vitest';
import { ApplicantProfile } from './applicant-profile';

describe('ApplicantProfile', () => {
  const base = new ApplicantProfile('1-2345-6789', 'NACIONAL', 'Juan', 'García');

  test('hasValidatedIdentity returns false when validatedAt is undefined', () => {
    expect(base.hasValidatedIdentity()).toBe(false);
  });

  test('hasValidatedIdentity returns true when validatedAt is set', () => {
    const validated = new ApplicantProfile(
      '1-2345-6789', 'NACIONAL', 'Juan', 'García', undefined, new Date(),
    );
    expect(validated.hasValidatedIdentity()).toBe(true);
  });

  test('withContact returns a new instance with the given contact data', () => {
    const contact = { countryCode: '+506', phone: '88887777', email: 'juan@example.test' };
    const updated = base.withContact(contact);

    expect(updated.contact).toEqual(contact);
    expect(base.contact).toBeUndefined();
    expect(updated).not.toBe(base);

    expect(updated.firstName).toBe('Juan');
    expect(updated.identificationNumber).toBe('1-2345-6789');
  });

  test('withValidation returns a new instance with the given validatedAt date', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    const updated = base.withValidation(date);

    expect(updated.validatedAt).toEqual(date);
    expect(base.validatedAt).toBeUndefined();
    expect(updated.hasValidatedIdentity()).toBe(true);

    expect(updated.firstName).toBe('Juan');
  });
});
