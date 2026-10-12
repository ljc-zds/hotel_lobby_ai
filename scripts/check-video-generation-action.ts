import assert from 'node:assert/strict';

import { videoGenerationAction } from '../src/lib/video-generation-action';

const signedIn = {
  busy: false,
  sessionPending: false,
  signedIn: true,
  balancePending: false,
  balanceError: false,
  balance: 0,
  ready: false,
};

// Purchasing and signing in must remain possible without uploaded photos or consent.
assert.equal(videoGenerationAction(signedIn), 'buy-credits');
assert.equal(
  videoGenerationAction({ ...signedIn, balance: 49, ready: true }),
  'buy-credits'
);
assert.equal(
  videoGenerationAction({ ...signedIn, signedIn: false }),
  'sign-in'
);
// Sufficient funds do not bypass required photos/consent or an in-progress task.
assert.equal(
  videoGenerationAction({ ...signedIn, balance: 50 }),
  'prepare-photos'
);
assert.equal(
  videoGenerationAction({ ...signedIn, balance: 50, ready: true }),
  'generate'
);
assert.equal(videoGenerationAction({ ...signedIn, busy: true }), 'wait');
// Unknown balance must never be treated as insufficient funds or allow generation.
assert.equal(
  videoGenerationAction({ ...signedIn, sessionPending: true }),
  'wait'
);
assert.equal(
  videoGenerationAction({ ...signedIn, balancePending: true }),
  'wait'
);
assert.equal(
  videoGenerationAction({ ...signedIn, balanceError: true, balance: 50 }),
  'retry-balance'
);
console.log(
  'Generation actions verified: sign-in, purchase, credit boundary, consent and loading/error states.'
);
