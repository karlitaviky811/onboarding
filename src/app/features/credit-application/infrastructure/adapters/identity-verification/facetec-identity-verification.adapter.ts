import { Injectable, inject } from '@angular/core';
import {
  IdentityVerificationPort,
  IdentityVerificationResult,
  VerificationFlow,
} from '@credit-application/domain';
import { Result, ok, DomainError } from '@shared/result/result';
import { LOGGER } from '@core/core';
import { Logger } from '@core/ports/logger.port';

/**
 * Identity verification adapter stub for FaceTec.
 *
 * TODO (Phase 5): Implement real FaceTec SDK integration.
 */
@Injectable({ providedIn: 'root' })
export class FacetecIdentityVerificationAdapter implements IdentityVerificationPort {
  private readonly logger = inject<Logger>(LOGGER);

  async verify(
    _identificationNumber: string,
    _flow: VerificationFlow,
  ): Promise<Result<IdentityVerificationResult, DomainError>> {
    this.logger.warn('[facetec] identity verification not implemented — returning stub');
    return ok({ approved: false });
  }
}
