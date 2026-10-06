import { describe, test, expect, vi } from 'vitest';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import {
  CreditApplication,
  Identification,
  IdentificationType,
  PersonName,
} from '@credit-application/domain';
import { CreditApplicationFacade } from '@credit-application/application';
import { err, NetworkError, NotFoundError, ok } from '@shared/result/result';
import { renderComponent } from '../../../../../../../../testing';
import { BasicData } from './basic-data';
import { AdminConfigAdapter } from '../../../../adapters/admin/admin-config.adapter';
import { ScreenContentAdapter } from '../../../../adapters/screen-content/screen-content.adapter';

function createExistingApplication(): CreditApplication {
  return CreditApplication.create(
    'app-001',
    new Identification(IdentificationType.National, '123456789'),
  );
}

type FacadeDetermineResult =
  | ReturnType<typeof ok<{ userType: string; existingApplication: CreditApplication | null }>>
  | ReturnType<typeof err<NetworkError>>;

type TseResult =
  | ReturnType<typeof ok<PersonName | null>>
  | ReturnType<typeof err<NotFoundError | NetworkError>>;

function createFacade(
  determineResult: FacadeDetermineResult,
  tseResult: TseResult = ok({ firstName: 'Juan', lastName: 'Pérez', fullName: 'Juan Pérez' }),
) {
  return {
    determineUserType: {
      execute: vi.fn().mockResolvedValue(determineResult),
    },
    tseQuery: {
      findByIdentification: vi.fn().mockResolvedValue(tseResult),
    },
    setApplication: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
    setPersonName: vi.fn(),
    personName: signal<PersonName | null>(null).asReadonly(),
    application: signal<CreditApplication | null>(null).asReadonly(),
  };
}

function createAdminConfig() {
  return {
    getIdentificationTypes: vi.fn().mockResolvedValue({ success: false }),
    getIdentityProvider: vi.fn().mockReturnValue('metamap'),
  };
}

function createScreenContentAdapter() {
  return {
    load: vi.fn().mockResolvedValue({ success: false }),
  };
}

async function renderBasicData(
  determineResult: FacadeDetermineResult = ok({ userType: 'CLIENTE_NUEVO', existingApplication: null }),
  tseResult: TseResult = ok({ firstName: 'Juan', lastName: 'Pérez', fullName: 'Juan Pérez' }),
) {
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const facade = createFacade(determineResult, tseResult);
  const adminConfig = createAdminConfig();
  const screenContentAdapter = createScreenContentAdapter();

  const { fixture } = await renderComponent(BasicData, {
    providers: [
      { provide: CreditApplicationFacade, useValue: facade },
      { provide: Router, useValue: router },
      { provide: AdminConfigAdapter, useValue: adminConfig },
      { provide: ScreenContentAdapter, useValue: screenContentAdapter },
    ],
  });

  return { fixture, facade, router };
}

