import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ORIGINACION_AUTH, ORIGINACION_BASE_URL } from '@core/config/originacion.config';

/**
 * Originación-scoped auth interceptor.
 *
 * Attaches service authentication credentials ONLY to requests targeting the
 * Originación backend. Reads credentials exclusively from the ORIGINACION_AUTH
 * injection token — NEVER from literal values in source code.
 *
 * URL scope: requests whose URL starts with ORIGINACION_BASE_URL or the dev
 * proxy prefix '/origination'.
 *
 * ASSUMPTION (PR-B OQ-3): Auth scheme is assumed to be Basic (Authorization header).
 *   If the backend requires body-embedded credentials (as GitCreditoWeb sends),
 *   this interceptor must be replaced with adapter-level body merging in PR-B.
 *
 * Production path: ORIGINACION_AUTH is null → interceptor no-ops, request passes
 * through unchanged. Production MUST route these calls through a BFF that injects
 * credentials server-side (BLOCKING follow-up before prod rollout).
 *
 * Security invariant: no literal credential strings in this file.
 * Credentials live ONLY in environment.originacionAuth (QA demo) or the BFF (prod).
 */
export const originacionAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(ORIGINACION_BASE_URL);
  const auth = inject(ORIGINACION_AUTH, { optional: true });

  const isOriginacion =
    req.url.startsWith(baseUrl) || req.url.startsWith('/origination');

  // Not an Originación request — pass through untouched
  if (!isOriginacion) {
    return next(req);
  }

  // No auth provided (production path: BFF handles it server-side)
  if (!auth) {
    return next(req);
  }

  // Attach Basic auth header
  const encoded = btoa(`${auth.username}:${auth.password}`);
  const authenticatedReq = req.clone({
    setHeaders: { Authorization: `Basic ${encoded}` },
  });

  return next(authenticatedReq);
};
