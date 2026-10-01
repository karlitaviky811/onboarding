import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CreditApplicationFacade } from '../../../../../application/credit-application.facade';

// Stage: Result — SubStage: DocumentDelivery
// TODO: implementar desde los diseños de Figma
@Component({
  selector: 'app-document-delivery',
  imports: [],
  templateUrl: './document-delivery.html',
  styleUrl: './document-delivery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentDelivery {
  protected readonly facade = inject(CreditApplicationFacade);
}
