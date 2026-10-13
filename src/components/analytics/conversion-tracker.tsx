import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/core/auth/client';
import { apiGet, apiPost } from '@/lib/api-client';

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
  const enabled =
    typeof navigator !== 'undefined' &&
    navigator.doNotTrack !== '1' &&
    /^G-[A-Z0-9]+$/.test(measurementId) &&
    !!session?.user;
  const events = useQuery({
    queryKey: ['conversion-events', session?.user.id],
    queryFn: () => apiGet<Event[]>('/api/analytics'),
    enabled,
    refetchInterval: 10_000,
  });
  useEffect(() => {
    if (!enabled || !events.data?.length) return;
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
  }, [enabled, events.data, measurementId]);
  return null;
}
