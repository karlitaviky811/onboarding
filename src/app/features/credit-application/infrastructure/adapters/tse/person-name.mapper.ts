import { PersonName } from '@credit-application/domain';
import { PersonNameDto } from './person-name.dto';

export function mapDtoToPersonName(dto: PersonNameDto): PersonName {
  return {
    firstName: dto.first_name,
    lastName: dto.last_name,
    fullName: dto.full_name,
  };
}
