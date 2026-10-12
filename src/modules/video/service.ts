import { and, desc, eq, isNull } from 'drizzle-orm';

import { AIMediaType, MiniMaxProvider } from '@/core/ai';
import { db } from '@/core/db';
import { archiveVideo, getVideoStorage } from '@/core/storage/video';
import { aiTask, config } from '@/config/db/schema';
import { videoCallbackUrl } from '@/lib/video-callback';

const provider = () =>
  new MiniMaxProvider({ apiKey: process.env.MINIMAX_API_KEY || '' });
export async function startVideo(
  userId: string,
  track: { id: string; description: string },
  images: string[]
) {
  // Check storage before spending provider credits or reserving the daily quota.
  await getVideoStorage();
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
      options: JSON.stringify({ resolution: '768P', duration: 10 }),
    });
  });
  try {
    const result = await provider().generate({
      params: {
        mediaType: AIMediaType.VIDEO,
        model: 'MiniMax-H3',
        prompt,
        options: {
          resolution: '768P',
          duration: 10,
          image_urls: images,
          callback_url: videoCallbackUrl(id),
        },
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
  const saved = task.taskResult ? JSON.parse(task.taskResult) : {};
  if (task.status === 'success' && saved.storage === 'r2')
    return { id, status: 'success', videoUrl: `/api/video/file?id=${id}` };
  if (task.status === 'failed' || task.status === 'canceled')
    return { id, status: task.status };
  if (saved.archiveStartedAt && Date.now() - saved.archiveStartedAt < 180_000)
    return { id, status: 'processing', storageStatus: 'saving' };
  if (saved.retryAfter > Date.now())
    return { id, status: 'processing', storageStatus: 'retrying' };
  if (!task.taskId) return { id, status: task.status };
  const result = await provider().query({ taskId: task.taskId });
  const unchanged = and(
    eq(aiTask.id, id),
    eq(aiTask.status, task.status),
    task.taskResult === null
      ? isNull(aiTask.taskResult)
      : eq(aiTask.taskResult, task.taskResult)
  );
  if (result.taskStatus !== 'success') {
    await db()
      .update(aiTask)
      .set({ status: result.taskStatus })
      .where(unchanged);
    return { id, status: result.taskStatus };
  }
  const sourceUrl = result.taskInfo?.videos?.[0]?.videoUrl;
  if (!sourceUrl) throw new Error('Video output is unavailable.');
  // A persisted lease prevents simultaneous callbacks/polls from downloading twice.
  // Expired leases can be recovered after an interrupted serverless invocation.
  const lease = JSON.stringify({ sourceUrl, archiveStartedAt: Date.now() });
  const claimed = await db()
    .update(aiTask)
    .set({ status: 'processing', taskResult: lease })
    .where(unchanged)
    .returning({ id: aiTask.id });
  if (!claimed.length)
    return { id, status: 'processing', storageStatus: 'saving' };
  try {
    const key = await archiveVideo(id, sourceUrl);
    const videoUrl = `/api/video/file?id=${id}`;
    await db()
      .update(aiTask)
      .set({
        status: 'success',
        taskResult: JSON.stringify({
          videoUrl,
          storage: 'r2',
          key,
          archivedAt: new Date().toISOString(),
        }),
      })
      .where(and(eq(aiTask.id, id), eq(aiTask.taskResult, lease)));
    return { id, status: 'success', videoUrl };
  } catch {
    await db()
      .update(aiTask)
      .set({
        status: 'processing',
        taskResult: JSON.stringify({
          sourceUrl,
          retryAfter: Date.now() + 30_000,
        }),
      })
      .where(and(eq(aiTask.id, id), eq(aiTask.taskResult, lease)));
    return { id, status: 'processing', storageStatus: 'retrying' };
  }
}

/** Callbacks trigger an authenticated provider query; never trust their output URL. */
export async function receiveVideoCallback(id: string) {
  const [task] = await db()
    .select({ userId: aiTask.userId })
    .from(aiTask)
    .where(and(eq(aiTask.id, id), eq(aiTask.provider, 'minimax')))
    .limit(1);
  if (!task) throw new Error('Video task not found.');
  return queryVideo(task.userId, id);
}

export async function getStoredVideoKey(userId: string, id: string) {
  const [task] = await db()
    .select({ status: aiTask.status, result: aiTask.taskResult })
    .from(aiTask)
    .where(
      and(
        eq(aiTask.id, id),
        eq(aiTask.userId, userId),
        eq(aiTask.provider, 'minimax')
      )
    )
    .limit(1);
  if (!task || task.status !== 'success' || !task.result) return null;
  const saved = JSON.parse(task.result);
  return saved.storage === 'r2' && saved.key === `videos/${id}.mp4`
    ? (saved.key as string)
    : null;
}

export async function listVideos(userId: string) {
  const rows = await db()
    .select({
      id: aiTask.id,
      scene: aiTask.scene,
      status: aiTask.status,
      createdAt: aiTask.createdAt,
      taskResult: aiTask.taskResult,
    })
    .from(aiTask)
    .where(and(eq(aiTask.userId, userId), eq(aiTask.provider, 'minimax')))
    .orderBy(desc(aiTask.createdAt))
    .limit(20);
  return rows.map(
    ({
      taskResult,
      ...task
    }: {
      taskResult: string | null;
      id: string;
      scene: string | null;
      status: string;
      createdAt: Date;
    }) => ({
      ...task,
      videoUrl:
        task.status === 'success' &&
        taskResult &&
        JSON.parse(taskResult).storage === 'r2'
          ? `/api/video/file?id=${task.id}`
          : undefined,
    })
  );
}
