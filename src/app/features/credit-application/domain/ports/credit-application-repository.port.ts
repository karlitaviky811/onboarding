import { CreditApplication } from '../entities/credit-application';
import { Identification } from '../value-objects/identification';
import { Result, NotFoundError, NetworkError } from '@shared/result/result';

export interface CreditApplicationRepository {
  findByIdentification(identification: Identification): Promise<Result<CreditApplication | null, NotFoundError | NetworkError>>;
  save(application: CreditApplication): Promise<Result<CreditApplication, NetworkError>>;
  findById(id: string): Promise<Result<CreditApplication | null, NotFoundError | NetworkError>>;
}
