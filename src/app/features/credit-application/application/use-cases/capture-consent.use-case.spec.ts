import { describe, test, expect, vi } from 'vitest';
import { CaptureConsentUseCase } from './capture-consent.use-case';
import { CreditApplication } from '../../domain/entities/credit-application';
import { Identification, IdentificationType } from '../../domain/value-objects/identification';
import { CreditApplicationRepository } from '../../domain/ports/credit-application-repository.port';
import { ok, err, NetworkError } from '@shared/result/result';

const identification = new Identification(IdentificationType.National, '123456789');
const baseApp = CreditApplication.create('app-1', identification);

const validConsent = {
  acceptedTermsAndConditions: true,
  acceptedPrivacyPolicy: true,
  acceptedCIC: true,
  acceptedCI: true,
};

function makeRepo(saveResult: ReturnType<typeof ok<CreditApplication>> | ReturnType<typeof err<NetworkError>>) {
  return {
    findByIdentification: vi.fn(),
    findById: vi.fn(),
    save: vi.fn().mockResolvedValue(saveResult),
  } as unknown as CreditApplicationRepository;
}

describe('CaptureConsentUseCase', () => {
  test('saves the updated application with consent attached', async () => {
    const repo = makeRepo(ok(baseApp));
    const useCase = new CaptureConsentUseCase(repo);

    const result = await useCase.execute(baseApp, validConsent);

    expect(result.success).toBe(true);
    expect(repo.save).toHaveBeenCalledTimes(1);

    const savedApp: CreditApplication = (repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(savedApp.currentProgress.stage).toBe('VALIDACION_IDENTIDAD');
  });

  test('propagates the repository error when save fails', async () => {
    const error = new NetworkError();
    const repo = makeRepo(err(error));
    const useCase = new CaptureConsentUseCase(repo);

    const result = await useCase.execute(baseApp, validConsent);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(error);
    }
  });

  test('throws when consent data is invalid (not all accepted)', async () => {
    const repo = makeRepo(ok(baseApp));
    const useCase = new CaptureConsentUseCase(repo);

    const invalidConsent = { ...validConsent, acceptedTermsAndConditions: false };

    await expect(useCase.execute(baseApp, invalidConsent)).rejects.toThrow();
  });
});
