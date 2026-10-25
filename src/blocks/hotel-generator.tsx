import { useEffect, useId, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { HotelTrack } from '@/types/hotel';
import {
  ArrowLeftRight,
  Check,
  ImagePlus,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { VIDEO_CREDIT_COST } from '@/config/video';
import { apiGet, apiPost } from '@/lib/api-client';
import { conversionQueryKey } from '@/lib/hotel-query-policy';
import { cn } from '@/lib/utils';
import { videoGenerationAction } from '@/lib/video-generation-action';
import { m } from '@/paraglide/messages.js';

import '@/styles/raindance-generator.css';
import '@/styles/hotel-trust.css';

interface Photo {
  url: string;
  name: string;
}

export function HotelGenerator({
  selected,
  onGenerated,
}: {
  selected: HotelTrack;
  onGenerated: (track: HotelTrack, quality: string, videoUrl?: string) => void;
}) {
  const id = useId();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const [photos, setPhotos] = useState<[Photo | null, Photo | null]>([
    null,
    null,
  ]);
  const photoRef = useRef(photos);
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const balanceQuery = useQuery({
    queryKey: ['hotel-credit-balance', session?.user?.id],
    queryFn: () => apiGet<{ balance: number }>('/api/video/balance'),
    enabled: !!session?.user,
  });
  const hasCredits = (balanceQuery.data?.balance ?? 0) >= VIDEO_CREDIT_COST;
  const [taskId, setTaskId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const completed = useRef('');
  const creationTrack = useRef(selected);
  const [errors, setErrors] = useState<[string, string]>(['', '']);
  const quality = '768P';
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');

  useEffect(
    () => () => {
      photoRef.current.forEach((photo) => {
        if (photo) URL.revokeObjectURL(photo.url);
      });
    },
    []
  );
  useEffect(() => {
    if (session?.user) {
      try {
        setTaskId(
          localStorage.getItem(`hotel-active-video:${session.user.id}`)
        );
      } catch {}
    } else {
      setTaskId(null);
      setVideoUrl('');
      setBusy(false);
      setResult('');
    }
  }, [session?.user?.id]);
  const task = useQuery<{
    id: string;
    status: string;
    videoUrl?: string;
    storageStatus?: string;
  }>({
    queryKey: ['video-task', session?.user?.id, taskId],
    queryFn: () => apiGet(`/api/video?id=${encodeURIComponent(taskId!)}`),
    enabled: !!taskId && !!session?.user,
    refetchInterval: (query) =>
      query.state.status !== 'error' &&
      ['pending', 'processing'].includes(query.state.data?.status || 'pending')
        ? 5000
        : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 2,
  });
  useEffect(() => {
    if (!task.data || completed.current === task.data.id) return;
    if (['pending', 'processing'].includes(task.data.status)) {
      setBusy(true);
      setResult(
        task.data.storageStatus === 'retrying'
          ? m['video.storage_retry']()
          : task.data.storageStatus === 'saving'
            ? m['video.saving']()
            : m['video.processing']()
      );
      return;
    }
    completed.current = task.data.id;
    void queryClient.invalidateQueries({ queryKey: ['hotel-credit-balance'] });
    setBusy(false);
    if (task.data.status === 'success' && task.data.videoUrl) {
      setVideoUrl(task.data.videoUrl);
      setResult(m['video.complete']());
      onGenerated(creationTrack.current, '768P', task.data.videoUrl);
    } else setResult(m['video.failed']());
    if (session?.user) {
      try {
        localStorage.removeItem(`hotel-active-video:${session.user.id}`);
      } catch {}
    }
  }, [task.data, session?.user?.id, onGenerated]);
  useEffect(() => {
    if (task.error) {
      setBusy(false);
      setResult(m['video.status_error']());
    }
  }, [task.error]);
  const generation = useMutation({
    mutationFn: (images: string[]) =>
      apiPost<{ id: string }>('/api/video', {
        trackId: creationTrack.current.id,
        consent: true,
        images,
      }),
    onSuccess: (data: { id: string }) => {
      void queryClient.invalidateQueries({
        queryKey: conversionQueryKey(session?.user?.id),
      });
      void queryClient.invalidateQueries({
        queryKey: ['hotel-videos', session?.user?.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ['hotel-credit-balance'],
      });
      setTaskId(data.id);
      if (session?.user) {
        try {
          localStorage.setItem(
            `hotel-active-video:${session.user.id}`,
            data.id
          );
        } catch {}
      }
      setResult(m['video.processing']());
    },
    onError: (error: Error) => {
      void queryClient.invalidateQueries({
        queryKey: ['hotel-credit-balance'],
      });
      setBusy(false);
      setResult(error.message);
    },
  });

  function updatePhotos(next: [Photo | null, Photo | null]) {
    photoRef.current.forEach((photo) => {
      if (photo && !next.some((entry) => entry?.url === photo.url))
        URL.revokeObjectURL(photo.url);
    });
    photoRef.current = next;
    setPhotos(next);
    setResult('');
    setVideoUrl('');
  }

  function choosePhoto(file: File | undefined, slot: 0 | 1) {
    if (!file) return;
    const error = !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      ? m['hotel.copy.choose_a_jpg_png_or_webp_088']()
      : file.size > 8 * 1024 * 1024
        ? m['hotel.copy.images_must_be_under_8_mb_089']()
        : '';
    setErrors((previous) => {
      const next: [string, string] = [...previous];
      next[slot] = error;
      return next;
    });
    if (error) return;
    const next: [Photo | null, Photo | null] = [...photoRef.current];
    next[slot] = { name: file.name, url: URL.createObjectURL(file) };
    updatePhotos(next);
  }

  const ready = Boolean(photos[0] && photos[1] && consent);
  const action = videoGenerationAction({
    busy,
    sessionPending,
    signedIn: !!session?.user,
    balancePending: balanceQuery.isPending,
    balanceError: balanceQuery.isError,
    balance: balanceQuery.data?.balance ?? 0,
    ready,
  });

  async function generate() {
    if (action === 'sign-in') {
      router.push('/sign-in?callbackUrl=%2F%23video-generator');
      return;
    }
    if (action === 'retry-balance') {
      void balanceQuery.refetch();
      return;
    }
    if (action === 'buy-credits') {
      router.push('/pricing');
      return;
    }
    if (action !== 'generate') return;
    creationTrack.current = selected;
    setBusy(true);
    setResult('');
    setVideoUrl('');
    try {
      const images = await Promise.all(
        photos.map(
          (photo) =>
            new Promise<string>((resolve, reject) => {
              const image = new Image();
              image.onload = () => {
                const scale = Math.min(
                  1,
                  1024 / Math.max(image.naturalWidth, image.naturalHeight)
                );
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(
                  1,
                  Math.round(image.naturalWidth * scale)
                );
                canvas.height = Math.max(
                  1,
                  Math.round(image.naturalHeight * scale)
                );
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                  reject(new Error(m['video.image_error']()));
                  return;
                }
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                const data = canvas.toDataURL('image/jpeg', 0.82);
                if (data.length > 1_500_000)
                  reject(new Error(m['video.image_error']()));
                else resolve(data);
              };
              image.onerror = () => reject(new Error(m['video.image_error']()));
              image.src = photo!.url;
            })
        )
      );
      generation.mutate(images);
    } catch (error) {
      setBusy(false);
      setResult(error instanceof Error ? error.message : m['video.failed']());
    }
  }

  return (
    <section
      className="rd-generator container"
      id="video-generator"
      aria-labelledby={`${id}-heading`}
    >
      <div className="rd-generator-shell">
        <h2 className="sr-only" id={`${id}-heading`}>
          {m['hotel.generator.heading']({ app: envConfigs.app_name })}
        </h2>
        <header className="rd-generator-heading">
          <div className="rd-generator-stickers">
            <span className="rd-generator-sticker">
              {m['hotel.redesign.two_photos']()}
            </span>
            <span className="rd-generator-sticker">
              {m['hotel.redesign.full_length']()}
            </span>
          </div>
          {session?.user && (
            <Link href="/settings/credits" className="rd-generator-balance">
              {m['settings.credits.balance']()}
              {' · '}
              {balanceQuery.isSuccess
                ? m['hotel.generator.credit_count']({
                    count: balanceQuery.data.balance,
                  })
                : balanceQuery.isError
                  ? '-'
                  : '…'}
            </Link>
          )}
        </header>
        <div className="rd-generator-grid">
          <div className="rd-generator-photos">
            <div className="rd-upload-grid">
              {([0, 1] as const).map((slot) => (
                <div
                  className={cn('rd-upload-bay', {
                    'is-filled': !!photos[slot],
                  })}
                  key={slot}
                >
                  <input
                    className="rd-upload-input"
                    id={`${id}-photo-${slot}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={busy}
                    aria-label={m['hotel.copy.add_a_photo_for_person_098']({
                      number: slot + 1,
                    })}
                    aria-describedby={`${id}-error-${slot}`}
                    onChange={(event) => {
                      choosePhoto(event.currentTarget.files?.[0], slot);
                      event.currentTarget.value = '';
                    }}
                  />
                  <label
                    className="rd-upload-label"
                    htmlFor={`${id}-photo-${slot}`}
                    tabIndex={busy ? -1 : 0}
                    role="button"
                    aria-disabled={busy}
                    aria-label={m[
                      'hotel.copy.add_or_replace_the_photo_for_099'
                    ]({ number: slot + 1 })}
                    onKeyDown={(event) => {
                      if (
                        !busy &&
                        (event.key === 'Enter' || event.key === ' ')
                      ) {
                        event.preventDefault();
                        document.getElementById(`${id}-photo-${slot}`)?.click();
                      }
                    }}
                  >
                    {photos[slot] && (
                      <img
                        src={photos[slot].url}
                        alt={m['hotel.copy.local_photo_preview_for_person_100'](
                          { number: slot + 1 }
                        )}
                      />
                    )}
                    <div className="rd-upload-copy">
                      <ImagePlus size={30} aria-hidden="true" />
                      <span className="rd-upload-person">
                        {m['hotel.copy.person_101']()} {slot + 1}
                      </span>
                      <strong>
                        {photos[slot]?.name ||
                          m['hotel.copy.click_to_add_a_photo_102']()}
                      </strong>
                      <span>
                        {photos[slot]
                          ? m['hotel.copy.click_to_replace_the_photo_103']()
                          : m['hotel.copy.jpg_png_webp_max_8_mb_104']()}
                      </span>
                    </div>
                  </label>
                  {photos[slot] && (
                    <button
                      className="rd-remove-upload"
                      type="button"
                      disabled={busy}
                      aria-label={m[
                        'hotel.copy.remove_the_photo_for_person_105'
                      ]({ number: slot + 1 })}
                      onClick={() => {
                        const next: [Photo | null, Photo | null] = [...photos];
                        next[slot] = null;
                        updatePhotos(next);
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                  <span
                    className="rd-upload-error"
                    id={`${id}-error-${slot}`}
                    role="alert"
                  >
                    {errors[slot]}
                  </span>
                </div>
              ))}
              <button
                type="button"
                className="rd-swap-button"
                aria-label={m['hotel.copy.swap_the_two_photos_097']()}
                disabled={busy || (!photos[0] && !photos[1])}
                onClick={() => {
                  updatePhotos([photos[1], photos[0]]);
                  setErrors([errors[1], errors[0]]);
                }}
              >
                <ArrowLeftRight size={18} />
              </button>
            </div>
          </div>
          <aside className="rd-generator-output rd-generator-card">
            <div className="rd-output-heading">
              <h3>{m['hotel.redesign.output']()}</h3>
              {!videoUrl && (
                <span className="rd-generator-sticker">
                  {m['hotel.redesign.example']()}
                </span>
              )}
            </div>
            <video
              key={videoUrl || selected.id}
              src={videoUrl || selected.video}
              poster={videoUrl ? undefined : selected.image}
              controls
              playsInline
              preload="none"
              aria-label={videoUrl ? m['video.complete']() : selected.title}
            />
            <div className="rd-output-copy">
              <strong>{selected.title}</strong>
              {videoUrl ? (
                <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                  {m['video.open']()}
                </a>
              ) : (
                <>
                  <p>{m['hotel.seo.preview_disclosure']()}</p>
                  <Link href="/#templates">
                    {m['hotel.redesign.template_selected']()} →
                  </Link>
                </>
              )}
            </div>
          </aside>
          <div className="rd-generator-details">
            <div className="rd-generator-card rd-generator-tips">
              <h3>{m['hotel.redesign.best_result']()}</h3>
              <ul>
                {[
                  m['hotel.copy.one_subject_per_photo_033'](),
                  m['hotel.copy.face_forward_or_slightly_to_the_034'](),
                  m[
                    'hotel.copy.use_original_photos_rather_than_screenshots_036'
                  ](),
                ].map((tip) => (
                  <li key={tip}>
                    <Check size={15} aria-hidden="true" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rd-generator-card rd-generator-quality">
              <h3>{m['hotel.redesign.quality']()}</h3>
              <div className="rd-quality-summary">
                <div>
                  <span>{m['hotel.copy.selected_resolution_112']()}</span>
                  <strong>{quality}</strong>
                </div>
                <div>
                  <span>{m['video.duration']()}</span>
                  <strong>15s</strong>
                </div>
                <div>
                  <span>{m['video.cost_label']()}</span>
                  <strong>
                    {m['video.cost']({ credits: VIDEO_CREDIT_COST })}
                  </strong>
                </div>
              </div>
              <p>{m['hotel.generator.model_disclosure']()}</p>
            </div>
          </div>
        </div>
        <div className="rd-generator-bottom">
          <p className="rd-generator-privacy">
            <ShieldCheck size={16} aria-hidden="true" />
            {m['hotel.copy.local_preview_only_photos_are_not_106']()}
          </p>
          <p className="generator-provider-note">
            {m['hotel.trust.provider_notice']()}{' '}
            <a
              href="https://platform.minimax.cn/protocol/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              {m['hotel.trust.provider_privacy']()}
            </a>
            {' / '}
            <a
              href="https://platform.minimax.cn/protocol/user-agreement"
              target="_blank"
              rel="noopener noreferrer"
            >
              {m['hotel.trust.provider_terms']()}
            </a>
          </p>
          <label className="rd-generator-consent">
            <input
              type="checkbox"
              checked={consent}
              disabled={busy}
              onChange={(event) => setConsent(event.currentTarget.checked)}
            />
            <span>{m['hotel.copy.i_have_permission_to_use_these_111']()}</span>
          </label>
          <button
            className="rd-generator-action"
            type="button"
            disabled={
              !hydrated || action === 'wait' || action === 'prepare-photos'
            }
            onClick={generate}
          >
            {busy ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <Sparkles size={18} />
            )}
            {!hydrated
              ? m['common.pricing.processing']()
              : busy
                ? m['hotel.copy.preparing_demo_115']()
                : action === 'retry-balance'
                  ? m['video.retry_balance']()
                  : action === 'sign-in'
                    ? m['video.sign_in']()
                    : action === 'buy-credits'
                      ? m['video.buy_credits']()
                      : m['hotel.copy.run_demo_116']()}
          </button>
          {session?.user && balanceQuery.isSuccess && !hasCredits && (
            <p className="rd-generator-foot">
              {m['video.insufficient_credits']()}{' '}
              <Link href="/pricing">{m['video.buy_credits']()}</Link>
            </p>
          )}
          <p className="rd-generator-foot">
            {m['hotel.copy.add_two_photos_and_confirm_permission_117']()}
            {!session?.user && (
              <Link href="/sign-in?callbackUrl=%2F%23video-generator">
                {' '}
                {m['video.sign_in']()}
              </Link>
            )}
          </p>
          <p className="rd-generator-foot">
            <Link href="/terms-of-service">
              {m['hotel.generator.content_standards']()}
            </Link>
            {' · '}
            <a href="mailto:2670855280@qq.com?subject=HotelLobby%20Content%20Report">
              {m['hotel.generator.report_content']()}
            </a>
          </p>
          <p role="status" aria-live="polite" className="rd-generator-status">
            {result}
          </p>
        </div>
      </div>
    </section>
  );
}
