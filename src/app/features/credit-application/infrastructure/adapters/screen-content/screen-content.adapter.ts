import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '@core/config/api.config';
import { LOGGER } from '@core/core';
import { Logger } from '@core/ports/logger.port';
import { Result, ok, err, NetworkError } from '@shared/result/result';
import {
  ScreenContentRepository,
  ScreenContent,
} from '../../../domain/ports/screen-content.port';

@Injectable({ providedIn: 'root' })
export class ScreenContentAdapter implements ScreenContentRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly logger = inject(LOGGER);

  async load(screenKey: string): Promise<Result<ScreenContent, NetworkError>> {
    try {
      const response = await firstValueFrom(
        this.http.get<ScreenContent>(
          `${this.baseUrl}/admin/screens/${screenKey}`,
        ),
      );
      return ok(response);
    } catch (error) {
      this.logger.error(`Failed to load screen content for ${screenKey}`, error);
      return err(new NetworkError());
    }
  }
}
