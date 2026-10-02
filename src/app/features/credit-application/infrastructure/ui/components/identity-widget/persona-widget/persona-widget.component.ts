import {
  ChangeDetectionStrategy,
  Component,
  inject,
  NgZone,
  OnDestroy,
} from '@angular/core';
import { Subject } from 'rxjs';
import Persona from 'persona';
import { environment } from '@environments/environment';
import type { IdentityVerificationWidget, VerificationWidgetEvent } from '../identity-verification-widget';

/**
 * Persona identity-verification widget.
 *
 * Implements {@link IdentityVerificationWidget} so the Consent screen
 * (and any other consumer) can use it interchangeably with any other provider.
 *
 * Lifecycle (called by the host component):
 *   1. `initialize(context)` — constructs `Persona.Client` with sandbox config.
 *      The client pre-loads assets but does NOT show the modal.
 *   2. `open()` — shows the Persona modal overlay.
 *   3. Subscribe to `events$` for outcome notifications.
 *   4. `destroy()` — tears down the client on host destroy.
 *
 * This component has a minimal host template because Persona renders its own
 * modal overlay on top of the application.
 */
@Component({
  selector: 'app-persona-widget',
  standalone: true,
  template: `<!-- Persona renders its own modal overlay. No host markup needed. -->`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonaWidgetComponent implements IdentityVerificationWidget, OnDestroy {
  private readonly zone = inject(NgZone);

  /** Internal Subject — exposed as a readonly Observable via events$. */
  private readonly _events$ = new Subject<VerificationWidgetEvent>();

  /** Observable of widget lifecycle events. All emissions are inside NgZone. */
  readonly events$ = this._events$.asObservable();

  /** Persona.Client instance — null until initialize() is called. */
  private client: InstanceType<typeof Persona.Client> | null = null;

  /**
   * Pre-warms the Persona SDK. Constructs a `Persona.Client` with:
   * - `templateId` from `environment.personaTemplateId`
   * - `environment: 'sandbox'`
   * - `referenceId` from the provided context
   *
   * Emits a `ready` event via `events$` when the SDK iframe is loaded.
   * Emits an `error` event if construction fails.
   *
   * @param context.referenceId  Optional reference ID for the user session.
   */
  initialize(context: { referenceId?: string }): void {
    try {
      this.client = new Persona.Client({
        templateId: environment.personaTemplateId,
        environment: 'sandbox',
        referenceId: context.referenceId,
        onReady: () => {
          this.zone.run(() => {
            this._events$.next({ type: 'ready' });
          });
        },
        onComplete: ({ inquiryId }: { inquiryId: string; status: string }) => {
          this.zone.run(() => {
            this._events$.next({ type: 'finished', verificationId: inquiryId });
          });
        },
        onCancel: () => {
          this.zone.run(() => {
            this._events$.next({ type: 'exited' });
          });
        },
        onError: (error: { message?: string } | unknown) => {
          const message = (error as { message?: string })?.message;
          this.zone.run(() => {
            this._events$.next({ type: 'error', message });
          });
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Persona SDK initialization failed';
      this.zone.run(() => {
        this._events$.next({ type: 'error', message });
      });
    }
  }


  open(): void {
    this.client?.open();
  }


  destroy(): void {
    this.client?.destroy();
    this._events$.complete();
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
