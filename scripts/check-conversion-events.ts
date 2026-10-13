import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = await mkdtemp(join(tmpdir(), 'hotel-conversions-'));
process.env.DATABASE_PROVIDER = 'sqlite';
process.env.DATABASE_URL = `file:${join(directory, 'test.db')}`;
process.env.DB_SINGLETON_ENABLED = 'true';
const { createClient } = await import('@libsql/client');
const client = createClient({ url: process.env.DATABASE_URL });
await client.execute('CREATE TABLE config (name TEXT PRIMARY KEY, value TEXT)');
try {
  const { db } = await import('../src/core/db');
  const { queueConversion } = await import('../src/lib/conversion-events');
  const { pendingConversions, acknowledgeConversions } =
    await import('../src/modules/analytics/service');
  await queueConversion(db(), 'user-a', 'sign_up', 'user-a');
  await queueConversion(db(), 'user-a', 'sign_up', 'user-a');
  await queueConversion(db(), 'user-a', 'start_video', 'task-a');
  await queueConversion(db(), 'user-a', 'payment_success', 'order-a');
  const events = await pendingConversions('user-a');
  assert.equal(
    events.length,
    3,
    'Duplicate business deliveries must not create new events'
  );
  assert.equal(
    (await pendingConversions('user-b')).length,
    0,
    'Another account cannot read events'
  );
  await acknowledgeConversions(
    'user-b',
    events.map((e) => e.id)
  );
  assert.equal(
    (await pendingConversions('user-a')).length,
    3,
    'Another account cannot acknowledge events'
  );
  const { trafficReport } = await import('../src/modules/traffic/service');
  const report = await trafficReport();
  assert.deepEqual(
    report.funnel.today,
    { signups: 1, videos: 1, payments: 1 },
    'Server counts must match confirmed events'
  );
  const serialized = JSON.stringify(events);
  for (const source of [
    'user-a',
    'task-a',
    'order-a',
    'amount',
    'currency',
    'email',
    'prompt',
  ])
    assert(
      !serialized.includes(source),
      'No business payload in outgoing events'
    );
  await acknowledgeConversions(
    'user-a',
    events.map((e) => e.id)
  );
  await queueConversion(db(), 'user-a', 'payment_success', 'order-a');
  assert.equal(
    (await pendingConversions('user-a')).length,
    0,
    'Acknowledged payments must not replay'
  );
  const rows = await client.execute('SELECT value FROM config');
  assert.equal(
    rows.rows.length,
    3,
    'Acknowledged records remain available for server conversion counts'
  );
  console.log(
    'Conversion queue: deduplication, ownership, anonymous payload and acknowledgement verified.'
  );
} finally {
  client.close();
  await rm(directory, { recursive: true, force: true });
}
