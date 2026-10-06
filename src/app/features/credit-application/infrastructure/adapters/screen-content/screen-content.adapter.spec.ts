import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@core/config/api.config';
import { LOGGER } from '@core/core';
import { NetworkError } from '@shared/result/result';
import { ScreenContentAdapter } from './screen-content.adapter';

const BASE = 'https://api.example.test';

function mockLogger() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

describe('ScreenContentAdapter — load()', () => {
  let adapter: ScreenContentAdapter;
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
    adapter = TestBed.inject(ScreenContentAdapter);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  test('GETs /admin/screens/:screenKey and returns ok(ScreenContent)', async () => {
    const expectedContent = { title: 'Bienvenido', body: 'Ingrese sus datos.' };
    const promise = adapter.load('welcome');

    const req = http.expectOne(`${BASE}/admin/screens/welcome`);
    expect(req.request.method).toBe('GET');
    req.flush(expectedContent);

    const result = await promise;
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual(expectedContent);
    }
  });

  test('returns err(NetworkError) on HTTP failure', async () => {
    const promise = adapter.load('missing-screen');

    const req = http.expectOne(`${BASE}/admin/screens/missing-screen`);
    req.flush('not found', { status: 404, statusText: 'Not Found' });

    const result = await promise;
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(NetworkError);
    }
  });

  test('logs and returns err(NetworkError) on 503 service unavailable', async () => {
    const promise = adapter.load('consent');

    const req = http.expectOne(`${BASE}/admin/screens/consent`);
    req.flush('unavailable', { status: 503, statusText: 'Service Unavailable' });

    const result = await promise;
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(NetworkError);
    }
  });
});
