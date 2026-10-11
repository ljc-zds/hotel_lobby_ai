import { createHmac } from 'node:crypto';
import { and, eq, gte, like, lt } from 'drizzle-orm';

import { db } from '@/core/db';
import { config } from '@/config/db/schema';

type Daily = {
  pv: number;
  visitors: string[];
  events: string[];
  pages: Record<string, number>;
};
const dateKey = (timestamp = Date.now()) =>
  new Date(timestamp + 8 * 3600_000).toISOString().slice(0, 10);
export async function recordVisit(
  visitor: string,
  event: string,
  path: string
) {
  if (!process.env.AUTH_SECRET) return;
  const name = `traffic:${dateKey()}`;
  const hash = createHmac('sha256', process.env.AUTH_SECRET)
    .update(visitor)
    .digest('hex');
  await db().transaction(async (tx: any) => {
    await tx
      .insert(config)
      .values({
        name,
        value: JSON.stringify({ pv: 0, visitors: [], events: [], pages: {} }),
      })
      .onConflictDoNothing();
    const [row] = await tx
      .select()
      .from(config)
      .where(eq(config.name, name))
      .for('update');
    const daily: Daily = JSON.parse(row.value);
    if (daily.events.includes(event) || daily.pv >= 50_000) return;
    daily.events.push(event);
    daily.pv++;
    if (!daily.visitors.includes(hash)) daily.visitors.push(hash);
    daily.pages[path] = (daily.pages[path] || 0) + 1;
    await tx
      .update(config)
      .set({ value: JSON.stringify(daily) })
      .where(eq(config.name, name));
  });
  // Retain at most 90 days of these pseudonymous statistics.
  await db()
    .delete(config)
    .where(
      and(
        like(config.name, 'traffic:%'),
        lt(config.name, `traffic:${dateKey(Date.now() - 90 * 86400_000)}`)
      )
    );
}
export async function trafficReport() {
  const rows = await db()
    .select()
    .from(config)
    .where(
      and(
        like(config.name, 'traffic:%'),
        gte(config.name, `traffic:${dateKey(Date.now() - 29 * 86400_000)}`)
      )
    );
  const days = rows
    .map((row: any) => ({
      date: row.name.slice(8),
      ...(JSON.parse(row.value || '{}') as Daily),
    }))
    .sort((a: any, b: any) => a.date.localeCompare(b.date));
  const summary = (count: number) => {
    const selected = days.filter(
      (d: any) => d.date >= dateKey(Date.now() - (count - 1) * 86400_000)
    );
    return {
      pv: selected.reduce((n: number, d: any) => n + d.pv, 0),
      uv: new Set(selected.flatMap((d: any) => d.visitors)).size,
    };
  };
  return {
    today: summary(1),
    week: summary(7),
    month: summary(30),
    days: days.map((d: any) => ({
      date: d.date,
      pv: d.pv,
      uv: d.visitors.length,
    })),
  };
}
