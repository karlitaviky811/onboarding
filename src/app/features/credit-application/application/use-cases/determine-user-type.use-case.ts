import { CreditApplication } from '@credit-application/domain';
import { Identification } from '@credit-application/domain';
import { UserType } from '@credit-application/domain';
import { CreditApplicationRepository } from '@credit-application/domain';
import { Result, NotFoundError, NetworkError } from '@shared/result/result';

// Determines which of the 5 user types applies based on Core's response
export class DetermineUserTypeUseCase {
  constructor(private readonly repository: CreditApplicationRepository) {}

  async execute(identification: Identification): Promise<Result<{
    userType: UserType;
    existingApplication: CreditApplication | null;
  }, NotFoundError | NetworkError>> {
    const result = await this.repository.findByIdentification(identification);

    if (!result.success) {
      return result;
    }

    const existing = result.value;

    if (!existing) {
      return { success: true, value: { userType: UserType.NewClient, existingApplication: null } };
    }

    return { success: true, value: { userType: existing.userType, existingApplication: existing } };
  }
}
