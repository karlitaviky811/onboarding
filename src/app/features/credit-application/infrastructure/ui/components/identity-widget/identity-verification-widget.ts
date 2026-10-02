import { Observable } from 'rxjs';

/**
 * Union of all events that an identity-verification widget can emit.
 * Consumers subscribe to `events$` and react to each event type.
 */
export type VerificationWidgetEvent =
  | { type: 'ready' }
  | { type: 'finished'; verificationId: string }
  | { type: 'exited' }
  | { type: 'error'; message?: string };

/**
 * Provider-agnostic contract for any identity-verification widget.
 *
 * Each concrete widget (MetaMap, Persona, …) implements this interface and
 * self-configures from `environment` — the Consent screen (or any other
 * consumer) only knows this interface, never the concrete provider.
 *
 * Lifecycle:
 *   1. `initialize(context)` — called on screen load to pre-warm the SDK.
 *   2. `open()` — called when the user clicks "Continue" to show the flow.
 *   3. Subscribe to `events$` for outcome notifications.
 *   4. `destroy()` — called when the host component is torn down.
 */
export interface IdentityVerificationWidget {
  /**
   * Pre-warms / pre-initialises the widget SDK.
   * Must be called on screen load (e.g. `ngAfterViewInit`) BEFORE `open()`.
   * @param context.referenceId  Optional reference identifier for the user session.
   */
  initialize(context: { referenceId?: string }): void;

  /**
   * Shows the identity-verification flow modal.
   * Should only be called after `initialize()`.
   */
  open(): void;

  /**
   * Observable that emits lifecycle events from the underlying SDK.
   * All emissions happen inside Angular's zone so change detection fires automatically.
   */
  readonly events$: Observable<VerificationWidgetEvent>;

  /**
   * Tears down the widget, removes event listeners, and cancels any pending SDK state.
   * Called from the host component's `ngOnDestroy`.
   */
  destroy(): void;
}
