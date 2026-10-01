import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CreditApplicationFacade } from '../../../../../application/credit-application.facade';

// Stage: Personalization — SubStage: Location
// TODO: implementar desde los diseños de Figma
@Component({
  selector: 'app-location',
  imports: [],
  templateUrl: './location.html',
  styleUrl: './location.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Location {
  protected readonly facade = inject(CreditApplicationFacade);
}
