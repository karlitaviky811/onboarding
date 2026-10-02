import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { LibButtonComponent } from 'crdx-components';
import { CreditApplicationFacade } from '@credit-application/application';

/**
 * Stage: Request — Substage: Retomando (ALREADY-VALIDATED clients)
 *
 * Shown after BasicData when DetermineUserTypeUseCase returns any type other
 * than NewClient (i.e., the client has an existing application).
 * Greets the user by name and lets them resume from the last completed step.
 *
 * TODO (slice 4 / PR-B): On continue, navigate to the real resume target
 * (the last completed substage) rather than always going to identity-validation.
 */
@Component({
  selector: 'app-retomando',
  standalone: true,
  imports: [LibButtonComponent],
  templateUrl: './retomando.html',
  styleUrl: './retomando.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Retomando {
  protected readonly facade = inject(CreditApplicationFacade);
  private readonly router = inject(Router);

  /** Greeting name derived from the stored person name (set during BasicData.onContinue). */
  protected readonly greetingName = computed(
    () => this.facade.personName()?.firstName ?? null,
  );

  onContinue(): void {
    // TODO (slice 4 / later): navigate to the real last completed step.
    this.router.navigate(['/request/identity-validation']);
  }
}
