// Infrastructure barrel — re-exports providers, adapters, and routes

export {
  CREDIT_APPLICATION_REPOSITORY,
  IDENTITY_VERIFICATION,
  IDENTITY_VERIFICATION_STATUS,
  ADMIN_CONFIG,
  TSE_QUERY,
  provideCreditApplication,
} from './providers/credit-application.providers';

export { CredixCoreAdapter } from './adapters/credix-core/credix-core.adapter';
export { AdminConfigAdapter } from './adapters/admin/admin-config.adapter';
export { TSEQueryAdapter } from './adapters/tse/tse-query.adapter';

// New identity-verification adapters
export { MetamapIdentityVerificationAdapter } from './adapters/identity-verification/metamap-identity-verification.adapter';
export { HttpRedirectIdentityVerificationAdapter } from './adapters/identity-verification/http-redirect-identity-verification.adapter';
export { FacetecIdentityVerificationAdapter } from './adapters/identity-verification/facetec-identity-verification.adapter';
export { RegulaIdentityVerificationAdapter } from './adapters/identity-verification/regula-identity-verification.adapter';

export { creditApplicationRoutes } from './ui/credit-application.routes';
