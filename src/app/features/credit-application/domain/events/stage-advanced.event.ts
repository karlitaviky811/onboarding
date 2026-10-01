import { DomainEvent } from './domain-event';
import { ApplicationStage } from '../value-objects/application-stage';
import { ApplicationSubstage } from '../value-objects/application-stage';

export class StageAdvancedEvent implements DomainEvent {
  readonly occurredAt = new Date();
  readonly type = 'StageAdvanced';
  constructor(
    readonly applicationId: string,
    readonly stage: ApplicationStage,
    readonly substage: ApplicationSubstage,
  ) {}
}
