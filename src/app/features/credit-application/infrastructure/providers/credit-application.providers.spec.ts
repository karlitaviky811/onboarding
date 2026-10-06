import { describe, test, expect, vi, afterEach } from 'vitest';
import { Injector, InjectionToken } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@core/config/api.config';
import { LOGGER } from '@core/core';
import { IdentityVerificationPort } from '@credit-application/domain';
import { resolveIdentityVerificationAdapter } from './identity-verification-resolver';
import { MetamapIdentityVerificationAdapter } from '../adapters/identity-verification/metamap-identity-verification.adapter';
import { FacetecIdentityVerificationAdapter } from '../adapters/identity-verification/facetec-identity-verification.adapter';
import { RegulaIdentityVerificationAdapter } from '../adapters/identity-verification/regula-identity-verification.adapter';

const IDENTITY_VERIFICATION_TEST = new InjectionToken<IdentityVerificationPort>('IdentityVerificationTest');

describe('IDENTITY_VERIFICATION factory — config-driven adapter selection (FU-1d, FU-1e)', () => {
  let httpController: HttpTestingController;

  function buildTestBed(providerName: string): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.example.test' },
        { provide: LOGGER, useValue: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } },
        {
          provide: IDENTITY_VERIFICATION_TEST,
          useFactory: (injector: Injector) => resolveIdentityVerificationAdapter(providerName, injector),
          deps: [Injector],
        },
      ],
    });
    httpController = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpController.verify();
  });

  test('FU-1e: resolves IDENTITY_VERIFICATION to MetamapIdentityVerificationAdapter when provider is "metamap"', () => {
    buildTestBed('metamap');

    const adapter = TestBed.inject(IDENTITY_VERIFICATION_TEST);

    expect(adapter).toBeInstanceOf(MetamapIdentityVerificationAdapter);
  });

  test('FU-1d: resolves IDENTITY_VERIFICATION to FacetecIdentityVerificationAdapter when provider is "facetec"', () => {
    buildTestBed('facetec');

    const adapter = TestBed.inject(IDENTITY_VERIFICATION_TEST);

    expect(adapter).toBeInstanceOf(FacetecIdentityVerificationAdapter);
  });

  test('FU-1e (regula): resolves IDENTITY_VERIFICATION to RegulaIdentityVerificationAdapter when provider is "regula"', () => {
    buildTestBed('regula');

    const adapter = TestBed.inject(IDENTITY_VERIFICATION_TEST);

    expect(adapter).toBeInstanceOf(RegulaIdentityVerificationAdapter);
  });

  test('falls back to MetamapIdentityVerificationAdapter when provider name is unrecognised', () => {
    buildTestBed('unknown-future-provider');

    const adapter = TestBed.inject(IDENTITY_VERIFICATION_TEST);

    expect(adapter).toBeInstanceOf(MetamapIdentityVerificationAdapter);
  });

  test('resolves to MetamapIdentityVerificationAdapter when provider is "metamap-widget" (UI-only safe fallback)', () => {
    buildTestBed('metamap-widget');
    const adapter = TestBed.inject(IDENTITY_VERIFICATION_TEST);
    expect(adapter).toBeInstanceOf(MetamapIdentityVerificationAdapter);
  });

  test('resolves to MetamapIdentityVerificationAdapter when provider is "persona-widget" (UI-only safe fallback)', () => {
    buildTestBed('persona-widget');
    const adapter = TestBed.inject(IDENTITY_VERIFICATION_TEST);
    expect(adapter).toBeInstanceOf(MetamapIdentityVerificationAdapter);
  });

  test('resolves to MetamapIdentityVerificationAdapter when provider is "onfido-widget" (UI-only safe fallback)', () => {
    buildTestBed('onfido-widget');
    const adapter = TestBed.inject(IDENTITY_VERIFICATION_TEST);
    expect(adapter).toBeInstanceOf(MetamapIdentityVerificationAdapter);
  });
});
