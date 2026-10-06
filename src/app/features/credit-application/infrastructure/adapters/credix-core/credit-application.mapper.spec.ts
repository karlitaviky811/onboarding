import { describe, test, expect } from 'vitest';
import { mapDtoToCreditApplication, mapCreditApplicationToDto } from './credit-application.mapper';
import type { CreditApplicationResponseDto } from './credit-application.dto';

const fullDto: CreditApplicationResponseDto = {
  id: 'app-100',
  identification_type: 'NACIONAL',
  identification_number: '1-1111-2222',
  user_type: 'CLIENTE_NUEVO',
  current_stage: 'SOLICITUD',
  current_substage: 'DATOS_BASICOS',
  current_completed_at: '2026-01-01T00:00:00.000Z',
  profile: {
    identification_number: '1-1111-2222',
    identification_type: 'NACIONAL',
    first_name: 'Ana',
    last_name: 'López',
    contact: { country_code: '+506', phone: '70001111', email: 'ana@example.test' },
    validated_at: '2026-01-02T00:00:00.000Z',
  },
  progress_log: [
    {
      stage: 'SOLICITUD',
      substage: 'DATOS_BASICOS',
      status: 'success',
      timestamp: '2026-01-01T00:00:00.000Z',
      metadata: { reason: 'ok' },
    },
  ],
  result: 'Approved',
  created_at: '2025-12-01T00:00:00.000Z',
};

const minimalDto: CreditApplicationResponseDto = {
  id: 'app-min',
  identification_type: 'NACIONAL',
  identification_number: '9-8888-7777',
  user_type: 'CLIENTE_NUEVO',
  current_stage: 'SOLICITUD',
  current_substage: 'DATOS_BASICOS',
  profile: {
    identification_number: '9-8888-7777',
    identification_type: 'NACIONAL',
  },
  progress_log: [],
};

describe('credit-application.mapper — mapCreditApplicationToDto (all optional fields present)', () => {
  test('round-trips a full DTO, serializing every optional field and the progress_log entries', () => {
    const app = mapDtoToCreditApplication(fullDto);
    const dto = mapCreditApplicationToDto(app);

    expect(dto.id).toBe('app-100');
    expect(dto.current_completed_at).toBe('2026-01-01T00:00:00.000Z');
    expect(dto.created_at).toBe('2025-12-01T00:00:00.000Z');
    expect(dto.result).toBe('Approved');

    expect(dto.profile.contact).toEqual({
      country_code: '+506',
      phone: '70001111',
      email: 'ana@example.test',
    });
    expect(dto.profile.validated_at).toBe('2026-01-02T00:00:00.000Z');

    expect(dto.progress_log).toHaveLength(1);
    expect(dto.progress_log[0]).toMatchObject({
      stage: 'SOLICITUD',
      substage: 'DATOS_BASICOS',
      status: 'success',
      metadata: { reason: 'ok' },
    });
    expect(typeof dto.progress_log[0].timestamp).toBe('string');
  });
});

describe('credit-application.mapper — mapCreditApplicationToDto (all optional fields absent)', () => {
  test('leaves every optional field undefined when the source has none', () => {
    const app = mapDtoToCreditApplication(minimalDto);
    const dto = mapCreditApplicationToDto(app);

    expect(dto.current_completed_at).toBeUndefined();
    expect(dto.created_at).toBeUndefined();
    expect(dto.profile.contact).toBeUndefined();
    expect(dto.profile.validated_at).toBeUndefined();
    expect(dto.progress_log).toHaveLength(0);
  });
});

describe('credit-application.mapper — mapDtoToCreditApplication parse guards', () => {
  test('throws on an unknown ApplicationStage', () => {
    expect(() =>
      mapDtoToCreditApplication({ ...minimalDto, current_stage: 'NO_EXISTE' }),
    ).toThrow(/Unknown ApplicationStage/);
  });

  test('throws on an unknown UserType', () => {
    expect(() =>
      mapDtoToCreditApplication({ ...minimalDto, user_type: 'NO_EXISTE' }),
    ).toThrow(/Unknown UserType/);
  });

  test('throws on an unknown IdentificationType', () => {
    expect(() =>
      mapDtoToCreditApplication({ ...minimalDto, identification_type: 'NO_EXISTE' }),
    ).toThrow(/Unknown IdentificationType/);
  });
});
