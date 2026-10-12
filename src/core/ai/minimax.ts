import {
  AIMediaType,
  AITaskStatus,
  type AIConfigs,
  type AIGenerateParams,
  type AIProvider,
  type AITaskResult,
} from './types';

export interface MiniMaxConfigs extends AIConfigs {
  apiKey: string;
}

export class MiniMaxApiError extends Error {
  constructor(public readonly status: number) {
    super(
      status === 402
        ? 'MiniMax H3 has insufficient balance or video quota.'
        : status === 401 || status === 403
          ? 'MiniMax video API authentication or permission failed.'
          : status === 422
            ? 'MiniMax rejected the request for content safety.'
            : status === 429
              ? 'MiniMax video API rate limit reached.'
              : 'MiniMax video API request failed.'
    );
    this.name = 'MiniMaxApiError';
  }
}

/** Official Video V2 API. M3 is a text model; video requests use H3. */
export class MiniMaxProvider implements AIProvider {
  readonly name = 'minimax';

  constructor(public configs: MiniMaxConfigs) {}

  private async request(path: string, body?: unknown) {
    if (!this.configs.apiKey)
      throw new Error('MiniMax API key is not configured.');
    const response = await fetch(`https://api.minimax.cn${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${this.configs.apiKey}`,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) throw new MiniMaxApiError(response.status);
    const data = await response.json();
    if (data.error)
      throw new MiniMaxApiError(Number(data.error.http_code) || 502);
    return data;
  }

  async generate({
    params,
  }: {
    params: AIGenerateParams;
  }): Promise<AITaskResult> {
    if (params.mediaType !== AIMediaType.VIDEO) {
      throw new Error('MiniMax H3 supports video generation only.');
    }
    const model = params.model || 'MiniMax-H3';
    if (model !== 'MiniMax-H3' && model !== 'MiniMax-H3-Max') {
      throw new Error('Use MiniMax-H3 or MiniMax-H3-Max for video generation.');
    }
    const prompt = params.prompt?.trim();
    if (!prompt || prompt.length > 5_000)
      throw new Error('Invalid video prompt.');
    const options = params.options || {};
    const resolution = options.resolution || '768P';
    const resolutions =
      model === 'MiniMax-H3' ? ['768P', '2K'] : ['480P', '768P'];
    const duration = options.duration ?? (model === 'MiniMax-H3' ? 15 : 5);
    if (
      !resolutions.includes(resolution) ||
      !Number.isInteger(duration) ||
      duration < (model === 'MiniMax-H3' ? 4 : 5) ||
      duration > 15
    ) {
      throw new Error('Invalid video resolution or duration for this model.');
    }
    const images: unknown = options.image_urls || [];
    if (
      !Array.isArray(images) ||
      images.length > 9 ||
      images.some(
        (image) =>
          typeof image !== 'string' ||
          image.length > 12_000_000 ||
          !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
            image
          )
      )
    ) {
      throw new Error('Reference images must be supported base64 image data.');
    }
    const content = [
      { type: 'text', text: prompt },
      ...images.map((url) => ({
        type: 'image_url',
        image_url: { url },
        role: 'reference_image',
      })),
    ];
    const data = await this.request('/v2/video_generation', {
      model,
      content,
      resolution,
      duration,
      ratio: '16:9',
      ...(options.callback_url ? { callback_url: options.callback_url } : {}),
    });
    if (typeof data.task_id !== 'string' || !data.task_id) {
      throw new Error('MiniMax did not return a video task ID.');
    }
    return { taskId: data.task_id, taskStatus: AITaskStatus.PENDING };
  }

  async query({ taskId }: { taskId: string }): Promise<AITaskResult> {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(taskId))
      throw new Error('Invalid video task ID.');
    const { task } = await this.request(
      `/v2/query/video_generation/${encodeURIComponent(taskId)}`
    );
    const statuses: Record<string, AITaskStatus> = {
      queued: AITaskStatus.PENDING,
      running: AITaskStatus.PROCESSING,
      succeeded: AITaskStatus.SUCCESS,
      failed: AITaskStatus.FAILED,
      cancelled: AITaskStatus.CANCELED,
    };
    if (!task || task.id !== taskId || !statuses[task.status]) {
      throw new Error('Invalid MiniMax video task response.');
    }
    const videoUrl = task.content?.url;
    if (
      task.status === 'succeeded' &&
      (typeof videoUrl !== 'string' || !videoUrl.startsWith('https://'))
    ) {
      throw new Error('MiniMax did not return a valid video URL.');
    }
    return {
      taskId,
      taskStatus: statuses[task.status],
      taskInfo: {
        status: task.status,
        ...(task.status === 'succeeded'
          ? { videos: [{ videoUrl, duration: task.duration }] }
          : {}),
        ...(task.status === 'failed'
          ? { errorMessage: 'MiniMax video generation failed.' }
          : {}),
      },
    };
  }
}
