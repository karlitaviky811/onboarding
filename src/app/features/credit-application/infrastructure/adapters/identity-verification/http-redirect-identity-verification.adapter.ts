import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  IdentityVerificationPort,
  IdentityVerificationResult,
  IdentityVerificationStatusPort,
  IdentityVerificationStatusResult,
  VerificationFlow,
} from '@credit-application/domain';
import { Result, ok, err, DomainError, NetworkError } from '@shared/result/result';
import { API_BASE_URL } from '@core/config/api.config';
import { LOGGER } from '@core/core';
import { Logger } from '@core/ports/logger.port';

interface IdentityVerificationResponseDto {
  verificationId?: unknown;
  status?: unknown;
  interactionUrl?: unknown;
}

@Injectable({ providedIn: 'root' })
export class HttpRedirectIdentityVerificationAdapter
  implements IdentityVerificationPort, IdentityVerificationStatusPort
{
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly logger = inject<Logger>(LOGGER);

  async verify(
    identificationNumber: string,
    _flow: VerificationFlow,
  ): Promise<Result<IdentityVerificationResult, DomainError>> {
    try {
      const dto = await firstValueFrom(
        this.http.post<IdentityVerificationResponseDto>(
          `${this.baseUrl}/identity-verifications`,
          { identificationNumber },
        ),
      );

      const verificationId =
        typeof dto?.verificationId === 'string' ? dto.verificationId : undefined;
      const redirectUrl =
        typeof dto?.interactionUrl === 'string' && dto.interactionUrl.trim().length > 0
          ? dto.interactionUrl
          : undefined;

      return ok({
        approved: false,
        redirectUrl,
        verificationId,
      });
    } catch (error) {
      this.logger.error('Failed to create identity verification', error);
      return err(new NetworkError());
    }
  }

  async getStatus(
    verificationId: string,
  ): Promise<Result<IdentityVerificationStatusResult, DomainError>> {
    try {
      const dto = await firstValueFrom(
        this.http.get<IdentityVerificationResponseDto>(
          `${this.baseUrl}/identity-verifications/${encodeURIComponent(verificationId)}`,
        ),
      );

      const status = typeof dto?.status === 'string' ? dto.status : 'unknown';

      return ok({ status });
    } catch (error) {
      this.logger.error('Failed to retrieve identity verification status', error);
      return err(new NetworkError());
    }
  }
}
