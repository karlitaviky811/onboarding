export interface IdentityValidationResultDto {
  approved: boolean;
  validated_identification_number?: string;
  error_code?: string;
}
