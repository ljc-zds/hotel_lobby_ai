import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';

import { apiPost } from '@/lib/api-client';

export function VisitTracker() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const { mutate } = useMutation({
    mutationFn: (body: { visitor: string; event: string; path: string }) =>
      apiPost('/api/traffic', body),
    retry: false,
  });
  useEffect(() => {
    if (
      navigator.doNotTrack === '1' ||
      /^\/(?:zh\/)?(?:admin|settings|api|orders|sign-|forgot|reset)/.test(path)
    )
      return;
    try {
      const stored = JSON.parse(
        localStorage.getItem('hotel-visitor') || 'null'
      );
      const visitor =
        stored?.expires > Date.now() ? stored.id : crypto.randomUUID();
      localStorage.setItem(
        'hotel-visitor',
        JSON.stringify({
          id: visitor,
          expires:
            stored?.expires > Date.now()
              ? stored.expires
              : Date.now() + 30 * 86400_000,
        })
      );
      const dedupKey = `hotel-visit:${path}`;
      if (Date.now() - Number(sessionStorage.getItem(dedupKey) || 0) < 1000)
        return;
      sessionStorage.setItem(dedupKey, String(Date.now()));
      mutate({ visitor, event: crypto.randomUUID(), path });
    } catch {
      /* Tracking is optional when browser storage is unavailable. */
    }
  }, [path, mutate]);
  return null;
}
