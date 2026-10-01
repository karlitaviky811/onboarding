import { ApplicationStage, ApplicationSubstage } from '../value-objects/application-stage';

export type ProgressEntryStatus = 'success' | 'error' | 'abandoned';

// Single entry in Progress Log
export class ProgressEntry {
  readonly timestamp: Date;

  constructor(
    readonly stage: ApplicationStage,
    readonly substage: ApplicationSubstage,
    readonly status: ProgressEntryStatus,
    readonly metadata?: Record<string, unknown>,
  ) {
    this.timestamp = new Date();
  }
}
