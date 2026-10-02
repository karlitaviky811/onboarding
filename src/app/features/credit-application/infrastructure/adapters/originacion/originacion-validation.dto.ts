/**
 * Originación DTOs for MetaMap button-data and save-verification endpoints.
 *
 * ASSUMPTION (PR-B OQ-1): The exact request payload for getmetamapbuttondata
 * in onboarding-app context is unconfirmed. GitCreditoWeb sends
 * { validationId, channelId, username, password } where validationId is derived
 * from a route-level encrypted URL param. onboarding-app has NO encrypted URL
 * param — the validationId source must be confirmed with backend before PR-B.
 * Placeholder shape used here: { validationId, channelId }.
 * Auth credentials are injected by the interceptor, NOT in this DTO.
 *
 * ASSUMPTION (PR-B OQ-2): The exact request payload for savevalidationverification
 * is unconfirmed. GitCreditoWeb sends { validationId, verificationId, channelId,
 * isCreditWeb, username, password }. The isCreditWeb value for onboarding-app
 * is likely false but must be confirmed. Auth fields are interceptor-injected.
 */

// ── Button-Data (getmetamapbuttondata) ────────────────────────────────────────

/** @see ASSUMPTION PR-B OQ-1 */
export interface GetMetamapButtonDataRequestDto {
  /**
   * ASSUMPTION (PR-B OQ-1): session/validation identifier.
   * GitCreditoWeb derives this from a decrypted URL param.
   * onboarding-app must clarify the source (CreditApplication.id candidate).
   */
  validationId: string;
  /** channelId=122 for Credix Originación (confirmed from reference). */
  channelId: number;
}

export interface GetMetamapButtonDataResponseDto {
  clientId: string;
  workflowId: string;
  /** Optional — present when backend has an identityId for this session. */
  identityId?: string;
  /** 1 = already validated (short-circuit: skip SDK); 0 = not yet validated. */
  validated: number;
}

// ── Save Verification (savevalidationverification) ────────────────────────────

/** @see ASSUMPTION PR-B OQ-2 */
export interface SaveValidationVerificationRequestDto {
  /**
   * ASSUMPTION (PR-B OQ-1/OQ-2): session identifier — same sourcing question as above.
   */
  validationId: string;
  /** The verificationId received from the MetaMap SDK `metamap:userFinishedSdk` event. */
  verificationId: string;
  /** channelId=122 (confirmed from reference). */
  channelId: number;
  /**
   * ASSUMPTION (PR-B OQ-2): GitCreditoWeb sends isCreditWeb=true.
   * For onboarding-app this is likely false but must be confirmed with backend.
   */
  isCreditWeb: boolean;
}

export interface SaveValidationVerificationResponseDto {
  /**
   * One of: verified | validated | rejected | support | identificationNoMatch | limitReached.
   * Any other value is treated as rejected (safe default).
   */
  status: string;
  /**
   * Retry gate. -1 or absent = not applicable.
   * The mapVerdict function normalizes this to remaining attempts (3 - triesLeft).
   */
  triesLeft: number;
}

// ── Button-Data ViewModel (infra-only, consumed by widget component) ──────────

export interface ButtonDataViewModel {
  clientId: string;
  flowId: string;
  identityId?: string;
  validated: number;
}
