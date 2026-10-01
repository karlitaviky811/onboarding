import { CreditApplication } from '@credit-application/domain';
import { Identification, IdentificationType } from '@credit-application/domain';
import { UserType } from '@credit-application/domain';
import { ApplicationStage, ApplicationSubstage } from '@credit-application/domain';
import { ApplicationProgress } from '@credit-application/domain';
import { ApplicantProfile } from '@credit-application/domain';
import { ProgressEntry } from '@credit-application/domain';
import { CreditApplicationResponseDto, CreditApplicationRequestDto } from './credit-application.dto';

function parseStage(value: string): ApplicationStage {
  const match = Object.entries(ApplicationStage).find(([, v]) => v === value);
  if (!match) throw new Error(`Unknown ApplicationStage: ${value}`);
  return match[1] as ApplicationStage;
}

function parseSubstage(value: string): ApplicationSubstage {
  const match = Object.entries(ApplicationSubstage).find(([, v]) => v === value);
  if (!match) throw new Error(`Unknown ApplicationSubstage: ${value}`);
  return match[1] as ApplicationSubstage;
}

function parseUserType(value: string): UserType {
  const match = Object.entries(UserType).find(([, v]) => v === value);
  if (!match) throw new Error(`Unknown UserType: ${value}`);
  return match[1] as UserType;
}

function parseIdentificationType(value: string): IdentificationType {
  const match = Object.entries(IdentificationType).find(([, v]) => v === value);
  if (!match) throw new Error(`Unknown IdentificationType: ${value}`);
  return match[1] as IdentificationType;
}

// Note: 'NACIONAL' maps to IdentificationType.National, 'DIMEX' maps to IdentificationType.DIMEX

export function mapDtoToCreditApplication(dto: CreditApplicationResponseDto): CreditApplication {
  const identification = new Identification(
    parseIdentificationType(dto.identification_type),
    dto.identification_number,
  );

  const currentProgress = new ApplicationProgress(
    parseStage(dto.current_stage),
    parseSubstage(dto.current_substage),
    dto.current_completed_at ? new Date(dto.current_completed_at) : undefined,
  );

  const profile = new ApplicantProfile(
    dto.profile.identification_number,
    dto.profile.identification_type,
    dto.profile.first_name,
    dto.profile.last_name,
    dto.profile.contact
      ? {
          countryCode: dto.profile.contact.country_code,
          phone: dto.profile.contact.phone,
          email: dto.profile.contact.email,
        }
      : undefined,
    dto.profile.validated_at ? new Date(dto.profile.validated_at) : undefined,
  );

  const progressLog = dto.progress_log.map(entry =>
    new ProgressEntry(
      parseStage(entry.stage),
      parseSubstage(entry.substage),
      entry.status,
      entry.metadata,
    ),
  );

  return CreditApplication.reconstruct(
    dto.id,
    identification,
    parseUserType(dto.user_type),
    currentProgress,
    profile,
    progressLog,
    dto.result as ('Approved' | 'UnderReview' | 'NotApproved') | undefined,
    dto.created_at ? new Date(dto.created_at) : undefined,
  );
}

export function mapCreditApplicationToDto(app: CreditApplication): CreditApplicationRequestDto {
  return {
    id: app.id,
    identification_type: app.identification.type,
    identification_number: app.identification.number,
    user_type: app.userType,
    current_stage: app.currentProgress.stage,
    current_substage: app.currentProgress.substage,
    current_completed_at: app.currentProgress.completedAt?.toISOString(),
    profile: {
      identification_number: app.profile.identificationNumber,
      identification_type: app.profile.identificationType,
      first_name: app.profile.firstName,
      last_name: app.profile.lastName,
      contact: app.profile.contact
        ? {
            country_code: app.profile.contact.countryCode,
            phone: app.profile.contact.phone,
            email: app.profile.contact.email,
          }
        : undefined,
      validated_at: app.profile.validatedAt?.toISOString(),
    },
    progress_log: app.progressLog.map(entry => ({
      stage: entry.stage,
      substage: entry.substage,
      status: entry.status,
      metadata: entry.metadata,
      timestamp: entry.timestamp.toISOString(),
    })),
    result: app.result,
    created_at: app.createdAt?.toISOString(),
  };
}
