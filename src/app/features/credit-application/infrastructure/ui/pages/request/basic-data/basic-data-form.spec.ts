import { describe, test, expect, vi } from 'vitest';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import {
  CreditApplication,
  Identification,
  IdentificationType,
  PersonName,
  IdentificationTypeConfig,
  ScreenContent,
} from '@credit-application/domain';
import { CreditApplicationFacade } from '@credit-application/application';
import { ok, err, NetworkError, Result, DomainError } from '@shared/result/result';
import { renderComponent } from '../../../../../../../../testing';
import { BasicData } from './basic-data';
import { AdminConfigAdapter } from '../../../../adapters/admin/admin-config.adapter';
import { ScreenContentAdapter } from '../../../../adapters/screen-content/screen-content.adapter';

const MOCK_ID_TYPES: IdentificationTypeConfig[] = [
  { id: 'NACIONAL', label: 'Nacional', mask: '#-####-####', maxLength: 9, isDefault: true },
  { id: 'DIMEX', label: 'DIMEX', mask: '############', maxLength: 12, isDefault: false },
];

const MOCK_SCREEN_CONTENT: ScreenContent = {
  screenKey: 'basic-data',
  copy: { headline: 'Headline', description: 'Desc', ctaLabel: 'Continue', legalNotice: 'Legal' },
  media: { gifUrl: '/img/test.gif', gifAlt: 'alt' },
  branding: { cardBackground: '#ffffff' },
};

function createFacade() {
  return {
    determineUserType: {
      execute: vi.fn().mockResolvedValue(ok({ userType: 'CLIENTE_NUEVO', existingApplication: null })),
    },
    tseQuery: {
      findByIdentification: vi.fn().mockResolvedValue(ok({ firstName: 'A', lastName: 'B', fullName: 'A B' })),
    },
    setApplication: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
    setPersonName: vi.fn(),
    personName: signal<PersonName | null>(null).asReadonly(),
    application: signal<CreditApplication | null>(null).asReadonly(),
  };
}

async function renderBasicData(
  adminConfigResult: Result<IdentificationTypeConfig[], DomainError> = ok(MOCK_ID_TYPES),
  screenContentResult: { success: boolean; value?: ScreenContent; error?: unknown } = ok(MOCK_SCREEN_CONTENT),
) {
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const facade = createFacade();
  const adminConfig = {
    getIdentificationTypes: vi.fn().mockResolvedValue(adminConfigResult),
    getIdentityProvider: vi.fn().mockReturnValue('metamap'),
  };
  const screenContentAdapter = {
    load: vi.fn().mockResolvedValue(screenContentResult),
  };

  const { fixture } = await renderComponent(BasicData, {
    providers: [
      { provide: CreditApplicationFacade, useValue: facade },
      { provide: Router, useValue: router },
      { provide: AdminConfigAdapter, useValue: adminConfig },
      { provide: ScreenContentAdapter, useValue: screenContentAdapter },
    ],
  });

  return { fixture, facade, router, adminConfig, screenContentAdapter };
}

describe('BasicData — constructor async data loading', () => {
  test('updates identificationTypes signal when adminConfig returns success', async () => {
    const { fixture } = await renderBasicData(ok(MOCK_ID_TYPES));
    await fixture.whenStable();

    const types = fixture.componentInstance.identificationTypes();
    expect(types).toEqual(MOCK_ID_TYPES);
  });

  test('keeps default identificationTypes when adminConfig returns failure', async () => {
    const { fixture } = await renderBasicData(err(new NetworkError()));
    await fixture.whenStable();

    const types = fixture.componentInstance.identificationTypes();
    expect(types.length).toBeGreaterThan(0);
    expect(types[0].id).toBe('NACIONAL');
  });

  test('updates screenContent signal when screenContentAdapter returns success', async () => {
    const { fixture } = await renderBasicData(ok(MOCK_ID_TYPES), ok(MOCK_SCREEN_CONTENT));
    await fixture.whenStable();

    const content = fixture.componentInstance.screenContent();
    expect(content.copy.headline).toBe('Headline');
    expect(content.media.gifUrl).toBe('/img/test.gif');
  });

  test('keeps default screenContent when screenContentAdapter returns failure', async () => {
    const { fixture } = await renderBasicData(ok(MOCK_ID_TYPES), err(new NetworkError()));
    await fixture.whenStable();

    const content = fixture.componentInstance.screenContent();
    expect(content.copy.headline).toBeTruthy();
    expect(content.copy.ctaLabel).toBe('Continuar');
  });
});

describe('BasicData — selectIdType()', () => {
  test('is a no-op when the same index is selected again', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;

    expect(comp['selectedIndex']()).toBe(0);

    comp.selectIdType(0);
    expect(comp['selectedIndex']()).toBe(0);
    expect(comp['idNumber']()).toBe('');
  });

  test('clears idNumber, errors, and contact data when switching type', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;

    comp['idNumber'].set('111111111');
    comp['idError'].set('some error');
    comp['contact'].set({ countryCode: '+1', phone: '12345678', email: 'a@b.com' });
    comp['showContactFields'].set(true);

    comp.selectIdType(1);

    expect(comp['selectedIndex']()).toBe(1);
    expect(comp['idNumber']()).toBe('');
    expect(comp['idError']()).toBeNull();
    expect(comp['showContactFields']()).toBe(false);
    expect(comp['contact']()).toEqual({ countryCode: '+506', phone: '', email: '' });
  });
});

