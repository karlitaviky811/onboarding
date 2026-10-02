import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { screen } from '@testing-library/angular';
import { PersonName } from '@credit-application/domain';
import { CreditApplicationFacade } from '@credit-application/application';
import { renderComponent } from '../../../../../../../../testing';
import { Retomando } from './retomando';

// ── helpers ───────────────────────────────────────────────────────────────────

function createFacade(personName: PersonName | null = null) {
  return {
    personName: signal<PersonName | null>(personName).asReadonly(),
  };
}

async function renderRetomando(personName: PersonName | null = null) {
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const facade = createFacade(personName);

  const { fixture } = await renderComponent(Retomando, {
    providers: [
      { provide: CreditApplicationFacade, useValue: facade },
      { provide: Router, useValue: router },
    ],
  });

  return { fixture, facade, router };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Retomando screen', () => {

  describe('Greeting', () => {
    it('shows "¡Hola de nuevo {firstName}!" greeting using the stored person name', async () => {
      await renderRetomando({ firstName: 'Carlos', lastName: 'Gómez', fullName: 'Carlos Gómez' });
      expect(screen.getByText(/¡Hola de nuevo Carlos!/i)).toBeTruthy();
    });

    it('shows fallback greeting when no person name is available', async () => {
      await renderRetomando(null);
      expect(screen.getByText(/¡Hola de nuevo!/i)).toBeTruthy();
    });
  });

  describe('Continue navigation', () => {
    it('navigates to /request/identity-validation when Continue is clicked', async () => {
      const { fixture, router } = await renderRetomando({ firstName: 'Carlos', lastName: 'Gómez', fullName: 'Carlos Gómez' });
      const component = fixture.componentInstance;

      component.onContinue();
      await fixture.whenStable();

      expect(router.navigate).toHaveBeenCalledWith(['/request/identity-validation']);
    });
  });
});
