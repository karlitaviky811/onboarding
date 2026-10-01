import { EnvironmentProviders, Injector, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import {
  CreditApplicationRepository,
  IdentityVerificationPort,
  IdentityVerificationStatusPort,
} from '@credit-application/domain';
import { AdminConfig } from '@credit-application/domain';
import { TSEQuery } from '@credit-application/domain';
import { ScreenContentRepository } from '@credit-application/domain';
import { CredixCoreAdapter } from '../adapters/credix-core/credix-core.adapter';
import { AdminConfigAdapter } from '../adapters/admin/admin-config.adapter';
import { TSEQueryAdapter } from '../adapters/tse/tse-query.adapter';
import { ScreenContentAdapter } from '../adapters/screen-content/screen-content.adapter';
import { CreditApplicationFacade } from '../../application/credit-application.facade';
import { HttpRedirectIdentityVerificationAdapter } from '../adapters/identity-verification/http-redirect-identity-verification.adapter';
import { resolveIdentityVerificationAdapter } from './identity-verification-resolver';
export { resolveIdentityVerificationAdapter } from './identity-verification-resolver';

export const CREDIT_APPLICATION_REPOSITORY =
  new InjectionToken<CreditApplicationRepository>('CreditApplicationRepository');

export const ADMIN_CONFIG =
  new InjectionToken<AdminConfig>('AdminConfig');

export const TSE_QUERY =
  new InjectionToken<TSEQuery>('TSEQuery');

export const SCREEN_CONTENT_REPOSITORY =
  new InjectionToken<ScreenContentRepository>('ScreenContentRepository');

/** Selects the data-match/verify adapter for the configured identity provider. */
export const IDENTITY_VERIFICATION =
  new InjectionToken<IdentityVerificationPort>('IdentityVerification');

/** Always resolves to the redirect flow adapter (HTTP redirect + status poll). Implements both verify() and getStatus(). */
export const IDENTITY_VERIFICATION_STATUS =
  new InjectionToken<IdentityVerificationPort & IdentityVerificationStatusPort>('IdentityVerificationStatus');


export function provideCreditApplication(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CREDIT_APPLICATION_REPOSITORY, useExisting: CredixCoreAdapter },
    {
      provide: IDENTITY_VERIFICATION,
      useFactory: (adminConfig: AdminConfig, injector: Injector): IdentityVerificationPort =>
        resolveIdentityVerificationAdapter(adminConfig.getIdentityProvider(), injector),
      deps: [AdminConfigAdapter, Injector],
    },
    { provide: IDENTITY_VERIFICATION_STATUS, useExisting: HttpRedirectIdentityVerificationAdapter },
    { provide: ADMIN_CONFIG,                  useExisting: AdminConfigAdapter },
    { provide: TSE_QUERY,                     useExisting: TSEQueryAdapter },
    { provide: SCREEN_CONTENT_REPOSITORY,     useExisting: ScreenContentAdapter },
    CreditApplicationFacade,
  ]);
}
