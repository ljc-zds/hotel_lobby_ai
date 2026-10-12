import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { getAuth } from '@/core/auth';
import { getVideoStorage } from '@/core/storage/video';
import { getStoredVideoKey } from '@/modules/video/service';
import { respErr } from '@/lib/resp';

async function serve({ request }: { request: Request }) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session?.user) return respErr('Unauthorized', { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !z.string().uuid().safeParse(id).success)
    return respErr('Invalid video', { status: 400 });
  const range = request.headers.get('range') || undefined;
  if (range && !/^bytes=(?:\d+-\d*|-\d+)$/.test(range))
    return respErr('Invalid range', { status: 416 });
  try {
    const key = await getStoredVideoKey(session.user.id, id);
    if (!key) return respErr('Video not found', { status: 404 });
    const storage = await getVideoStorage();
    const response = await storage.readFile(key, {
      range,
      head: request.method === 'HEAD',
    });
    if (![200, 206, 416].includes(response.status)) {
      await response.body?.cancel();
      return respErr('Video temporarily unavailable', { status: 503 });
    }
    const headers = new Headers({
      'Content-Type': 'video/mp4',
      'Content-Disposition': `inline; filename="${id}.mp4"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': 'bytes',
    });
    for (const name of [
      'content-length',
      'content-range',
      'etag',
      'last-modified',
    ]) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(request.method === 'HEAD' ? null : response.body, {
      status: response.status,
      headers,
    });
  } catch {
    return respErr('Video temporarily unavailable', { status: 503 });
  }
}

export const Route = createFileRoute('/api/video/file')({
  server: { handlers: { GET: serve, HEAD: serve } },
});
