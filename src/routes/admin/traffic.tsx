import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { apiGet } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';

type Funnel = { signups: number; videos: number; payments: number };
type Report = {
  funnel: { today: Funnel; week: Funnel; month: Funnel };
  today: { pv: number; uv: number };
  week: { pv: number; uv: number };
  month: { pv: number; uv: number };
  days: { date: string; pv: number; uv: number }[];
};
function TrafficPage() {
  const query = useQuery({
    queryKey: ['admin-traffic'],
    queryFn: () => apiGet<Report>('/api/admin/traffic'),
    // Refresh on user activity; an unattended dashboard must not keep Neon awake.
    refetchInterval: false,
    refetchOnWindowFocus: true,
  });
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{m['traffic.title']()}</h1>
      <p className="text-muted-foreground">{m['traffic.description']()}</p>
      <button
        className="rounded border px-4 py-2"
        onClick={() => query.refetch()}
      >
        {m['traffic.refresh']()}
      </button>
      {query.isPending ? (
        <p>{m['traffic.loading']()}</p>
      ) : query.error ? (
        <p role="alert">{m['traffic.error']()}</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {(['today', 'week', 'month'] as const).map((key, index) => (
              <article key={key} className="rounded-xl border p-5">
                <h2>
                  {
                    [
                      m['traffic.today'](),
                      m['traffic.week'](),
                      m['traffic.month'](),
                    ][index]
                  }
                </h2>
                <p className="mt-2 text-3xl font-bold">
                  {query.data?.[key].uv ?? 0}
                </p>
                <p>{m['traffic.visitors']()}</p>
                <p className="mt-3">
                  {m['traffic.pageviews']()}: {query.data?.[key].pv ?? 0}
                </p>
              </article>
            ))}
          </div>
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {m['traffic.funnel_title']()}
            </h2>
            <p className="text-muted-foreground">
              {m['traffic.funnel_description']()}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th>{m['traffic.period']()}</th>
                    <th>{m['traffic.signups']()}</th>
                    <th>{m['traffic.videos']()}</th>
                    <th>{m['traffic.payments']()}</th>
                  </tr>
                </thead>
                <tbody>
                  {(['today', 'week', 'month'] as const).map((period, i) => (
                    <tr key={period} className="border-t">
                      <td className="py-3">
                        {
                          [
                            m['traffic.today'](),
                            m['traffic.week'](),
                            m['traffic.month'](),
                          ][i]
                        }
                      </td>
                      <td>{query.data?.funnel?.[period].signups ?? 0}</td>
                      <td>{query.data?.funnel?.[period].videos ?? 0}</td>
                      <td>{query.data?.funnel?.[period].payments ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="p-3">{m['traffic.date']()}</th>
                  <th>{m['traffic.visitors']()}</th>
                  <th>{m['traffic.pageviews']()}</th>
                </tr>
              </thead>
              <tbody>
                {query.data?.days
                  .slice()
                  .reverse()
                  .map((day) => (
                    <tr key={day.date} className="border-t">
                      <td className="p-3">{day.date}</td>
                      <td>{day.uv}</td>
                      <td>{day.pv}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!query.data?.days.length && <p>{m['traffic.empty']()}</p>}
        </>
      )}
      <a
        href="https://analytics.google.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Google Analytics
      </a>
    </div>
  );
}
export const Route = createFileRoute('/admin/traffic')({
  component: TrafficPage,
  head: () => ({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] }),
});
