import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { hasPermission } from '@/modules/rbac/service';
import { respData, respErr } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized', { status: 401 });

    const isAdmin = await hasPermission(session.user.id, 'admin.access');
    return respData({ isAdmin }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return respErr('Unable to check permissions', { status: 503 });
  }
}

export const Route = createFileRoute('/api/user/permissions')({
  server: {
    handlers: { GET },
  },
});
