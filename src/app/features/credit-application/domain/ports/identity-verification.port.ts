import { Result, DomainError } from '@shared/result/result';

export type VerificationFlow = 'NationalValidation' | 'DIMEXValidation' | 'Revalidation';

export interface IdentityVerificationResult {
  approved: boolean;
  validatedIdentificationNumber?: string;
  redirectUrl?: string;
  verificationId?: string;
  errorCode?: string;
}

export interface IdentityVerificationPort {
  verify(
    identificationNumber: string,
    flow: VerificationFlow,
  ): Promise<Result<IdentityVerificationResult, DomainError>>;
}

export interface IdentityVerificationStatusResult {
  status: string;
}

export interface IdentityVerificationStatusPort {
  getStatus(verificationId: string): Promise<Result<IdentityVerificationStatusResult, DomainError>>;
}
