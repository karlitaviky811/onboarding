import { Identification, IdentificationType } from '@credit-application/domain';
import { ApplicantProfile } from '@credit-application/domain';
import {
  IdentityVerificationPort,
  IdentityVerificationResult,
  VerificationFlow,
} from '@credit-application/domain';
import { NetworkError } from '@shared/result/result';

export type ValidationOutcome =
  | 'Approved'
  | 'NotApproved'
  | 'Mismatch'
  | 'Redirect'
  | 'Timeout'
  | 'CustomerService';

export class ValidateIdentityUseCase {
  constructor(private readonly port: IdentityVerificationPort) {}

  async execute(
    identification: Identification,
    profile: ApplicantProfile,
    retriesUsed: number,
    maxRetries: number,
  ): Promise<{ outcome: ValidationOutcome; result?: IdentityVerificationResult }> {
    if (retriesUsed >= maxRetries) {
      return { outcome: 'CustomerService' };
    }

    const flow = this.resolveFlow(identification, profile);

    const verificationResult = await this.port.verify(identification.number, flow);

    if (!verificationResult.success) {
      // If it's a network error, treat as timeout
      if (verificationResult.error instanceof NetworkError) {
        return { outcome: 'Timeout' };
      }
      return { outcome: 'Timeout' };
    }

    const result = verificationResult.value;

    // Redirect takes priority: not a retry-worthy rejection, do not touch retry gate
    if (result.redirectUrl) {
      return { outcome: 'Redirect', result };
    }

    // Mismatch: verified number differs from the submitted one (approved:false per spec UC-3)
    if (
      result.validatedIdentificationNumber &&
      result.validatedIdentificationNumber !== identification.number
    ) {
      return { outcome: 'Mismatch', result };
    }

    if (!result.approved) {
      return { outcome: 'NotApproved', result };
    }

    return { outcome: 'Approved', result };
  }

  private resolveFlow(
    identification: Identification,
    profile: ApplicantProfile,
  ): VerificationFlow {
    if (profile.hasValidatedIdentity()) {
      return 'Revalidation';
    }
    return identification.type === IdentificationType.National
      ? 'NationalValidation'
      : 'DIMEXValidation';
  }
}
