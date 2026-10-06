import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@core/config/api.config';
import { LOGGER } from '@core/core';
import { AdminConfigAdapter } from './admin-config.adapter';

describe('AdminConfigAdapter — preload() and getIdentityProvider()', () => {
  let adapter: AdminConfigAdapter;
  let httpController: HttpTestingController;
  let mockLogger: { debug: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.example.test' },
        { provide: LOGGER, useValue: mockLogger },
      ],
    });

    adapter = TestBed.inject(AdminConfigAdapter);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  test('FU-1h: returns default "metamap" synchronously before preload() has run', () => {
    const result = adapter.getIdentityProvider();
    expect(result).toBe('metamap');

    httpController.expectNone('https://api.example.test/admin/config');
  });

  test('FU-1a: preload() fetches /admin/config and caches "metamap"', async () => {
    const preloadPromise = adapter.preload();

    const request = httpController.expectOne('https://api.example.test/admin/config');
    expect(request.request.method).toBe('GET');
    request.flush({ identityProvider: 'metamap' });

    await preloadPromise;

    expect(adapter.getIdentityProvider()).toBe('metamap');
  });

  test('FU-1b: preload() fetches /admin/config and caches "facetec"', async () => {
    const preloadPromise = adapter.preload();

    const request = httpController.expectOne('https://api.example.test/admin/config');
    request.flush({ identityProvider: 'facetec' });

    await preloadPromise;

    expect(adapter.getIdentityProvider()).toBe('facetec');
  });

  test('FU-1c: preload() fetches /admin/config and caches "regula"', async () => {
    const preloadPromise = adapter.preload();

    const request = httpController.expectOne('https://api.example.test/admin/config');
    request.flush({ identityProvider: 'regula' });

    await preloadPromise;

    expect(adapter.getIdentityProvider()).toBe('regula');
  });

  test('FU-1d: preload() fetches /admin/config and caches "metamap-widget"', async () => {
    const preloadPromise = adapter.preload();

    const request = httpController.expectOne('https://api.example.test/admin/config');
    request.flush({ identityProvider: 'metamap-widget' });

    await preloadPromise;

    expect(adapter.getIdentityProvider()).toBe('metamap-widget');
  });

  test('FU-1f: preload() resolves (does not reject) on network error and falls back to "metamap"', async () => {
    const preloadPromise = adapter.preload();

    const request = httpController.expectOne('https://api.example.test/admin/config');
    request.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });

    await expect(preloadPromise).resolves.toBeUndefined();

    expect(adapter.getIdentityProvider()).toBe('metamap');
    expect(mockLogger.error).toHaveBeenCalledOnce();
  });

  test('FU-1g: preload() falls back to "metamap" and warns when backend returns unknown provider', async () => {
    const preloadPromise = adapter.preload();

    const request = httpController.expectOne('https://api.example.test/admin/config');
    request.flush({ identityProvider: 'unknown-provider' });

    await preloadPromise;

    expect(adapter.getIdentityProvider()).toBe('metamap');
    expect(mockLogger.warn).toHaveBeenCalledOnce();
  });

  test('W-2: preload() falls back to "metamap" and warns when backend returns {} (no identityProvider key)', async () => {
    const preloadPromise = adapter.preload();

    const request = httpController.expectOne('https://api.example.test/admin/config');
    request.flush({});

    await preloadPromise;

    expect(adapter.getIdentityProvider()).toBe('metamap');
    expect(mockLogger.warn).toHaveBeenCalledOnce();
  });

  test('getIdentityProvider() returns the cached value without making a new HTTP request after preload()', async () => {
    const preloadPromise = adapter.preload();

    const request = httpController.expectOne('https://api.example.test/admin/config');
    request.flush({ identityProvider: 'facetec' });

    await preloadPromise;

    expect(adapter.getIdentityProvider()).toBe('facetec');
    expect(adapter.getIdentityProvider()).toBe('facetec');

    httpController.expectNone('https://api.example.test/admin/config');
  });
});
