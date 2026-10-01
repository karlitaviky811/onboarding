import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CreditApplicationFacade } from '@credit-application/application';

@Component({
  selector: 'app-consent',
  imports: [],
  templateUrl: './consent.html',
  styleUrl: './consent.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Consent {
  protected readonly facade  = inject(CreditApplicationFacade);
  protected readonly isFlip  = this.facade.isFlipClient;
}
