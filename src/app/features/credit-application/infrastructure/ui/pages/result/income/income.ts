import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CreditApplicationFacade } from '../../../../../application/credit-application.facade';

// Stage: Result — SubStage: Income
// TODO: implementar desde los diseños de Figma
@Component({
  selector: 'app-income',
  imports: [],
  templateUrl: './income.html',
  styleUrl: './income.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Income {
  protected readonly facade = inject(CreditApplicationFacade);
}
