import { IdentityValidationResult } from '@credit-application/domain';
import { IdentityValidationResultDto } from './identity-validation-result.dto';

export function mapDtoToIdentityValidationResult(dto: IdentityValidationResultDto): IdentityValidationResult {
  return {
    approved: dto.approved,
    validatedIdentificationNumber: dto.validated_identification_number,
    errorCode: dto.error_code,
  };
}

export function mapIdentityValidationResultToDto(result: IdentityValidationResult): IdentityValidationResultDto {
  return {
    approved: result.approved,
    validated_identification_number: result.validatedIdentificationNumber,
    error_code: result.errorCode,
  };
}
