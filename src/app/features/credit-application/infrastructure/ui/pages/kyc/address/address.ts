import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CreditApplicationFacade } from '../../../../../application/credit-application.facade';

// Stage: KYC — SubStage: Address
// TODO: implementar desde los diseños de Figma
@Component({
  selector: 'app-address',
  imports: [],
  templateUrl: './address.html',
  styleUrl: './address.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Address {
  protected readonly facade = inject(CreditApplicationFacade);
}
