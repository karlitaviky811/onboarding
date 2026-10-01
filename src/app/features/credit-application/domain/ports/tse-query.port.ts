import { Result, NotFoundError, NetworkError } from '@shared/result/result';

export interface PersonName {
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface TSEQuery {
  findByIdentification(identificationNumber: string): Promise<Result<PersonName | null, NotFoundError | NetworkError>>;
}
