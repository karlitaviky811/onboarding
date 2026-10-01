import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CreditApplicationFacade } from '../../../../../application/credit-application.facade';

// Stage: CreditAnalysis — SubStage: Qualification
// TODO: implementar desde los diseños de Figma
@Component({
  selector: 'app-qualification',
  imports: [],
  templateUrl: './qualification.html',
  styleUrl: './qualification.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Qualification {
  protected readonly facade = inject(CreditApplicationFacade);
}
