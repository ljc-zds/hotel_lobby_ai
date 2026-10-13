# Conversion tracking

The production app records three server-confirmed events:

| Event             | Trigger                                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `sign_up`         | Better Auth creates a new user, including Google/GitHub first-time signup. Existing-account logins do not trigger it.         |
| `start_video`     | The AI provider accepts a video task. Missing credits, invalid images and failed requests do not trigger it.                  |
| `payment_success` | A verified payment result is fulfilled, including subscription renewals. Checkout clicks and unpaid orders do not trigger it. |

Events are stored in the existing config table under `conversion:` keys, using stable source keys for deduplication. Payment events are written inside the fulfillment transaction. No new database migration is required. Only an anonymous event name and a random delivery nonce are queued in GA4; account identifiers, order numbers, amounts, currency, products, images and prompts are not transmitted. This tracks payment counts, not ecommerce revenue.

The signed-in browser polls `/api/analytics`, sends pending events to the configured GA4 property, and acknowledges them. Persistent browser deduplication and server acknowledgements prevent ordinary refresh/retry duplicates. Multiple devices or storage restrictions may still duplicate non-purchase events. Acknowledgement confirms queueing in `gtag`, not Google's receipt; ad blockers, DNT and a customer never returning after an asynchronous payment can prevent GA4 reporting. Server conversion counts remain in `/admin/traffic`. Events start with this release; old accounts/orders/tasks are not backfilled.

The tag ignores `accounts.google.com` referrers, so OAuth return traffic does not replace the original acquisition source. Internal traffic exclusions require a verified internal IP/filter and are not guessed automatically.

## GA4 setup

Property `558301958` uses `sign_up`, `start_video` and `payment_success` as key events under Admin → Data display → Events. These events have no default monetary value. Build the funnel in Explorations using these three events. Regular reports can take time to process; validate with Realtime or DebugView. Anonymous payment counts intentionally do not populate the ecommerce revenue report.

## Verification

With the local SQLite schema selected, run `node --import tsx scripts/check-conversion-events.ts`. It creates a disposable temporary database and verifies deduplication, account isolation, anonymous payloads and acknowledgements, without touching production or initiating paid generation/checkout. Verify `pnpm build` afterward.
