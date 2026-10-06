import { describe, test, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';
import { readSignal } from '../../../../testing';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  test('should start with isLoading = false', () => {
    expect(readSignal(service.isLoading)).toBe(false);
  });

  test('should set isLoading to true after start()', () => {
    service.start();

    expect(readSignal(service.isLoading)).toBe(true);
  });

  test('should set isLoading back to false after stop()', () => {
    service.start();
    service.stop();

    expect(readSignal(service.isLoading)).toBe(false);
  });

  test('should remain loading when start() is called twice and stop() once', () => {
    service.start();
    service.start();
    service.stop();

    expect(readSignal(service.isLoading)).toBe(true);
  });

  test('should not go below zero active requests', () => {
    service.stop();

    expect(readSignal(service.isLoading)).toBe(false);
  });
});
