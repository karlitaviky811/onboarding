import { Injectable, computed, inject, signal } from '@angular/core';
import { CreditApplication, PersonName } from '@credit-application/domain';
import { UserType } from '@credit-application/domain';
import { ApplicationStage, ApplicationSubstage } from '@credit-application/domain';
import {
  CREDIT_APPLICATION_REPOSITORY,
  IDENTITY_VERIFICATION,
  ADMIN_CONFIG,
  TSE_QUERY,
} from '@credit-application/infrastructure';
import { DetermineUserTypeUseCase } from './use-cases/determine-user-type.use-case';
import { ValidateIdentityUseCase } from './use-cases/validate-identity.use-case';
import { CaptureConsentUseCase } from './use-cases/capture-consent.use-case';
import { ResumeApplicationUseCase } from './use-cases/resume-application.use-case';

// Angular-aware orchestrator. Connects use-cases (domain) with signals (UI).
// All signals live here — the domain is pure TypeScript.
@Injectable()
export class CreditApplicationFacade {
  private readonly repo                = inject(CREDIT_APPLICATION_REPOSITORY);
  private readonly identityVerification = inject(IDENTITY_VERIFICATION);
  readonly adminConfig                 = inject(ADMIN_CONFIG);
  readonly tseQuery                    = inject(TSE_QUERY);

  readonly determineUserType  = new DetermineUserTypeUseCase(this.repo);
  readonly validateIdentity   = new ValidateIdentityUseCase(this.identityVerification);
  readonly captureConsent     = new CaptureConsentUseCase(this.repo);
  readonly resumeApplication  = new ResumeApplicationUseCase(this.repo);

  private readonly _application       = signal<CreditApplication | null>(null);
  private readonly _userType          = signal<UserType | null>(null);
  private readonly _isLoading         = signal(false);
  private readonly _validationRetries = signal(0);
  private readonly _error             = signal<string | null>(null);
  /**
   * Stores the person name fetched from TSE during BasicData.onContinue().
   * Consumed by the Consent and Retomando screens to greet the user by name.
   */
  private readonly _personName        = signal<PersonName | null>(null);

  readonly application  = this._application.asReadonly();
  readonly userType     = this._userType.asReadonly();
  readonly isLoading    = this._isLoading.asReadonly();
  readonly error        = this._error.asReadonly();
  readonly personName   = this._personName.asReadonly();

  readonly isFlipClient     = computed(() => this._userType() === UserType.FlipClient);
  readonly isNewClient      = computed(() => this._userType() === UserType.NewClient);
  readonly isResuming       = computed(() => this._userType() === UserType.Prospect);
  readonly isExistingClient = computed(() =>
    this._userType() === UserType.ClientWithCard ||
    this._userType() === UserType.ClientWithoutCard
  );

  readonly currentStage = computed(
    () => this._application()?.currentProgress.stage ?? ApplicationStage.Request
  );

  readonly currentSubstage = computed(
    () => this._application()?.currentProgress.substage ?? ApplicationSubstage.BasicData
  );

  setApplication(application: CreditApplication): void {
    this._application.set(application);
    this._userType.set(application.userType);
  }

  setPersonName(name: PersonName): void {
    this._personName.set(name);
  }

  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  setError(message: string | null): void {
    this._error.set(message);
  }

  incrementRetries(): void {
    this._validationRetries.update(n => n + 1);
  }

  getRetries(): number {
    return this._validationRetries();
  }

  reset(): void {
    this._application.set(null);
    this._userType.set(null);
    this._isLoading.set(false);
    this._validationRetries.set(0);
    this._error.set(null);
    this._personName.set(null);
  }
}
