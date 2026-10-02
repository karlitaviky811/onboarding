export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  mockEnabled: true,
  /**
   * QA demo: '/origination' is proxied by proxy.conf.json to the Credix QA backend.
   * Requires VPN to reach qaoriginacionbe.credix.com — document as a demo prerequisite.
   */
  apiUrlOriginacion: '/origination',
  channelId: 122,
  /**
   * QA service credentials — read by originacionAuthInterceptor.
   * NEVER commit real credentials here. Use a local environment override or CI secret.
   * Replace <<QA-hash-from-ops>> with the actual value obtained from the ops team.
   */
  originacionAuth: {
    username: 'sts_sac',
    password: '<<QA-hash-from-ops>>',
  } as { username: string; password: string } | null,
  /**
   * DEV SMOKE: paste your MetaMap clientId here to launch the widget locally.
   * With ng serve (mockEnabled: true), /admin/config returns 'metamap-widget'
   * so the page renders the widget. Fill in these values from your MetaMap dashboard.
   * PR-B replaces this with a real backend fetch (getButtonData) — these fields
   * will no longer be needed once the Credix Originación backend is wired.
   */
  metamapClientId: '6abedc6afb833c58dae1bb72',   // DEV SMOKE clientId
  metamapFlowId: '6abedc6a3f95e74332a9ea56',  // NEEDS CONFIRMATION: verify this is the real workflowId from MetaMap dashboard / getmetamapbuttondata
  /**
   * Persona sandbox template — same across environments (sandbox data only).
   * Switch the mock interceptor's identityProvider value to 'persona-widget' to
   * demo Persona's real sandbox flow in ng serve.
   */
  personaTemplateId: 'itmpl_Ygs16MKTkA6obnF8C3Rb17dm',
  personaEnvironment: 'sandbox' as const,
  /**
   * DEV: paste a sandbox SDK token here to demo the Onfido widget in ng serve.
   * Generate via: POST https://api.onfido.com/v3.6/sdk_token (requires API key + applicant_id).
   * Tokens expire after 90 minutes. Switch the mock interceptor's identityProvider
   * to 'onfido-widget' to activate this widget in the dev server.
   */
  onfidoToken: '',  // DEV: paste a sandbox SDK token (generate via Onfido API; expires 90min)
};
