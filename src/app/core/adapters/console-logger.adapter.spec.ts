import { describe, it, expect, vi, afterEach } from 'vitest';
import { ConsoleLogger } from './console-logger.adapter';

describe('ConsoleLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates debug() to console.debug', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const logger = new ConsoleLogger();

    logger.debug('debug message', { extra: 1 });

    expect(spy).toHaveBeenCalledWith('debug message', { extra: 1 });
  });

  it('delegates info() to console.info', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const logger = new ConsoleLogger();

    logger.info('info message', 42);

    expect(spy).toHaveBeenCalledWith('info message', 42);
  });

  it('delegates warn() to console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logger = new ConsoleLogger();

    logger.warn('warn message');

    expect(spy).toHaveBeenCalledWith('warn message');
  });

  it('delegates error() to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = new ConsoleLogger();

    logger.error('error message', new Error('oops'));

    expect(spy).toHaveBeenCalledWith('error message', new Error('oops'));
  });

  it('forwards multiple meta arguments', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const logger = new ConsoleLogger();

    logger.info('multi', 1, 'two', { three: 3 });

    expect(spy).toHaveBeenCalledWith('multi', 1, 'two', { three: 3 });
  });
});
