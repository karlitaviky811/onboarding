import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@core/config/api.config';
import { LOGGER } from '@core/core';
import { NetworkError } from '@shared/result/result';
import { HttpRedirectIdentityVerificationAdapter } from './http-redirect-identity-verification.adapter';

describe('HttpRedirectIdentityVerificationAdapter', () => {
  let adapter: HttpRedirectIdentityVerificationAdapter;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.example.test' },
        {
          provide: LOGGER,
          useValue: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
        },
      ],
    });

    adapter = TestBed.inject(HttpRedirectIdentityVerificationAdapter);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('verify()', () => {
    test('posts to /identity-verifications and maps interactionUrl→redirectUrl, id→verificationId (redirect flow returned)', async () => {
      const resultPromise = adapter.verify('123456789', 'NationalValidation');

      const request = httpController.expectOne('https://api.example.test/identity-verifications');
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ identificationNumber: '123456789' });

      request.flush({
        verificationId: 'verification-456',
        status: 'pending',
        interactionUrl: 'https://verify.example.test/session/456',
      });

      const result = await resultPromise;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.approved).toBe(false);

        expect(result.value.redirectUrl).toBe('https://verify.example.test/session/456');

        expect(result.value.verificationId).toBe('verification-456');

        expect(result.value.validatedIdentificationNumber).toBeUndefined();
      }
    });

    test('returns approved:false with no redirectUrl when backend returns no interactionUrl', async () => {
      const resultPromise = adapter.verify('123456789', 'NationalValidation');

      const request = httpController.expectOne('https://api.example.test/identity-verifications');
      request.flush({
        verificationId: 'verification-456',
        status: 'pending',
      });

      const result = await resultPromise;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.approved).toBe(false);
        expect(result.value.verificationId).toBe('verification-456');
        expect(result.value.redirectUrl).toBeUndefined();
      }
    });

    test('leaves verificationId undefined when the backend value is not a string', async () => {
      const resultPromise = adapter.verify('123456789', 'NationalValidation');

      const request = httpController.expectOne('https://api.example.test/identity-verifications');
      request.flush({ verificationId: 42, status: 'pending' });

      const result = await resultPromise;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.verificationId).toBeUndefined();
      }
    });

    test('returns Result.failure(NetworkError) on HTTP error (network error yields timeout outcome)', async () => {
      const resultPromise = adapter.verify('123456789', 'NationalValidation');

      const request = httpController.expectOne('https://api.example.test/identity-verifications');
      request.flush('unavailable', { status: 503, statusText: 'Service Unavailable' });

      const result = await resultPromise;

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NetworkError);
        expect(result.error.code).toBe('NETWORK_ERROR');
      }
    });
  });

  describe('getStatus()', () => {
    test('polls GET /identity-verifications/:id and returns status result', async () => {
      const resultPromise = adapter.getStatus('verification-456');

      const request = httpController.expectOne(
        'https://api.example.test/identity-verifications/verification-456',
      );
      expect(request.request.method).toBe('GET');

      request.flush({
        verificationId: 'verification-456',
        status: 'approved',
      });

      const result = await resultPromise;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.status).toBe('approved');
      }
    });

    test("defaults status to 'unknown' when the backend omits a string status", async () => {
      const resultPromise = adapter.getStatus('verification-456');

      const request = httpController.expectOne(
        'https://api.example.test/identity-verifications/verification-456',
      );
      request.flush({ verificationId: 'verification-456' });

      const result = await resultPromise;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.status).toBe('unknown');
      }
    });

    test('returns Result.failure(NetworkError) when GET /identity-verifications/:id fails', async () => {
      const resultPromise = adapter.getStatus('verification-456');

      const request = httpController.expectOne(
        'https://api.example.test/identity-verifications/verification-456',
      );
      request.flush('not found', { status: 404, statusText: 'Not Found' });

      const result = await resultPromise;

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NetworkError);
      }
    });

    test('URL-encodes the verificationId when polling status', async () => {
      const resultPromise = adapter.getStatus('verify/id-with-slash');

      const request = httpController.expectOne(
        'https://api.example.test/identity-verifications/verify%2Fid-with-slash',
      );
      request.flush({ verificationId: 'verify/id-with-slash', status: 'pending' });

      const result = await resultPromise;

      expect(result.success).toBe(true);
    });
  });
});
