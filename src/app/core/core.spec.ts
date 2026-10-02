import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LOGGER, provideCore } from './core';
import { ConsoleLogger } from './adapters/console-logger.adapter';

describe('provideCore()', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideCore()],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('registers LOGGER token with ConsoleLogger', () => {
    const logger = TestBed.inject(LOGGER);
    expect(logger).toBeInstanceOf(ConsoleLogger);
  });

  it('LOGGER has debug, info, warn, and error methods', () => {
    const logger = TestBed.inject(LOGGER);
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });
});
