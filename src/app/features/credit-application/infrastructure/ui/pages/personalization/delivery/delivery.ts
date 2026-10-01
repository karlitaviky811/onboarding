import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CreditApplicationFacade } from '../../../../../application/credit-application.facade';

// Stage: Personalization — SubStage: Delivery
// TODO: implementar desde los diseños de Figma
@Component({
  selector: 'app-delivery',
  imports: [],
  templateUrl: './delivery.html',
  styleUrl: './delivery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Delivery {
  protected readonly facade = inject(CreditApplicationFacade);
}
