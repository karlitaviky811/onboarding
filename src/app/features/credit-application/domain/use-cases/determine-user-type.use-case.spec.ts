import { describe, it, expect, vi } from 'vitest';
import { DetermineUserTypeUseCase } from '../../application/use-cases/determine-user-type.use-case';
import { CreditApplicationRepository } from '../ports/credit-application-repository.port';
import { Identification, IdentificationType } from '../value-objects/identification';
import { CreditApplication } from '../entities/credit-application';
import { UserType } from '../value-objects/user-type';
import { ok } from '../../../../shared/result/result';

describe('DetermineUserTypeUseCase', () => {
  const identification = new Identification(IdentificationType.National, '123456789');

  it('should return NewClient when no existing application is found', async () => {
    const repo: CreditApplicationRepository = {
      findByIdentification: vi.fn().mockResolvedValue(ok(null)),
      save: vi.fn(),
      findById: vi.fn(),
    };

    const useCase = new DetermineUserTypeUseCase(repo);
    const result = await useCase.execute(identification);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.userType).toBe(UserType.NewClient);
      expect(result.value.existingApplication).toBeNull();
    }
  });

  it('should return the existing user type when an application is found', async () => {
    const existingApp = CreditApplication.create('app-1', identification).withUserType(UserType.FlipClient);
    const repo: CreditApplicationRepository = {
      findByIdentification: vi.fn().mockResolvedValue(ok(existingApp)),
      save: vi.fn(),
      findById: vi.fn(),
    };

    const useCase = new DetermineUserTypeUseCase(repo);
    const result = await useCase.execute(identification);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.userType).toBe(UserType.FlipClient);
      expect(result.value.existingApplication).toBe(existingApp);
    }
  });
});
