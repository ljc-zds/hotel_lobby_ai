import { useEffect, useId, useRef, useState } from 'react';
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

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
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
  onGenerated: (track: HotelTrack, quality: string) => void;
}) {
  const resolutions = [
    {
      quality: '480p',
      credits: 20,
      detail: m['hotel.copy.quick_preview_standard_definition_085'](),
    },
    {
      quality: '720p',
      credits: 45,
      detail: m['hotel.copy.recommended_high_definition_086'](),
    },
    {
      quality: '1080p',
      credits: 80,
      detail: m['hotel.copy.more_detail_full_hd_087'](),
    },
  ];
  const id = useId();
  const [photos, setPhotos] = useState<[Photo | null, Photo | null]>([
    null,
    null,
  ]);
  const photoRef = useRef(photos);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [errors, setErrors] = useState<[string, string]>(['', '']);
  const [quality, setQuality] = useState('720p');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');

  useEffect(
    () => () => {
      photoRef.current.forEach((photo) => {
        if (photo) URL.revokeObjectURL(photo.url);
      });
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  function updatePhotos(next: [Photo | null, Photo | null]) {
    photoRef.current.forEach((photo) => {
      if (photo && !next.some((entry) => entry?.url === photo.url))
        URL.revokeObjectURL(photo.url);
    });
    photoRef.current = next;
    setPhotos(next);
    setResult('');
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

  const resolution = resolutions.find((item) => item.quality === quality)!;
  const ready = Boolean(photos[0] && photos[1] && consent);

  function generate() {
    if (!ready || busy) return;
    const chosenTrack = selected;
    const chosenQuality = quality;
    setBusy(true);
    setResult('');
    timer.current = setTimeout(() => {
      setBusy(false);
      setResult(
        m['hotel.copy.demo_complete_added_to_demo_creations_090']({
          title: chosenTrack.title,
          quality: chosenQuality,
        })
      );
      onGenerated(chosenTrack, chosenQuality);
      timer.current = null;
    }, 1400);
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
            <img src={selected.image} alt="" />
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
            <div className="studio-step-label">
              <span>02</span>
              <div>
                <strong>{m['hotel.copy.choose_video_resolution_107']()}</strong>
                <small>
                  {m[
                    'hotel.copy.compare_the_credits_for_each_resolution_108'
                  ]()}
                </small>
              </div>
            </div>
            <div
              className="resolution-grid"
              role="group"
              aria-label={m['hotel.copy.video_resolution_109']()}
            >
              {resolutions.map((item) => (
                <button
                  key={item.quality}
                  type="button"
                  className={quality === item.quality ? 'active' : ''}
                  aria-pressed={quality === item.quality}
                  disabled={busy}
                  onClick={() => {
                    setQuality(item.quality);
                    setResult('');
                  }}
                >
                  <strong>{item.quality}</strong>
                  <span>
                    {m['hotel.generator.credit_count']({ count: item.credits })}
                  </span>
                  <small>{item.detail}</small>
                </button>
              ))}
            </div>
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
                <span>{m['hotel.copy.template_credits_113']()}</span>
                <strong>
                  {m['hotel.generator.credit_count']({
                    count: resolution.credits,
                  })}
                </strong>
              </div>
              <small>
                {m['hotel.copy.the_demo_does_not_spend_credits_114']()}
              </small>
            </div>
            <button
              className="primary-action"
              type="button"
              disabled={!ready || busy}
              onClick={generate}
            >
              {busy ? (
                <LoaderCircle className="animate-spin" size={18} />
              ) : (
                <Sparkles size={18} />
              )}
              {busy
                ? m['hotel.copy.preparing_demo_115']()
                : m['hotel.copy.run_demo_116']()}
            </button>
            <p className="studio-foot">
              {m['hotel.copy.add_two_photos_and_confirm_permission_117']()}
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
          </div>
        </div>
      </div>
    </section>
  );
}
