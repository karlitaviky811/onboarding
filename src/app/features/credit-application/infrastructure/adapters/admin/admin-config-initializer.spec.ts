/**
 * App-initializer integration spec for AdminConfigAdapter.preload().
 *
 * Verifies that a provideAppInitializer registered at bootstrap causes
 * preload() to be called and the result (success or fallback) to be cached
 * before any DI consumer reads getIdentityProvider().
 *
 * Spec scenarios: FU-1a success path, FU-1f failure/fallback path.
 */

import { ApplicationInitStatus, provideAppInitializer, inject } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@core/config/api.config';
import { LOGGER } from '@core/core';
import { AdminConfigAdapter } from './admin-config.adapter';

describe('AdminConfigAdapter — provideAppInitializer integration', () => {
  let httpController: HttpTestingController;
  let mockLogger: { debug: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  function buildTestBed(): void {
    mockLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.example.test' },
        { provide: LOGGER, useValue: mockLogger },
        provideAppInitializer(() => inject(AdminConfigAdapter).preload()),
      ],
    });

    httpController = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpController.verify();
  });

  it('FU-1a (initializer): preload() is called during bootstrap and caches the fetched provider', async () => {
    buildTestBed();

    // ApplicationInitStatus.donePromise resolves when all APP_INITIALIZER/provideAppInitializer
    // callbacks have completed — this is what Angular awaits before rendering.
    const initStatus = TestBed.inject(ApplicationInitStatus);

    // Flush the HTTP request that preload() will make
    const request = httpController.expectOne('https://api.example.test/admin/config');
    expect(request.request.method).toBe('GET');
    request.flush({ identityProvider: 'facetec' });

    // Wait for all initializers to complete
    await initStatus.donePromise;

    // After bootstrap, the cache must be warm
    const adapter = TestBed.inject(AdminConfigAdapter);
    expect(adapter.getIdentityProvider()).toBe('facetec');
  });

  it('FU-1f (initializer): bootstrap resolves normally when preload() fetch fails — caches default "metamap"', async () => {
    buildTestBed();

    const initStatus = TestBed.inject(ApplicationInitStatus);

    const request = httpController.expectOne('https://api.example.test/admin/config');
    // Simulate network-level failure (HTTP 503)
    request.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });

    // Bootstrap must NOT crash — donePromise must resolve
    await expect(initStatus.donePromise).resolves.not.toThrow();

    const adapter = TestBed.inject(AdminConfigAdapter);
    expect(adapter.getIdentityProvider()).toBe('metamap');
    expect(mockLogger.error).toHaveBeenCalledOnce();
  });
});
