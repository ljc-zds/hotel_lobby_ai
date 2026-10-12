import { createHmac, timingSafeEqual } from 'node:crypto';

import { envConfigs } from '@/config';

function signature(id: string) {
  if (!process.env.AUTH_SECRET) throw new Error('Auth secret is required.');
  return createHmac('sha256', process.env.AUTH_SECRET)
    .update(`minimax-video:${id}`)
    .digest('hex');
}

export function videoCallbackUrl(id: string) {
  const url = new URL('/api/video/callback', envConfigs.app_url);
  // A local development server cannot receive MiniMax callbacks.
  if (url.protocol !== 'https:') return undefined;
  url.searchParams.set('id', id);
  url.searchParams.set('token', signature(id));
  return url.href;
}

export function verifyVideoCallback(id: string, token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f]{64}$/.test(token))
    return false;
  return timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(signature(id), 'hex')
  );
}
