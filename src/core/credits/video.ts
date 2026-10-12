import { and, asc, eq, gt, inArray, isNull, or, sql, sum } from 'drizzle-orm';

import { db } from '@/core/db';
import { credit, user } from '@/config/db/schema';
import { VIDEO_CREDIT_COST } from '@/config/video';
import { getSnowId, getUuid } from '@/lib/hash';

export class InsufficientVideoCredits extends Error {
  constructor() {
    super(
      'Insufficient paid credits. Each video costs 50 credits. Please purchase a credit pack.'
    );
  }
}

function paidCredits(userId: string) {
  return and(
    eq(credit.userId, userId),
    eq(credit.transactionType, 'grant'),
    eq(credit.status, 'active'),
    isNull(credit.deletedAt),
    inArray(credit.transactionScene, ['payment', 'subscription', 'renewal']),
    gt(credit.remainingCredits, 0),
    or(isNull(credit.expiresAt), gt(credit.expiresAt, new Date()))
  );
}

export async function paidVideoBalance(userId: string) {
  const [row] = await db()
    .select({ total: sum(credit.remainingCredits) })
    .from(credit)
    .where(paidCredits(userId));
  return Number(row?.total || 0);
}

/** Runs in the same transaction as task creation. A user lock serializes spends. */
export async function reserveVideoCredits(
  tx: any,
  userId: string,
  taskId: string
) {
  const [owner] = await tx
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, userId))
    .for('update');
  if (!owner) throw new InsufficientVideoCredits();
  const grants = await tx
    .select()
    .from(credit)
    .where(paidCredits(userId))
    .orderBy(asc(credit.expiresAt), asc(credit.createdAt), asc(credit.id))
    .for('update');
  if (
    grants.reduce(
      (total: number, item: { remainingCredits: number }) =>
        total + item.remainingCredits,
      0
    ) < VIDEO_CREDIT_COST
  )
    throw new InsufficientVideoCredits();
  let remaining = VIDEO_CREDIT_COST;
  const consumed: { creditId: string; creditsConsumed: number }[] = [];
  for (const grant of grants) {
    if (!remaining) break;
    const amount = Math.min(remaining, grant.remainingCredits);
    await tx
      .update(credit)
      .set({ remainingCredits: grant.remainingCredits - amount })
      .where(eq(credit.id, grant.id));
    consumed.push({ creditId: grant.id, creditsConsumed: amount });
    remaining -= amount;
  }
  const id = getUuid();
  await tx.insert(credit).values({
    id,
    userId,
    transactionNo: getSnowId(),
    transactionType: 'consume',
    transactionScene: 'video',
    credits: -VIDEO_CREDIT_COST,
    remainingCredits: 0,
    status: 'active',
    description: 'MiniMax-H3 15-second video',
    consumedDetail: JSON.stringify(consumed),
    metadata: JSON.stringify({ taskId }),
  });
  return id;
}

/** Lock the consumption record so duplicate callbacks cannot refund twice. */
export async function refundVideoCredits(
  tx: any,
  userId: string,
  id: string | null
) {
  if (!id) return;
  await tx
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, userId))
    .for('update');
  const [record] = await tx
    .select()
    .from(credit)
    .where(
      and(
        eq(credit.id, id),
        eq(credit.userId, userId),
        eq(credit.transactionType, 'consume'),
        eq(credit.transactionScene, 'video'),
        eq(credit.status, 'active')
      )
    )
    .for('update');
  if (!record?.consumedDetail) return;
  const items: { creditId: string; creditsConsumed: number }[] = JSON.parse(
    record.consumedDetail
  );
  for (const item of items) {
    await tx
      .update(credit)
      .set({
        remainingCredits: sql`${credit.remainingCredits} + ${item.creditsConsumed}`,
      })
      .where(
        and(
          eq(credit.id, item.creditId),
          eq(credit.userId, userId),
          eq(credit.transactionType, 'grant')
        )
      );
  }
  await tx.update(credit).set({ status: 'deleted' }).where(eq(credit.id, id));
}
