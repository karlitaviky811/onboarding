import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CreditApplicationFacade } from '../../../../../application/credit-application.facade';

// Stage: KYC — SubStage: PersonalData
// TODO: implementar desde los diseños de Figma
@Component({
  selector: 'app-personal-data',
  imports: [],
  templateUrl: './personal-data.html',
  styleUrl: './personal-data.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalData {
  protected readonly facade = inject(CreditApplicationFacade);
}
