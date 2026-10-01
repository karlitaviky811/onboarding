import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CreditApplicationFacade } from '@credit-application/application';

// Stage: Result
// Variants by user type:
//   ClientWithCard → welcome panel + app download
//   ClientWithoutCard → card delivery status + app download
//   Resuming (Prospect) → button to resume flow
//   Approved → continue to KYC
//   UnderReview / NotApproved → informational screens
@Component({
  selector: 'app-result',
  imports: [],
  templateUrl: './result.html',
  styleUrl: './result.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Result {
  protected readonly facade           = inject(CreditApplicationFacade);
  protected readonly isExistingClient = this.facade.isExistingClient;
  protected readonly isResuming       = this.facade.isResuming;
}
