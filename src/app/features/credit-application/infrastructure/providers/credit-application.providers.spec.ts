/**
 * DI factory integration spec for the IDENTITY_VERIFICATION token.
 *
 * Verifies that resolveIdentityVerificationAdapter() — the pure function extracted
 * from the useFactory in provideCreditApplication() — selects the correct adapter
 * based on the provider name. The real factory calls this same function, so these
 * tests directly cover production routing logic with zero drift risk.
 *
 * Spec scenarios: FU-1d (cache = 'facetec' → FacetecIdentityVerificationAdapter),
 *                 FU-1e (cache = 'metamap' → MetamapIdentityVerificationAdapter),
 *                 FU-1e variant (cache = 'regula' → RegulaIdentityVerificationAdapter),
 *                 default (unknown provider → MetamapIdentityVerificationAdapter).
 *
 * Import note: we import from the providers file directly (NOT via the infrastructure
 * barrel) to avoid the circular TDZ that arises when Vitest resolves:
 *   infrastructure/index.ts → credit-application.routes.ts → credit-application.providers.ts
 */

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

  // ── FU-1e: cache = 'metamap' → factory yields MetamapIdentityVerificationAdapter ───────────

  it('FU-1e: resolves IDENTITY_VERIFICATION to MetamapIdentityVerificationAdapter when provider is "metamap"', () => {
    buildTestBed('metamap');

    const adapter = TestBed.inject(IDENTITY_VERIFICATION_TEST);

    expect(adapter).toBeInstanceOf(MetamapIdentityVerificationAdapter);
  });

  // ── FU-1d: cache = 'facetec' → factory yields FacetecIdentityVerificationAdapter ──────────

  it('FU-1d: resolves IDENTITY_VERIFICATION to FacetecIdentityVerificationAdapter when provider is "facetec"', () => {
    buildTestBed('facetec');

    const adapter = TestBed.inject(IDENTITY_VERIFICATION_TEST);

    expect(adapter).toBeInstanceOf(FacetecIdentityVerificationAdapter);
  });

  // ── FU-1e variant: cache = 'regula' → factory yields RegulaIdentityVerificationAdapter ────

  it('FU-1e (regula): resolves IDENTITY_VERIFICATION to RegulaIdentityVerificationAdapter when provider is "regula"', () => {
    buildTestBed('regula');

    const adapter = TestBed.inject(IDENTITY_VERIFICATION_TEST);

    expect(adapter).toBeInstanceOf(RegulaIdentityVerificationAdapter);
  });

  // ── Default: unknown provider → falls back to MetamapIdentityVerificationAdapter ──────────

  it('falls back to MetamapIdentityVerificationAdapter when provider name is unrecognised', () => {
    buildTestBed('unknown-future-provider');

    const adapter = TestBed.inject(IDENTITY_VERIFICATION_TEST);

    expect(adapter).toBeInstanceOf(MetamapIdentityVerificationAdapter);
  });
});
