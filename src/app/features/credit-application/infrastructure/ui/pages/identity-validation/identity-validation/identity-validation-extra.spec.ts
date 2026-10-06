import { describe, test, expect, vi } from 'vitest';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { CreditApplication, Identification, IdentificationType } from '@credit-application/domain';
import { CreditApplicationFacade } from '@credit-application/application';
import { IDENTITY_VERIFICATION_STATUS } from '@credit-application/infrastructure';
import { ADMIN_CONFIG } from '@credit-application/infrastructure';
import { ok } from '@shared/result';
import { renderComponent } from '../../../../../../../../testing';
import { IdentityValidation } from './identity-validation';
import { OriginacionValidationAdapter } from '../../../../adapters/originacion/originacion-validation.adapter';

function createApplication(): CreditApplication {
  return CreditApplication.create(
    'application-123',
    new Identification(IdentificationType.National, '1-2345-6789'),
  );
}

async function renderPage(
  verificationPort: { verify: ReturnType<typeof vi.fn>; getStatus: ReturnType<typeof vi.fn> },
  provider = 'metamap',
) {
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const applicationSignal = signal(createApplication());
  const facade = { application: applicationSignal.asReadonly(), setApplication: vi.fn() };
  const adminConfig = { getIdentityProvider: vi.fn().mockReturnValue(provider) };
  const originacionAdapter = {
    getButtonData: vi.fn().mockResolvedValue(ok({ clientId: 'c', flowId: 'f', identityId: undefined, validated: 0 })),
    saveVerification: vi.fn().mockResolvedValue(ok({ state: 'approved', route: '/request/result', triesLeft: null })),
  };

  const { fixture } = await renderComponent(IdentityValidation, {
    providers: [
      { provide: CreditApplicationFacade, useValue: facade },
      { provide: IDENTITY_VERIFICATION_STATUS, useValue: verificationPort },
      { provide: Router, useValue: router },
      { provide: ADMIN_CONFIG, useValue: adminConfig },
      { provide: OriginacionValidationAdapter, useValue: originacionAdapter },
    ],
  });

  return { fixture, router };
}

describe('IdentityValidation — data-match approved path (no redirect, approved:true)', () => {
  test('routes to /request/result immediately when backend approves without redirect', async () => {
    const verificationPort = {
      verify: vi.fn().mockResolvedValue(ok({ approved: true, redirectUrl: undefined, verificationId: undefined })),
      getStatus: vi.fn(),
    };

    const { fixture, router } = await renderPage(verificationPort);

    fixture.componentInstance.startVerification();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/request/result']);
    expect(fixture.componentInstance.state()).toBe('approved');
  });
});

describe('IdentityValidation — refreshStatus() early return when verificationId is null', () => {
  test('does nothing when refreshStatus() is called before startVerification()', async () => {
    const verificationPort = {
      verify: vi.fn().mockResolvedValue(ok({ approved: false, redirectUrl: 'https://r.test', verificationId: 'v-1' })),
      getStatus: vi.fn().mockResolvedValue(ok({ status: 'pending' })),
    };

    const { fixture } = await renderPage(verificationPort);

    expect(fixture.componentInstance.verificationId()).toBeNull();

    await fixture.componentInstance.refreshStatus();
    fixture.detectChanges();

    expect(verificationPort.getStatus).not.toHaveBeenCalled();
  });
});

describe('IdentityValidation — onWidgetExited() no-op', () => {
  test('does not change state when onWidgetExited is called', async () => {
    const verificationPort = {
      verify: vi.fn(),
      getStatus: vi.fn(),
    };

    const { fixture } = await renderPage(verificationPort, 'metamap-widget');

    const stateBefore = fixture.componentInstance.state();
    fixture.componentInstance.onWidgetExited();
    fixture.detectChanges();

    expect(fixture.componentInstance.state()).toBe(stateBefore);
  });
});
