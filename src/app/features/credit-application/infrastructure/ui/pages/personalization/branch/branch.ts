import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CreditApplicationFacade } from '../../../../../application/credit-application.facade';

// Stage: Personalization — SubStage: Branch
// TODO: implementar desde los diseños de Figma
@Component({
  selector: 'app-branch',
  imports: [],
  templateUrl: './branch.html',
  styleUrl: './branch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Branch {
  protected readonly facade = inject(CreditApplicationFacade);
}
