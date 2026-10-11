import assert from 'node:assert/strict';

import { MiniMaxApiError, MiniMaxProvider } from '../src/core/ai/minimax';
import { AIMediaType, AITaskStatus } from '../src/core/ai/types';

const originalFetch = globalThis.fetch;
const provider = new MiniMaxProvider({ apiKey: 'test-only-key' });
const params = {
  mediaType: AIMediaType.VIDEO,
  prompt: 'Two original cartoon cats dancing.',
};
let requests = 0;
try {
  globalThis.fetch = async (input, init) => {
    requests++;
    assert.equal(String(input), 'https://api.minimax.cn/v2/video_generation');
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, 'MiniMax-H3');
    assert.equal(body.resolution, '768P');
    assert.equal(body.duration, 4);
    assert.equal(body.content[1].role, 'reference_image');
    return Response.json({ task_id: 'test_task' });
  };
  const task = await provider.generate({
    params: {
      ...params,
      options: { image_urls: ['data:image/png;base64,YQ=='] },
    },
  });
  assert.equal(task.taskStatus, AITaskStatus.PENDING);
  assert.equal(task.taskId, 'test_task');
  await assert.rejects(
    provider.generate({ params: { ...params, model: 'MiniMax-M3' } })
  );
  await assert.rejects(
    provider.generate({
      params: {
        ...params,
        options: { image_urls: ['http://127.0.0.1/private'] },
      },
    })
  );
  await assert.rejects(
    provider.generate({
      params: { ...params, options: { resolution: '1080p' } },
    })
  );
  assert.equal(requests, 1, 'Invalid inputs must never reach MiniMax.');

  globalThis.fetch = async () =>
    Response.json(
      { error: { message: 'test-only-key sensitive upstream detail' } },
      { status: 402 }
    );
  await assert.rejects(provider.generate({ params }), (error: unknown) => {
    assert.ok(error instanceof MiniMaxApiError);
    assert.equal(error.status, 402);
    assert.ok(!error.message.includes('test-only-key'));
    return true;
  });

  for (const [status, expected] of [
    ['queued', AITaskStatus.PENDING],
    ['running', AITaskStatus.PROCESSING],
    ['succeeded', AITaskStatus.SUCCESS],
    ['failed', AITaskStatus.FAILED],
    ['cancelled', AITaskStatus.CANCELED],
  ] as const) {
    globalThis.fetch = async (input) => {
      assert.equal(
        String(input),
        'https://api.minimax.cn/v2/query/video_generation/test_task'
      );
      return Response.json({
        task: {
          id: 'test_task',
          status,
          content: { url: 'https://example.com/video.mp4' },
          duration: 4,
        },
      });
    };
    const result = await provider.query({ taskId: 'test_task' });
    assert.equal(result.taskStatus, expected);
    if (status === 'succeeded')
      assert.equal(
        result.taskInfo?.videos?.[0].videoUrl,
        'https://example.com/video.mp4'
      );
  }
  globalThis.fetch = async () =>
    Response.json({
      task: {
        id: 'other_user_task',
        status: 'succeeded',
        content: { url: 'https://example.com/video.mp4' },
      },
    });
  await assert.rejects(provider.query({ taskId: 'test_task' }));
  console.log(
    'MiniMax provider: input checks, 402 handling, status polling and response checks passed.'
  );
} finally {
  globalThis.fetch = originalFetch;
}
