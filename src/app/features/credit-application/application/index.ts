// Application barrel — re-exports facade and use cases

export { CreditApplicationFacade } from './credit-application.facade';

export { DetermineUserTypeUseCase } from './use-cases/determine-user-type.use-case';
export { ValidateIdentityUseCase } from './use-cases/validate-identity.use-case';
export type { ValidationOutcome } from './use-cases/validate-identity.use-case';
export { CaptureConsentUseCase } from './use-cases/capture-consent.use-case';
export { ResumeApplicationUseCase } from './use-cases/resume-application.use-case';
