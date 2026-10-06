import { describe, test, expect, vi, afterEach, type Mock } from 'vitest';
import { Router } from '@angular/router';
import { Component, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { screen } from '@testing-library/angular';
import { PersonName } from '@credit-application/domain';
import { CreditApplicationFacade } from '@credit-application/application';
import { ADMIN_CONFIG } from '@credit-application/infrastructure';
import { renderComponent } from '../../../../../../../../testing';
import { Consent } from './consent';
import { IDENTITY_WIDGET_REGISTRY } from '../../../components/identity-widget/widget-registry';
import type { IdentityVerificationWidget, VerificationWidgetEvent } from '../../../components/identity-widget/identity-verification-widget';

function createFacade(personName: PersonName | null = null) {
  return {
    personName: signal<PersonName | null>(personName).asReadonly(),
    isFlipClient: signal(false).asReadonly(),
  };
}

let _fakeWidgetEventsSubject: Subject<VerificationWidgetEvent>;
let _fakeWidgetInitializeSpy: Mock<(context: { referenceId?: string }) => void>;
let _fakeWidgetOpenSpy: Mock<() => void>;
let _fakeWidgetDestroySpy: Mock<() => void>;

@Component({
  selector: 'app-fake-identity-widget',
  standalone: true,
  template: `<div data-testid="fake-widget"></div>`,
})
class FakeIdentityWidgetComponent implements IdentityVerificationWidget {
  events$ = _fakeWidgetEventsSubject;
  initialize(context: { referenceId?: string }): void {
    _fakeWidgetInitializeSpy(context);
  }
  open(): void {
    _fakeWidgetOpenSpy();
  }
  destroy(): void {
    _fakeWidgetDestroySpy();
  }
}

function createFakeWidgetMocks() {
  _fakeWidgetEventsSubject = new Subject<VerificationWidgetEvent>();
  _fakeWidgetInitializeSpy = vi.fn<(context: { referenceId?: string }) => void>();
  _fakeWidgetOpenSpy = vi.fn<() => void>();
  _fakeWidgetDestroySpy = vi.fn<() => void>();
}

async function renderConsent(
  personName: PersonName | null = null,
  provider = 'persona-widget',
) {
  createFakeWidgetMocks();

  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const facade = createFacade(personName);

  const adminConfigStub = {
    getIdentityProvider: vi.fn().mockReturnValue(provider),
  };

  const mockRegistry = {
    [provider]: FakeIdentityWidgetComponent,
  };

  const { fixture } = await renderComponent(Consent, {
    providers: [
      { provide: CreditApplicationFacade, useValue: facade },
      { provide: Router, useValue: router },
      { provide: ADMIN_CONFIG, useValue: adminConfigStub },
      { provide: IDENTITY_WIDGET_REGISTRY, useValue: mockRegistry },
    ],
  });

  return {
    fixture,
    facade,
    router,
    get initializeSpy() { return _fakeWidgetInitializeSpy; },
    get openSpy() { return _fakeWidgetOpenSpy; },
    get destroySpy() { return _fakeWidgetDestroySpy; },
    get eventsSubject() { return _fakeWidgetEventsSubject; },
  };
}

describe('Consent screen', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Greeting', () => {
    test('shows "¡Hola {firstName}!" greeting using the stored person name', async () => {
      await renderConsent({ firstName: 'María', lastName: 'López', fullName: 'María López' });
      expect(screen.getByText(/¡Hola María!/i)).toBeTruthy();
    });

    test('shows fallback greeting when no person name is available', async () => {
      await renderConsent(null);
      expect(screen.getByText(/¡Hola!/i)).toBeTruthy();
    });
  });

  describe('Checkbox states — Continue button disabled', () => {
    test('Continue button is disabled when both checkboxes are unchecked', async () => {
      const { fixture } = await renderConsent({ firstName: 'Juan', lastName: 'Pérez', fullName: 'Juan Pérez' });
      const component = fixture.componentInstance;

      expect(component['acceptedTerms']()).toBe(false);
      expect(component['acceptedOic']()).toBe(false);
      expect(component['canContinue']()).toBe(false);
    });

    test('Continue button is disabled when only the first checkbox is checked', async () => {
      const { fixture } = await renderConsent({ firstName: 'Juan', lastName: 'Pérez', fullName: 'Juan Pérez' });
      const component = fixture.componentInstance;

      component['acceptedTerms'].set(true);
      fixture.detectChanges();

      expect(component['canContinue']()).toBe(false);
    });

    test('Continue button is disabled when only the second checkbox is checked', async () => {
      const { fixture } = await renderConsent({ firstName: 'Juan', lastName: 'Pérez', fullName: 'Juan Pérez' });
      const component = fixture.componentInstance;

      component['acceptedOic'].set(true);
      fixture.detectChanges();

      expect(component['canContinue']()).toBe(false);
    });
  });

  describe('Checkbox states — Continue button enabled', () => {
    test('canContinue() is true when both checkboxes are checked', async () => {
      const { fixture } = await renderConsent({ firstName: 'Juan', lastName: 'Pérez', fullName: 'Juan Pérez' });
      const component = fixture.componentInstance;

      component['acceptedTerms'].set(true);
      component['acceptedOic'].set(true);
      fixture.detectChanges();

      expect(component['canContinue']()).toBe(true);
    });
  });

  describe('Widget initialization (provider-agnostic)', () => {
    test('calls initialize() on the dynamically-created widget instance during ngAfterViewInit', async () => {
      const { initializeSpy } = await renderConsent({
        firstName: 'Juan', lastName: 'Pérez', fullName: 'Juan Pérez',
      });

      expect(initializeSpy).toHaveBeenCalledTimes(1);
    });

    test('does NOT call open() during initialization (pre-warm only, NOT immediate launch)', async () => {
      const { openSpy } = await renderConsent({
        firstName: 'Juan', lastName: 'Pérez', fullName: 'Juan Pérez',
      });

      expect(openSpy).not.toHaveBeenCalled();
    });
  });

  describe('Continue → widget.open() (no navigation)', () => {
    test('does NOT call router.navigate when both checkboxes are checked and Continue is invoked', async () => {
      const { fixture, router } = await renderConsent({
        firstName: 'Juan', lastName: 'Pérez', fullName: 'Juan Pérez',
      });
      const component = fixture.componentInstance;

      component['acceptedTerms'].set(true);
      component['acceptedOic'].set(true);
      fixture.detectChanges();

      component.onContinue();
      await fixture.whenStable();

      expect(router.navigate).not.toHaveBeenCalled();
    });

    test('does NOT navigate when Continue is clicked with checkboxes unchecked', async () => {
      const { fixture, router } = await renderConsent({
        firstName: 'Juan', lastName: 'Pérez', fullName: 'Juan Pérez',
      });
      const component = fixture.componentInstance;

      component.onContinue();
      await fixture.whenStable();

      expect(router.navigate).not.toHaveBeenCalled();
    });

    test('calls open() on the widget instance when both checkboxes are checked and Continue is invoked', async () => {
      const { fixture, openSpy } = await renderConsent({
        firstName: 'Juan', lastName: 'Pérez', fullName: 'Juan Pérez',
      });
      const component = fixture.componentInstance;

      component['acceptedTerms'].set(true);
      component['acceptedOic'].set(true);
      fixture.detectChanges();

      component.onContinue();

      expect(openSpy).toHaveBeenCalledTimes(1);
    });

    test('does NOT call open() when checkboxes are unchecked', async () => {
      const { fixture, openSpy } = await renderConsent({
        firstName: 'Juan', lastName: 'Pérez', fullName: 'Juan Pérez',
      });
      const component = fixture.componentInstance;

      component.onContinue();

      expect(openSpy).not.toHaveBeenCalled();
    });
  });

  describe('Widget events$ subscriptions', () => {
    test('navigates to /request/result when events$ emits finished', async () => {
      const { fixture, router, eventsSubject } = await renderConsent({
        firstName: 'Juan', lastName: 'Pérez', fullName: 'Juan Pérez',
      });

      eventsSubject.next({ type: 'finished', verificationId: 'inq-001' });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(router.navigate).toHaveBeenCalledWith(['/request/result']);
    });

    test('sets widgetLoadError when events$ emits error', async () => {
      const { fixture, eventsSubject } = await renderConsent({
        firstName: 'Juan', lastName: 'Pérez', fullName: 'Juan Pérez',
      });
      const component = fixture.componentInstance;

      eventsSubject.next({ type: 'error', message: 'SDK failed' });
      fixture.detectChanges();

      expect(component['widgetLoadError']()).toBe(true);
    });

    test('shows error message in DOM when events$ emits error', async () => {
      const { fixture, eventsSubject } = await renderConsent({
        firstName: 'Juan', lastName: 'Pérez', fullName: 'Juan Pérez',
      });

      eventsSubject.next({ type: 'error' });
      fixture.detectChanges();

      expect(screen.getByTestId('consent-widget-error')).toBeInTheDocument();
    });

    test('does NOT navigate when events$ emits exited (user cancelled)', async () => {
      const { fixture, router, eventsSubject } = await renderConsent({
        firstName: 'Juan', lastName: 'Pérez', fullName: 'Juan Pérez',
      });

      eventsSubject.next({ type: 'exited' });
      await fixture.whenStable();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Unknown provider — shows error', () => {
    test('shows widgetLoadError when provider is not in the registry', async () => {
      createFakeWidgetMocks();

      const router = { navigate: vi.fn().mockResolvedValue(true) };
      const facade = createFacade(null);
      const adminConfigStub = {
        getIdentityProvider: vi.fn().mockReturnValue('unknown-provider'),
      };

      const emptyRegistry = {};

      const { fixture } = await renderComponent(Consent, {
        providers: [
          { provide: CreditApplicationFacade, useValue: facade },
          { provide: Router, useValue: router },
          { provide: ADMIN_CONFIG, useValue: adminConfigStub },
          { provide: IDENTITY_WIDGET_REGISTRY, useValue: emptyRegistry },
        ],
      });
      fixture.detectChanges();

      expect(fixture.componentInstance['widgetLoadError']()).toBe(true);
    });
  });
});
