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

  metamapClientId: '6834ec0eac885d85d6417fc6',   // DEV SMOKE clientId
  metamapFlowId: '692f32ad72b6fa85b7f85440',  // NEEDS CONFIRMATION: verify this is the real workflowId from MetaMap dashboard / getmetamapbuttondata
  personaTemplateId: 'itmpl_Ygs16MKTkA6obnF8C3Rb17dm',
  personaEnvironment: 'sandbox' as const,
  onfidoToken: '',  
};
