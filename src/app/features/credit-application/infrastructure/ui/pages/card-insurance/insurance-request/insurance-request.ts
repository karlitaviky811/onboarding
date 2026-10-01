import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CreditApplicationFacade } from '../../../../../application/credit-application.facade';

// Stage: CardInsurance — SubStage: InsuranceRequest
// TODO: implementar desde los diseños de Figma
@Component({
  selector: 'app-insurance-request',
  imports: [],
  templateUrl: './insurance-request.html',
  styleUrl: './insurance-request.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsuranceRequest {
  protected readonly facade = inject(CreditApplicationFacade);
}
