export interface CreditApplicationResponseDto {
  id: string;
  identification_type: string;
  identification_number: string;
  user_type: string;
  current_stage: string;
  current_substage: string;
  current_completed_at?: string;
  profile: ApplicantProfileDto;
  progress_log: ProgressEntryDto[];
  result?: string;
  created_at?: string;
}

export interface CreditApplicationRequestDto {
  id: string;
  identification_type: string;
  identification_number: string;
  user_type: string;
  current_stage: string;
  current_substage: string;
  current_completed_at?: string;
  profile: ApplicantProfileDto;
  progress_log: ProgressEntryDto[];
  result?: string;
  created_at?: string;
}

export interface ApplicantProfileDto {
  identification_number: string;
  identification_type: string;
  first_name?: string;
  last_name?: string;
  contact?: ContactDataDto;
  validated_at?: string;
}

export interface ContactDataDto {
  country_code: string;
  phone: string;
  email: string;
}

export interface ProgressEntryDto {
  stage: string;
  substage: string;
  status: 'success' | 'error' | 'abandoned';
  metadata?: Record<string, unknown>;
  timestamp: string;
}
