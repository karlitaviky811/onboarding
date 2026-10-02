/**
 * Pure resolver function that selects the correct IdentityVerificationPort adapter
 * from the Angular DI injector based on the configured provider name.
 *
 * This is a leaf module: it imports adapter classes directly (NOT via any barrel) to
 * avoid the circular import TDZ that arises when specs in the providers directory
 * cause Vitest to resolve:
 *   infrastructure/index.ts → credit-application.routes.ts → credit-application.providers.ts
 *
 * Keeping this function in its own file lets specs import resolveIdentityVerificationAdapter
 * and test the real production routing logic without triggering that cycle.
 */

import { Injector } from '@angular/core';
import { IdentityVerificationPort } from '@credit-application/domain';
import { MetamapIdentityVerificationAdapter } from '../adapters/identity-verification/metamap-identity-verification.adapter';
import { FacetecIdentityVerificationAdapter } from '../adapters/identity-verification/facetec-identity-verification.adapter';
import { RegulaIdentityVerificationAdapter } from '../adapters/identity-verification/regula-identity-verification.adapter';

export function resolveIdentityVerificationAdapter(
  providerName: string,
  injector: Injector,
): IdentityVerificationPort {
  switch (providerName) {
    case 'facetec': return injector.get(FacetecIdentityVerificationAdapter);
    case 'regula':  return injector.get(RegulaIdentityVerificationAdapter);
    // 'metamap-widget' is a UI-only provider: the widget handles identity flow in-page via
    // OriginacionValidationAdapter. The domain IdentityVerificationPort is not exercised on this
    // path, but the DI factory must remain total so the token resolves without throwing.
    // Mapping to MetamapIdentityVerificationAdapter keeps the factory safe — the port will
    // simply never be called when the page's useWidget branch is active.
    case 'metamap-widget':
    // 'persona-widget' is also a UI-only provider (same reasoning as metamap-widget above).
    case 'persona-widget':
    // 'onfido-widget' is also a UI-only provider (same reasoning as metamap-widget above).
    // Onfido renders inline; the domain IdentityVerificationPort is not exercised on this path.
    case 'onfido-widget':
    case 'metamap':
    default:        return injector.get(MetamapIdentityVerificationAdapter);
  }
}
