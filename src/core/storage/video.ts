import { inArray } from 'drizzle-orm';

import { db } from '@/core/db';
import { R2Provider } from '@/core/storage/r2';
import { envConfigs } from '@/config';
import { config } from '@/config/db/schema';
import { decryptSecret } from '@/lib/crypto';

export class VideoStorageError extends Error {
  constructor() {
    super('Video storage is temporarily unavailable. Please try again later.');
  }
}

/** Read the same encrypted R2 settings used by the admin storage panel. */
export async function getVideoStorage() {
  const values: Record<string, string> = { ...envConfigs };
  const rows = await db()
    .select()
    .from(config)
    .where(
      inArray(config.name, [
        'r2_account_id',
        'r2_access_key',
        'r2_secret_key',
        'r2_bucket_name',
        'r2_upload_path',
        'r2_endpoint',
      ])
    );
  for (const row of rows) {
    if (row.value) {
      const plain = await decryptSecret(row.value);
      if (plain !== null) values[row.name] = plain;
    }
  }
  const accessKeyId = values.r2_access_key || values.storage_access_key;
  const secretAccessKey = values.r2_secret_key || values.storage_secret_key;
  const bucket = values.r2_bucket_name || values.storage_bucket;
  const endpoint =
    values.r2_endpoint ||
    values.storage_endpoint ||
    (values.r2_account_id
      ? `https://${values.r2_account_id}.r2.cloudflarestorage.com`
      : '');
  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint)
    throw new VideoStorageError();
  const url = new URL(endpoint);
  if (
    url.protocol !== 'https:' ||
    !url.hostname.endsWith('.r2.cloudflarestorage.com') ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash ||
    !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)
  )
    throw new VideoStorageError();
  return new R2Provider({
    accountId: values.r2_account_id || '',
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint: url.origin,
    uploadPath: values.r2_upload_path || 'uploads',
  });
}

export function videoObjectKey(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new VideoStorageError();
  return `videos/${id}.mp4`;
}

// Only download provider-owned output hosts, including each redirect hop.
const outputHosts = new Set([
  'algeng-video-infer.oss-cn-shanghai.aliyuncs.com',
  'video-product.cdn.minimax.io',
  'cdn.hailuoai.com',
]);
const maxBytes = 128 * 1024 * 1024;

export async function archiveVideo(id: string, sourceUrl: string) {
  const storage = await getVideoStorage();
  const key = videoObjectKey(id);
  if (await storage.exists({ key })) return key;
  let url = new URL(sourceUrl);
  const signal = AbortSignal.timeout(45_000);
  for (let hop = 0; hop < 4; hop++) {
    if (
      url.protocol !== 'https:' ||
      !outputHosts.has(url.hostname) ||
      url.username ||
      url.password ||
      url.port
    )
      throw new VideoStorageError();
    const response = await fetch(url, {
      redirect: 'manual',
      signal,
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      const location = response.headers.get('location');
      if (!location) throw new VideoStorageError();
      url = new URL(location, url);
      continue;
    }
    if (
      !response.ok ||
      !response.body ||
      Number(response.headers.get('content-length')) > maxBytes
    ) {
      await response.body?.cancel();
      throw new VideoStorageError();
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > maxBytes) throw new VideoStorageError();
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
    const body = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    if (length < 12 || new TextDecoder().decode(body.subarray(4, 8)) !== 'ftyp')
      throw new VideoStorageError();
    const uploaded = await storage.uploadFile({
      key,
      body,
      contentType: 'video/mp4',
      disposition: 'inline',
    });
    if (!uploaded.success) throw new VideoStorageError();
    return key;
  }
  throw new VideoStorageError();
}
