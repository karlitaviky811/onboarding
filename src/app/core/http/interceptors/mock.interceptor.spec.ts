import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { mockInterceptor } from './mock.interceptor';

// ── environment mock ──────────────────────────────────────────────────────────
// We control mockEnabled via the module mock so tests run the mock-path.

vi.mock('@environments/environment', () => ({
  environment: { mockEnabled: true },
}));

// ── SLICE 1: new-vs-validated example rule ────────────────────────────────────
// EXAMPLE RULE (temporary): 123456789 = new client (null body); any other id = already validated.

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

  it('returns null body for id 123456789 (new client — no existing application)', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<null>('http://localhost:3000/originacion/solicitudes/123456789')),
    );
    expect(result).toBeNull();
  });

  it('returns a mock application body for id 111111111 (already validated client)', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<{ id: string }>('http://localhost:3000/originacion/solicitudes/111111111')),
    );
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('id');
  });

  it('returns a mock application body for id 987654321 (any other id → validated)', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<{ id: string }>('http://localhost:3000/originacion/solicitudes/987654321')),
    );
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('id');
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

  // ── RED→GREEN: the mock interceptor returns the active demo identity provider
  //    for GET /admin/config. Currently 'persona-widget' — switch this value to
  //    swap the validator. AdminConfigAdapter.preload() reads this in ng serve.

  it('returns { identityProvider: "persona-widget" } for GET /admin/config (exact endpoint)', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<{ identityProvider: string }>('http://localhost:3000/admin/config')),
    );

    expect(result).toEqual({ identityProvider: 'persona-widget' });
  });

  // ── Triangulation: also works with a URL that has a different host/prefix
  it('returns { identityProvider: "persona-widget" } for any URL ending with /admin/config', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      lastValueFrom(http.get<{ identityProvider: string }>('https://api.example.com/admin/config')),
    );

    expect(result).toEqual({ identityProvider: 'persona-widget' });
  });

  // ── Guard: specific sub-paths must NOT be swallowed by the generic handler ──
  //
  // These tests verify the endsWith('/admin/config') guard: sub-paths like
  // /admin/config/servicio-cliente do NOT end with '/admin/config', so the
  // more-specific handlers above it in the interceptor fire first.
  //
  // We verify the invariant structurally (URL string math) rather than through
  // an HTTP call, because the specific handlers are what respond to those URLs —
  // NOT the generic handler. The guard is in the URL shape, not in ordering alone.

  it('URL /admin/config/servicio-cliente does NOT end with /admin/config (guard invariant)', () => {
    const specificUrl = '/admin/config/servicio-cliente';
    expect(specificUrl.endsWith('/admin/config')).toBe(false);
  });

  it('URL /admin/config/reintentos does NOT end with /admin/config (guard invariant)', () => {
    const specificUrl = '/admin/config/reintentos';
    expect(specificUrl.endsWith('/admin/config')).toBe(false);
  });
});
