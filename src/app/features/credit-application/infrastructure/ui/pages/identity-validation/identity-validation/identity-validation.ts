import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CreditApplicationFacade } from '@credit-application/application';
import { IdentityVerificationStatusResult } from '@credit-application/domain';
import { IDENTITY_VERIFICATION_STATUS } from '@credit-application/infrastructure';

export type IdentityValidationState = 'idle' | 'creating' | 'error' | string;

@Component({
  selector: 'app-identity-validation',
  imports: [],
  templateUrl: './identity-validation.html',
  styleUrl: './identity-validation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdentityValidation {
  private readonly router = inject(Router);
  private readonly facade = inject(CreditApplicationFacade);
  private readonly verificationPort = inject(IDENTITY_VERIFICATION_STATUS);

  readonly state = signal<IdentityValidationState>(
    this.facade.application() ? 'idle' : 'error',
  );
  readonly errorMessage = signal<string | null>(
    this.facade.application() ? null : 'No hay una solicitud de crédito activa. Regrese al inicio para continuar.',
  );
  readonly verificationId = signal<string | null>(null);

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
