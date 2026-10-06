
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
    case 'metamap-widget':
    case 'persona-widget':
    case 'onfido-widget':
    case 'metamap':
    default:        return injector.get(MetamapIdentityVerificationAdapter);
  }
}
