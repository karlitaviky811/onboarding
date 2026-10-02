import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  inject,
  input,
  NgZone,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '@environments/environment';
import type { IdentityVerificationWidget, VerificationWidgetEvent } from '../identity-verification-widget';


type MetamapVerificationCtor = new (cfg: MetamapVerificationConfig) => MetamapVerificationInstance;

interface MetamapVerificationConfig {
  clientId: string;
  flowId: string;
  language: string;
  identityId?: string;
}

interface MetamapVerificationInstance {
  start(): void;
}

interface MetamapWindow {
  MetamapVerification?: MetamapVerificationCtor;
}

interface MetamapFinishDetail {
  verificationId: string;
}

@Component({
  selector: 'app-metamap-widget',
  standalone: true,
  imports: [],
  templateUrl: './metamap-widget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MetamapWidgetComponent implements IdentityVerificationWidget, AfterViewInit, OnDestroy {

  // ── IdentityVerificationWidget interface ───────────────────────────────────

  private readonly _events$ = new Subject<VerificationWidgetEvent>();
  readonly events$ = this._events$.asObservable();

  // ── Signal inputs ──────────────────────────────────────────────────────────

  // Optional: identity-validation sets these via template bindings. In the
  // provider-agnostic Consent path (dynamic createComponent) they stay unset,
  // so open() falls back to environment config — consistent with Persona/Onfido
  // which self-configure from the environment internally.
  readonly clientId = input<string>('');
  readonly flowId = input<string>('');
  readonly identityId = input<string | undefined>(undefined);
  readonly validated = input(0);
  // Default OFF: widgets created via the IdentityVerificationWidget interface
  // (Consent's dynamic createComponent) must launch only on open(), never on init.
  // identity-validation opts in with [autoLaunch]="true" for its auto-open flow.
  readonly autoLaunch = input(false);

  // ── Signal outputs ─────────────────────────────────────────────────────────

  readonly sessionFinished = output<string>();
  readonly sessionExited = output<void>();
  readonly loadError = output<void>();

  // ── Internal state ─────────────────────────────────────────────────────────

  readonly finished = signal(false);
  readonly loading = signal(false);
  readonly loadFailed = signal(false);

  // ── Polling config (injectable for testability) ───────────────────────────

  pollIntervalMs = 150;
  pollMaxAttempts = 15;

  // ── DI ─────────────────────────────────────────────────────────────────────

  private readonly zone = inject(NgZone);

  // ── Event listener refs (for teardown) ─────────────────────────────────────

  private finishHandler?: (e: Event) => void;
  private exitHandler?: (e: Event) => void;

  // ── Double-launch guard ───────────────────────────────────────────────────

  private _launched = false;

  // ── Polling state ─────────────────────────────────────────────────────────

  private _pollTimer?: ReturnType<typeof setInterval>;
  private _pollAttempts = 0;

  constructor() {
    // Already-validated short-circuit: fires reactively when validated becomes truthy.
    // Replaces ngOnChanges + SimpleChanges pattern for signal inputs.
    effect(() => {
      if (this.validated()) {
        this.sessionFinished.emit('ALREADY_VALIDATED');
        this._events$.next({ type: 'finished', verificationId: 'ALREADY_VALIDATED' });
      }
    });
  }

  // ── IdentityVerificationWidget: initialize() ───────────────────────────────

  initialize(_context: { referenceId?: string }): void {
    // Pre-warm only. identity-validation sets inputs via template bindings;
    // Consent's dynamic-create path calls this after createComponent().
    // Actual SDK readiness check happens lazily in _startLaunchSequence.
  }

  /** Implements IdentityVerificationWidget.open(). Triggers the SDK launch sequence. */
  open(): void {
    this.launchSdk();
  }

  // ── IdentityVerificationWidget: destroy() ─────────────────────────────────

  destroy(): void {
    this._stopPolling();
    this.removeListeners();
    this._events$.complete();
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngAfterViewInit(): void {
    if (!this.autoLaunch()) {
      return;
    }
    this._startLaunchSequence();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Triggers the MetaMap SDK launch sequence (readiness guard + polling).
   * Used by parents that set [autoLaunch]="false" to launch on demand.
   * No-op when already launched or finished.
   */
  launchSdk(): void {
    if (this._launched || this.finished()) {
      return;
    }
    this._startLaunchSequence();
  }

  retryLaunch(): void {
    if (this._launched || this.finished()) {
      return;
    }
    this.loadFailed.set(false);
    this.loading.set(false);
    this._startLaunchSequence();
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _startLaunchSequence(): void {
    if (this.validated() || this._launched) {
      return;
    }

    const win = window as unknown as MetamapWindow;
    const sdkReady = () =>
      typeof win.MetamapVerification === 'function' &&
      !!customElements.get('metamap-button');

    if (sdkReady()) {
      this._executeLaunch();
      return;
    }

    this.loading.set(true);

    this._pollAttempts = 0;
    this._pollTimer = setInterval(() => {
      this._pollAttempts++;

      if (sdkReady()) {
        this._stopPolling();
        this.zone.run(() => {
          this.loading.set(false);
        });
        this._executeLaunch();
        return;
      }

      if (this._pollAttempts >= this.pollMaxAttempts) {
        this._stopPolling();
        this.zone.run(() => {
          this.loading.set(false);
          this.loadFailed.set(true);
          this.loadError.emit();
          this._events$.next({ type: 'error', message: 'MetaMap SDK failed to load' });
        });
      }
    }, this.pollIntervalMs);
  }

  private _executeLaunch(): void {
    if (this._launched) {
      return;
    }
    this._launched = true;

    const win = window as unknown as MetamapWindow;
    const Verification = win.MetamapVerification!;

    // Inputs win (identity-validation template path); fall back to environment
    // for the provider-agnostic Consent path that creates the widget dynamically.
    const config: MetamapVerificationConfig = {
      clientId: this.clientId() || environment.metamapClientId,
      flowId: this.flowId() || environment.metamapFlowId,
      language: 'es',
      ...(this.identityId() ? { identityId: this.identityId() } : {}),
    };

    this.finishHandler = (e: Event) => {
      const detail = (e as CustomEvent<MetamapFinishDetail>).detail;
      this.zone.run(() => {
        this.finished.set(true);
        this.sessionFinished.emit(detail.verificationId);
        this._events$.next({ type: 'finished', verificationId: detail.verificationId });
      });
    };

    this.exitHandler = () => {
      this.zone.run(() => {
        this.sessionExited.emit();
        this._events$.next({ type: 'exited' });
      });
    };

    window.addEventListener('metamap:userFinishedSdk', this.finishHandler);
    window.addEventListener('metamap:userExitedSdk', this.exitHandler);

    const verification = new Verification(config);
    verification.start();
  }

  private _stopPolling(): void {
    if (this._pollTimer !== undefined) {
      clearInterval(this._pollTimer);
      this._pollTimer = undefined;
    }
  }

  private removeListeners(): void {
    if (this.finishHandler) {
      window.removeEventListener('metamap:userFinishedSdk', this.finishHandler);
    }
    if (this.exitHandler) {
      window.removeEventListener('metamap:userExitedSdk', this.exitHandler);
    }
  }
}
