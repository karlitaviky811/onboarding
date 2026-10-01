import { ApplicationStage, ApplicationSubstage } from './application-stage';

// Application progress pointer to resume the flow
export class ApplicationProgress {
  constructor(
    readonly stage: ApplicationStage,
    readonly substage: ApplicationSubstage,
    readonly completedAt?: Date,
  ) {}

  isCompleted(): boolean {
    return this.completedAt !== undefined;
  }

  static initial(): ApplicationProgress {
    return new ApplicationProgress(
      ApplicationStage.Request,
      ApplicationSubstage.BasicData,
    );
  }
}
