import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Router } from '@angular/router';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { signal } from '@angular/core';
import { CreditApplication, Identification, IdentificationType } from '@credit-application/domain';
import { CreditApplicationFacade } from '@credit-application/application';
import { IDENTITY_VERIFICATION_STATUS } from '@credit-application/infrastructure';
import { ADMIN_CONFIG } from '@credit-application/infrastructure';
import { err, NetworkError, ok } from '@shared/result';
import { renderComponent } from '../../../../../../../../testing';
import { IdentityValidation } from './identity-validation';
import { OriginacionValidationAdapter } from '../../../../adapters/originacion/originacion-validation.adapter';
import { environment } from '@environments/environment';

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

function createAdminConfig(provider: string) {
  return { getIdentityProvider: vi.fn().mockReturnValue(provider) };
}

function createOriginacionAdapter() {
  return {
    getButtonData: vi.fn().mockResolvedValue(ok({
      clientId: 'mm-client-id',
      flowId: 'mm-flow-id',
      identityId: undefined,
      validated: 0,
    })),
    saveVerification: vi.fn().mockResolvedValue(ok({
      state: 'approved',
      route: '/request/result',
      triesLeft: null,
    })),
  };
}

describe('IdentityValidation — redirect path (provider: metamap)', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function renderIdentityValidation(
    application: CreditApplication | null,
    verificationPort = createVerificationPort('pending'),
    provider = 'metamap',
  ) {
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    const applicationSignal = signal(application);
    const facade = { application: applicationSignal.asReadonly(), setApplication: vi.fn() };
    const adminConfig = createAdminConfig(provider);
    const originacionAdapter = createOriginacionAdapter();

    await renderComponent(IdentityValidation, {
      providers: [
        { provide: CreditApplicationFacade, useValue: facade },
        { provide: IDENTITY_VERIFICATION_STATUS, useValue: verificationPort },
        { provide: Router, useValue: router },
        { provide: ADMIN_CONFIG, useValue: adminConfig },
        { provide: OriginacionValidationAdapter, useValue: originacionAdapter },
      ],
    });

    return { facade, verificationPort, router, originacionAdapter };
  }

  test('shows a safe error and sends no request when there is no credit application', async () => {
    const { verificationPort } = await renderIdentityValidation(null);

    expect(screen.getByRole('alert')).toHaveTextContent('No hay una solicitud de crédito activa');
    expect(verificationPort.verify).not.toHaveBeenCalled();
    expect(verificationPort.getStatus).not.toHaveBeenCalled();
  });

  test('creates one verification, opens only the backend redirect URL, and allows refreshing it', async () => {
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
  });

  test.each([
    ['pending', 'Verificación pendiente'],
    ['rejected', 'Verificación rechazada'],
    ['manual_review', 'Verificación en revisión manual'],
    ['failed', 'No se pudo completar la verificación'],
  ] as const)('shows the backend %s state after polling without advancing the application', async (status, message) => {
    const user = userEvent.setup();
    const { router } = await renderIdentityValidation(createApplication(), createVerificationPort(status));

    await user.click(screen.getByRole('button', { name: 'Iniciar verificación' }));
    expect(screen.getByText('Verificación pendiente')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Actualizar estado' }));

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  test('does not open a window when the backend does not return a redirect URL', async () => {
    const user = userEvent.setup();
    const verificationPort = createVerificationPort('pending');
    verificationPort.verify.mockResolvedValue(ok({ approved: false, verificationId: 'verification-456' }));
    await renderIdentityValidation(createApplication(), verificationPort);

    await user.click(screen.getByRole('button', { name: 'Iniciar verificación' }));

    expect(screen.getByText('Verificación pendiente')).toBeInTheDocument();
    expect(window.open).not.toHaveBeenCalled();
  });

  test('shows an actionable error when the backend cannot create the verification', async () => {
    const user = userEvent.setup();
    const verificationPort = createVerificationPort('pending');
    verificationPort.verify.mockResolvedValue(err(new NetworkError()));
    await renderIdentityValidation(createApplication(), verificationPort);

    await user.click(screen.getByRole('button', { name: 'Iniciar verificación' }));

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo iniciar la verificación');
  });

  test('advances only after the backend reports approved via status poll', async () => {
    const user = userEvent.setup();
    const verificationPort = createVerificationPort('approved');
    const { router } = await renderIdentityValidation(createApplication(), verificationPort);

    await user.click(screen.getByRole('button', { name: 'Iniciar verificación' }));
    expect(screen.getByText('Verificación pendiente')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Actualizar estado' }));

    expect(screen.getByText('Identidad aprobada')).toBeInTheDocument();
    expect(router.navigate).toHaveBeenCalledWith(['/request/result']);
  });

  test('does NOT render <app-metamap-widget> when provider is metamap', async () => {
    await renderIdentityValidation(createApplication());

    expect(screen.queryByTestId('metamap-widget-container')).not.toBeInTheDocument();
  });
});

describe('IdentityValidation — widget path (provider: metamap-widget)', () => {
  async function renderWithWidget(
    application: CreditApplication | null,
    originacionAdapter = createOriginacionAdapter(),
    routerMock?: { navigate: ReturnType<typeof vi.fn> },
  ) {
    const router = routerMock ?? { navigate: vi.fn().mockResolvedValue(true) };
    const applicationSignal = signal(application);
    const facade = { application: applicationSignal.asReadonly(), setApplication: vi.fn() };
    const adminConfig = createAdminConfig('metamap-widget');
    const verificationPort = createVerificationPort('pending');

    const { fixture } = await renderComponent(IdentityValidation, {
      providers: [
        { provide: CreditApplicationFacade, useValue: facade },
        { provide: IDENTITY_VERIFICATION_STATUS, useValue: verificationPort },
        { provide: Router, useValue: router },
        { provide: ADMIN_CONFIG, useValue: adminConfig },
        { provide: OriginacionValidationAdapter, useValue: originacionAdapter },
      ],
    });

    return { fixture, router, originacionAdapter, verificationPort };
  }

  test('renders <app-metamap-widget> when provider is metamap-widget', async () => {
    await renderWithWidget(createApplication());

    expect(screen.getByTestId('metamap-widget-container')).toBeInTheDocument();
  });

  test('does NOT render the redirect "Iniciar verificación" button when provider is metamap-widget', async () => {
    await renderWithWidget(createApplication());

    expect(screen.queryByRole('button', { name: 'Actualizar estado' })).not.toBeInTheDocument();
  });

  test('calls saveVerification when sessionFinished emits a real verificationId, then routes to result on approved', async () => {
    const originacionAdapter = createOriginacionAdapter();
    originacionAdapter.saveVerification.mockResolvedValue(ok({
      state: 'approved',
      route: '/request/result',
      triesLeft: null,
    }));
    const router = { navigate: vi.fn().mockResolvedValue(true) };

    const { fixture } = await renderWithWidget(createApplication(), originacionAdapter, router);

    fixture.componentInstance.onWidgetFinished('v-real-001');

    await fixture.whenStable();
    fixture.detectChanges();

    expect(originacionAdapter.saveVerification).toHaveBeenCalledWith(
      'PLACEHOLDER_VALIDATION_ID',
      'v-real-001',
    );
    expect(router.navigate).toHaveBeenCalledWith(['/request/result']);
  });

  test('shows approved state in DOM after approved verdict from saveVerification', async () => {
    const originacionAdapter = createOriginacionAdapter();
    originacionAdapter.saveVerification.mockResolvedValue(ok({
      state: 'approved',
      route: '/request/result',
      triesLeft: null,
    }));
    const router = { navigate: vi.fn().mockResolvedValue(true) };

    const { fixture } = await renderWithWidget(createApplication(), originacionAdapter, router);

    fixture.componentInstance.onWidgetFinished('v-real-002');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByText('Identidad aprobada')).toBeInTheDocument();
  });

  test('shows rejected state when saveVerification returns rejected verdict', async () => {
    const originacionAdapter = createOriginacionAdapter();
    originacionAdapter.saveVerification.mockResolvedValue(ok({
      state: 'rejected',
      route: undefined,
      triesLeft: 2,
    }));
    const router = { navigate: vi.fn().mockResolvedValue(true) };

    const { fixture } = await renderWithWidget(createApplication(), originacionAdapter, router);

    fixture.componentInstance.onWidgetFinished('v-rejected-001');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByText('Verificación rechazada')).toBeInTheDocument();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  test('skips saveVerification and routes to /request/result when ALREADY_VALIDATED sentinel received', async () => {
    const originacionAdapter = createOriginacionAdapter();
    const router = { navigate: vi.fn().mockResolvedValue(true) };

    const { fixture } = await renderWithWidget(createApplication(), originacionAdapter, router);

    fixture.componentInstance.onWidgetFinished('ALREADY_VALIDATED');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(originacionAdapter.saveVerification).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/request/result']);
  });

  test('shows approved state when ALREADY_VALIDATED sentinel received', async () => {
    const originacionAdapter = createOriginacionAdapter();
    const router = { navigate: vi.fn().mockResolvedValue(true) };

    const { fixture } = await renderWithWidget(createApplication(), originacionAdapter, router);

    fixture.componentInstance.onWidgetFinished('ALREADY_VALIDATED');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByText('Identidad aprobada')).toBeInTheDocument();
  });

  test('shows an error state when saveVerification returns a NetworkError', async () => {
    const originacionAdapter = createOriginacionAdapter();
    originacionAdapter.saveVerification.mockResolvedValue(err(new NetworkError()));
    const router = { navigate: vi.fn().mockResolvedValue(true) };

    const { fixture } = await renderWithWidget(createApplication(), originacionAdapter, router);

    fixture.componentInstance.onWidgetFinished('v-net-fail');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  test('falls back to error state on loadError from the widget', async () => {
    const { fixture } = await renderWithWidget(createApplication());

    fixture.componentInstance.onWidgetLoadError();
    fixture.detectChanges();

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('IdentityValidation — DEV-SMOKE: widgetClientId/flowId from environment', () => {
  async function renderWithWidget(application: CreditApplication | null) {
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    const applicationSignal = signal(application);
    const facade = { application: applicationSignal.asReadonly(), setApplication: vi.fn() };
    const adminConfig = createAdminConfig('metamap-widget');
    const verificationPort = createVerificationPort('pending');
    const originacionAdapter = createOriginacionAdapter();

    const { fixture } = await renderComponent(IdentityValidation, {
      providers: [
        { provide: CreditApplicationFacade, useValue: facade },
        { provide: IDENTITY_VERIFICATION_STATUS, useValue: verificationPort },
        { provide: Router, useValue: router },
        { provide: ADMIN_CONFIG, useValue: adminConfig },
        { provide: OriginacionValidationAdapter, useValue: originacionAdapter },
      ],
    });

    return { fixture, router, originacionAdapter };
  }

  test('exposes widgetClientId() equal to environment.metamapClientId when useWidget is true', async () => {
    const { fixture } = await renderWithWidget(createApplication());
    const component = fixture.componentInstance;

    expect(component.widgetClientId()).toBe(environment.metamapClientId);
  });

  test('exposes widgetFlowId() equal to environment.metamapFlowId when useWidget is true', async () => {
    const { fixture } = await renderWithWidget(createApplication());
    const component = fixture.componentInstance;

    expect(component.widgetFlowId()).toBe(environment.metamapFlowId);
  });

  test('widgetClientId/flowId remain empty strings when environment values are not configured (smoke default)', () => {
    expect(environment.metamapClientId).toBe('');
    expect(environment.metamapFlowId).toBe('');
  });
});
