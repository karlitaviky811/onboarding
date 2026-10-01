// Domain barrel — re-exports all public domain artifacts

// Entities
export { CreditApplication } from './entities/credit-application';
export type { ApplicationResult } from './entities/credit-application';
export { ApplicantProfile } from './entities/applicant-profile';
export type { ContactData } from './entities/applicant-profile';
export { ProgressEntry } from './entities/progress-entry';
export type { ProgressEntryStatus } from './entities/progress-entry';

// Value Objects
export { Identification, IdentificationType } from './value-objects/identification';
export { UserType } from './value-objects/user-type';
export { ApplicationStage, ApplicationSubstage } from './value-objects/application-stage';
export { ApplicationProgress } from './value-objects/application-progress';
export { Consent } from './value-objects/consent';
export type { ConsentData } from './value-objects/consent';

// Ports
export type { CreditApplicationRepository } from './ports/credit-application-repository.port';
export type {
  AdminConfig,
  IdentificationTypeConfig,
  CountryConfig,
  ScreenTexts,
} from './ports/admin-config.port';
export type { TSEQuery, PersonName } from './ports/tse-query.port';
export type { CreditBureau, CreditScore } from './ports/credit-bureau.port';
export type {
  ScreenContentRepository,
  ScreenContent,
  ScreenCopy,
  ScreenMedia,
  ScreenBranding,
} from './ports/screen-content.port';

export type {
  VerificationFlow,
  IdentityVerificationResult,
  IdentityVerificationPort,
  IdentityVerificationStatusResult,
  IdentityVerificationStatusPort,
} from './ports/identity-verification.port';

// Errors (re-exported from shared for convenience)
export {
  DomainError,
  NotFoundError,
  NetworkError,
  ValidationError,
  ok,
  err,
} from '@shared/result/result';
export type { Result } from '@shared/result/result';
