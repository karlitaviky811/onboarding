import { describe, test, expect, vi } from 'vitest';
import { ValidateIdentityUseCase } from '../../application/use-cases/validate-identity.use-case';
import { IdentityVerificationPort } from '../ports/identity-verification.port';
import { Identification, IdentificationType } from '../value-objects/identification';
import { ApplicantProfile } from '../entities/applicant-profile';
import { ok, err, NetworkError } from '@shared/result/result';

describe('ValidateIdentityUseCase', () => {
  const identification = new Identification(IdentificationType.National, '123456789');
  const profile = new ApplicantProfile('123456789', 'NACIONAL');

  test('should return CustomerService when retries are exhausted', async () => {
    const port: IdentityVerificationPort = {
      verify: vi.fn(),
    };

    const useCase = new ValidateIdentityUseCase(port);
    const result = await useCase.execute(identification, profile, 3, 3);

    expect(result.outcome).toBe('CustomerService');
    expect(port.verify).not.toHaveBeenCalled();
  });

  test('should resolve NationalValidation flow for National type without prior validation', async () => {
    const port: IdentityVerificationPort = {
      verify: vi.fn().mockResolvedValue(ok({ approved: true })),
    };

    const useCase = new ValidateIdentityUseCase(port);
    await useCase.execute(identification, profile, 0, 3);

    expect(port.verify).toHaveBeenCalledWith('123456789', 'NationalValidation');
  });

  test('should resolve DIMEXValidation flow for DIMEX type', async () => {
    const dimexId = new Identification(IdentificationType.DIMEX, '123456789');
    const port: IdentityVerificationPort = {
      verify: vi.fn().mockResolvedValue(ok({ approved: true })),
    };

    const useCase = new ValidateIdentityUseCase(port);
    await useCase.execute(dimexId, profile, 0, 3);

    expect(port.verify).toHaveBeenCalledWith('123456789', 'DIMEXValidation');
  });

  test('should resolve Revalidation flow when profile has validated identity', async () => {
    const validatedProfile = new ApplicantProfile('123456789', 'NACIONAL', undefined, undefined, undefined, new Date());
    const port: IdentityVerificationPort = {
      verify: vi.fn().mockResolvedValue(ok({ approved: true })),
    };

    const useCase = new ValidateIdentityUseCase(port);
    await useCase.execute(identification, validatedProfile, 0, 3);

    expect(port.verify).toHaveBeenCalledWith('123456789', 'Revalidation');
  });

  test('should return Approved when verification succeeds', async () => {
    const port: IdentityVerificationPort = {
      verify: vi.fn().mockResolvedValue(ok({ approved: true })),
    };

    const useCase = new ValidateIdentityUseCase(port);
    const result = await useCase.execute(identification, profile, 0, 3);

    expect(result.outcome).toBe('Approved');
  });

  test('should return NotApproved when verification is not approved', async () => {
    const port: IdentityVerificationPort = {
      verify: vi.fn().mockResolvedValue(ok({ approved: false })),
    };

    const useCase = new ValidateIdentityUseCase(port);
    const result = await useCase.execute(identification, profile, 0, 3);

    expect(result.outcome).toBe('NotApproved');
  });

  test('should return Mismatch when validated number differs (approved:false)', async () => {
    const port: IdentityVerificationPort = {
      verify: vi.fn().mockResolvedValue(ok({ approved: false, validatedIdentificationNumber: '999' })),
    };

    const useCase = new ValidateIdentityUseCase(port);
    const result = await useCase.execute(identification, profile, 0, 3);

    expect(result.outcome).toBe('Mismatch');
  });

  test('should return Timeout on network error', async () => {
    const port: IdentityVerificationPort = {
      verify: vi.fn().mockResolvedValue(err(new NetworkError())),
    };

    const useCase = new ValidateIdentityUseCase(port);
    const result = await useCase.execute(identification, profile, 0, 3);

    expect(result.outcome).toBe('Timeout');
  });

  test('should return CustomerService when retries are exhausted after Mismatch (UC-5)', async () => {
    const port: IdentityVerificationPort = {
      verify: vi.fn().mockResolvedValue(ok({ approved: false, validatedIdentificationNumber: '999' })),
    };

    const useCase = new ValidateIdentityUseCase(port);
    const result = await useCase.execute(identification, profile, 3, 3);

    expect(result.outcome).toBe('CustomerService');
    expect(port.verify).not.toHaveBeenCalled();
  });

  test('should return Redirect when verify returns redirectUrl (UC-7)', async () => {
    const port: IdentityVerificationPort = {
      verify: vi.fn().mockResolvedValue(
        ok({ approved: false, redirectUrl: 'https://verify.example.test/session/abc', verificationId: 'v-123' }),
      ),
    };

    const useCase = new ValidateIdentityUseCase(port);
    const result = await useCase.execute(identification, profile, 0, 3);

    expect(result.outcome).toBe('Redirect');
    expect(result.result?.redirectUrl).toBe('https://verify.example.test/session/abc');
    expect(result.result?.verificationId).toBe('v-123');
  });

  test('should NOT increment retries for Redirect outcome (UC-7 retry-gate invariant)', async () => {
    const port: IdentityVerificationPort = {
      verify: vi.fn().mockResolvedValue(
        ok({ approved: false, redirectUrl: 'https://verify.example.test/session/xyz', verificationId: 'v-456' }),
      ),
    };

    const useCase = new ValidateIdentityUseCase(port);

    const result = await useCase.execute(identification, profile, 2, 3);

    expect(result.outcome).toBe('Redirect');
  });

  test('returns Timeout for a non-NetworkError failure (generic error branch)', async () => {
    const { err: errFn, DomainError } = await import('@shared/result/result');
    const port: IdentityVerificationPort = {
      verify: vi.fn().mockResolvedValue(errFn(new DomainError('Some other error', 'OTHER_ERROR'))),
    };

    const useCase = new ValidateIdentityUseCase(port);
    const result = await useCase.execute(identification, profile, 0, 3);

    expect(result.outcome).toBe('Timeout');
  });
});
