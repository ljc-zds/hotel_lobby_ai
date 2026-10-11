import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { MiniMaxApiError } from '@/core/ai';
import { getAuth } from '@/core/auth';
import { envConfigs } from '@/config';
import { listVideos, queryVideo, startVideo } from '@/modules/video/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';
import { getHotelTracks } from '@/blocks/hotel-tracks';

const schema = z.object({
  trackId: z.string().max(100),
  consent: z.literal(true),
  images: z
    .array(
      z
        .string()
        .max(1_500_000)
        .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/)
    )
    .length(2),
});
const noStore = { headers: { 'Cache-Control': 'no-store' } };
async function POST({ request }: { request: Request }) {
  if (request.headers.get('origin') !== new URL(envConfigs.app_url).origin)
    return respErr('Forbidden origin', { status: 403 });
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session?.user)
    return respErr('Please sign in to generate a video.', { status: 401 });
  const limited = enforceMinIntervalRateLimit(request, {
    intervalMs: 30_000,
    keyPrefix: 'video',
    extraKey: session.user.id,
  });
  if (limited)
    return respErr('Please wait before creating another video.', {
      status: 429,
    });
  try {
    if (Number(request.headers.get('content-length') || 0) > 3_100_000)
      return respErr('Images are too large.', { status: 413 });
    const text = await request.text();
    if (text.length > 3_100_000)
      return respErr('Images are too large.', { status: 413 });
    const body = schema.parse(JSON.parse(text));
    const track = getHotelTracks('en').find((t) => t.id === body.trackId);
    if (!track) return respErr('Unknown template.', { status: 400 });
    if (!process.env.MINIMAX_API_KEY)
      return respErr('Video generation is not configured.', { status: 503 });
    return respData(
      await startVideo(session.user.id, track, body.images),
      noStore
    );
  } catch (error) {
    if (error instanceof MiniMaxApiError)
      return respErr(error.message, { status: error.status });
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return respErr('Invalid images or consent.', { status: 400 });
    if (error instanceof Error && error.message.startsWith('Daily video limit'))
      return respErr(error.message, { status: 429 });
    return respErr(
      'Video generation could not start. Please try again later.',
      { status: 502 }
    );
  }
}
async function GET({ request }: { request: Request }) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session?.user) return respErr('Unauthorized', { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (id && !z.string().uuid().safeParse(id).success)
    return respErr('Invalid task.', { status: 400 });
  try {
    return respData(
      id
        ? await queryVideo(session.user.id, id)
        : await listVideos(session.user.id),
      noStore
    );
  } catch {
    return respErr('Video task unavailable.', { status: 404 });
  }
}
export const Route = createFileRoute('/api/video')({
  server: { handlers: { GET, POST } },
});
