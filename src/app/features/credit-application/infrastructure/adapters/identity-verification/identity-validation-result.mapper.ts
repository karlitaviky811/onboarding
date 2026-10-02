import { IdentityVerificationResult } from '@credit-application/domain';
import { IdentityValidationResultDto } from './identity-validation-result.dto';

export function mapDtoToIdentityValidationResult(dto: IdentityValidationResultDto): IdentityVerificationResult {
  return {
    approved: dto.approved,
    validatedIdentificationNumber: dto.validated_identification_number,
    errorCode: dto.error_code,
  };
}
