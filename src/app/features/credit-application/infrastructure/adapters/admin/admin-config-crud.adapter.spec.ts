import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@core/config/api.config';
import { LOGGER } from '@core/core';
import { NetworkError } from '@shared/result/result';
import { AdminConfigAdapter } from './admin-config.adapter';

const BASE = 'https://api.example.test';

function mockLogger() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

describe('AdminConfigAdapter — getIdentificationTypes()', () => {
  let adapter: AdminConfigAdapter;
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
    adapter = TestBed.inject(AdminConfigAdapter);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  test('GETs the endpoint and returns ok(list)', async () => {
    const types = [{ code: 'NACIONAL', label: 'Cédula Nacional' }];
    const promise = adapter.getIdentificationTypes();

    const req = http.expectOne(
      `${BASE}/admin/tipos-identificacion?pais=CR&tipoPersona=FISICA&visualizacionOriginacion=true`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(types);

    const result = await promise;
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual(types);
    }
  });

  test('returns err(NetworkError) on HTTP failure', async () => {
    const promise = adapter.getIdentificationTypes();

    const req = http.expectOne(
      `${BASE}/admin/tipos-identificacion?pais=CR&tipoPersona=FISICA&visualizacionOriginacion=true`,
    );
    req.flush('error', { status: 500, statusText: 'Internal Server Error' });

    const result = await promise;
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(NetworkError);
    }
  });
});

describe('AdminConfigAdapter — getCountries()', () => {
  let adapter: AdminConfigAdapter;
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
    adapter = TestBed.inject(AdminConfigAdapter);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  test('GETs /admin/paises and returns ok(list)', async () => {
    const countries = [{ code: 'CR', name: 'Costa Rica' }];
    const promise = adapter.getCountries();

    const req = http.expectOne(`${BASE}/admin/paises?validacionTelefonica=true`);
    expect(req.request.method).toBe('GET');
    req.flush(countries);

    const result = await promise;
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual(countries);
    }
  });

  test('returns err(NetworkError) on HTTP failure', async () => {
    const promise = adapter.getCountries();

    const req = http.expectOne(`${BASE}/admin/paises?validacionTelefonica=true`);
    req.flush('error', { status: 503, statusText: 'Service Unavailable' });

    const result = await promise;
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(NetworkError);
    }
  });
});

describe('AdminConfigAdapter — getScreenTexts()', () => {
  let adapter: AdminConfigAdapter;
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
    adapter = TestBed.inject(AdminConfigAdapter);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  test('GETs /admin/textos/:screenKey and returns ok(ScreenTexts)', async () => {
    const texts = { title: 'Solicitud', body: 'Complete su solicitud.' };
    const promise = adapter.getScreenTexts('basic-data');

    const req = http.expectOne(`${BASE}/admin/textos/basic-data`);
    expect(req.request.method).toBe('GET');
    req.flush(texts);

    const result = await promise;
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual(texts);
    }
  });

  test('returns err(NetworkError) on HTTP failure', async () => {
    const promise = adapter.getScreenTexts('consent');

    const req = http.expectOne(`${BASE}/admin/textos/consent`);
    req.flush('not found', { status: 404, statusText: 'Not Found' });

    const result = await promise;
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(NetworkError);
    }
  });
});

describe('AdminConfigAdapter — getCustomerServicePhone()', () => {
  let adapter: AdminConfigAdapter;
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
    adapter = TestBed.inject(AdminConfigAdapter);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  test('GETs /admin/config/servicio-cliente and returns ok(phone)', async () => {
    const promise = adapter.getCustomerServicePhone();

    const req = http.expectOne(`${BASE}/admin/config/servicio-cliente`);
    expect(req.request.method).toBe('GET');
    req.flush({ phone: '+50688887777' });

    const result = await promise;
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe('+50688887777');
    }
  });

  test('returns err(NetworkError) on HTTP failure', async () => {
    const promise = adapter.getCustomerServicePhone();

    const req = http.expectOne(`${BASE}/admin/config/servicio-cliente`);
    req.flush('error', { status: 500, statusText: 'Internal Server Error' });

    const result = await promise;
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(NetworkError);
    }
  });
});

describe('AdminConfigAdapter — getMaxRetries()', () => {
  let adapter: AdminConfigAdapter;
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
    adapter = TestBed.inject(AdminConfigAdapter);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  test('GETs /admin/config/reintentos and returns ok(max_retries)', async () => {
    const promise = adapter.getMaxRetries();

    const req = http.expectOne(`${BASE}/admin/config/reintentos`);
    expect(req.request.method).toBe('GET');
    req.flush({ max_retries: 3 });

    const result = await promise;
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(3);
    }
  });

  test('returns err(NetworkError) on HTTP failure', async () => {
    const promise = adapter.getMaxRetries();

    const req = http.expectOne(`${BASE}/admin/config/reintentos`);
    req.flush('error', { status: 503, statusText: 'Service Unavailable' });

    const result = await promise;
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(NetworkError);
    }
  });
});
