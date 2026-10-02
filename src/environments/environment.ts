export const environment = {
  production: true,
  apiUrl: 'https://api.example.com',
  mockEnabled: false,
  /**
   * Originación backend base URL.
   * Production: MUST be routed through a Credix BFF that injects service credentials
   * server-side. originacionAuth is null here — interceptor is a no-op in prod.
   * See PROD BFF follow-up (PR-B B-5, BLOCKING before production rollout).
   */
  apiUrlOriginacion: 'https://originacionbe.credix.com/origination',
  channelId: 122,
  /** Production: null — credentials NEVER in browser. BFF injects them server-side. */
  originacionAuth: null as { username: string; password: string } | null,
  /**
   * Type-parity fields for MetaMap widget dev-smoke.
   * Production does NOT use these — the real clientId/flowId are fetched from the
   * Credix Originación backend via getButtonData (PR-B). These fields MUST remain
   * '' in production; they are here only so the type shape matches environment.development.ts.
   */
  metamapClientId: '',
  metamapFlowId: '',
  /**
   * Persona sandbox template ID (shared across environments for now).
   * The sandbox flow uses Persona's shared sandbox data — no real identity docs are processed.
   */
  personaTemplateId: 'itmpl_Ygs16MKTkA6obnF8C3Rb17dm',
  personaEnvironment: 'sandbox' as const,
  /**
   * Onfido SDK token.
   * Production: MUST be minted server-side by your BFF (tokens expire after 90 minutes).
   * NEVER put real tokens in source control.
   */
  onfidoToken: '',
};
