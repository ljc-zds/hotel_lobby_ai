import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { paidVideoBalance } from '@/core/credits/video';
import { VIDEO_CREDIT_COST } from '@/config/video';
import { respData, respErr } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session?.user) return respErr('Unauthorized', { status: 401 });
  try {
    return respData(
      {
        balance: await paidVideoBalance(session.user.id),
        cost: VIDEO_CREDIT_COST,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return respErr('Balance unavailable', { status: 503 });
  }
}
export const Route = createFileRoute('/api/video/balance')({
  server: { handlers: { GET } },
});
