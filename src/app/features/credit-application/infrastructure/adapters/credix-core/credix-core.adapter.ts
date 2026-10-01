import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CreditApplicationRepository } from '@credit-application/domain';
import { CreditApplication } from '@credit-application/domain';
import { Identification } from '@credit-application/domain';
import { Result, ok, err, NotFoundError, NetworkError } from '@shared/result/result';
import { API_BASE_URL } from '@core/config/api.config';
import { LOGGER } from '@core/core';
import { Logger } from '@core/ports/logger.port';
import { CreditApplicationResponseDto, CreditApplicationRequestDto } from './credit-application.dto';
import { mapDtoToCreditApplication, mapCreditApplicationToDto } from './credit-application.mapper';

@Injectable({ providedIn: 'root' })
export class CredixCoreAdapter implements CreditApplicationRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly logger = inject(LOGGER);

  async findByIdentification(identification: Identification): Promise<Result<CreditApplication | null, NotFoundError | NetworkError>> {
    try {
      const response = await firstValueFrom(
        this.http.get<CreditApplicationResponseDto | null>(
          `${this.baseUrl}/originacion/solicitudes/${identification.number}`,
        ),
      );
      return ok(response ? mapDtoToCreditApplication(response) : null);
    } catch (error) {
      this.logger.error('Failed to find application by identification', error);
      return err(new NetworkError());
    }
  }

  async save(application: CreditApplication): Promise<Result<CreditApplication, NetworkError>> {
    try {
      const dto = mapCreditApplicationToDto(application);
      const response = await firstValueFrom(
        this.http.post<CreditApplicationRequestDto>(
          `${this.baseUrl}/originacion/solicitudes`,
          dto,
        ),
      );
      return ok(mapDtoToCreditApplication(response));
    } catch (error) {
      this.logger.error('Failed to save application', error);
      return err(new NetworkError());
    }
  }

  async findById(id: string): Promise<Result<CreditApplication | null, NotFoundError | NetworkError>> {
    try {
      const response = await firstValueFrom(
        this.http.get<CreditApplicationResponseDto>(`${this.baseUrl}/originacion/solicitudes/${id}`),
      );
      return ok(mapDtoToCreditApplication(response));
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return err(new NotFoundError('CreditApplication'));
      }
      this.logger.error('Failed to find application by id', error);
      return err(new NetworkError());
    }
  }
}
