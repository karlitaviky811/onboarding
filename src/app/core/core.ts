import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { Logger } from './ports/logger.port';
import { ConsoleLogger } from './adapters/console-logger.adapter';

export const LOGGER = new InjectionToken<Logger>('Logger');

export function provideCore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: LOGGER, useClass: ConsoleLogger },
  ]);
}
