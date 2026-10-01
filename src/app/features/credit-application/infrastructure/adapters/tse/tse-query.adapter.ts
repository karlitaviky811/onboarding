import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PersonName, TSEQuery } from '@credit-application/domain';
import { Result, ok, err, NotFoundError, NetworkError } from '@shared/result/result';
import { API_BASE_URL } from '@core/config/api.config';
import { LOGGER } from '@core/core';
import { Logger } from '@core/ports/logger.port';
import { PersonNameDto } from './person-name.dto';
import { mapDtoToPersonName } from './person-name.mapper';

@Injectable({ providedIn: 'root' })
export class TSEQueryAdapter implements TSEQuery {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly logger = inject(LOGGER);

  async findByIdentification(identificationNumber: string): Promise<Result<PersonName | null, NotFoundError | NetworkError>> {
    try {
      const dto = await firstValueFrom(
        this.http.get<PersonNameDto>(`${this.baseUrl}/tse/personas/${identificationNumber}`),
      );
      return ok(mapDtoToPersonName(dto));
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return err(new NotFoundError('PersonName'));
      }
      this.logger.error('Failed to find person by identification', error);
      return err(new NetworkError());
    }
  }
}
