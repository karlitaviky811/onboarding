import { Identification } from '../value-objects/identification';
import { UserType } from '../value-objects/user-type';
import { ApplicationStage, ApplicationSubstage } from '../value-objects/application-stage';
import { ApplicationProgress } from '../value-objects/application-progress';
import { ApplicantProfile } from './applicant-profile';
import { ProgressEntry, ProgressEntryStatus } from './progress-entry';
import { DomainEvent } from '../events/domain-event';
import { StageAdvancedEvent } from '../events/stage-advanced.event';

export type ApplicationResult = 'Approved' | 'UnderReview' | 'NotApproved';

// Aggregate root — Origination (the complete credit application process)
export class CreditApplication {
  private constructor(
    readonly id: string,
    readonly identification: Identification,
    readonly userType: UserType,
    readonly currentProgress: ApplicationProgress,
    readonly profile: ApplicantProfile,
    readonly progressLog: ProgressEntry[],
    private readonly _events: DomainEvent[],
    readonly result?: ApplicationResult,
    readonly createdAt?: Date,
  ) {}

  static create(id: string, identification: Identification): CreditApplication {
    return new CreditApplication(
      id,
      identification,
      UserType.NewClient,
      ApplicationProgress.initial(),
      new ApplicantProfile(identification.number, identification.type),
      [],
      [],
      undefined,
      new Date(),
    );
  }

  static reconstruct(
    id: string,
    identification: Identification,
    userType: UserType,
    currentProgress: ApplicationProgress,
    profile: ApplicantProfile,
    progressLog: ProgressEntry[],
    result?: ApplicationResult,
    createdAt?: Date,
  ): CreditApplication {
    return new CreditApplication(
      id, identification, userType,
      currentProgress, profile, progressLog,
      [],
      result, createdAt,
    );
  }

  get events(): readonly DomainEvent[] {
    return this._events;
  }

  clearEvents(): CreditApplication {
    return new CreditApplication(
      this.id, this.identification, this.userType,
      this.currentProgress, this.profile, this.progressLog,
      [],
      this.result, this.createdAt,
    );
  }

  withUserType(userType: UserType): CreditApplication {
    return new CreditApplication(
      this.id, this.identification, userType,
      this.currentProgress, this.profile, this.progressLog,
      this._events,
      this.result, this.createdAt,
    );
  }

  advanceTo(stage: ApplicationStage, substage: ApplicationSubstage): CreditApplication {
    const newProgress = new ApplicationProgress(stage, substage, new Date());
    const event = new StageAdvancedEvent(this.id, stage, substage);
    return new CreditApplication(
      this.id, this.identification, this.userType,
      newProgress, this.profile, this.progressLog,
      [...this._events, event],
      this.result, this.createdAt,
    );
  }

  recordProgress(
    stage: ApplicationStage,
    substage: ApplicationSubstage,
    status: ProgressEntryStatus,
    metadata?: Record<string, unknown>,
  ): CreditApplication {
    const entry = new ProgressEntry(stage, substage, status, metadata);
    return new CreditApplication(
      this.id, this.identification, this.userType,
      this.currentProgress, this.profile,
      [...this.progressLog, entry],
      this._events,
      this.result, this.createdAt,
    );
  }

  withResult(result: ApplicationResult): CreditApplication {
    return new CreditApplication(
      this.id, this.identification, this.userType,
      this.currentProgress, this.profile, this.progressLog,
      this._events,
      result, this.createdAt,
    );
  }

  isFlipClient(): boolean {
    return this.userType === UserType.FlipClient;
  }

  isExistingClient(): boolean {
    return this.userType === UserType.ClientWithCard ||
           this.userType === UserType.ClientWithoutCard ||
           this.userType === UserType.FlipClient;
  }

  isResuming(): boolean {
    return this.userType === UserType.Prospect;
  }
}
