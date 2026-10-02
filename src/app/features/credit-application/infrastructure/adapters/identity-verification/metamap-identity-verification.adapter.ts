import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  IdentityVerificationPort,
  IdentityVerificationResult,
  VerificationFlow,
} from '@credit-application/domain';
import { Result, ok, err, DomainError, NetworkError } from '@shared/result/result';
import { API_BASE_URL } from '@core/config/api.config';
import { LOGGER } from '@core/core';
import { Logger } from '@core/ports/logger.port';
import { IdentityValidationResultDto } from './identity-validation-result.dto';
import { mapDtoToIdentityValidationResult } from './identity-validation-result.mapper';

@Injectable({ providedIn: 'root' })
export class MetamapIdentityVerificationAdapter implements IdentityVerificationPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly logger = inject<Logger>(LOGGER);

  async verify(
    identificationNumber: string,
    flow: VerificationFlow,
  ): Promise<Result<IdentityVerificationResult, DomainError>> {
    try {
      const dto = await firstValueFrom(
        this.http.post<IdentityValidationResultDto>(
          `${this.baseUrl}/validacion/identidad`,
          { identificationNumber, flow },
        ),
      );
      const mapped = mapDtoToIdentityValidationResult(dto);
      return ok({
        approved: mapped.approved,
        validatedIdentificationNumber: mapped.validatedIdentificationNumber,
        errorCode: mapped.errorCode,
      });
    } catch (error) {
      this.logger.error('Failed to validate identity', error);
      return err(new NetworkError());
    }
  }
}
