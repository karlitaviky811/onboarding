import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CreditApplicationFacade } from '@credit-application/application';
import { IdentityVerificationStatusResult } from '@credit-application/domain';
import { IDENTITY_VERIFICATION_STATUS, ADMIN_CONFIG } from '@credit-application/infrastructure';
import { OriginacionValidationAdapter } from '../../../../adapters/originacion/originacion-validation.adapter';
import { MetamapWidgetComponent } from '../../../components/identity-widget/metamap-widget/metamap-widget.component';
import { environment } from '@environments/environment';

export type IdentityValidationState = 'idle' | 'creating' | 'error' | string;

/** Sentinel emitted by MetamapWidgetComponent when the user was already validated. */
const ALREADY_VALIDATED = 'ALREADY_VALIDATED';

@Component({
  selector: 'app-identity-validation',
  imports: [MetamapWidgetComponent],
  templateUrl: './identity-validation.html',
  styleUrl: './identity-validation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdentityValidation {
  private readonly router = inject(Router);
  private readonly facade = inject(CreditApplicationFacade);
  private readonly verificationPort = inject(IDENTITY_VERIFICATION_STATUS);
  private readonly adminConfig = inject(ADMIN_CONFIG);
  private readonly originacionAdapter = inject(OriginacionValidationAdapter);

  readonly useWidget = this.adminConfig.getIdentityProvider() === 'metamap-widget';

  readonly state = signal<IdentityValidationState>(
    this.facade.application() ? 'idle' : 'error',
  );
  readonly errorMessage = signal<string | null>(
    this.facade.application() ? null : 'No hay una solicitud de crédito activa. Regrese al inicio para continuar.',
  );
  readonly verificationId = signal<string | null>(null);

  readonly widgetClientId = signal<string>(
    this.useWidget ? environment.metamapClientId : '', // DEV SMOKE path — PR-B replaces this with originacionAdapter.getButtonData(validationId) from the Credix backend.
  );

  readonly widgetFlowId = signal<string>(
    this.useWidget ? environment.metamapFlowId : '', // DEV SMOKE path — PR-B replaces this with originacionAdapter.getButtonData(validationId) from the Credix backend.
  );
  readonly widgetIdentityId = signal<string | undefined>(undefined);
  readonly widgetValidated = signal<number>(0);

  async startVerification(): Promise<void> {
    const application = this.facade.application();
    if (!application) {
      this.showMissingApplicationError();
      return;
    }

    const currentVerificationId = this.verificationId();
    if (currentVerificationId) {
      await this.refreshStatus();
      return;
    }

    this.state.set('creating');
    this.errorMessage.set(null);

    const result = await this.verificationPort.verify(application.id, 'NationalValidation');
    if (!result.success) {
      this.showNetworkError('No se pudo iniciar la verificación. Intente de nuevo.');
      return;
    }

    const { redirectUrl, verificationId } = result.value;

    // Disambiguation invariant: check redirectUrl FIRST, then approved
    if (redirectUrl) {
      this.verificationId.set(verificationId ?? null);
      this.state.set('pending');
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Data-match path (no redirect)
    if (result.value.approved) {
      this.state.set('approved');
      void this.router.navigate(['/request/result']);
    } else {
      this.state.set('pending');
      this.verificationId.set(verificationId ?? null);
    }
  }

  async refreshStatus(): Promise<void> {
    const currentVerificationId = this.verificationId();
    if (!currentVerificationId) {
      return;
    }

    this.state.set('creating');
    this.errorMessage.set(null);

    const result = await this.verificationPort.getStatus(currentVerificationId);
    if (!result.success) {
      this.showNetworkError('No se pudo actualizar el estado de la verificación. Intente de nuevo.');
      return;
    }

    this.applyStatus(result.value);
  }


  async onWidgetFinished(verificationId: string): Promise<void> {
    if (verificationId === ALREADY_VALIDATED) {
      // Short-circuit: user was already validated — skip save, go straight to success.
      this.state.set('approved');
      void this.router.navigate(['/request/result']);
      return;
    }

    // Normal path: save the verificationId and apply the verdict.
    // ASSUMPTION (PR-B OQ-1): 'PLACEHOLDER_VALIDATION_ID' — real value TBD in PR-B.
    const result = await this.originacionAdapter.saveVerification(
      'PLACEHOLDER_VALIDATION_ID', // ASSUMPTION (PR-B)
      verificationId,
    );

    if (!result.success) {
      this.showNetworkError('No se pudo completar la verificación. Intente de nuevo.');
      return;
    }

    const { state, route } = result.value;
    this.state.set(state);

    if (route) {
      void this.router.navigate([route]);
    }
  }

  /** Called when MetamapWidgetComponent emits (sessionExited). No-op for now — reserved. */
  onWidgetExited(): void {
    // Reserved: user exited the SDK flow without completing.
    // For now, do nothing — the widget stays mounted and allows re-launch.
  }


  onWidgetLoadError(): void {
    this.showNetworkError(
      'No se pudo cargar el componente de verificación. Intente recargar la página.',
    );
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private applyStatus(statusResult: IdentityVerificationStatusResult): void {
    const { status } = statusResult;
    this.state.set(status);

    if (status === 'approved') {
      void this.router.navigate(['/request/result']);
    }
  }

  private showMissingApplicationError(): void {
    this.state.set('error');
    this.errorMessage.set('No hay una solicitud de crédito activa. Regrese al inicio para continuar.');
  }

  private showNetworkError(message: string): void {
    this.state.set('error');
    this.errorMessage.set(message);
  }
}
