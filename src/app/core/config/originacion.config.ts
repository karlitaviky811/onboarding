import { InjectionToken } from '@angular/core';

/**
 * Injection token for the Originación backend base URL.
 * In development: '/origination' (proxied via proxy.conf.json to QA).
 * In production: MUST be resolved server-side via BFF — see PROD BFF follow-up.
 *
 * Provided in app.config.ts via useValue from environment.apiUrlOriginacion.
 */
export const ORIGINACION_BASE_URL = new InjectionToken<string>('ORIGINACION_BASE_URL');

/**
 * Injection token for the Originación channelId.
 * Value: 122 for Credix Originación (confirmed from GitCreditoWeb reference).
 *
 * Provided in app.config.ts via useValue from environment.channelId.
 */
export const ORIGINACION_CHANNEL_ID = new InjectionToken<number>('ORIGINACION_CHANNEL_ID');

/**
 * Injection token for Originación service auth credentials.
 * QA demo: { username, password } from environment.
 * Production: null — interceptor no-ops; credentials MUST be injected server-side via BFF.
 *
 * SECURITY INVARIANT: credentials MUST NOT appear as literals in any component
 * or adapter source. This token is the only code path that carries them.
 *
 * Provided in app.config.ts via useValue from environment.originacionAuth.
 */
export const ORIGINACION_AUTH = new InjectionToken<{ username: string; password: string } | null>(
  'ORIGINACION_AUTH',
);
