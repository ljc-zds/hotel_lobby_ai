import { useEffect, useRef, useState } from 'react';
import type { HotelTrack } from '@/types/hotel';
import { ArrowRight, Pause, Play } from 'lucide-react';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';

/** Product footage is decorative here; template previews retain full controls. */
export function HotelCinemaHero({ track }: { track: HotelTrack }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const manuallyPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [playbackFailed, setPlaybackFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stopForReducedMotion = () => {
      if (reducedMotion.matches) video.pause();
    };
    reducedMotion.addEventListener('change', stopForReducedMotion);
    const observer = new IntersectionObserver(
      ([entry]) => {
        const saveData = (
          navigator as Navigator & { connection?: { saveData?: boolean } }
        ).connection?.saveData;
        if (!entry.isIntersecting) video.pause();
        else if (
          !reducedMotion.matches &&
          !manuallyPaused.current &&
          !saveData
        ) {
          void video.play().catch(() => setPlaying(false));
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(video);
    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener('change', stopForReducedMotion);
      video.pause();
    };
  }, []);

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      manuallyPaused.current = true;
      video.pause();
    } else {
      try {
        manuallyPaused.current = false;
        await video.play();
      } catch {
        setPlaying(false);
        setPlaybackFailed(true);
      }
    }
  }

  return (
    <section className="cinema-hero" aria-labelledby="cinema-title">
      <video
        className="cinema-footage"
        ref={videoRef}
        src={track.video}
        poster={track.image}
        muted
        playsInline
        loop
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        onPlay={() => {
          setPlaying(true);
          setPlaybackFailed(false);
        }}
        onPause={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setPlaybackFailed(true);
        }}
      />
      <div className="cinema-shade" />
      <div className="cinema-content">
        <p className="cinema-intro">
          {envConfigs.app_name} / {m['hotel.cinema.studio']()}
        </p>
        <h1 id="cinema-title">
          {m['hotel.cinema.title_first']()}
          <br />
          <span>{m['hotel.cinema.title_second']()}</span>
        </h1>
        <p className="cinema-description">{m['hotel.cinema.description']()}</p>
        <div className="cinema-actions">
          <a href="#video-generator" className="cinema-primary">
            {m['hotel.copy.make_a_video_013']()}
            <ArrowRight size={18} />
          </a>
          <a href="#actual-example" className="cinema-secondary">
            {m['hotel.proof.hero_cta']()}
          </a>
        </div>
      </div>
      <div className="cinema-footnote">
        <span>{m['hotel.cinema.reference_note']()}</span>
        <button
          type="button"
          onClick={togglePlayback}
          disabled={playbackFailed}
          aria-label={
            playing ? m['hotel.cinema.pause']() : m['hotel.cinema.play']()
          }
          aria-pressed={playing}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
          {playing ? m['hotel.cinema.pause']() : m['hotel.cinema.play']()}
        </button>
      </div>
    </section>
  );
}
