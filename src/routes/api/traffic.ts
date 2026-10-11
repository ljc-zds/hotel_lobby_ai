import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { envConfigs } from '@/config';
import { recordVisit } from '@/modules/traffic/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respErr, respOk } from '@/lib/resp';

const schema = z.object({
  visitor: z.string().uuid(),
  event: z.string().uuid(),
  path: z
    .string()
    .max(160)
    .regex(
      /^\/(?:zh\/?|pricing|about|contact|guide|privacy-policy|terms-of-service|what-is-hotel-lobby-ai|hotel-lobby-ai-prompts|blog(?:\/[a-z0-9-]+)?|zh\/(?:pricing|about|contact|guide|privacy-policy|terms-of-service|what-is-hotel-lobby-ai|hotel-lobby-ai-prompts|blog(?:\/[a-z0-9-]+)?))?\/?$/
    ),
});
async function POST({ request }: { request: Request }) {
  if (request.headers.get('origin') !== new URL(envConfigs.app_url).origin)
    return respErr('Forbidden', { status: 403 });
  const limited = enforceMinIntervalRateLimit(request, {
    intervalMs: 1000,
    keyPrefix: 'traffic',
  });
  if (limited) return respOk();
  try {
    if (Number(request.headers.get('content-length') || 0) > 4096)
      return respErr('Invalid body', { status: 400 });
    const text = await request.text();
    if (text.length > 4096) return respErr('Invalid body', { status: 400 });
    const body = schema.parse(JSON.parse(text));
    await recordVisit(body.visitor, body.event, body.path);
    return respOk({ headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return respErr('Unable to record visit', { status: 400 });
  }
}
export const Route = createFileRoute('/api/traffic')({
  server: { handlers: { POST } },
});