describe('BasicData — onContinue()', () => {
  test('does nothing when canContinue() is false (guard)', async () => {
    const { fixture, facade, router } = await renderBasicData();

    fixture.componentInstance.onContinue();
    await fixture.whenStable();

    expect(facade.determineUserType.execute).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  test('builds Identification with correct type (NACIONAL → National) and number, then calls determineUserType.execute', async () => {
    const { fixture, facade } = await renderBasicData(
      ok({ userType: 'CLIENTE_NUEVO', existingApplication: null }),
    );

    const component = fixture.componentInstance;

    component['idNumber'].set('123456789');
    component['showContactFields'].set(true);
    component['contact'].set({ countryCode: '+506', phone: '88888888', email: 'test@test.com' });

    component.onContinue();
    await fixture.whenStable();

    expect(facade.determineUserType.execute).toHaveBeenCalledTimes(1);
    const passedId: Identification = facade.determineUserType.execute.mock.calls[0][0];
    expect(passedId).toBeInstanceOf(Identification);
    expect(passedId.type).toBe(IdentificationType.National);
    expect(passedId.number).toBe('123456789');
  });

  test('builds Identification with DIMEX type when id type is DIMEX', async () => {
    const { fixture, facade } = await renderBasicData(
      ok({ userType: 'CLIENTE_NUEVO', existingApplication: null }),
    );

    const component = fixture.componentInstance;

    component.selectIdType(1);
    component['idNumber'].set('123456789012');
    component['showContactFields'].set(true);
    component['contact'].set({ countryCode: '+506', phone: '88888888', email: 'test@test.com' });

    component.onContinue();
    await fixture.whenStable();

    const passedId: Identification = facade.determineUserType.execute.mock.calls[0][0];
    expect(passedId.type).toBe(IdentificationType.DIMEX);
    expect(passedId.number).toBe('123456789012');
  });

  test('calls setApplication with existingApplication and navigates to /request/retomando when application exists (validated client)', async () => {
    const existingApp = createExistingApplication();
    const { fixture, facade, router } = await renderBasicData(
      ok({ userType: 'CLIENTE_CON_TARJETA', existingApplication: existingApp }),
    );

    const component = fixture.componentInstance;
    component['idNumber'].set('111111111');
    component['showContactFields'].set(true);
    component['contact'].set({ countryCode: '+506', phone: '88888888', email: 'test@test.com' });

    component.onContinue();
    await fixture.whenStable();

    expect(facade.setApplication).toHaveBeenCalledWith(existingApp);
    expect(router.navigate).toHaveBeenCalledWith(['/request/retomando']);
  });

  test('creates a new CreditApplication and navigates to /request/consent when existingApplication is null (new client)', async () => {
    const { fixture, facade, router } = await renderBasicData(
      ok({ userType: 'CLIENTE_NUEVO', existingApplication: null }),
    );

    const component = fixture.componentInstance;
    component['idNumber'].set('123456789');
    component['showContactFields'].set(true);
    component['contact'].set({ countryCode: '+506', phone: '88888888', email: 'test@test.com' });

    component.onContinue();
    await fixture.whenStable();

    expect(facade.setApplication).toHaveBeenCalledTimes(1);
    const savedApp: CreditApplication = facade.setApplication.mock.calls[0][0];
    expect(savedApp).toBeInstanceOf(CreditApplication);
    expect(savedApp.identification.number).toBe('123456789');
    expect(savedApp.identification.type).toBe(IdentificationType.National);
    expect(router.navigate).toHaveBeenCalledWith(['/request/consent']);
  });

  test('calls facade.tseQuery.findByIdentification with the id number and stores the result via facade.setPersonName', async () => {
    const personName = { firstName: 'María', lastName: 'López', fullName: 'María López' };
    const { fixture, facade } = await renderBasicData(
      ok({ userType: 'CLIENTE_NUEVO', existingApplication: null }),
      ok(personName),
    );

    const component = fixture.componentInstance;
    component['idNumber'].set('123456789');
    component['showContactFields'].set(true);
    component['contact'].set({ countryCode: '+506', phone: '88888888', email: 'test@test.com' });

    component.onContinue();
    await fixture.whenStable();

    expect(facade.tseQuery.findByIdentification).toHaveBeenCalledWith('123456789');
    expect(facade.setPersonName).toHaveBeenCalledWith(personName);
  });

  test('still navigates correctly even when TSE query fails (name fetch is non-blocking)', async () => {
    const { fixture, facade, router } = await renderBasicData(
      ok({ userType: 'CLIENTE_NUEVO', existingApplication: null }),
      err(new NetworkError()),
    );

    const component = fixture.componentInstance;
    component['idNumber'].set('123456789');
    component['showContactFields'].set(true);
    component['contact'].set({ countryCode: '+506', phone: '88888888', email: 'test@test.com' });

    component.onContinue();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/request/consent']);

    expect(facade.setPersonName).not.toHaveBeenCalled();
  });

  test('calls setError and does NOT navigate on failure', async () => {
    const { fixture, facade, router } = await renderBasicData(
      err(new NetworkError()),
    );

    const component = fixture.componentInstance;
    component['idNumber'].set('123456789');
    component['showContactFields'].set(true);
    component['contact'].set({ countryCode: '+506', phone: '88888888', email: 'test@test.com' });

    component.onContinue();
    await fixture.whenStable();

    expect(facade.setError).toHaveBeenCalledTimes(1);
    expect(facade.setError.mock.calls[0][0]).toBeTruthy();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  test('sets loading to true before the call and false after (on success)', async () => {
    const existingApp = createExistingApplication();
    const { fixture, facade } = await renderBasicData(
      ok({ userType: 'CLIENTE_CON_TARJETA', existingApplication: existingApp }),
    );

    const component = fixture.componentInstance;
    component['idNumber'].set('123456789');
    component['showContactFields'].set(true);
    component['contact'].set({ countryCode: '+506', phone: '88888888', email: 'test@test.com' });

    component.onContinue();
    await fixture.whenStable();

    expect(facade.setLoading).toHaveBeenNthCalledWith(1, true);
    expect(facade.setLoading).toHaveBeenNthCalledWith(2, false);
  });
});
