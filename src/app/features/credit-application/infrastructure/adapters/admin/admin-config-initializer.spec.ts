import { describe, test, expect, vi, afterEach } from 'vitest';
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

  test('FU-1a (initializer): preload() is called during bootstrap and caches the fetched provider', async () => {
    buildTestBed();

    const initStatus = TestBed.inject(ApplicationInitStatus);

    const request = httpController.expectOne('https://api.example.test/admin/config');
    expect(request.request.method).toBe('GET');
    request.flush({ identityProvider: 'facetec' });

    await initStatus.donePromise;

    const adapter = TestBed.inject(AdminConfigAdapter);
    expect(adapter.getIdentityProvider()).toBe('facetec');
  });

  test('FU-1f (initializer): bootstrap resolves normally when preload() fetch fails — caches default "metamap"', async () => {
    buildTestBed();

    const initStatus = TestBed.inject(ApplicationInitStatus);

    const request = httpController.expectOne('https://api.example.test/admin/config');

    request.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });

    await expect(initStatus.donePromise).resolves.not.toThrow();

    const adapter = TestBed.inject(AdminConfigAdapter);
    expect(adapter.getIdentityProvider()).toBe('metamap');
    expect(mockLogger.error).toHaveBeenCalledOnce();
  });
});
