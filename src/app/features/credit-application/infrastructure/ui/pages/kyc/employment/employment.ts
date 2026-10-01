import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CreditApplicationFacade } from '../../../../../application/credit-application.facade';

// Stage: KYC — SubStage: Employment
// TODO: implementar desde los diseños de Figma
@Component({
  selector: 'app-employment',
  imports: [],
  templateUrl: './employment.html',
  styleUrl: './employment.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Employment {
  protected readonly facade = inject(CreditApplicationFacade);
}
