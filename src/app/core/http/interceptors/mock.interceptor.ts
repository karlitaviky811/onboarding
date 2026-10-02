import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '@environments/environment';

/**
 * Development mock interceptor.
 * Returns fake data for known backend endpoints when mockEnabled is true.
 * This allows developers to work on the UI without a running backend.
 */
export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.mockEnabled) {
    return next(req);
  }

  const url = req.url;
  const method = req.method;

  // Helper to create an immediate mock response
  const mock = <T>(body: T, status = 200) =>
    of(new HttpResponse({ status, body }));

  // ── Admin Config ──────────────────────────────────────────────────────────
  if (method === 'GET' && url.includes('/admin/tipos-identificacion')) {
    return mock([
      {
        id: 'NACIONAL',
        label: 'Nacional',
        mask: '#-####-####',
        maxLength: 9,
        isDefault: true,
      },
      {
        id: 'DIMEX',
        label: 'DIMEX',
        mask: '############',
        maxLength: 12,
        isDefault: false,
      },
    ]);
  }

  if (method === 'GET' && url.includes('/admin/paises')) {
    return mock([
      {
        code: 'CR',
        name: 'Costa Rica',
        phonePrefix: '+506',
        phoneMask: '0000-0000',
        phoneMaxLength: 8,
      },
      {
        code: 'US',
        name: 'Estados Unidos',
        phonePrefix: '+1',
        phoneMask: '(000) 000-0000',
        phoneMaxLength: 10,
      },
    ]);
  }

  if (method === 'GET' && url.includes('/admin/textos/')) {
    const key = url.split('/admin/textos/').pop() ?? 'unknown';
    return mock({
      title: `Pantalla: ${key}`,
      description: 'Bienvenido al proceso de solicitud de tarjeta de crédito.',
      gifUrl: '/assets/welcome.gif',
      buttonLabel: 'Continuar',
    });
  }

  if (method === 'GET' && url.includes('/admin/config/servicio-cliente')) {
    return mock({ phone: '800-123-4567' });
  }

  if (method === 'GET' && url.includes('/admin/config/reintentos')) {
    return mock({ max_retries: 3 });
  }

  // DEV-SMOKE: return the active demo identity provider.
  // Switching this value swaps the validator — the Consent screen reads the
  // registry and dynamically creates the matching widget component.
  // Switchable values: 'metamap-widget' | 'persona-widget' | 'onfido-widget'
  //   'persona-widget' → Persona sandbox flow (real Persona iframe in ng serve)
  //   'metamap-widget' → MetaMap flow (requires MetaMap credentials in environment.development.ts)
  //   'onfido-widget'  → Onfido inline flow (requires onfidoToken in environment.development.ts; token expires 90min)
  // The specific /servicio-cliente and /reintentos handlers above match FIRST —
  // this handler fires only for the exact /admin/config endpoint (url.endsWith guard).
  if (method === 'GET' && url.endsWith('/admin/config')) {
    return mock({ identityProvider: 'persona-widget' });
  }

  if (method === 'GET' && url.includes('/admin/screens/')) {
    const key = url.split('/admin/screens/').pop() ?? 'unknown';
    return mock({
      screenKey: key,
      copy: {
        headline: 'Su tarjeta está muy cerca',
        description: 'Siga estos sencillos pasos para completar su registro.',
        ctaLabel: 'Continuar',
        legalNotice: 'Este sitio está protegido por reCAPTCHA y las Políticas de Privacidad y Términos de Servicio de Google que aplican.',
      },
      media: {
        // Empty gifUrl → component shows default SVG fallback
        gifUrl: '',
        gifAlt: '',
      },
      branding: {
        cardBackground: '#e8f5e9',
        cardBackgroundImage: undefined,
      },
    });
  }

  // ── Credit Application (Credix Core) ──────────────────────────────────────
  if (method === 'GET' && url.includes('/originacion/solicitudes/')) {
    const id = url.split('/originacion/solicitudes/').pop() ?? '';

    // EXAMPLE RULE (temporary): 123456789 = new client; any other id = already validated.
    // findByIdentification returns null when the body is null → DetermineUserTypeUseCase → NewClient.
    if (id === '123456789') {
      return mock(null, 200);
    }

    return mock({
      id: 'app-mock-001',
      identification_type: 'NACIONAL',
      identification_number: id,
      user_type: 'CLIENTE_CON_TARJETA',
      current_stage: 'SOLICITUD',
      current_substage: 'DATOS_BASICOS',
      current_completed_at: new Date().toISOString(),
      profile: {
        identification_number: id,
        identification_type: 'NACIONAL',
        first_name: 'Juan',
        last_name: 'Pérez',
        contact: {
          country_code: '+506',
          phone: '8888-8888',
          email: 'juan.perez@example.com',
        },
        validated_at: new Date().toISOString(),
      },
      progress_log: [
        {
          stage: 'SOLICITUD',
          substage: 'DATOS_BASICOS',
          status: 'success',
          metadata: { source: 'mock' },
          timestamp: new Date().toISOString(),
        },
      ],
      result: 'Aprobado',
      created_at: new Date().toISOString(),
    });
  }

  if (method === 'POST' && url.includes('/originacion/solicitudes')) {
    const body = req.body as Record<string, unknown>;
    return mock({
      ...body,
      id: 'app-mock-002',
      created_at: new Date().toISOString(),
    });
  }

  // ── Identity Verification (backend-owned) ─────────────────────────────────
  if (method === 'POST' && url.includes('/identity-verifications')) {
    const body = req.body as { applicationId?: string };
    return mock({
      verificationId: `identity-${body.applicationId ?? 'missing-application'}`,
      status: 'pending',
      interactionUrl: 'https://verification.local/continue',
    });
  }

  if (method === 'GET' && url.includes('/identity-verifications/')) {
    const verificationId = url.split('/identity-verifications/').pop() ?? 'unknown';
    return mock({ verificationId, status: 'pending' });
  }

  // ── Legacy Identity Validation (MetaMap) ──────────────────────────────────
  if (method === 'POST' && url.includes('/validacion/identidad')) {
    const body = req.body as { identificationNumber?: string };
    // Simulate failure for IDs ending in 0 to test retry/error flows
    const shouldFail = body.identificationNumber?.endsWith('0');
    if (shouldFail) {
      return mock({ approved: false, error_code: 'MOCK_VALIDATION_FAILED' });
    }
    return mock({
      approved: true,
      validated_identification_number: body.identificationNumber,
    });
  }

  if (method === 'POST' && url.includes('/validacion/contacto')) {
    return mock({ approved: true });
  }

  // ── TSE Query ─────────────────────────────────────────────────────────────
  if (method === 'GET' && url.includes('/tse/personas/')) {
    const id = url.split('/tse/personas/').pop() ?? '';
    // Simulate "not found" for IDs starting with 0
    if (id.startsWith('0')) {
      return mock(null, 200);
    }
    return mock({
      first_name: 'Juan',
      last_name: 'Pérez',
      full_name: 'Juan Pérez González',
    });
  }

  // ── KYC Session ───────────────────────────────────────────────────────────
  if (method === 'POST' && url.includes('/kyc/session')) {
    const body = req.body as { provider?: string; identificationNumber?: string };
    const provider = body.provider ?? 'metamap';
    return mock({
      sessionToken: `mock-${provider}-session-${Date.now()}`,
      metadata: { flowId: `mock-flow-${provider}` },
    });
  }

  // ── Credit Bureau (not yet implemented but reserved) ──────────────────────
  // if (method === 'POST' && url.includes('/buro-credito/consulta')) { ... }

  // Pass through anything we don't mock
  return next(req);
};
