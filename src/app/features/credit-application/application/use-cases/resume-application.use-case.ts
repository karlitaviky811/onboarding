import { CreditApplication } from '@credit-application/domain';
import { Identification } from '@credit-application/domain';
import { CreditApplicationRepository } from '@credit-application/domain';
import { ApplicationProgress } from '@credit-application/domain';
import { Result, NotFoundError, NetworkError } from '@shared/result/result';

export class ResumeApplicationUseCase {
  constructor(private readonly repository: CreditApplicationRepository) {}

  async execute(identification: Identification): Promise<Result<{
    application: CreditApplication;
    resumeFrom: ApplicationProgress;
  } | null, NotFoundError | NetworkError>> {
    const result = await this.repository.findByIdentification(identification);

    if (!result.success) {
      return result;
    }

    const application = result.value;

    if (!application) return { success: true, value: null };

    return {
      success: true,
      value: {
        application,
        resumeFrom: application.currentProgress,
      },
    };
  }
}
