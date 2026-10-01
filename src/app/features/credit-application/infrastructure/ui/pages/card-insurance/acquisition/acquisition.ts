import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CreditApplicationFacade } from '../../../../../application/credit-application.facade';

// Stage: CardInsurance — SubStage: Acquisition
// TODO: implementar desde los diseños de Figma
@Component({
  selector: 'app-acquisition',
  imports: [],
  templateUrl: './acquisition.html',
  styleUrl: './acquisition.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Acquisition {
  protected readonly facade = inject(CreditApplicationFacade);
}
