import { Result, NetworkError } from '@shared/result/result';

// Port for credit bureau queries during the Credit Analysis stage

export interface CreditScore {
  value: number;
  level: 'High' | 'Medium' | 'Low';
  result: 'Approved' | 'UnderReview' | 'NotApproved';
}

export interface CreditBureau {
  queryScore(identificationNumber: string): Promise<Result<CreditScore, NetworkError>>;
}
