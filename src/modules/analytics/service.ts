import { and, eq, like } from 'drizzle-orm';

import { db } from '@/core/db';
import { config } from '@/config/db/schema';
import {
  conversionPrefix,
  type ConversionEvent,
} from '@/lib/conversion-events';

export async function pendingConversions(userId: string) {
  const rows = await db()
    .select()
    .from(config)
    .where(
      and(
        like(config.name, conversionPrefix(userId) + '%'),
        like(config.value, '%"deliveredAt":null%')
      )
    )
    .limit(100);
  return rows
    .map(
      (row: { value: string | null }) =>
        JSON.parse(row.value || '{}') as ConversionEvent
    )
    .filter((event) => !event.deliveredAt);
}
export async function acknowledgeConversions(userId: string, ids: string[]) {
  const rows = await db()
    .select()
    .from(config)
    .where(
      and(
        like(config.name, conversionPrefix(userId) + '%'),
        like(config.value, '%"deliveredAt":null%')
      )
    )
    .limit(100);
  for (const row of rows) {
    const event = JSON.parse(row.value || '{}') as ConversionEvent;
    if (!ids.includes(event.id) || event.deliveredAt) continue;
    event.deliveredAt = new Date().toISOString();
    await db()
      .update(config)
      .set({ value: JSON.stringify(event) })
      .where(and(eq(config.name, row.name), eq(config.value, row.value)));
  }
}
