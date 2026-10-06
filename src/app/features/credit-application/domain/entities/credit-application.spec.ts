import { describe, test, expect } from 'vitest';
import { CreditApplication } from './credit-application';
import { Identification, IdentificationType } from '../value-objects/identification';
import { UserType } from '../value-objects/user-type';
import { ApplicationStage, ApplicationSubstage } from '../value-objects/application-stage';
import { ApplicationProgress } from '../value-objects/application-progress';
import { ApplicantProfile } from './applicant-profile';
import { StageAdvancedEvent } from '../events/stage-advanced.event';

describe('CreditApplication', () => {
  const identification = new Identification(IdentificationType.National, '123456789');

  test('create should initialize with correct defaults', () => {
    const app = CreditApplication.create('app-1', identification);

    expect(app.id).toBe('app-1');
    expect(app.identification).toBe(identification);
    expect(app.userType).toBe(UserType.NewClient);
    expect(app.currentProgress.stage).toBe(ApplicationStage.Request);
    expect(app.currentProgress.substage).toBe(ApplicationSubstage.BasicData);
    expect(app.progressLog).toEqual([]);
    expect(app.result).toBeUndefined();
    expect(app.createdAt).toBeInstanceOf(Date);
  });

  test('withUserType should return a new instance without mutating the original', () => {
    const app = CreditApplication.create('app-1', identification);
    const updated = app.withUserType(UserType.FlipClient);

    expect(updated.userType).toBe(UserType.FlipClient);
    expect(app.userType).toBe(UserType.NewClient);
    expect(updated).not.toBe(app);
  });

  test('advanceTo should update progress', () => {
    const app = CreditApplication.create('app-1', identification);
    const updated = app.advanceTo(ApplicationStage.IdentityValidation, ApplicationSubstage.IdentityValidationStep);

    expect(updated.currentProgress.stage).toBe(ApplicationStage.IdentityValidation);
    expect(updated.currentProgress.substage).toBe(ApplicationSubstage.IdentityValidationStep);
    expect(updated.currentProgress.isCompleted()).toBe(true);
  });

  test('recordProgress should append to log', () => {
    const app = CreditApplication.create('app-1', identification);
    const updated = app.recordProgress(ApplicationStage.Request, ApplicationSubstage.Consent, 'success');

    expect(updated.progressLog.length).toBe(1);
    expect(updated.progressLog[0].stage).toBe(ApplicationStage.Request);
    expect(updated.progressLog[0].substage).toBe(ApplicationSubstage.Consent);
  });

  test('isFlipClient should work correctly', () => {
    const app = CreditApplication.create('app-1', identification).withUserType(UserType.FlipClient);
    expect(app.isFlipClient()).toBe(true);

    const notFlip = CreditApplication.create('app-2', identification);
    expect(notFlip.isFlipClient()).toBe(false);
  });

  test('isExistingClient should work correctly', () => {
    expect(CreditApplication.create('app-1', identification).withUserType(UserType.ClientWithCard).isExistingClient()).toBe(true);
    expect(CreditApplication.create('app-2', identification).withUserType(UserType.ClientWithoutCard).isExistingClient()).toBe(true);
    expect(CreditApplication.create('app-3', identification).withUserType(UserType.FlipClient).isExistingClient()).toBe(true);
    expect(CreditApplication.create('app-4', identification).isExistingClient()).toBe(false);
    expect(CreditApplication.create('app-5', identification).withUserType(UserType.Prospect).isExistingClient()).toBe(false);
  });

  test('isResuming should work correctly', () => {
    const app = CreditApplication.create('app-1', identification).withUserType(UserType.Prospect);
    expect(app.isResuming()).toBe(true);

    const notResuming = CreditApplication.create('app-2', identification);
    expect(notResuming.isResuming()).toBe(false);
  });

  test('domain events should be populated on advanceTo', () => {
    const app = CreditApplication.create('app-1', identification);
    expect(app.events.length).toBe(0);

    const updated = app.advanceTo(ApplicationStage.IdentityValidation, ApplicationSubstage.IdentityValidationStep);
    expect(updated.events.length).toBe(1);

    const event = updated.events[0];
    expect(event).toBeInstanceOf(StageAdvancedEvent);
    expect(event.type).toBe('StageAdvanced');
    expect((event as StageAdvancedEvent).applicationId).toBe('app-1');
    expect((event as StageAdvancedEvent).stage).toBe(ApplicationStage.IdentityValidation);
    expect((event as StageAdvancedEvent).substage).toBe(ApplicationSubstage.IdentityValidationStep);
  });

  test('clearEvents should return a copy with empty events', () => {
    const app = CreditApplication.create('app-1', identification)
      .advanceTo(ApplicationStage.IdentityValidation, ApplicationSubstage.IdentityValidationStep);

    expect(app.events.length).toBe(1);

    const cleared = app.clearEvents();
    expect(cleared.events.length).toBe(0);
    expect(cleared).not.toBe(app);
  });

  test('reconstruct should build an application from persistent data without emitting events', () => {
    const progress = ApplicationProgress.initial();
    const profile = new ApplicantProfile('123456789', 'NACIONAL', 'Ana', 'Pérez');
    const createdAt = new Date('2026-01-01T00:00:00.000Z');

    const app = CreditApplication.reconstruct(
      'app-recon-1',
      identification,
      UserType.Prospect,
      progress,
      profile,
      [],
      'Approved',
      createdAt,
    );

    expect(app.id).toBe('app-recon-1');
    expect(app.userType).toBe(UserType.Prospect);
    expect(app.result).toBe('Approved');
    expect(app.createdAt).toEqual(createdAt);
    expect(app.events.length).toBe(0);
  });

  test('withResult returns new instance with the given result and does not mutate original', () => {
    const app = CreditApplication.create('app-1', identification);
    expect(app.result).toBeUndefined();

    const withApproved = app.withResult('Approved');
    expect(withApproved.result).toBe('Approved');
    expect(app.result).toBeUndefined();
  });
});
