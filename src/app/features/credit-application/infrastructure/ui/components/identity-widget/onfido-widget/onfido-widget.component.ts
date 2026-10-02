import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { Subject } from 'rxjs';
import { Onfido } from 'onfido-sdk-ui';
import type { Handle } from 'onfido-sdk-ui';
import { environment } from '@environments/environment';
import type { IdentityVerificationWidget, VerificationWidgetEvent } from '../identity-verification-widget';

/**
 * Onfido identity-verification widget.
 *
 * Implements {@link IdentityVerificationWidget} — interchangeable with any other
 * provider widget via the Consent screen's dynamic registry.
 *
 * Unlike Persona (modal overlay), Onfido renders INLINE into a container element.
 * The template provides `<div #mount>` passed as `containerEl` to `Onfido.init()`.
 *
 * Lifecycle: initialize(context) → open() → subscribe events$ → destroy().
 * Set `identityProvider: 'onfido-widget'` in admin config (or mock interceptor).
 * Paste a fresh SDK token into `environment.onfidoToken` (expires 90 min).
 *
 * @see https://documentation.onfido.com/sdk/web/
 */
@Component({
  selector: 'app-onfido-widget',
  standalone: true,
  templateUrl: './onfido-widget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnfidoWidgetComponent implements IdentityVerificationWidget, OnDestroy {
  private readonly zone = inject(NgZone);

  private readonly mountEl = viewChild<ElementRef<HTMLDivElement>>('mount');

  private readonly _events$ = new Subject<VerificationWidgetEvent>();
  readonly events$ = this._events$.asObservable();

  private onfidoHandle: Handle | null = null;

  /** Stored from initialize() — fallback verificationId when onComplete lacks applicant_id. */
  private referenceId = '';

  /**
   * Test-only token override. Set `component['_testToken'] = 'token'` before
   * calling initialize() to bypass environment.onfidoToken in tests.
   * @internal
   */
  _testToken: string | undefined;

  private get token(): string {
    return this._testToken !== undefined ? this._testToken : (environment as { onfidoToken?: string }).onfidoToken ?? '';
  }

  initialize(context: { referenceId?: string }): void {
    this.referenceId = context.referenceId ?? '';

    if (!this.token) {
      this.zone.run(() => {
        this._events$.next({ type: 'error', message: 'Falta el SDK token de Onfido' });
      });
      return;
    }

    this.zone.run(() => {
      this._events$.next({ type: 'ready' });
    });
  }

  /** Calls Onfido.init() and renders inline into the mount element. No-op (emits error) without a token. */
  open(): void {
    if (!this.token) {
      this.zone.run(() => {
        this._events$.next({ type: 'error', message: 'Falta el SDK token de Onfido' });
      });
      return;
    }

    this.onfidoHandle = Onfido.init({
      token: this.token,
      containerEl: this.mountEl()?.nativeElement,
      steps: ['welcome', 'document', 'face', 'complete'],
      onComplete: (data: Record<string, unknown>) => {
        const verificationId = String(data?.['applicant_id'] ?? this.referenceId ?? '');
        this.zone.run(() => {
          this._events$.next({ type: 'finished', verificationId });
        });
      },
      onError: (error: { type: string; message: string; exception?: unknown }) => {
        const message = String(error?.message ?? error);
        this.zone.run(() => {
          this._events$.next({ type: 'error', message });
        });
      },
      onUserExit: () => {
        this.zone.run(() => {
          this._events$.next({ type: 'exited' });
        });
      },
    });
  }

  /** Tears down the Onfido SDK handle. No-op if open() was never called. */
  destroy(): void {
    this.onfidoHandle?.tearDown();
    this.onfidoHandle = null;
    this._events$.complete();
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
