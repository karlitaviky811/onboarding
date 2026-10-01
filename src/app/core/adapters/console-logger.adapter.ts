import { Logger } from '../ports/logger.port';

export class ConsoleLogger implements Logger {
  debug(msg: string, ...meta: unknown[]) { console.debug(msg, ...meta); }
  info(msg: string, ...meta: unknown[]) { console.info(msg, ...meta); }
  warn(msg: string, ...meta: unknown[]) { console.warn(msg, ...meta); }
  error(msg: string, ...meta: unknown[]) { console.error(msg, ...meta); }
}
