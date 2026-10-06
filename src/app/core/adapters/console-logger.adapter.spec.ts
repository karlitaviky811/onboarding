import { describe, test, expect, vi, afterEach } from 'vitest';
import { ConsoleLogger } from './console-logger.adapter';

describe('ConsoleLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('delegates debug() to console.debug', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const logger = new ConsoleLogger();

    logger.debug('debug message', { extra: 1 });

    expect(spy).toHaveBeenCalledWith('debug message', { extra: 1 });
  });

  test('delegates info() to console.info', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const logger = new ConsoleLogger();

    logger.info('info message', 42);

    expect(spy).toHaveBeenCalledWith('info message', 42);
  });

  test('delegates warn() to console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logger = new ConsoleLogger();

    logger.warn('warn message');

    expect(spy).toHaveBeenCalledWith('warn message');
  });

  test('delegates error() to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = new ConsoleLogger();

    logger.error('error message', new Error('oops'));

    expect(spy).toHaveBeenCalledWith('error message', new Error('oops'));
  });

  test('forwards multiple meta arguments', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const logger = new ConsoleLogger();

    logger.info('multi', 1, 'two', { three: 3 });

    expect(spy).toHaveBeenCalledWith('multi', 1, 'two', { three: 3 });
  });
});
