import { CreditApplication } from '@credit-application/domain';
import { ApplicationStage, ApplicationSubstage } from '@credit-application/domain';
import { Consent, ConsentData } from '@credit-application/domain';
import { CreditApplicationRepository } from '@credit-application/domain';
import { Result, NetworkError } from '@shared/result/result';

export class CaptureConsentUseCase {
  constructor(private readonly repository: CreditApplicationRepository) {}

  async execute(
    application: CreditApplication,
    consent: ConsentData,
  ): Promise<Result<CreditApplication, NetworkError>> {
    const consentResult = Consent.create(consent);

    if (!consentResult.success) {
      throw new Error(consentResult.error.message);
    }

    const updated = application
      .recordProgress(ApplicationStage.Request, ApplicationSubstage.Consent, 'success', { consent: consentResult.value })
      .advanceTo(ApplicationStage.IdentityValidation, ApplicationSubstage.IdentityValidationStep);

    return this.repository.save(updated);
  }
}
