import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ApiErrorTracker } from './api-error.service';
import { readSignal } from '../../../../testing';

describe('ApiErrorTracker', () => {
  let tracker: ApiErrorTracker;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    tracker = TestBed.inject(ApiErrorTracker);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('starts with lastError = null', () => {
    expect(readSignal(tracker.lastError)).toBeNull();
  });

  it('setError() stores the given ApiError in lastError', () => {
    tracker.setError({ status: 404, message: 'Not Found' });

    expect(readSignal(tracker.lastError)).toEqual({ status: 404, message: 'Not Found' });
  });

  it('setError() stores the optional code field when provided', () => {
    tracker.setError({ status: 500, message: 'Server Error', code: 'INTERNAL' });

    const error = readSignal(tracker.lastError);
    expect(error?.code).toBe('INTERNAL');
    expect(error?.status).toBe(500);
  });

  it('clearError() resets lastError back to null', () => {
    tracker.setError({ status: 401, message: 'Unauthorized' });
    tracker.clearError();

    expect(readSignal(tracker.lastError)).toBeNull();
  });

  it('setError() replaces a previous error when called twice', () => {
    tracker.setError({ status: 400, message: 'Bad Request' });
    tracker.setError({ status: 403, message: 'Forbidden' });

    const error = readSignal(tracker.lastError);
    expect(error?.status).toBe(403);
    expect(error?.message).toBe('Forbidden');
  });
});