describe('BasicData — onIdValueChange()', () => {
  test('sets idNumber and clears idError', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;
    comp['idError'].set('old error');

    comp.onIdValueChange('12345');

    expect(comp['idNumber']()).toBe('12345');
    expect(comp['idError']()).toBeNull();
  });

  test('hides contact fields if they were visible and a new ID is being typed', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;
    comp['showContactFields'].set(true);
    comp['contact'].set({ countryCode: '+1', phone: '11111111', email: 'x@x.com' });

    comp.onIdValueChange('1');

    expect(comp['showContactFields']()).toBe(false);
    expect(comp['contact']()).toEqual({ countryCode: '+506', phone: '', email: '' });
  });

  test('sets isIdLoading when the value reaches the required length (NACIONAL = 9)', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;

    vi.useFakeTimers();
    comp.onIdValueChange('123456789');

    expect(comp['isIdLoading']()).toBe(true);
    vi.useRealTimers();
  });

  test('does NOT set isIdLoading if value is shorter than required', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;

    comp.onIdValueChange('1234');
    expect(comp['isIdLoading']()).toBe(false);
  });

  test('showContactFields becomes true after the 1.5s timeout fires', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;

    vi.useFakeTimers();
    comp.onIdValueChange('123456789');

    expect(comp['isIdLoading']()).toBe(true);
    expect(comp['showContactFields']()).toBe(false);

    vi.advanceTimersByTime(1500);

    expect(comp['isIdLoading']()).toBe(false);
    expect(comp['showContactFields']()).toBe(true);
    vi.useRealTimers();
  });
});

describe('BasicData — onIdBlur()', () => {
  test('sets idTouched to true', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;

    comp.onIdBlur();
    expect(comp['idTouched']()).toBe(true);
  });

  test('shows an error when value is incomplete (length > 0 but < required)', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;
    comp['idNumber'].set('1234');

    comp.onIdBlur();

    expect(comp['idError']()).toContain('9');
  });

  test('does NOT show an error when idNumber is empty', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;
    comp['idNumber'].set('');

    comp.onIdBlur();

    expect(comp['idError']()).toBeNull();
  });

  test('does NOT show an error when value is exactly the required length', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;
    comp['idNumber'].set('123456789');

    comp.onIdBlur();

    expect(comp['idError']()).toBeNull();
  });
});

describe('BasicData — phone interactions', () => {
  test('onPhoneValueChange updates phone and clears phoneError', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;
    comp['phoneError'].set('old phone error');

    comp.onPhoneValueChange('88001122');

    expect(comp['contact']().phone).toBe('88001122');
    expect(comp['phoneError']()).toBeNull();
  });

  test('onPhoneBlur sets phoneTouched', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;

    comp.onPhoneBlur();
    expect(comp['phoneTouched']()).toBe(true);
  });

  test('onPhoneBlur sets error for short phone (length > 0 but < 8)', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;
    comp['contact'].set({ countryCode: '+506', phone: '1234', email: '' });

    comp.onPhoneBlur();

    expect(comp['phoneError']()).toContain('8');
  });

  test('onPhoneBlur does NOT set error when phone is empty', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;
    comp['contact'].set({ countryCode: '+506', phone: '', email: '' });

    comp.onPhoneBlur();

    expect(comp['phoneError']()).toBeNull();
  });

  test('onPhoneBlur does NOT set error when phone has exactly 8 digits', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;
    comp['contact'].set({ countryCode: '+506', phone: '88888888', email: '' });

    comp.onPhoneBlur();

    expect(comp['phoneError']()).toBeNull();
  });
});

describe('BasicData — email interactions', () => {
  test('onEmailValueChange updates email and clears emailError', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;
    comp['emailError'].set('old email error');

    comp.onEmailValueChange('new@email.com');

    expect(comp['contact']().email).toBe('new@email.com');
    expect(comp['emailError']()).toBeNull();
  });

  test('onEmailBlur sets emailTouched', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;

    comp.onEmailBlur();
    expect(comp['emailTouched']()).toBe(true);
  });

  test('onEmailBlur sets error for invalid email format', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;
    comp['contact'].set({ countryCode: '+506', phone: '', email: 'not-an-email' });

    comp.onEmailBlur();

    expect(comp['emailError']()).toBeTruthy();
    expect(comp['emailError']()).toContain('correo');
  });

  test('onEmailBlur does NOT set error when email is empty', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;
    comp['contact'].set({ countryCode: '+506', phone: '', email: '' });

    comp.onEmailBlur();

    expect(comp['emailError']()).toBeNull();
  });

  test('onEmailBlur does NOT set error for a valid email', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;
    comp['contact'].set({ countryCode: '+506', phone: '', email: 'valid@test.com' });

    comp.onEmailBlur();

    expect(comp['emailError']()).toBeNull();
  });
});

describe('BasicData — onCountryChange()', () => {
  test('updates countryCode when passed a string', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;

    comp.onCountryChange('+1');

    expect(comp['contact']().countryCode).toBe('+1');
  });

  test('updates countryCode when passed an array (takes first element)', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;

    comp.onCountryChange(['+52', '+57']);

    expect(comp['contact']().countryCode).toBe('+52');
  });

  test('does NOT update countryCode when passed null', async () => {
    const { fixture } = await renderBasicData();
    const comp = fixture.componentInstance;
    comp['contact'].set({ countryCode: '+506', phone: '', email: '' });

    comp.onCountryChange(null);

    expect(comp['contact']().countryCode).toBe('+506');
  });
});
