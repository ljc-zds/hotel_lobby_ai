import assert from 'node:assert/strict';
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryObserver,
} from '@tanstack/react-query';

import {
  conversionQueryKey,
  conversionQueryOptions,
  videoListPollingInterval,
} from '../src/lib/hotel-query-policy';

assert.equal(videoListPollingInterval(true, undefined), false);
assert.equal(videoListPollingInterval(true, []), false);
assert.equal(
  videoListPollingInterval(true, [
    { status: 'success' },
    { status: 'failed' },
    { status: 'canceled' },
  ]),
  false
);
for (const status of ['pending', 'processing']) {
  assert.equal(
    videoListPollingInterval(true, [{ status: 'success' }, { status }]),
    10_000
  );
  assert.equal(videoListPollingInterval(false, [{ status }]), false);
}
assert.equal(conversionQueryOptions.refetchInterval, false);

const client = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: Infinity } },
});
let reads = 0;
const options = {
  ...conversionQueryOptions,
  queryKey: conversionQueryKey('test-user'),
  queryFn: async () => ++reads,
};
const observer = new QueryObserver(client, options);
client.mount();
const unsubscribe = observer.subscribe(() => {});
const settled = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
try {
  await settled();
  assert.equal(reads, 1, 'Fetch once on initial mount');
  observer.setOptions(options);
  await settled();
  assert.equal(reads, 1, 'An ordinary rerender must not refetch');
  await client.invalidateQueries({
    queryKey: conversionQueryKey('other-user'),
  });
  assert.equal(reads, 1, 'Other accounts must not trigger this query');
  await client.invalidateQueries({ queryKey: conversionQueryKey('test-user') });
  assert.equal(reads, 2, 'Business events invalidate the active account');
  focusManager.setFocused(false);
  focusManager.setFocused(true);
  await settled();
  assert.equal(reads, 3, 'Returning to the page checks delayed conversions');
  onlineManager.setOnline(false);
  onlineManager.setOnline(true);
  await settled();
  assert.equal(reads, 4, 'Reconnecting checks delayed conversions');
  console.log(
    'Hotel query policy: conditional polling, account-scoped invalidation, focus and reconnect verified.'
  );
} finally {
  unsubscribe();
  client.unmount();
  client.clear();
  focusManager.setFocused(undefined);
}
