import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';

import { useSession } from '@/core/auth/client';
import { apiGet, apiPost } from '@/lib/api-client';
import {
  conversionQueryKey,
  conversionQueryOptions,
} from '@/lib/hotel-query-policy';

type Event = {
  id: string;
  name: 'sign_up' | 'start_video' | 'payment_success';
};
const sentThisPage = new Set<string>();
export function ConversionTracker({
  measurementId,
}: {
  measurementId: string;
}) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const location = useRouterState({ select: (state) => state.location.href });
  const userId = session?.user.id;
  const [analyticsReady, setAnalyticsReady] = useState(false);
  const enabled =
    typeof navigator !== 'undefined' &&
    navigator.doNotTrack !== '1' &&
    /^G-[A-Z0-9]+$/.test(measurementId) &&
    !!session?.user;
  const events = useQuery({
    ...conversionQueryOptions,
    queryKey: conversionQueryKey(userId),
    queryFn: () => apiGet<Event[]>('/api/analytics'),
    enabled,
  });
  useEffect(() => {
    if (!enabled) return;
    // Navigation covers checkout/OAuth returns; login also refreshes cached events.
    // Do not restart an initial request already in flight.
    void queryClient.invalidateQueries(
      { queryKey: conversionQueryKey(userId) },
      { cancelRefetch: false }
    );
  }, [enabled, location, userId, queryClient]);
  useEffect(() => {
    const ready = () => setAnalyticsReady(true);
    if (typeof (window as Window & { gtag?: unknown }).gtag === 'function')
      ready();
    window.addEventListener('hotel:analytics-ready', ready);
    return () => window.removeEventListener('hotel:analytics-ready', ready);
  }, []);
  useEffect(() => {
    if (!enabled || !analyticsReady || !events.data?.length) return;
    const target = window as Window & { gtag?: (...args: unknown[]) => void };
    if (!target.gtag) return;
    const acknowledged: string[] = [];
    for (const event of events.data) {
      const key = `hotel-conversion:${event.id}`;
      let sent = sentThisPage.has(event.id);
      try {
        sent ||= localStorage.getItem(key) === 'sent';
      } catch {
        /* In-memory dedup when storage is disabled. */
      }
      if (!sent) {
        // Anonymous event name and random delivery nonce only.
        target.gtag('event', event.name, {
          event_id: event.id,
          send_to: measurementId,
        });
        sentThisPage.add(event.id);
        try {
          localStorage.setItem(key, 'sent');
        } catch {
          /* Analytics stays optional. */
        }
      }
      acknowledged.push(event.id);
    }
    // Queueing in gtag does not guarantee delivery when ads are blocked.
    void apiPost('/api/analytics', { ids: acknowledged }).catch(() => {});
  }, [enabled, analyticsReady, events.data, measurementId]);
  return null;
}
