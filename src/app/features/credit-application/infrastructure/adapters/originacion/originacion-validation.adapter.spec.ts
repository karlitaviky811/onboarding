import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NetworkError } from '@shared/result/result';
import { OriginacionValidationAdapter } from './originacion-validation.adapter';
import { ORIGINACION_BASE_URL, ORIGINACION_CHANNEL_ID } from '@core/config/originacion.config';


describe('OriginacionValidationAdapter', () => {
  let adapter: OriginacionValidationAdapter;
  let httpController: HttpTestingController;

  const BASE_URL = 'https://qa.test/origination';
  const CHANNEL_ID = 122;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ORIGINACION_BASE_URL, useValue: BASE_URL },
        { provide: ORIGINACION_CHANNEL_ID, useValue: CHANNEL_ID },
      ],
    });

    adapter = TestBed.inject(OriginacionValidationAdapter);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  // ── getButtonData ──────────────────────────────────────────────────────────

  describe('getButtonData()', () => {
    it('POSTs to /validations/getmetamapbuttondata with expected body shape', async () => {
      const resultPromise = adapter.getButtonData('PLACEHOLDER_VALIDATION_ID');

      const req = httpController.expectOne(
        `${BASE_URL}/validations/getmetamapbuttondata`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toMatchObject({
        validationId: 'PLACEHOLDER_VALIDATION_ID',
        channelId: CHANNEL_ID,
      });

      req.flush({
        clientId: 'client-123',
        workflowId: 'flow-456',
        identityId: 'identity-789',
        validated: 0,
      });

      const result = await resultPromise;
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.clientId).toBe('client-123');
        expect(result.value.flowId).toBe('flow-456');
        expect(result.value.identityId).toBe('identity-789');
        expect(result.value.validated).toBe(0);
      }
    });

    it('returns ok with validated=1 when user is already verified', async () => {
      const resultPromise = adapter.getButtonData('PLACEHOLDER_VALIDATION_ID');

      const req = httpController.expectOne(
        `${BASE_URL}/validations/getmetamapbuttondata`,
      );
      req.flush({
        clientId: 'c',
        workflowId: 'w',
        validated: 1,
      });

      const result = await resultPromise;
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.validated).toBe(1);
        expect(result.value.identityId).toBeUndefined();
      }
    });

    it('returns Result.failure(NetworkError) on HTTP error', async () => {
      const resultPromise = adapter.getButtonData('PLACEHOLDER_VALIDATION_ID');

      const req = httpController.expectOne(
        `${BASE_URL}/validations/getmetamapbuttondata`,
      );
      req.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });

      const result = await resultPromise;
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NetworkError);
        expect(result.error.code).toBe('NETWORK_ERROR');
      }
    });

    it('does NOT throw on HTTP error (must return Result, never throw)', async () => {
      const resultPromise = adapter.getButtonData('PLACEHOLDER_VALIDATION_ID');

      const req = httpController.expectOne(
        `${BASE_URL}/validations/getmetamapbuttondata`,
      );
      req.flush('Gateway Timeout', { status: 504, statusText: 'Gateway Timeout' });

      // Must resolve, not reject
      await expect(resultPromise).resolves.toMatchObject({ success: false });
    });
  });

  // ── saveVerification ───────────────────────────────────────────────────────

  describe('saveVerification()', () => {
    it('POSTs to /validations/savevalidationverification with expected body', async () => {
      const resultPromise = adapter.saveVerification(
        'PLACEHOLDER_VALIDATION_ID',
        'verification-v-001',
      );

      const req = httpController.expectOne(
        `${BASE_URL}/validations/savevalidationverification`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toMatchObject({
        validationId: 'PLACEHOLDER_VALIDATION_ID',
        verificationId: 'verification-v-001',
        channelId: CHANNEL_ID,
        isCreditWeb: false,
      });

      req.flush({ status: 'verified', triesLeft: 1 });

      const result = await resultPromise;
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.state).toBe('approved');
        expect(result.value.route).toBe('/request/result');
        expect(result.value.triesLeft).toBe(2); // 3 - 1 = 2
      }
    });

    it('maps rejected status to rejected outcome', async () => {
      const resultPromise = adapter.saveVerification(
        'PLACEHOLDER_VALIDATION_ID',
        'v-rejected',
      );

      const req = httpController.expectOne(
        `${BASE_URL}/validations/savevalidationverification`,
      );
      req.flush({ status: 'rejected', triesLeft: 2 });

      const result = await resultPromise;
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.state).toBe('rejected');
      }
    });

    it('returns Result.failure(NetworkError) on HTTP error', async () => {
      const resultPromise = adapter.saveVerification(
        'PLACEHOLDER_VALIDATION_ID',
        'v-error',
      );

      const req = httpController.expectOne(
        `${BASE_URL}/validations/savevalidationverification`,
      );
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      const result = await resultPromise;
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NetworkError);
      }
    });

    it('does NOT throw on HTTP error', async () => {
      const resultPromise = adapter.saveVerification(
        'PLACEHOLDER_VALIDATION_ID',
        'v-timeout',
      );

      const req = httpController.expectOne(
        `${BASE_URL}/validations/savevalidationverification`,
      );
      req.flush('Timeout', { status: 504, statusText: 'Gateway Timeout' });

      await expect(resultPromise).resolves.toMatchObject({ success: false });
    });
  });

  // ── Security: no inline credentials ───────────────────────────────────────

  describe('security invariant', () => {
    it('adapter source does NOT contain literal credential strings', async () => {
      // Read the adapter source file and assert no hardcoded credentials.
      // This is a static analysis test — verifies the constraint mechanically.
      const { readFileSync } = await import('fs');
      const { resolve } = await import('path');

      const adapterPath = resolve(
        'src/app/features/credit-application/infrastructure/adapters/originacion/originacion-validation.adapter.ts',
      );
      const source = readFileSync(adapterPath, 'utf-8');

      expect(source).not.toMatch(/sts_sac/);
      expect(source).not.toMatch(/password\s*:\s*['"`][^'"`]+['"`]/);
      expect(source).not.toMatch(/username\s*:\s*['"`][^'"`]+['"`]/);
      expect(source).not.toMatch(/secretKey\s*:\s*['"`][^'"`]+['"`]/);
    });
  });
});
