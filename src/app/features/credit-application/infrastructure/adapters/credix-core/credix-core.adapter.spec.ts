import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@core/config/api.config';
import { LOGGER } from '@core/core';
import { Identification, IdentificationType, UserType } from '@credit-application/domain';
import { ApplicationStage, ApplicationSubstage } from '@credit-application/domain';
import { ApplicationProgress } from '@credit-application/domain';
import { ApplicantProfile } from '@credit-application/domain';
import { CreditApplication } from '@credit-application/domain';
import { NetworkError, NotFoundError } from '@shared/result/result';
import { CredixCoreAdapter } from './credix-core.adapter';

const BASE = 'https://api.example.test';

function mockLogger() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function makeResponseDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app-001',
    identification_type: 'NACIONAL',
    identification_number: '1-2345-6789',
    user_type: 'CLIENTE_NUEVO',
    current_stage: 'SOLICITUD',
    current_substage: 'DATOS_BASICOS',
    profile: {
      identification_number: '1-2345-6789',
      identification_type: 'NACIONAL',
    },
    progress_log: [],
    ...overrides,
  };
}

function makeCreditApplication(): CreditApplication {
  return CreditApplication.create(
    'app-001',
    new Identification(IdentificationType.National, '1-2345-6789'),
  );
}

describe('CredixCoreAdapter — findByIdentification()', () => {
  let adapter: CredixCoreAdapter;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: LOGGER, useValue: mockLogger() },
      ],
    });
    adapter = TestBed.inject(CredixCoreAdapter);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  test('GETs /originacion/solicitudes/:number and returns mapped application', async () => {
    const promise = adapter.findByIdentification(
      new Identification(IdentificationType.National, '1-2345-6789'),
    );

    const req = http.expectOne(`${BASE}/originacion/solicitudes/1-2345-6789`);
    expect(req.request.method).toBe('GET');
    req.flush(makeResponseDto());

    const result = await promise;
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).not.toBeNull();
      expect(result.value?.id).toBe('app-001');
    }
  });

  test('returns ok(null) when backend responds with null', async () => {
    const promise = adapter.findByIdentification(
      new Identification(IdentificationType.National, '1-2345-6789'),
    );

    const req = http.expectOne(`${BASE}/originacion/solicitudes/1-2345-6789`);
    req.flush(null);

    const result = await promise;
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBeNull();
    }
  });

  test('returns err(NetworkError) on HTTP failure', async () => {
    const promise = adapter.findByIdentification(
      new Identification(IdentificationType.National, '1-2345-6789'),
    );

    const req = http.expectOne(`${BASE}/originacion/solicitudes/1-2345-6789`);
    req.flush('error', { status: 500, statusText: 'Internal Server Error' });

    const result = await promise;
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(NetworkError);
    }
  });
});

describe('CredixCoreAdapter — save()', () => {
  let adapter: CredixCoreAdapter;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: LOGGER, useValue: mockLogger() },
      ],
    });
    adapter = TestBed.inject(CredixCoreAdapter);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  test('POSTs to /originacion/solicitudes and returns mapped application', async () => {
    const app = makeCreditApplication();
    const promise = adapter.save(app);

    const req = http.expectOne(`${BASE}/originacion/solicitudes`);
    expect(req.request.method).toBe('POST');
    req.flush(makeResponseDto());

    const result = await promise;
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.id).toBe('app-001');
    }
  });

  test('returns err(NetworkError) on HTTP failure', async () => {
    const app = makeCreditApplication();
    const promise = adapter.save(app);

    const req = http.expectOne(`${BASE}/originacion/solicitudes`);
    req.flush('error', { status: 503, statusText: 'Service Unavailable' });

    const result = await promise;
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(NetworkError);
    }
  });
});

describe('CredixCoreAdapter — findById()', () => {
  let adapter: CredixCoreAdapter;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: LOGGER, useValue: mockLogger() },
      ],
    });
    adapter = TestBed.inject(CredixCoreAdapter);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  test('GETs /originacion/solicitudes/:id and returns mapped application', async () => {
    const promise = adapter.findById('app-001');

    const req = http.expectOne(`${BASE}/originacion/solicitudes/app-001`);
    expect(req.request.method).toBe('GET');
    req.flush(makeResponseDto());

    const result = await promise;
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value?.id).toBe('app-001');
    }
  });

  test('returns err(NotFoundError) on 404', async () => {
    const promise = adapter.findById('app-missing');

    const req = http.expectOne(`${BASE}/originacion/solicitudes/app-missing`);
    req.flush('not found', { status: 404, statusText: 'Not Found' });

    const result = await promise;
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(NotFoundError);
    }
  });

  test('returns err(NetworkError) on non-404 HTTP failure', async () => {
    const promise = adapter.findById('app-001');

    const req = http.expectOne(`${BASE}/originacion/solicitudes/app-001`);
    req.flush('error', { status: 500, statusText: 'Internal Server Error' });

    const result = await promise;
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(NetworkError);
    }
  });
});

describe('CredixCoreAdapter — credit-application.mapper: mapDtoToCreditApplication with optional fields', () => {
  let adapter: CredixCoreAdapter;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: LOGGER, useValue: mockLogger() },
      ],
    });
    adapter = TestBed.inject(CredixCoreAdapter);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  test('maps DTO with contact and validatedAt correctly', async () => {
    const promise = adapter.findByIdentification(
      new Identification(IdentificationType.National, '1-2345-6789'),
    );

    const req = http.expectOne(`${BASE}/originacion/solicitudes/1-2345-6789`);
    req.flush(makeResponseDto({
      profile: {
        identification_number: '1-2345-6789',
        identification_type: 'NACIONAL',
        first_name: 'Juan',
        last_name: 'García',
        contact: {
          country_code: '+506',
          phone: '88887777',
          email: 'juan@example.test',
        },
        validated_at: '2026-01-01T00:00:00.000Z',
      },
      current_completed_at: '2026-01-01T00:00:00.000Z',
      result: 'Approved',
      created_at: '2025-12-01T00:00:00.000Z',
      progress_log: [
        {
          stage: 'SOLICITUD',
          substage: 'DATOS_BASICOS',
          status: 'success',
          timestamp: '2025-12-01T00:00:00.000Z',
        },
      ],
    }));

    const result = await promise;
    expect(result.success).toBe(true);
    if (result.success && result.value) {
      expect(result.value.profile.firstName).toBe('Juan');
      expect(result.value.profile.contact?.email).toBe('juan@example.test');
      expect(result.value.result).toBe('Approved');
      expect(result.value.progressLog).toHaveLength(1);
    }
  });
});
