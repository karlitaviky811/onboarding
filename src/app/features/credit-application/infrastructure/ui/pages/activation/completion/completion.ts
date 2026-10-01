import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CreditApplicationFacade } from '../../../../../application/credit-application.facade';

@Component({
  selector: 'app-completion',
  imports: [],
  templateUrl: './completion.html',
  styleUrl: './completion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Completion {
  protected readonly facade = inject(CreditApplicationFacade);
}
