import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { hasPermission } from '@/modules/rbac/service';
import { trafficReport } from '@/modules/traffic/service';
import { respData, respErr } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session?.user) return respErr('Unauthorized', { status: 401 });
  if (!(await hasPermission(session.user.id, 'admin.settings.read')))
    return respErr('Forbidden', { status: 403 });
  try {
    return respData(await trafficReport(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return respErr('Statistics unavailable', { status: 503 });
  }
}
export const Route = createFileRoute('/api/admin/traffic')({
  server: { handlers: { GET } },
});
