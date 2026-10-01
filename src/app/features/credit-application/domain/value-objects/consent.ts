import { Result, ok, err, ValidationError } from '@shared/result/result';

export interface ConsentData {
  acceptedTermsAndConditions: boolean;
  acceptedPrivacyPolicy: boolean;
  acceptedCIC: boolean;
  acceptedCI: boolean;
}

export class Consent {
  private constructor(
    readonly acceptedTermsAndConditions: boolean,
    readonly acceptedPrivacyPolicy: boolean,
    readonly acceptedCIC: boolean,
    readonly acceptedCI: boolean,
  ) {}

  static create(data: ConsentData): Result<Consent, ValidationError> {
    if (!data.acceptedTermsAndConditions || !data.acceptedPrivacyPolicy || !data.acceptedCIC || !data.acceptedCI) {
      return err(new ValidationError('All consent checkboxes must be accepted'));
    }
    return ok(new Consent(
      data.acceptedTermsAndConditions,
      data.acceptedPrivacyPolicy,
      data.acceptedCIC,
      data.acceptedCI,
    ));
  }
}
