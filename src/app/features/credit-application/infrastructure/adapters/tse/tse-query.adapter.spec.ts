import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@core/config/api.config';
import { LOGGER } from '@core/core';
import { NetworkError, NotFoundError } from '@shared/result/result';
import { TSEQueryAdapter } from './tse-query.adapter';

const BASE = 'https://api.example.test';

function mockLogger() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

describe('TSEQueryAdapter — findByIdentification()', () => {
  let adapter: TSEQueryAdapter;
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
    adapter = TestBed.inject(TSEQueryAdapter);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  test('GETs /tse/personas/:id and maps PersonNameDto to PersonName', async () => {
    const promise = adapter.findByIdentification('1-2345-6789');

    const req = http.expectOne(`${BASE}/tse/personas/1-2345-6789`);
    expect(req.request.method).toBe('GET');
    req.flush({
      first_name: 'María',
      last_name: 'López',
      full_name: 'María López',
    });

    const result = await promise;
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value?.firstName).toBe('María');
      expect(result.value?.lastName).toBe('López');
      expect(result.value?.fullName).toBe('María López');
    }
  });

  test('returns err(NotFoundError) on 404', async () => {
    const promise = adapter.findByIdentification('9-9999-9999');

    const req = http.expectOne(`${BASE}/tse/personas/9-9999-9999`);
    req.flush('not found', { status: 404, statusText: 'Not Found' });

    const result = await promise;
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(NotFoundError);
    }
  });

  test('returns err(NetworkError) on non-404 HTTP failure', async () => {
    const promise = adapter.findByIdentification('1-2345-6789');

    const req = http.expectOne(`${BASE}/tse/personas/1-2345-6789`);
    req.flush('error', { status: 503, statusText: 'Service Unavailable' });

    const result = await promise;
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(NetworkError);
    }
  });
});

describe('person-name.mapper — mapDtoToPersonName', () => {
  test('maps all fields from PersonNameDto to PersonName', async () => {
    const { mapDtoToPersonName } = await import('./person-name.mapper');
    const dto = { first_name: 'Carlos', last_name: 'Vargas', full_name: 'Carlos Vargas' };
    const result = mapDtoToPersonName(dto);
    expect(result.firstName).toBe('Carlos');
    expect(result.lastName).toBe('Vargas');
    expect(result.fullName).toBe('Carlos Vargas');
  });
});
