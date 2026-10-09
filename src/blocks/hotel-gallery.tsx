import { useEffect, useId, useRef, useState } from 'react';
import type { HotelTrack } from '@/types/hotel';
import { ArrowRight, Check, Play, Volume2, X } from 'lucide-react';
import { createPortal } from 'react-dom';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { getHotelTracks } from '@/blocks/hotel-tracks';

interface HotelGalleryProps {
  selected: HotelTrack;
  onSelect: (track: HotelTrack) => void;
  title?: string;
  items?: HotelTrack[];
}

export function HotelGallery({
  selected,
  onSelect,
  title,
  items = getHotelTracks(),
}: HotelGalleryProps) {
  const categories = [
    { id: 'all', label: m['hotel.copy.all_templates_118']() },
    { id: 'people', label: m['hotel.copy.person_101']() },
    { id: 'culture', label: m['hotel.copy.culture_119']() },
    { id: 'animals', label: m['hotel.copy.animals_120']() },
  ];
  const [category, setCategory] = useState('all');
  const [preview, setPreview] = useState<HotelTrack | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const headingId = useId();
  const previewHeadingId = useId();

  useEffect(() => {
    if (!preview) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const trigger = triggerRef.current;
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setPreview(null);
      }
      if (event.key !== 'Tab') return;
      const controls = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), video[controls], [tabindex="0"]'
        ) ?? []
      );
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      trigger?.focus({ preventScroll: true });
    };
  }, [preview]);

  function choose(track: HotelTrack) {
    onSelect(track);
    setPreview(null);
    requestAnimationFrame(() => {
      document.getElementById('video-generator')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      });
    });
  }

  return (
    <section
      className="template-section container"
      id="templates"
      aria-labelledby={headingId}
    >
      <div className="section-heading-row">
        <div>
          <span className="eyebrow">02 · PICK A TRACK</span>
          <h2 id={headingId}>
            {title ??
              m['hotel.copy.choose_a_template_121']({
                app: envConfigs.app_name,
              })}
          </h2>
        </div>
        <div
          className="filter-row"
          role="group"
          aria-label={m['hotel.copy.template_categories_122']()}
        >
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`filter${category === item.id ? 'active' : ''}`}
              aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <p className="template-audio-note">
        <Volume2 size={16} aria-hidden="true" />
        {m['hotel.copy.preview_and_choose_your_duos_performance_123']()}
      </p>
      <div className="template-grid">
        {items
          .filter((track) => category === 'all' || track.category === category)
          .map((track) => (
            <article
              key={track.id}
              className={`template-card${selected.id === track.id ? 'selected' : ''}`}
            >
              <div className="template-media">
                <button
                  type="button"
                  className="template-preview-target"
                  aria-label={m['hotel.copy.preview_124']({
                    title: track.title,
                  })}
                  onClick={(event) => {
                    triggerRef.current = event.currentTarget;
                    setPreview(track);
                  }}
                >
                  <img
                    src={track.image}
                    alt={track.title}
                    loading="lazy"
                    width={640}
                    height={360}
                  />
                  <span className="room-number">
                    TRACK {String(items.indexOf(track) + 1).padStart(2, '0')}
                  </span>
                  <span className="preview-chip">
                    <Play size={10} aria-hidden="true" />
                    {m['hotel.copy.preview_125']()}
                  </span>
                  <span className="landscape-play">
                    <Play size={20} fill="currentColor" aria-hidden="true" />
                  </span>
                </button>
                {selected.id === track.id && (
                  <span className="selected-chip">
                    <Check size={11} aria-hidden="true" />
                    {m['hotel.copy.selected_126']()}
                  </span>
                )}
                <button
                  type="button"
                  className="template-create-cta"
                  onClick={() => choose(track)}
                  aria-label={m['hotel.copy.create_with_127']({
                    title: track.title,
                  })}
                >
                  {m['hotel.copy.create_this_style_128']()}
                  <ArrowRight size={12} aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                className="template-copy"
                onClick={() => choose(track)}
                aria-pressed={selected.id === track.id}
              >
                <strong>{track.title}</strong>
                <span>{track.description}</span>
                <small>
                  {m['hotel.copy.choose_this_template_129']()}
                  <ArrowRight size={12} aria-hidden="true" />
                </small>
              </button>
            </article>
          ))}
      </div>
      {preview &&
        createPortal(
          <div
            className="template-modal studio-theme-modal"
            onClick={(event) => {
              if (event.target === event.currentTarget) setPreview(null);
            }}
          >
            <div
              className="template-modal-card"
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={previewHeadingId}
            >
              <button
                className="modal-close"
                type="button"
                aria-label={m['hotel.copy.close_preview_130']()}
                onClick={() => setPreview(null)}
              >
                <X size={20} />
              </button>
              <div className="landscape-player">
                {preview.id === 'orange-street-duo' ? (
                  <video
                    src="/reference/orange-street-duo-v6.mp4"
                    poster={preview.image}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={preview.image}
                    alt={preview.title}
                    width={1280}
                    height={720}
                  />
                )}
              </div>
              <div className="template-modal-copy">
                <div>
                  <small>
                    {preview.id === 'orange-street-duo'
                      ? 'VIDEO PREVIEW'
                      : 'TEMPLATE POSTER'}
                  </small>
                  <h3 id={previewHeadingId}>{preview.title}</h3>
                  <p>{preview.description}</p>
                  {preview.id !== 'orange-street-duo' && (
                    <p>
                      {m['hotel.copy.video_preview_is_not_available_for_131']()}
                    </p>
                  )}
                </div>
                <button
                  className="hero-primary"
                  type="button"
                  onClick={() => choose(preview)}
                >
                  {m['hotel.copy.create_this_style_128']()}
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
