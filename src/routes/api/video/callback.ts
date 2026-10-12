import { createFileRoute } from '@tanstack/react-router';

import { receiveVideoCallback } from '@/modules/video/service';
import { respErr, respOk } from '@/lib/resp';
import { verifyVideoCallback } from '@/lib/video-callback';

async function POST({ request }: { request: Request }) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  if (!verifyVideoCallback(id, url.searchParams.get('token') || ''))
    return respErr('Unauthorized', { status: 401 });
  if (Number(request.headers.get('content-length')) > 20_000)
    return respErr('Payload too large', { status: 413 });
  try {
    const text = await request.text();
    if (text.length > 20_000)
      return respErr('Payload too large', { status: 413 });
    const body = JSON.parse(text);
    // MiniMax verifies callback URLs before returning a provider task ID.
    if (typeof body.challenge === 'string' && body.challenge.length <= 4096)
      return Response.json({ challenge: body.challenge });
    const result = await receiveVideoCallback(id);
    // Request redelivery when storage failed; the browser also retries polling.
    if (result.storageStatus)
      return respErr('Storage retry required', { status: 503 });
    return respOk();
  } catch {
    return respErr('Callback temporarily unavailable', { status: 503 });
  }
}

export const Route = createFileRoute('/api/video/callback')({
  server: { handlers: { POST } },
});
