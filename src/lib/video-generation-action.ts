import { VIDEO_CREDIT_COST } from '@/config/video';

export function videoGenerationAction(state: {
  busy: boolean;
  sessionPending: boolean;
  signedIn: boolean;
  balancePending: boolean;
  balanceError: boolean;
  balance: number;
  ready: boolean;
}) {
  if (state.busy || state.sessionPending) return 'wait';
  if (!state.signedIn) return 'sign-in';
  if (state.balancePending) return 'wait';
  if (state.balanceError) return 'retry-balance';
  if (state.balance < VIDEO_CREDIT_COST) return 'buy-credits';
  if (!state.ready) return 'prepare-photos';
  return 'generate';
}
