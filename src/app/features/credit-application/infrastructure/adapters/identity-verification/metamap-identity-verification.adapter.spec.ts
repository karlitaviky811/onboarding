import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@core/config/api.config';
import { LOGGER } from '@core/core';
import { NetworkError } from '@shared/result/result';
import { MetamapIdentityVerificationAdapter } from './metamap-identity-verification.adapter';

describe('MetamapIdentityVerificationAdapter', () => {
  let adapter: MetamapIdentityVerificationAdapter;
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

    adapter = TestBed.inject(MetamapIdentityVerificationAdapter);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  test('returns approved result with validatedIdentificationNumber on success (approved data-match)', async () => {
    const resultPromise = adapter.verify('123456789', 'NationalValidation');

    const request = httpController.expectOne('https://api.example.test/validacion/identidad');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      identificationNumber: '123456789',
      flow: 'NationalValidation',
    });

    request.flush({
      approved: true,
      validated_identification_number: '123456789',
    });

    const result = await resultPromise;

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.approved).toBe(true);
      expect(result.value.validatedIdentificationNumber).toBe('123456789');

      expect(result.value.redirectUrl).toBeUndefined();
      expect(result.value.verificationId).toBeUndefined();
    }
  });

  test('returns rejected result with errorCode on rejection (rejected data-match)', async () => {
    const resultPromise = adapter.verify('123456789', 'NationalValidation');

    const request = httpController.expectOne('https://api.example.test/validacion/identidad');
    request.flush({ approved: false, error_code: 'IDENTITY_NOT_FOUND' });

    const result = await resultPromise;

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.approved).toBe(false);
      expect(result.value.errorCode).toBe('IDENTITY_NOT_FOUND');
      expect(result.value.redirectUrl).toBeUndefined();
      expect(result.value.verificationId).toBeUndefined();
      expect(result.value.validatedIdentificationNumber).toBeUndefined();
    }
  });

  test('returns approved:false with validatedIdentificationNumber set to backend value on mismatch', async () => {
    const resultPromise = adapter.verify('123456789', 'NationalValidation');

    const request = httpController.expectOne('https://api.example.test/validacion/identidad');
    request.flush({ approved: false, validated_identification_number: '999999999' });

    const result = await resultPromise;

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.approved).toBe(false);
      expect(result.value.validatedIdentificationNumber).toBe('999999999');
      expect(result.value.redirectUrl).toBeUndefined();
    }
  });

  test('returns Result.failure(NetworkError) on HTTP error (network error yields timeout outcome)', async () => {
    const resultPromise = adapter.verify('123456789', 'NationalValidation');

    const request = httpController.expectOne('https://api.example.test/validacion/identidad');
    request.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });

    const result = await resultPromise;

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(NetworkError);
      expect(result.error.code).toBe('NETWORK_ERROR');
    }
  });

  test('passes the correct flow for DIMEXValidation', async () => {
    const resultPromise = adapter.verify('123456789', 'DIMEXValidation');

    const request = httpController.expectOne('https://api.example.test/validacion/identidad');
    expect(request.request.body).toEqual({
      identificationNumber: '123456789',
      flow: 'DIMEXValidation',
    });
    request.flush({ approved: true });

    await resultPromise;
  });
});
