import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CreditApplicationFacade } from '../../../../../application/credit-application.facade';

// Stage: Personalization — SubStage: Acceptance
// TODO: implementar desde los diseños de Figma
@Component({
  selector: 'app-acceptance',
  imports: [],
  templateUrl: './acceptance.html',
  styleUrl: './acceptance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Acceptance {
  protected readonly facade = inject(CreditApplicationFacade);
}
