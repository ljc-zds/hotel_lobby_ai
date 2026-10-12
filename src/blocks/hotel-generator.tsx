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
import { videoGenerationAction } from '@/lib/video-generation-action';
import { m } from '@/paraglide/messages.js';

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
    refetchInterval: (query: { state: { data?: { status: string } } }) =>
      ['pending', 'processing'].includes(query.state.data?.status || 'pending')
        ? 5000
        : false,
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
      className="studio-section container"
      id="video-generator"
      aria-labelledby={`${id}-heading`}
    >
      <div className="studio-shell">
        <div className="studio-heading">
          <div>
            <span className="eyebrow">YOUR DUO. YOUR STAGE.</span>
            <h2 id={`${id}-heading`}>
              {m['hotel.generator.heading']({ app: envConfigs.app_name })}
            </h2>
            <p>{m['hotel.copy.choose_a_scene_add_two_photos_093']()}</p>
            <p className="privacy-note">
              {m['hotel.generator.model_disclosure']()}
            </p>
          </div>
          <div className="selected-template-mini">
            <img src={selected.image} alt="" width={1280} height={720} />
            <div>
              <span>{m['hotel.copy.selected_template_094']()}</span>
              <strong>{selected.title}</strong>
            </div>
          </div>
        </div>
        <div className="studio-body">
          <div className="studio-upload-pane">
            <div className="studio-step-label">
              <span>01</span>
              <div>
                <strong>{m['hotel.copy.upload_your_duo_095']()}</strong>
                <small>
                  {m['hotel.copy.clear_frontfacing_photos_work_best_096']()}
                </small>
              </div>
            </div>
            <div className="upload-grid">
              {([0, 1] as const).map((slot) => (
                <div key={slot} style={{ display: 'contents' }}>
                  {slot === 1 && (
                    <button
                      type="button"
                      className="swap-button"
                      aria-label={m['hotel.copy.swap_the_two_photos_097']()}
                      disabled={busy || (!photos[0] && !photos[1])}
                      onClick={() => {
                        updatePhotos([photos[1], photos[0]]);
                        setErrors([errors[1], errors[0]]);
                      }}
                    >
                      <ArrowLeftRight size={18} />
                    </button>
                  )}
                  <div className={`upload-bay${photos[slot] ? 'filled' : ''}`}>
                    <input
                      className="upload-input"
                      style={{ position: 'absolute', width: 1, height: 1 }}
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
                      className="upload-label"
                      htmlFor={`${id}-photo-${slot}`}
                      tabIndex={busy ? -1 : 0}
                      role="button"
                      aria-label={m[
                        'hotel.copy.add_or_replace_the_photo_for_099'
                      ]({ number: slot + 1 })}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          document
                            .getElementById(`${id}-photo-${slot}`)
                            ?.click();
                        }
                      }}
                    >
                      {photos[slot] && (
                        <img
                          src={photos[slot].url}
                          alt={m[
                            'hotel.copy.local_photo_preview_for_person_100'
                          ]({ number: slot + 1 })}
                        />
                      )}
                      <div className="upload-copy">
                        <span className="field-title">
                          {m['hotel.copy.person_101']()}
                          {slot + 1}
                        </span>
                        <ImagePlus size={30} aria-hidden="true" />
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
                        className="remove-upload"
                        type="button"
                        disabled={busy}
                        aria-label={m[
                          'hotel.copy.remove_the_photo_for_person_105'
                        ]({ number: slot + 1 })}
                        onClick={() => {
                          const next: [Photo | null, Photo | null] = [
                            ...photos,
                          ];
                          next[slot] = null;
                          updatePhotos(next);
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}
                    <span
                      className="upload-error"
                      id={`${id}-error-${slot}`}
                      role="alert"
                    >
                      {errors[slot]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="privacy-note">
              <ShieldCheck size={16} />
              {m['hotel.copy.local_preview_only_photos_are_not_106']()}
            </p>
          </div>
          <div className="studio-settings-pane">
            <label className="consent-row">
              <input
                type="checkbox"
                checked={consent}
                disabled={busy}
                onChange={(event) => setConsent(event.currentTarget.checked)}
              />
              <span className="check-box" aria-hidden="true">
                {consent && <Check size={12} />}
              </span>
              <span>
                {m['hotel.copy.i_have_permission_to_use_these_111']()}
              </span>
            </label>
            <div className="action-summary">
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
              <small>
                {m['hotel.copy.the_demo_does_not_spend_credits_114']()}
              </small>
            </div>
            <button
              className="primary-action"
              type="button"
              disabled={action === 'wait' || action === 'prepare-photos'}
              onClick={generate}
            >
              {busy ? (
                <LoaderCircle className="animate-spin" size={18} />
              ) : (
                <Sparkles size={18} />
              )}
              {busy
                ? m['hotel.copy.preparing_demo_115']()
                : action === 'retry-balance'
                  ? m['video.retry_balance']()
                  : m['hotel.copy.run_demo_116']()}
            </button>
            {session?.user && balanceQuery.isSuccess && !hasCredits && (
              <p className="studio-foot">
                {m['video.insufficient_credits']()}{' '}
                <Link href="/pricing" className="studio-account-action">
                  {m['video.buy_credits']()}
                </Link>
              </p>
            )}
            <p className="studio-foot">
              {m['hotel.copy.add_two_photos_and_confirm_permission_117']()}
              {!session?.user && (
                <Link
                  href="/sign-in?callbackUrl=%2F%23video-generator"
                  className="studio-account-action"
                >
                  {' '}
                  {m['video.sign_in']()}
                </Link>
              )}
            </p>
            <p className="studio-foot">
              <Link href="/terms-of-service">
                {m['hotel.generator.content_standards']()}
              </Link>
              {' · '}
              <a href="mailto:2670855280@qq.com?subject=HotelLobby%20Content%20Report">
                {m['hotel.generator.report_content']()}
              </a>
            </p>
            <p role="status" aria-live="polite" className="privacy-note">
              {result}
            </p>
            {videoUrl && (
              <div className="space-y-3">
                <video
                  src={videoUrl}
                  controls
                  playsInline
                  className="w-full rounded-xl"
                />
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {m['video.open']()}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
