import { describe, test, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LOGGER } from '@core/core';
import { FacetecIdentityVerificationAdapter } from './facetec-identity-verification.adapter';

describe('FacetecIdentityVerificationAdapter', () => {
  let adapter: FacetecIdentityVerificationAdapter;
  let logger: { warn: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } as typeof logger & {
      debug: ReturnType<typeof vi.fn>;
      info: ReturnType<typeof vi.fn>;
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LOGGER, useValue: logger },
      ],
    });

    adapter = TestBed.inject(FacetecIdentityVerificationAdapter);
  });

  test('returns a stub result (approved:false, redirectUrl undefined, verificationId undefined)', async () => {
    const result = await adapter.verify('123456789', 'NationalValidation');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.approved).toBe(false);
      expect(result.value.redirectUrl).toBeUndefined();
      expect(result.value.verificationId).toBeUndefined();
    }
  });

  test('logs a warn message indicating the adapter is not implemented', async () => {
    await adapter.verify('123456789', 'NationalValidation');

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('facetec'),
    );
  });
});
