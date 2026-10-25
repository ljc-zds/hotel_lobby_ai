import { createHash, randomUUID } from 'node:crypto';

import { envConfigs } from '@/config';

type Scope = 'settings' | 'posts';
type Fence = { id: string; blocked: boolean };
type Entry = { generation: string; json: string; expires: number };
type Store = {
  get(key: string): Promise<unknown>;
  set(
    key: string,
    value: unknown,
    options?: { ttl?: number; tags?: string[] }
  ): Promise<unknown>;
  delete(key: string): Promise<unknown>;
  expireTag(tag: string): Promise<unknown>;
};

const namespace = createHash('sha256')
  .update(
    [
      process.env.VERCEL_PROJECT_ID || '',
      envConfigs.app_url,
      envConfigs.db_schema,
      process.env.VERCEL_ENV || 'local',
    ].join('|')
  )
  .digest('hex')
  .slice(0, 24);
const prefix = `public-v1:${namespace}`;

async function runtimeStore(): Promise<Store | null> {
  if (process.env.VERCEL !== '1' || !process.env.VERCEL_REGION) return null;
  const { getCache } = await import('@vercel/functions');
  return getCache({
    keyHashFunction: (key) => createHash('sha256').update(key).digest('hex'),
  });
}

// Store only explicit public DTOs. Do not pass sessions, previews or full configs.
export function createPublicCache(getStore: () => Promise<Store | null>) {
  const tag = (scope: Scope) => `${prefix}:${scope}`;
  const fenceKey = (scope: Scope) => `${tag(scope)}:fence`;
  const generation = (f: Fence | null) => f?.id || 'initial';
  const serialize = (value: unknown) =>
    JSON.stringify({ value }, function (key, v) {
      return this[key] instanceof Date
        ? { __publicDate: this[key].toISOString() }
        : v;
    });
  const deserialize = (json: string) =>
    JSON.parse(json, (_key, v) =>
      v &&
      typeof v === 'object' &&
      Object.keys(v).length === 1 &&
      typeof v.__publicDate === 'string'
        ? new Date(v.__publicDate)
        : v
    ).value;

  async function read<T>(
    scope: Scope,
    key: string,
    load: () => Promise<T>,
    ttl = 600
  ): Promise<T> {
    let store: Store | null = null;
    let before: Fence | null = null;
    const cacheKey = `${tag(scope)}:${key}`;
    try {
      store = await getStore();
      if (store) {
        before = (await store.get(fenceKey(scope))) as Fence | null;
        if (before?.blocked) return load();
        const hit = (await store.get(cacheKey)) as Entry | null;
        if (
          hit &&
          hit.generation === generation(before) &&
          hit.expires > Date.now()
        ) {
          const after = (await store.get(fenceKey(scope))) as Fence | null;
          if (!after?.blocked && generation(after) === generation(before)) {
            console.info('public_cache', { scope, outcome: 'hit' });
            return deserialize(hit.json) as T;
          }
        }
      }
    } catch {
      store = null; // Cache failures never turn public reads into outages.
    }
    const value = await load(); // Rejections are deliberately never cached.
    if (store) {
      try {
        const after = (await store.get(fenceKey(scope))) as Fence | null;
        if (!after?.blocked && generation(after) === generation(before)) {
          await store.set(
            cacheKey,
            {
              generation: generation(before),
              json: serialize(value),
              expires: Date.now() + ttl * 1000,
            },
            { ttl, tags: [tag(scope)] }
          );
          const finalFence = (await store.get(fenceKey(scope))) as Fence | null;
          if (
            finalFence?.blocked ||
            generation(finalFence) !== generation(before)
          )
            await store.delete(cacheKey);
          console.info('public_cache', { scope, outcome: 'fill' });
        }
      } catch {
        console.warn('public_cache_write_unavailable', { scope });
      }
    }
    return value;
  }

  async function mutate<T>(scope: Scope, work: () => Promise<T>): Promise<T> {
    const store = await getStore();
    if (!store) return work();
    // Establish bypass before changing content. If this fails, do not mutate DB.
    const guardId = randomUUID();
    await store.set(
      fenceKey(scope),
      { id: guardId, blocked: true },
      { ttl: 86400 }
    );
    const confirmed = (await store.get(fenceKey(scope))) as Fence | null;
    if (confirmed?.id !== guardId || !confirmed.blocked)
      throw new Error('Public cache guard unavailable; retry saving.');
    try {
      return await work();
    } finally {
      try {
        await store.expireTag(tag(scope));
        await store.set(
          fenceKey(scope),
          { id: randomUUID(), blocked: false },
          { ttl: 86400 }
        );
      } catch {
        // Leave bypass enabled rather than resurrect stale withdrawn content.
        // Do not report a committed payment/refund as failed due to cache cleanup.
        console.error('public_cache_invalidation_unavailable', { scope });
      }
    }
  }
  return { read, mutate };
}

const cache = createPublicCache(runtimeStore);
export const readPublicCache = cache.read;
export const mutatePublicCache = cache.mutate;
