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

import { envConfigs } from '@/config';

interface Photo {
  url: string;
  name: string;
}
const resolutions = [
  { quality: '480p', credits: 20, detail: '快速预览 · 标准清晰度' },
  { quality: '720p', credits: 45, detail: '推荐选择 · 高清画面' },
  { quality: '1080p', credits: 80, detail: '细节优先 · 全高清画面' },
];

export function HotelGenerator({
  selected,
  onGenerated,
}: {
  selected: HotelTrack;
  onGenerated: (track: HotelTrack, quality: string) => void;
}) {
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
      ? '请选择 JPG、PNG 或 WebP 图片。'
      : file.size > 8 * 1024 * 1024
        ? '图片不能超过 8 MB，请选择较小的文件。'
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
        `演示完成：${chosenTrack.title} · ${chosenQuality}。已添加到演示作品；没有生成 AI 视频，也没有上传照片。`
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
              将你的组合置于 {envConfigs.app_name} 画面中
            </h2>
            <p>
              选好场景，添加两张照片，预览你的双人组合。当前为交互演示，不会生成
              AI 视频。
            </p>
          </div>
          <div className="selected-template-mini">
            <img src={selected.image} alt="" />
            <div>
              <span>已选择模板</span>
              <strong>{selected.title}</strong>
            </div>
          </div>
        </div>
        <div className="studio-body">
          <div className="studio-upload-pane">
            <div className="studio-step-label">
              <span>01</span>
              <div>
                <strong>上传你的双人组合</strong>
                <small>清晰正面照片，效果更佳</small>
              </div>
            </div>
            <div className="upload-grid">
              {([0, 1] as const).map((slot) => (
                <div key={slot} style={{ display: 'contents' }}>
                  {slot === 1 && (
                    <button
                      type="button"
                      className="swap-button"
                      aria-label="交换两张照片"
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
                      aria-label={`添加人物 ${slot + 1} 的照片`}
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
                      aria-label={`添加或更换人物 ${slot + 1} 的照片`}
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
                          alt={`人物 ${slot + 1} 的本地照片预览`}
                        />
                      )}
                      <div className="upload-copy">
                        <span className="field-title">人物 {slot + 1}</span>
                        <ImagePlus size={30} aria-hidden="true" />
                        <strong>{photos[slot]?.name || '点击添加照片'}</strong>
                        <span>
                          {photos[slot]
                            ? '点击更换照片'
                            : 'JPG / PNG / WEBP · 最大 8 MB'}
                        </span>
                      </div>
                    </label>
                    {photos[slot] && (
                      <button
                        className="remove-upload"
                        type="button"
                        disabled={busy}
                        aria-label={`移除人物 ${slot + 1} 的照片`}
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
              本地预览，照片不会上传。仅保存在当前页面，关闭页面即释放。
            </p>
          </div>
          <div className="studio-settings-pane">
            <div className="studio-step-label">
              <span>02</span>
              <div>
                <strong>选择视频分辨率</strong>
                <small>查看不同清晰度对应的积分</small>
              </div>
            </div>
            <div
              className="resolution-grid"
              role="group"
              aria-label="视频分辨率"
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
                  <span>{item.credits} 积分</span>
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
              <span>我确认拥有照片使用权，并已获得照片中人物的同意。</span>
            </label>
            <div className="action-summary">
              <div>
                <span>已选分辨率</span>
                <strong>{quality}</strong>
              </div>
              <div>
                <span>模板积分</span>
                <strong>{resolution.credits} 积分</strong>
              </div>
              <small>演示不扣积分，不创建真实订单。</small>
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
              {busy ? '正在准备演示…' : '演示生成'}
            </button>
            <p className="studio-foot">
              请先添加两张照片并勾选授权确认。此模板仅演示界面流程。
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
