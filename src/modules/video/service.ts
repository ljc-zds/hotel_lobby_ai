import { and, desc, eq, gte } from 'drizzle-orm';

import { AIMediaType, MiniMaxProvider } from '@/core/ai';
import { db } from '@/core/db';
import { aiTask, config } from '@/config/db/schema';

const provider = () =>
  new MiniMaxProvider({ apiKey: process.env.MINIMAX_API_KEY || '' });
export async function startVideo(
  userId: string,
  track: { id: string; description: string },
  images: string[]
) {
  const day = new Date().toISOString().slice(0, 10);
  const id = crypto.randomUUID();
  const prompt = `Create a family-safe music performance video with both subjects from reference image 1 and reference image 2 together. Preserve their identities. Scene: ${track.description}. Natural movement, no violence, nudity, sexual content, hateful content or deceptive impersonation. No text or logos.`;
  // Lock a shared quota row before creating a reservation; enforce limits across server instances.
  await db().transaction(async (tx: any) => {
    const name = `video-quota:${day}`;
    await tx.insert(config).values({ name, value: '{}' }).onConflictDoNothing();
    const [row] = await tx
      .select()
      .from(config)
      .where(eq(config.name, name))
      .for('update');
    const quota = JSON.parse(row.value || '{}');
    if ((quota.total || 0) >= 10 || (quota[userId] || 0) >= 2)
      throw new Error('Daily video limit reached. Please try again tomorrow.');
    quota.total = (quota.total || 0) + 1;
    quota[userId] = (quota[userId] || 0) + 1;
    await tx
      .update(config)
      .set({ value: JSON.stringify(quota) })
      .where(eq(config.name, name));
    await tx.insert(aiTask).values({
      id,
      userId,
      mediaType: 'video',
      provider: 'minimax',
      model: 'MiniMax-H3',
      prompt,
      status: 'pending',
      costCredits: 0,
      scene: track.id,
      options: JSON.stringify({ resolution: '768P', duration: 4 }),
    });
  });
  try {
    const result = await provider().generate({
      params: {
        mediaType: AIMediaType.VIDEO,
        model: 'MiniMax-H3',
        prompt,
        options: { resolution: '768P', duration: 4, image_urls: images },
      },
    });
    await db()
      .update(aiTask)
      .set({ taskId: result.taskId, status: 'processing' })
      .where(eq(aiTask.id, id));
    return { id, status: 'processing' };
  } catch (error) {
    await db()
      .update(aiTask)
      .set({ status: 'failed' })
      .where(eq(aiTask.id, id));
    throw error;
  }
}

export async function queryVideo(userId: string, id: string) {
  const [task] = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.id, id),
        eq(aiTask.userId, userId),
        eq(aiTask.provider, 'minimax')
      )
    )
    .limit(1);
  if (!task) throw new Error('Video task not found.');
  if (
    task.status === 'success' ||
    task.status === 'failed' ||
    task.status === 'canceled'
  )
    return {
      id,
      status: task.status,
      videoUrl: task.taskResult
        ? JSON.parse(task.taskResult).videoUrl
        : undefined,
    };
  if (!task.taskId) return { id, status: task.status };
  const result = await provider().query({ taskId: task.taskId });
  const videoUrl = result.taskInfo?.videos?.[0]?.videoUrl;
  await db()
    .update(aiTask)
    .set({
      status: result.taskStatus,
      taskResult: JSON.stringify({ videoUrl }),
    })
    .where(eq(aiTask.id, id));
  return { id, status: result.taskStatus, videoUrl };
}

export async function listVideos(userId: string) {
  const since = new Date(Date.now() - 7 * 86400_000);
  const rows = await db()
    .select({
      id: aiTask.id,
      scene: aiTask.scene,
      status: aiTask.status,
      createdAt: aiTask.createdAt,
    })
    .from(aiTask)
    .where(
      and(
        eq(aiTask.userId, userId),
        eq(aiTask.provider, 'minimax'),
        gte(aiTask.createdAt, since)
      )
    )
    .orderBy(desc(aiTask.createdAt))
    .limit(20);
  return rows;
}
