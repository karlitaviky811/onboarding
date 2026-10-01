import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CreditApplicationFacade } from '../../../../../application/credit-application.facade';

// Stage: Result — SubStage: Credentials
// TODO: implementar desde los diseños de Figma
@Component({
  selector: 'app-credentials',
  imports: [],
  templateUrl: './credentials.html',
  styleUrl: './credentials.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Credentials {
  protected readonly facade = inject(CreditApplicationFacade);
}
