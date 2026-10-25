import assert from 'node:assert/strict';

import { createPublicCache } from '../src/lib/public-cache.server';

const values = new Map<string, { value: unknown; tags: string[] }>();
let failSet = false,
  failExpire = false;
const store = {
  async get(key: string) {
    return values.get(key)?.value ?? null;
  },
  async set(key: string, value: unknown, options?: { tags?: string[] }) {
    if (failSet) throw new Error('cache unavailable');
    values.set(key, { value, tags: options?.tags || [] });
  },
  async delete(key: string) {
    values.delete(key);
  },
  async expireTag(tag: string) {
    if (failExpire) throw new Error('invalidation unavailable');
    for (const [key, entry] of values)
      if (entry.tags.includes(tag)) values.delete(key);
  },
};
const cache = createPublicCache(async () => store);
let reads = 0;
const load = async () => {
  reads++;
  return { title: 'public', createdAt: new Date('2026-01-01') };
};
await cache.read('posts', 'article', load);
const hit = await cache.read('posts', 'article', load);
assert.equal(reads, 1);
assert(hit.createdAt instanceof Date);
await cache.mutate('posts', async () => {});
await cache.read('posts', 'article', load);
assert.equal(reads, 2, 'mutation must invalidate');

let release!: (value: string) => void;
const stale = cache.read(
  'posts',
  'race',
  () =>
    new Promise<string>((r) => {
      release = r;
    })
);
while (!release) await new Promise((r) => setTimeout(r, 0));
await cache.mutate('posts', async () => {});
release('old');
await stale;
assert.equal(
  await cache.read('posts', 'race', async () => 'new'),
  'new',
  'in-flight stale load repopulated cache'
);

let failures = 0;
for (let i = 0; i < 2; i++)
  await assert.rejects(
    cache.read('posts', 'error', async () => {
      failures++;
      throw new Error('DB offline');
    })
  );
assert.equal(failures, 2, 'error was cached');
let changed = false;
failSet = true;
await assert.rejects(
  cache.mutate('posts', async () => {
    changed = true;
  })
);
assert.equal(changed, false, 'mutation ran without invalidation guard');
failSet = false;
failExpire = true;
assert.equal(await cache.mutate('posts', async () => 'committed'), 'committed');
let bypassReads = 0;
for (let i = 0; i < 2; i++)
  assert.equal(
    await cache.read('posts', 'article', async () => {
      bypassReads++;
      return 'fresh';
    }),
    'fresh'
  );
assert.equal(bypassReads, 2, 'failed invalidation must leave reads uncached');
console.log(
  'Public cache checks passed: hit, dates, invalidation, race, error retry, mutation guard, fail-safe bypass'
);
