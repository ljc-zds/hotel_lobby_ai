import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { getAuth } from '@/core/auth';
import { envConfigs } from '@/config';
import {
  acknowledgeConversions,
  pendingConversions,
} from '@/modules/analytics/service';
import { respData, respErr, respOk } from '@/lib/resp';

const noStore = { headers: { 'Cache-Control': 'no-store' } };
const bodySchema = z.object({ ids: z.array(z.string().uuid()).max(100) });
async function handle(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session?.user)
    return respErr('Unauthorized', { status: 401, ...noStore });
  try {
    if (request.method === 'GET') {
      const events = await pendingConversions(session.user.id);
      return respData(
        events.map(({ id, name }) => ({ id, name })),
        noStore
      );
    }
    if (request.headers.get('origin') !== new URL(envConfigs.app_url).origin)
      return respErr('Forbidden', { status: 403 });
    if (Number(request.headers.get('content-length') || 0) > 5000)
      return respErr('Invalid body', { status: 400 });
    const text = await request.text();
    if (text.length > 5000) return respErr('Invalid body', { status: 400 });
    const { ids } = bodySchema.parse(JSON.parse(text));
    await acknowledgeConversions(session.user.id, ids);
    return respOk(noStore);
  } catch {
    return respErr('Analytics unavailable', { status: 503, ...noStore });
  }
}
export const Route = createFileRoute('/api/analytics')({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
