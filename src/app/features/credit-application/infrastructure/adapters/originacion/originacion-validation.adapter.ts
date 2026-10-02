import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Result, ok, err, NetworkError } from '@shared/result/result';
import { ORIGINACION_BASE_URL, ORIGINACION_CHANNEL_ID } from '@core/config/originacion.config';
import {
  GetMetamapButtonDataRequestDto,
  GetMetamapButtonDataResponseDto,
  SaveValidationVerificationRequestDto,
  SaveValidationVerificationResponseDto,
  ButtonDataViewModel,
} from './originacion-validation.dto';
import { VerdictOutcome } from './verdict.map';
import { mapButtonDataResponse, mapSaveVerificationResponse } from './originacion-validation.mapper';


@Injectable({ providedIn: 'root' })
export class OriginacionValidationAdapter {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(ORIGINACION_BASE_URL);
  private readonly channelId = inject(ORIGINACION_CHANNEL_ID);

  /**
   * Fetches MetaMap button-data (clientId, workflowId, identityId, validated) from
   * POST /validations/getmetamapbuttondata.
   *
   * @param validationId - ASSUMPTION (PR-B OQ-1): session identifier whose source
   *   is unconfirmed. Callers pass a placeholder until PR-B resolves the source.
   */
  async getButtonData(
    validationId: string,
  ): Promise<Result<ButtonDataViewModel, NetworkError>> {
    const body: GetMetamapButtonDataRequestDto = {
      validationId,
      channelId: this.channelId,
    };

    try {
      const dto = await firstValueFrom(
        this.http.post<GetMetamapButtonDataResponseDto>(
          `${this.baseUrl}/validations/getmetamapbuttondata`,
          body,
        ),
      );
      return ok(mapButtonDataResponse(dto));
    } catch {
      return err(new NetworkError());
    }
  }

  async saveVerification(
    validationId: string,
    verificationId: string,
  ): Promise<Result<VerdictOutcome, NetworkError>> {
    const body: SaveValidationVerificationRequestDto = {
      validationId,
      verificationId,
      channelId: this.channelId,
      isCreditWeb: false,
    };

    try {
      const dto = await firstValueFrom(
        this.http.post<SaveValidationVerificationResponseDto>(
          `${this.baseUrl}/validations/savevalidationverification`,
          body,
        ),
      );
      return ok(mapSaveVerificationResponse(dto));
    } catch {
      return err(new NetworkError());
    }
  }
}
