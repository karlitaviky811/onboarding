import { describe, test, expect, vi } from 'vitest';
import { ResumeApplicationUseCase } from './resume-application.use-case';
import { CreditApplication } from '../../domain/entities/credit-application';
import { Identification, IdentificationType } from '../../domain/value-objects/identification';
import { CreditApplicationRepository } from '../../domain/ports/credit-application-repository.port';
import { ok, err, NetworkError } from '@shared/result/result';

const identification = new Identification(IdentificationType.National, '123456789');

function makeRepo(findResult: ReturnType<typeof ok<CreditApplication | null>> | ReturnType<typeof err<NetworkError>>) {
  return {
    findByIdentification: vi.fn().mockResolvedValue(findResult),
    findById: vi.fn(),
    save: vi.fn(),
  } as unknown as CreditApplicationRepository;
}

describe('ResumeApplicationUseCase', () => {
  test('returns null when no application is found for the identification', async () => {
    const repo = makeRepo(ok(null));
    const useCase = new ResumeApplicationUseCase(repo);

    const result = await useCase.execute(identification);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBeNull();
    }
  });

  test('returns the application and resumeFrom when an existing application is found', async () => {
    const existingApp = CreditApplication.create('app-1', identification);
    const repo = makeRepo(ok(existingApp));
    const useCase = new ResumeApplicationUseCase(repo);

    const result = await useCase.execute(identification);

    expect(result.success).toBe(true);
    if (result.success && result.value !== null) {
      expect(result.value.application).toBe(existingApp);
      expect(result.value.resumeFrom).toBeDefined();
      expect(result.value.resumeFrom.stage).toBeDefined();
    }
  });

  test('propagates the repository error when findByIdentification fails', async () => {
    const error = new NetworkError();
    const repo = makeRepo(err(error));
    const useCase = new ResumeApplicationUseCase(repo);

    const result = await useCase.execute(identification);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(error);
    }
  });
});
