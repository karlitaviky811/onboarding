import { mapVerdict, VerdictOutcome } from './verdict.map';
import {
  ButtonDataViewModel,
  GetMetamapButtonDataResponseDto,
  SaveValidationVerificationResponseDto,
} from './originacion-validation.dto';

export function mapButtonDataResponse(
  dto: GetMetamapButtonDataResponseDto,
): ButtonDataViewModel {
  return {
    clientId: dto.clientId,
    flowId: dto.workflowId,
    identityId: dto.identityId,
    validated: dto.validated,
  };
}

export function mapSaveVerificationResponse(
  dto: SaveValidationVerificationResponseDto,
): VerdictOutcome {
  return mapVerdict(dto.status, dto.triesLeft);
}
