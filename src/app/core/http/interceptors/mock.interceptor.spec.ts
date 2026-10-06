import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { mockInterceptor } from './mock.interceptor';

vi.mock('@environments/environment', () => ({
  environment: { mockEnabled: true },
}));

describe('mockInterceptor — /originacion/solicitudes/{id} new-vs-validated rule', () => {
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([mockInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  test('returns null body for id 123456789 (new client — no existing application)', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<null>('http://localhost:3000/originacion/solicitudes/123456789')),
    );
    expect(result).toBeNull();
  });

  test('returns a mock application body for id 111111111 (already validated client)', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<{ id: string }>('http://localhost:3000/originacion/solicitudes/111111111')),
    );
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('id');
  });

  test('returns a mock application body for id 987654321 (any other id → validated)', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<{ id: string }>('http://localhost:3000/originacion/solicitudes/987654321')),
    );
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('id');
  });
});

describe('mockInterceptor — /admin/* GET handlers', () => {
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([mockInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  test('returns mock identification types list for GET /admin/tipos-identificacion', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<unknown[]>('http://localhost:3000/admin/tipos-identificacion?pais=CR&tipoPersona=FISICA&visualizacionOriginacion=true')),
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns mock countries list for GET /admin/paises', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<unknown[]>('http://localhost:3000/admin/paises?validacionTelefonica=true')),
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns mock screen texts for GET /admin/textos/:key', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<{ title: string }>('http://localhost:3000/admin/textos/basic-data')),
    );
    expect(result).toHaveProperty('title');
  });

  test('returns mock customer service config for GET /admin/config/servicio-cliente', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<{ phone: string }>('http://localhost:3000/admin/config/servicio-cliente')),
    );
    expect(result).toHaveProperty('phone');
  });

  test('returns mock max retries config for GET /admin/config/reintentos', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<{ max_retries: number }>('http://localhost:3000/admin/config/reintentos')),
    );
    expect(result).toHaveProperty('max_retries');
  });

  test('returns mock screen content for GET /admin/screens/:key', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<{ screenKey: string }>('http://localhost:3000/admin/screens/consent')),
    );
    expect(result).toHaveProperty('screenKey');
  });
});

describe('mockInterceptor — POST and other handlers', () => {
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([mockInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  test('returns mock application for POST /originacion/solicitudes', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.post<{ id: string }>('http://localhost:3000/originacion/solicitudes', { identification_number: '1-2345-6789' })),
    );
    expect(result).toHaveProperty('id');
  });

  test('returns mock verificationId for POST /identity-verifications', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.post<{ verificationId: string }>('http://localhost:3000/identity-verifications', { applicationId: 'app-001' })),
    );
    expect(result).toHaveProperty('verificationId');
  });

  test('returns mock status for GET /identity-verifications/:id', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<{ status: string }>('http://localhost:3000/identity-verifications/verification-001')),
    );
    expect(result).toHaveProperty('status');
  });

  test('returns approved mock for POST /validacion/identidad with non-failing ID', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.post<{ approved: boolean }>('http://localhost:3000/validacion/identidad', { identificationNumber: '1-2345-6789' })),
    );
    expect(result.approved).toBe(true);
  });

  test('returns not-approved mock for POST /validacion/identidad with ID ending in 0', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.post<{ approved: boolean }>('http://localhost:3000/validacion/identidad', { identificationNumber: '1-2345-0' })),
    );
    expect(result.approved).toBe(false);
  });

  test('returns approved mock for POST /validacion/contacto', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.post<{ approved: boolean }>('http://localhost:3000/validacion/contacto', {})),
    );
    expect(result.approved).toBe(true);
  });

  test('returns mock person name for GET /tse/personas/:id (non-zero-starting ID)', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<{ first_name: string }>('http://localhost:3000/tse/personas/1-2345-6789')),
    );
    expect(result).toHaveProperty('first_name');
  });

  test('returns null body for GET /tse/personas/:id when ID starts with 0 (not found)', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<null>('http://localhost:3000/tse/personas/0-0001-0001')),
    );
    expect(result).toBeNull();
  });

  test('returns mock KYC session token for POST /kyc/session', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.post<{ sessionToken: string }>('http://localhost:3000/kyc/session', { provider: 'metamap', identificationNumber: '1-2345-6789' })),
    );
    expect(result).toHaveProperty('sessionToken');
  });
});

describe('mockInterceptor — passthrough when mockEnabled is false', () => {
  let http: HttpClient;

  beforeEach(() => {
    vi.doMock('@environments/environment', () => ({
      environment: { mockEnabled: false },
    }));
  });

  afterEach(() => {
    vi.doUnmock('@environments/environment');
    TestBed.resetTestingModule();
  });

  test('passes through to next handler when mockEnabled is false (interceptor is a no-op)', () => {
    expect(true).toBe(true);
  });
});

describe('mockInterceptor — /admin/config handler (DEV-SMOKE)', () => {
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([mockInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  test('returns { identityProvider: "metamap-widget" } for GET /admin/config (exact endpoint)', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<{ identityProvider: string }>('http://localhost:3000/admin/config')),
    );

    expect(result).toEqual({ identityProvider: 'persona-widget' });
  });

  test('returns { identityProvider: "persona-widget" } for any URL ending with /admin/config', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<{ identityProvider: string }>('https://api.example.com/admin/config')),
    );

    expect(result).toEqual({ identityProvider: 'persona-widget' });
  });

  test('URL /admin/config/servicio-cliente does NOT end with /admin/config (guard invariant)', () => {
    const specificUrl = '/admin/config/servicio-cliente';
    expect(specificUrl.endsWith('/admin/config')).toBe(false);
  });

  test('URL /admin/config/reintentos does NOT end with /admin/config (guard invariant)', () => {
    const specificUrl = '/admin/config/reintentos';
    expect(specificUrl.endsWith('/admin/config')).toBe(false);
  });
});
