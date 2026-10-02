export type UiVerificationState =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'manual_review'
  | 'failed';

export interface VerdictOutcome {
  state: UiVerificationState;
  route?: string;
  triesLeft: number | null;
}

export function mapVerdict(
  status: string,
  triesLeft: number | null | undefined,
): VerdictOutcome {
  const normalizedTries =
    triesLeft === -1 || triesLeft == null ? null : 3 - triesLeft;

  switch (status) {
    case 'verified':
    case 'validated':
      return { state: 'approved', route: '/request/result', triesLeft: normalizedTries };

    case 'rejected':
      return { state: 'rejected', triesLeft: normalizedTries };

    case 'support':
      return { state: 'manual_review', triesLeft: normalizedTries };

    case 'identificationNoMatch':
      return { state: 'rejected', triesLeft: normalizedTries };

    case 'limitReached':
      return { state: 'failed', triesLeft: normalizedTries };

    default:
      // Unknown/future statuses: safe fallback is rejected (no silent approvals).
      return { state: 'rejected', triesLeft: normalizedTries };
  }
}
