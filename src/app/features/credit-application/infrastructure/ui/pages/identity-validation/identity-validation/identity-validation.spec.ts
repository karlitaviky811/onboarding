import { Router } from '@angular/router';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { signal } from '@angular/core';
import { CreditApplication, Identification, IdentificationType } from '@credit-application/domain';
import { CreditApplicationFacade } from '@credit-application/application';
import { IDENTITY_VERIFICATION_STATUS } from '@credit-application/infrastructure';
import { err, NetworkError, ok } from '@shared/result';
import { renderComponent } from '../../../../../../../../testing';
import { IdentityValidation } from './identity-validation';

function createApplication(): CreditApplication {
  return CreditApplication.create(
    'application-123',
    new Identification(IdentificationType.National, '1-2345-6789'),
  );
}

type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'manual_review' | 'failed';

function createVerificationPort(status: VerificationStatus) {
  return {
    verify: vi.fn().mockResolvedValue(ok({
      approved: false,
      redirectUrl: 'https://verify.example.test/session/456',
      verificationId: 'verification-456',
    })),
    getStatus: vi.fn().mockResolvedValue(ok({ status })),
  };
}

describe('IdentityValidation', () => {
  async function renderIdentityValidation(
    application: CreditApplication | null,
    verificationPort = createVerificationPort('pending'),
  ) {
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    const applicationSignal = signal(application);
    const facade = { application: applicationSignal.asReadonly(), setApplication: vi.fn() };

    await renderComponent(IdentityValidation, {
      providers: [
        { provide: CreditApplicationFacade, useValue: facade },
        { provide: IDENTITY_VERIFICATION_STATUS, useValue: verificationPort },
        { provide: Router, useValue: router },
      ],
    });

    return { facade, verificationPort, router };
  }

  it('shows a safe error and sends no request when there is no credit application', async () => {
    const { verificationPort } = await renderIdentityValidation(null);

    expect(screen.getByRole('alert')).toHaveTextContent('No hay una solicitud de crédito activa');
    expect(verificationPort.verify).not.toHaveBeenCalled();
    expect(verificationPort.getStatus).not.toHaveBeenCalled();
  });

  it('creates one verification, opens only the backend redirect URL, and allows refreshing it', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const user = userEvent.setup();
    const { verificationPort } = await renderIdentityValidation(createApplication());

    await user.click(screen.getByRole('button', { name: 'Iniciar verificación' }));

    expect(verificationPort.verify).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith(
      'https://verify.example.test/session/456',
      '_blank',
      'noopener,noreferrer',
    );
    expect(screen.getByText('Verificación pendiente')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Actualizar estado' }));

    expect(verificationPort.getStatus).toHaveBeenCalledWith('verification-456');
    expect(verificationPort.verify).toHaveBeenCalledTimes(1);
    open.mockRestore();
  });

  it.each([
    ['pending', 'Verificación pendiente'],
    ['rejected', 'Verificación rechazada'],
    ['manual_review', 'Verificación en revisión manual'],
    ['failed', 'No se pudo completar la verificación'],
  ] as const)('shows the backend %s state after polling without advancing the application', async (status, message) => {
    const user = userEvent.setup();
    const { router } = await renderIdentityValidation(createApplication(), createVerificationPort(status));

    // Start verification — opens redirect URL, sets state to 'pending'
    await user.click(screen.getByRole('button', { name: 'Iniciar verificación' }));
    expect(screen.getByText('Verificación pendiente')).toBeInTheDocument();

    // Refresh status — now shows the actual backend status
    await user.click(screen.getByRole('button', { name: 'Actualizar estado' }));

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('does not open a window when the backend does not return a redirect URL', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const user = userEvent.setup();
    const verificationPort = createVerificationPort('pending');
    verificationPort.verify.mockResolvedValue(ok({ approved: false, verificationId: 'verification-456' }));
    await renderIdentityValidation(createApplication(), verificationPort);

    await user.click(screen.getByRole('button', { name: 'Iniciar verificación' }));

    expect(screen.getByText('Verificación pendiente')).toBeInTheDocument();
    expect(window.open).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it('shows an actionable error when the backend cannot create the verification', async () => {
    const user = userEvent.setup();
    const verificationPort = createVerificationPort('pending');
    verificationPort.verify.mockResolvedValue(err(new NetworkError()));
    await renderIdentityValidation(createApplication(), verificationPort);

    await user.click(screen.getByRole('button', { name: 'Iniciar verificación' }));

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo iniciar la verificación');
  });

  it('advances only after the backend reports approved via status poll', async () => {
    const user = userEvent.setup();
    const verificationPort = createVerificationPort('approved');
    const { router } = await renderIdentityValidation(createApplication(), verificationPort);

    // Start verification — opens redirect URL, sets state to 'pending'
    await user.click(screen.getByRole('button', { name: 'Iniciar verificación' }));
    expect(screen.getByText('Verificación pendiente')).toBeInTheDocument();

    // Refresh status — now backend reports approved
    await user.click(screen.getByRole('button', { name: 'Actualizar estado' }));

    expect(screen.getByText('Identidad aprobada')).toBeInTheDocument();
    expect(router.navigate).toHaveBeenCalledWith(['/request/result']);
  });
});
