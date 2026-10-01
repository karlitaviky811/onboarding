import { describe, it, expect } from 'vitest';
import { Consent } from './consent';

describe('Consent', () => {
  it('create should return error when any checkbox is false', () => {
    const result = Consent.create({
      acceptedTermsAndConditions: true,
      acceptedPrivacyPolicy: true,
      acceptedCIC: true,
      acceptedCI: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('All consent checkboxes must be accepted');
    }
  });

  it('create should return ok when all are true', () => {
    const result = Consent.create({
      acceptedTermsAndConditions: true,
      acceptedPrivacyPolicy: true,
      acceptedCIC: true,
      acceptedCI: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.acceptedTermsAndConditions).toBe(true);
      expect(result.value.acceptedPrivacyPolicy).toBe(true);
      expect(result.value.acceptedCIC).toBe(true);
      expect(result.value.acceptedCI).toBe(true);
    }
  });
});
