import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CreditApplicationFacade } from '../../../../../application/credit-application.facade';

// Stage: KYC — SubStage: IncomeDetails
// TODO: implementar desde los diseños de Figma
@Component({
  selector: 'app-income-details',
  imports: [],
  templateUrl: './income-details.html',
  styleUrl: './income-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncomeDetails {
  protected readonly facade = inject(CreditApplicationFacade);
}
