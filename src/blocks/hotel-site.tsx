import { useEffect, useState, type ReactNode } from 'react';
import type { HotelTrack } from '@/types/hotel';
import {
  ArrowRight,
  Check,
  Coins,
  Film,
  ImagePlus,
  Mail,
  Menu,
  Mic,
  Play,
  UserRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { HotelGallery } from '@/blocks/hotel-gallery';
import { HotelGenerator } from '@/blocks/hotel-generator';
import { getHotelTracks } from '@/blocks/hotel-tracks';
import { BuiltWithShipAny } from '@/components/built-with-shipany';
import { LocaleSelector } from '@/components/locale-selector';

import '@/styles/hotel.css';
import '@/styles/studio-theme.css';

type DemoOrder = { id: string; track: string; quality: string; date: string };
export function HotelSite({
  page = 'home',
  children,
}: {
  page?: 'home' | 'pricing' | 'orders' | 'guide' | 'content';
  children?: ReactNode;
}) {
  const tracks = getHotelTracks();
  const { data: session } = useSession();
  const [selected, setSelected] = useState(tracks[0]);
  const [menu, setMenu] = useState(false);
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [credits, setCredits] = useState(0);
  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem('hotel-demo-orders') || '[]'
      );
      if (Array.isArray(stored))
        setOrders(
          stored
            .map((x) => ({
              ...x,
              track:
                getHotelTracks('zh').find((t) => t.title === x.track)?.id ||
                getHotelTracks('en').find((t) => t.title === x.track)?.id ||
                x.track,
            }))
            .filter(
              (x) =>
                typeof x.id === 'string' &&
                typeof x.track === 'string' &&
                typeof x.quality === 'string' &&
                typeof x.date === 'string'
            )
        );
      setCredits(Number(localStorage.getItem('hotel-demo-credits')) || 0);
    } catch {
      /* Ignore outdated demo data. */
    }
  }, []);
  function generated(track: HotelTrack, quality: string) {
    const next = [
      {
        id: crypto.randomUUID(),
        track: track.id,
        quality,
        date: new Date().toISOString(),
      },
      ...orders,
    ].slice(0, 20);
    setOrders(next);
    try {
      localStorage.setItem('hotel-demo-orders', JSON.stringify(next));
    } catch {
      toast.info(m['hotel.copy.your_browser_could_not_save_the_001']());
    }
  }
  function addCredits(amount: number) {
    const next = credits + amount;
    setCredits(next);
    try {
      localStorage.setItem('hotel-demo-credits', String(next));
    } catch {
      /* Demo still works without storage. */
    }
    toast.success(
      m['hotel.copy.added_demo_credits_no_payment_was_002']({ amount })
    );
  }
  return (
    <div className="hotel-site">
      <div className="announcement-bar">
        {m['hotel.copy.hotel_lobby_ai_14_music_templates_003']()}
      </div>
      <header className="site-header">
        <div className="header-inner container">
          <Link
            href="/"
            className="brand"
            aria-label={m['hotel.copy.home_004']()}
          >
            <span className="brand-mark-wrap">
              <img
                className="brand-mark"
                src="/reference/hotellobby-mark-clean.webp"
                alt=""
              />
            </span>
            <span>
              {envConfigs.app_name.replace(/\.ai$/, '')}
              <span>.ai</span>
            </span>
          </Link>
          <nav
            className={`hotel-nav ${menu ? 'is-open' : ''}`}
            aria-label={m['hotel.copy.main_navigation_005']()}
            onClick={() => setMenu(false)}
          >
            <Link href="/#video-generator">{m['hotel.nav.generator']()}</Link>
            <Link href="/#templates">{m['hotel.nav.templates']()}</Link>
            <Link href="/hotel-lobby-ai-prompts">
              {m['hotel.nav.prompts']()}
            </Link>
            <Link href="/pricing">{m['hotel.nav.pricing']()}</Link>
            <Link href="/what-is-hotel-lobby-ai">{m['hotel.nav.what']()}</Link>
            <Link href="/blog">{m['hotel.nav.blog']()}</Link>
            <Link href="/about">{m['hotel.nav.about']()}</Link>
            <Link href="/contact">{m['hotel.nav.contact']()}</Link>
          </nav>
          <div className="hotel-header-actions">
            <LocaleSelector variant="pill" className="hotel-language" />
            <Link
              href="/orders"
              className="hotel-login hotel-credit-badge"
              aria-label={`${m['hotel.nav.credits']()}: ${credits}`}
            >
              <Coins size={16} />
              <span>{credits}</span>
            </Link>
            <Link
              href="/orders"
              className="hotel-login hotel-videos"
              aria-label={m['hotel.nav.videos']()}
            >
              <Film size={16} />
              <span>{m['hotel.nav.videos']()}</span>
            </Link>
            <Link
              href={session?.user ? '/settings' : '/sign-in'}
              className="hotel-login hotel-account"
              aria-label={m['hotel.nav.account']()}
            >
              <UserRound size={16} />
              <span>{m['hotel.nav.account']()}</span>
            </Link>
            <button
              className="hotel-menu"
              aria-label={
                menu
                  ? m['hotel.copy.close_navigation_006']()
                  : m['hotel.copy.open_navigation_007']()
              }
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>
      <main>
        {page === 'content' && children}
        {page === 'home' && (
          <>
            <section className="hero-section">
              <div className="hero-grid-lines" />
              <div className="hero-grid container">
                <div className="hero-copy">
                  <div className="eyebrow">
                    {m['hotel.copy.hotel_lobby_ai_rap_video_generator_008']()}
                  </div>
                  <h1 className="hero-title-exact">
                    {m['hotel.copy.your_duo_009']()}
                    <br />
                    <span>{m['hotel.copy.your_verse_010']()}</span>
                    <br />
                    {m['hotel.copy.one_drop_011']()}
                  </h1>
                  <p>
                    {m[
                      'hotel.copy.preview_15second_landscape_music_templates_and_012'
                    ]()}
                  </p>
                  <div className="hero-actions">
                    <a href="#video-generator" className="hero-primary">
                      {m['hotel.copy.make_a_video_013']()}
                      <ArrowRight size={18} />
                    </a>
                    <a href="#templates" className="hero-secondary">
                      {m['hotel.copy.browse_templates_014']()}
                    </a>
                  </div>
                  <div className="hero-facts">
                    {[
                      'HOTEL LOBBY AI',
                      '2 PHOTOS',
                      '16:9 MP4',
                      '480P · 720P · 1080P',
                    ].map((x) => (
                      <span key={x}>{x}</span>
                    ))}
                  </div>
                </div>
                <div className="hero-visual">
                  <div className="hero-tape-label">
                    HOTEL LOBBY AI · TRACK 01
                  </div>
                  <div className="hero-room-card">
                    <div className="eyebrow hotel-room-label">
                      ORANGE STUDIO · CENTER MIC
                    </div>
                    <a
                      href="#templates"
                      aria-label={m[
                        'hotel.copy.browse_the_orange_street_duo_template_015'
                      ]()}
                    >
                      <img
                        src={tracks[0].image}
                        alt={m[
                          'hotel.copy.two_performers_singing_around_a_suspended_016'
                        ]()}
                        fetchPriority="high"
                      />
                    </a>
                    <div className="hero-card-footer">
                      <span>Orange Street Duo</span>
                      <b>
                        <Mic size={12} /> SOUND PREVIEW
                      </b>
                    </div>
                  </div>
                  <a
                    className="hotel-sticker"
                    href="#templates"
                    aria-label={m['hotel.copy.browse_music_templates_017']()}
                  >
                    HOTEL
                    <br />
                    LOBBY AI
                    <br />
                    VIDEO
                  </a>
                </div>
              </div>
            </section>
            <HotelGenerator selected={selected} onGenerated={generated} />
            <HotelGallery selected={selected} onSelect={setSelected} />
            <section className="how-section container">
              <div className="eyebrow">HOTEL LOBBY AI WORKFLOW</div>
              <h2>
                {m['hotel.copy.three_steps_to_your_018']()}
                <br />
                {m['hotel.copy.hotel_lobby_ai_video_019']()}
              </h2>
              <div className="steps-grid">
                {[
                  {
                    title: m['hotel.copy.upload_two_clear_photos_020'](),
                    text: m['hotel.copy.use_one_subject_per_photo_with_021'](),
                    icon: ImagePlus,
                  },
                  {
                    title:
                      m['hotel.copy.choose_a_hotel_lobby_ai_template_022'](),
                    text: m[
                      'hotel.copy.explore_fourteen_orange_studio_hotel_cultural_023'
                    ](),
                    icon: Mic,
                  },
                  {
                    title: m['hotel.copy.choose_a_resolution_and_create_024'](),
                    text: m['hotel.copy.try_the_workflow_in_480p_720p_025'](),
                    icon: Play,
                  },
                ].map((s, i) => (
                  <article key={s.title}>
                    <span>0{i + 1}</span>
                    <s.icon size={28} />
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </article>
                ))}
              </div>
            </section>
            <section className="trend-section">
              <div className="trend-grid container">
                <div>
                  <div className="eyebrow">HOTEL LOBBY AI FORMAT</div>
                  <h2>
                    {m['hotel.copy.a_twosubject_026']()}
                    <br />
                    <span>{m['hotel.copy.rap_video_format_027']()}</span>
                  </h2>
                </div>
                <div className="trend-copy">
                  <p>
                    {m[
                      'hotel.copy.two_subjects_one_suspended_microphone_a_028'
                    ]()}
                  </p>
                  <p>
                    {m['hotel.copy.put_friends_couples_pets_or_your_029']()}
                  </p>
                  <Link href="/guide" className="hero-secondary">
                    {m['hotel.copy.read_the_full_guide_030']()}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </section>
            <section className="photo-guide container">
              <div>
                <div className="eyebrow">HOTEL LOBBY AI PHOTO GUIDE</div>
                <h2>
                  {m['hotel.copy.better_photos_031']()}
                  <br />
                  {m['hotel.copy.better_results_032']()}
                </h2>
              </div>
              <div className="hotel-photo-tips">
                {[
                  m['hotel.copy.one_subject_per_photo_033'](),
                  m['hotel.copy.face_forward_or_slightly_to_the_034'](),
                  m['hotel.copy.keep_eyes_and_jawline_visible_035'](),
                  m[
                    'hotel.copy.use_original_photos_rather_than_screenshots_036'
                  ](),
                ].map((x, i) => (
                  <div key={x}>
                    <span>0{i + 1}</span>
                    <Check size={20} />
                    <strong>{x}</strong>
                  </div>
                ))}
              </div>
            </section>
            <section className="faq-section container">
              <div className="eyebrow">HOTEL LOBBY AI FAQ</div>
              <h2>{m['hotel.copy.questions_before_you_create_037']()}</h2>
              <div className="hotel-faq">
                {[
                  {
                    q: m['hotel.copy.what_photos_should_i_use_038'](),
                    a: m['hotel.copy.use_an_original_jpg_png_or_039'](),
                  },
                  {
                    q: m['hotel.copy.how_many_credits_does_a_video_040'](),
                    a: m['hotel.copy.the_reference_workflow_uses_20_45_041'](),
                  },
                  {
                    q: m['hotel.copy.where_can_i_find_my_history_042'](),
                    a: m['hotel.copy.open_my_videos_to_see_demo_043'](),
                  },
                  {
                    q: m['hotel.copy.where_are_my_photos_uploaded_044'](),
                    a: m['hotel.copy.photos_are_previewed_only_in_your_045'](),
                  },
                ].map((f, i) => (
                  <details key={f.q}>
                    <summary>
                      <span>0{i + 1}</span>
                      {f.q}
                      <b>+</b>
                    </summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
            <section className="final-cta">
              <div className="container">
                <div>
                  <div className="eyebrow">HOTEL LOBBY AI GENERATOR</div>
                  <h2>
                    {m['hotel.copy.let_your_duo_046']()}
                    <br />
                    {m['hotel.copy.take_the_spotlight_047']()}
                  </h2>
                </div>
                <a className="hero-secondary" href="#video-generator">
                  {m['hotel.copy.start_creating_048']()}
                  <ArrowRight size={18} />
                </a>
              </div>
            </section>
          </>
        )}
        {page === 'pricing' && (
          <>
            <section className="hotel-page-intro container">
              <div className="eyebrow">CREDIT PACKS</div>
              <h1>
                {m['hotel.copy.your_next_drop_049']()}
                <br />
                <span>{m['hotel.copy.starts_here_050']()}</span>
              </h1>
              <p>{m['hotel.copy.choose_a_credit_pack_for_your_051']()}</p>
              <div className="hotel-demo-notice">
                {m['hotel.copy.template_demo_no_payment_demo_credits_052']()}
                {credits}
              </div>
            </section>
            <section id="credit-packs" className="pack-grid container">
              {[
                { name: 'Starter Drop', credits: 50, price: '9.90' },
                { name: 'Creator Stack', credits: 105, price: '19.90' },
                { name: 'Studio Vault', credits: 160, price: '29.90' },
              ].map((pack, i) => (
                <article
                  key={pack.name}
                  className={`pack-card ${i === 1 ? 'featured' : ''}`}
                >
                  <div>
                    <span>{i === 1 ? 'MOST POPULAR' : `PACK 0${i + 1}`}</span>
                    <h2>${pack.price}</h2>
                    <p>{pack.credits} CREDITS</p>
                  </div>
                  <h3>{pack.name}</h3>
                  <ul>
                    <li>
                      <Check />
                      {m['hotel.copy.480p_720p_or_1080p_053']()}
                    </li>
                    <li>
                      <Check />
                      {m['hotel.copy.14_scene_templates_054']()}
                    </li>
                    <li>
                      <Check />
                      {m['hotel.copy.15second_landscape_video_055']()}
                    </li>
                  </ul>
                  <button
                    className="primary-action"
                    onClick={() => addCredits(pack.credits)}
                  >
                    {m['hotel.copy.try_demo_purchase_056']()}
                    <ArrowRight size={16} />
                  </button>
                </article>
              ))}
            </section>
            <section className="hotel-pricing-foot container">
              <Link href="/orders" className="hero-secondary">
                {m['hotel.copy.view_demo_credits_057']()}
                <ArrowRight size={16} />
              </Link>
            </section>
          </>
        )}
        {page === 'orders' && (
          <section className="hotel-page-intro container">
            <div className="eyebrow">ORDERS</div>
            <h1>{m['hotel.copy.your_creative_space_058']()}</h1>
            <p>{m['hotel.copy.check_your_credits_and_creations_then_059']()}</p>
            <div className="hotel-orders-summary">
              <article>
                <span>{m['hotel.copy.demo_credits_060']()}</span>
                <strong>{credits}</strong>
                <Link href="/pricing">
                  {m['hotel.copy.add_credits_061']()}
                  <ArrowRight size={16} />
                </Link>
              </article>
              <article>
                <span>{m['hotel.copy.demo_creations_062']()}</span>
                <strong>{orders.length}</strong>
                <Link href="/#video-generator">
                  {m['hotel.copy.start_creating_048']()}
                  <ArrowRight size={16} />
                </Link>
              </article>
            </div>
            <div className="hotel-demo-notice">
              {m['hotel.copy.this_page_shows_demo_data_saved_063']()}
              <Link href="/sign-in">{m['hotel.copy.sign_in_064']()}</Link>
              {m['hotel.copy.to_use_the_account_features_065']()}
            </div>
            {orders.length ? (
              <div className="hotel-order-list">
                {orders.map((o) => (
                  <article key={o.id}>
                    <img
                      src={
                        tracks.find((t) => t.id === o.track)?.image ||
                        tracks[0].image
                      }
                      alt=""
                    />
                    <div>
                      <h3>
                        {tracks.find((t) => t.id === o.track)?.title || o.track}
                      </h3>
                      <p>
                        {o.quality} ·{' '}
                        {new Date(o.date).toLocaleString(
                          getLocale() === 'zh' ? 'zh-CN' : 'en-US'
                        )}
                      </p>
                      <span>
                        {m[
                          'hotel.copy.demo_complete_no_ai_video_generated_066'
                        ]()}
                      </span>
                    </div>
                    <Link href="/#video-generator">
                      {m['hotel.copy.create_again_067']()}
                      <ArrowRight size={16} />
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="hotel-empty">
                <Mic size={36} />
                <h2>{m['hotel.copy.the_stage_is_ready_068']()}</h2>
                <p>{m['hotel.copy.choose_a_template_and_add_two_069']()}</p>
                <Link href="/#video-generator" className="hero-primary">
                  {m['hotel.copy.start_creating_048']()}
                  <ArrowRight size={18} />
                </Link>
              </div>
            )}
          </section>
        )}
        {page === 'guide' && (
          <section className="hotel-page-intro hotel-guide container">
            <div className="eyebrow">THE HOTEL LOBBY AI GUIDE</div>
            <h1>
              {m['hotel.copy.two_photos_070']()}
              <br />
              <span>{m['hotel.copy.one_shared_stage_071']()}</span>
            </h1>
            <p>{m['hotel.copy.hotel_lobby_ai_is_a_twosubject_072']()}</p>
            <img
              src={tracks[0].image}
              alt={m['hotel.copy.orange_studio_with_two_performers_073']()}
            />
            <h2>{m['hotel.copy.get_your_photos_stageready_074']()}</h2>
            <p>{m['hotel.copy.use_one_clear_subject_per_photo_075']()}</p>
            <h2>{m['hotel.copy.a_prompt_you_can_adapt_076']()}</h2>
            <blockquote>
              {m['hotel.copy.two_subjects_take_turns_singing_in_077']()}
            </blockquote>
            <h2>{m['hotel.copy.check_your_image_permissions_078']()}</h2>
            <p>{m['hotel.copy.use_only_authorized_photos_review_the_079']()}</p>
            <Link href="/#video-generator" className="hero-primary">
              {m['hotel.copy.start_creating_048']()}
              <ArrowRight size={18} />
            </Link>
          </section>
        )}
      </main>
      <footer className="site-footer">
        <div className="footer-grid container">
          <div>
            <div className="footer-brand">{envConfigs.app_name}</div>
            <p>{m['hotel.copy.two_photos_one_original_drop_080']()}</p>
          </div>
          <div className="footer-links">
            <Link href="/pricing">{m['hotel.copy.pricing_081']()}</Link>
            <Link href="/what-is-hotel-lobby-ai">{m['hotel.nav.what']()}</Link>
            <Link href="/hotel-lobby-ai-prompts">
              {m['hotel.nav.prompts']()}
            </Link>
            <Link href="/orders">{m['hotel.copy.my_videos_082']()}</Link>
            <Link href="/blog">{m['hotel.nav.blog']()}</Link>
            <Link href="/about">{m['hotel.nav.about']()}</Link>
            <Link href="/contact">{m['hotel.nav.contact']()}</Link>
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-of-service">Terms</Link>
          </div>
          <div className="footer-contact">
            <Link href="/contact">
              <Mail size={16} />
              {m['hotel.nav.contact']()}
            </Link>
            <p>
              {m[
                'hotel.copy.authorized_images_only_ai_creation_template_083'
              ]()}
            </p>
          </div>
        </div>
        <div className="footer-bottom hotel-footer-bottom container">
          <span>
            © 2026 {envConfigs.app_name}
            {m['hotel.copy.template_demo_084']()}
          </span>
          <BuiltWithShipAny />
        </div>
      </footer>
    </div>
  );
}
