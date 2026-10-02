import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  computed,
  inject,
  NgZone,
  OnDestroy,
  signal,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LibButtonComponent, LibCheckboxComponent } from 'crdx-components';
import { CreditApplicationFacade } from '@credit-application/application';
import { ADMIN_CONFIG } from '@credit-application/infrastructure';
import { IDENTITY_WIDGET_REGISTRY } from '../../../components/identity-widget/widget-registry';
import type { IdentityVerificationWidget } from '../../../components/identity-widget/identity-verification-widget';

/**
 * Stage: Request — Substage: Consent (NEW clients only)
 *
 * Shown after BasicData when DetermineUserTypeUseCase returns NewClient.
 * Provider-agnostic: resolves the active identity widget from IDENTITY_WIDGET_REGISTRY.
 *
 * Lifecycle:
 *   1. ngAfterViewInit → creates widget via ViewContainerRef.createComponent(), calls initialize().
 *   2. onContinue() (both checkboxes checked) → calls widget.open().
 *   3. events$ finished → navigate to /request/result.
 *   4. events$ error → show widgetLoadError.
 */
@Component({
  selector: 'app-consent',
  standalone: true,
  imports: [LibButtonComponent, LibCheckboxComponent],
  templateUrl: './consent.html',
  styleUrl: './consent.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Consent implements AfterViewInit, OnDestroy {
  protected readonly facade = inject(CreditApplicationFacade);
  private readonly router = inject(Router);
  private readonly adminConfig = inject(ADMIN_CONFIG);
  private readonly widgetRegistry = inject(IDENTITY_WIDGET_REGISTRY);
  private readonly zone = inject(NgZone);

  protected readonly widgetHostRef = viewChild<ViewContainerRef>('widgetHost', { read: ViewContainerRef });

  protected readonly acceptedTerms = signal(false);
  protected readonly acceptedOic = signal(false);

  protected readonly canContinue = computed(
    () => this.acceptedTerms() && this.acceptedOic(),
  );

  protected readonly greetingName = computed(
    () => this.facade.personName()?.firstName ?? null,
  );

  protected readonly widgetLoadError = signal(false);

  // ── Widget instance & cleanup ─────────────────────────────────────────────

  private widgetRef?: ComponentRef<IdentityVerificationWidget>;
  private eventsSub?: Subscription;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngAfterViewInit(): void {
    this._createAndInitWidget();
  }

  ngOnDestroy(): void {
    this.eventsSub?.unsubscribe();
    this.widgetRef?.instance?.destroy();
    this.widgetRef?.destroy();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Opens the identity widget when both checkboxes are accepted. Navigation is driven by events$. */
  onContinue(): void {
    if (!this.canContinue()) return;
    this.widgetRef?.instance?.open();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _createAndInitWidget(): void {
    const hostRef = this.widgetHostRef();
    if (!hostRef) {
      return;
    }

    const provider = this.adminConfig.getIdentityProvider();
    const ComponentType = this.widgetRegistry[provider];

    if (!ComponentType) {
      this.zone.run(() => this.widgetLoadError.set(true));
      return;
    }

    hostRef.clear();
    this.widgetRef = hostRef.createComponent(ComponentType);

    const instance = this.widgetRef.instance;

    // TODO (PR-B): pass real referenceId from the active application
    instance.initialize({ referenceId: undefined });

    this.eventsSub = instance.events$.subscribe(event => {
      if (event.type === 'finished') {
        // TODO (PR-B): navigate to the real next step based on backend verdict
        void this.router.navigate(['/request/result']);
      } else if (event.type === 'error') {
        this.widgetLoadError.set(true);
      }
    });
  }
}
