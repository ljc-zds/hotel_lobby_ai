import { useState, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { Link, useRouter } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { hotelPacks } from '@/config/hotel-packs';
import { publicVideoExample } from '@/config/public-example';
import { apiGet, apiPost } from '@/lib/api-client';
import { videoListPollingInterval } from '@/lib/hotel-query-policy';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { HotelActualExample } from '@/blocks/hotel-actual-example';
import { HotelCinemaHero } from '@/blocks/hotel-cinema-hero';
import { HotelGallery } from '@/blocks/hotel-gallery';
import { HotelGenerator } from '@/blocks/hotel-generator';
import { HotelPurchaseNotes } from '@/blocks/hotel-purchase-notes';
import { getHotelTracks } from '@/blocks/hotel-tracks';
import { LocaleSelector } from '@/components/locale-selector';

import '@/styles/hotel.css';
import '@/styles/raindance-theme.css';

import { BuiltWithShipAny } from '@/components/built-with-shipany';

type VideoOrder = {
  id: string;
  scene: string | null;
  status: string;
  createdAt: string;
  videoUrl?: string;
};
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
  const videoQuery = useQuery({
    queryKey: ['hotel-videos', session?.user?.id],
    queryFn: () => apiGet<VideoOrder[]>('/api/video'),
    enabled: !!session?.user && page === 'orders',
    refetchInterval: (query) =>
      query.state.status === 'error'
        ? false
        : videoListPollingInterval(page === 'orders', query.state.data),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
  const orders: VideoOrder[] = session?.user ? (videoQuery.data ?? []) : [];
  const router = useRouter();
  const balanceQuery = useQuery({
    queryKey: ['hotel-credit-balance', session?.user?.id],
    queryFn: () => apiGet<{ balance: number }>('/api/video/balance'),
    enabled: !!session?.user,
  });
  const credits = session?.user ? (balanceQuery.data?.balance ?? 0) : 0;
  const checkout = useMutation({
    mutationFn: (productId: string) =>
      apiPost<{ checkout_url: string }>('/api/payment/checkout', {
        product_id: productId,
        redirect:
          getLocale() === 'zh' ? '/zh/settings/billing' : '/settings/billing',
      }),
    onSuccess: ({ checkout_url }: { checkout_url: string }) => {
      if (!checkout_url) throw new Error(m['hotel.payment.unavailable']());
      window.location.assign(checkout_url);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  function generated() {
    void videoQuery.refetch();
  }
  function buyPack(productId: string) {
    if (!session?.user) {
      router.push('/sign-in?callbackUrl=%2Fpricing');
      return;
    }
    checkout.mutate(productId);
  }
  return (
    <div className="hotel-site">
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
                src="/logo.svg?v=2"
                alt=""
                width={40}
                height={40}
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
              aria-label={session?.user?.email || m['hotel.nav.account']()}
              title={session?.user?.email || m['hotel.nav.account']()}
            >
              {session?.user?.email ? (
                <span className="hotel-account-email">
                  {session.user.email}
                </span>
              ) : (
                <>
                  <UserRound size={16} />
                  <span>{m['hotel.nav.account']()}</span>
                </>
              )}
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
            <HotelCinemaHero
              track={{
                ...tracks[0],
                image: publicVideoExample.poster,
                video: publicVideoExample.video,
              }}
            />
            <div className="cinema-generator-intro container">
              <h2>{m['hotel.cinema.generator_title']()}</h2>
              <p>{m['hotel.cinema.generator_description']()}</p>
            </div>
            <HotelGenerator selected={selected} onGenerated={generated} />
            <HotelActualExample />
            <section className="how-section container" id="how-it-works">
              <div className="eyebrow">{m['hotel.redesign.workflow']()}</div>
              <h2>{m['hotel.redesign.how']()}</h2>
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
            <HotelGallery selected={selected} onSelect={setSelected} />
            <section className="trend-section">
              <div className="trend-grid container">
                <div className="rain-trend-media">
                  <video
                    src={tracks[0].video}
                    poster={tracks[0].image}
                    controls
                    playsInline
                    preload="none"
                  />
                  <div>
                    {m['hotel.redesign.example']()}
                    <span>{tracks[0].title}</span>
                  </div>
                </div>
                <div className="trend-copy">
                  <div className="eyebrow">
                    {m['hotel.redesign.trend_label']()}
                  </div>
                  <h2>{m['hotel.redesign.trend_heading']()}</h2>
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
                <div className="eyebrow">
                  {m['hotel.redesign.photo_guide']()}
                </div>
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
            <section className="rain-pricing container">
              <div className="eyebrow">{m['hotel.nav.pricing']()}</div>
              <h2>{m['hotel.redesign.pricing_heading']()}</h2>
              <p>{m['hotel.redesign.pricing_description']()}</p>
              <div className="rain-pricing-grid">
                {[hotelPacks[0], hotelPacks[2]].map((pack, i) => (
                  <article key={pack.id}>
                    <span className="rain-sticker">
                      {i === 0
                        ? m['hotel.redesign.single_label']()
                        : m['hotel.redesign.creator_label']()}
                    </span>
                    <h3>
                      {i === 0
                        ? m['hotel.redesign.single_title']()
                        : m['hotel.redesign.creator_title']()}
                    </h3>
                    <strong className="rain-price">
                      ${(pack.priceInCents / 100).toFixed(2)}
                    </strong>
                    <p>
                      {i === 0
                        ? m['hotel.redesign.single_copy']()
                        : m['hotel.redesign.creator_copy']()}
                    </p>
                    <span>
                      {m['hotel.pricing.videos']({ count: pack.videos })} /{' '}
                      {m['hotel.generator.credit_count']({
                        count: pack.credits,
                      })}
                    </span>
                  </article>
                ))}
              </div>
              <Link className="hero-secondary" href="/pricing">
                {m['hotel.redesign.pricing_link']()}
                <ArrowRight size={16} />
              </Link>
            </section>
            <section className="faq-section container">
              <div className="eyebrow">{m['hotel.redesign.faq_label']()}</div>
              <h2>{m['hotel.copy.questions_before_you_create_037']()}</h2>
              <div className="hotel-faq">
                {[
                  {
                    q: m['hotel.seo.free_question'](),
                    a: m['hotel.seo.free_answer'](),
                  },
                  {
                    q: m['hotel.seo.preview_question'](),
                    a: m['hotel.seo.preview_answer'](),
                  },
                  {
                    q: m['hotel.seo.failure_question'](),
                    a: m['hotel.seo.failure_answer'](),
                  },
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
                  <h2>{m['hotel.redesign.final_heading']()}</h2>
                  <p>{m['hotel.redesign.final_description']()}</p>
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
              <div className="eyebrow">{m['hotel.pricing.heading']()}</div>
              <h1>
                {m['hotel.copy.your_next_drop_049']()}
                <br />
                <span>{m['hotel.copy.starts_here_050']()}</span>
              </h1>
              <p>{m['hotel.copy.choose_a_credit_pack_for_your_051']()}</p>
              <div className="hotel-demo-notice">
                {m['hotel.payment.notice']()}
              </div>
            </section>
            <section id="credit-packs" className="pack-grid container">
              {hotelPacks.map((pack, i) => (
                <article
                  key={pack.id}
                  className={`pack-card ${i === 2 ? 'featured' : ''}`}
                >
                  <div>
                    <span>
                      {i === 2
                        ? m['hotel.pricing.popular']()
                        : m['hotel.pricing.pack_number']({ number: i + 1 })}
                    </span>
                    <h2>${(pack.priceInCents / 100).toFixed(2)}</h2>
                    <p>{m['hotel.pricing.videos']({ count: pack.videos })}</p>
                  </div>
                  <h3>
                    {
                      [
                        m['hotel.pricing.single'](),
                        m['hotel.pricing.starter'](),
                        m['hotel.pricing.creator'](),
                        m['hotel.pricing.bulk'](),
                      ][i]
                    }
                  </h3>
                  <p>
                    {m['hotel.pricing.average']({
                      price: (pack.priceInCents / 100 / pack.videos).toFixed(2),
                    })}
                  </p>
                  <p>
                    {m['hotel.generator.credit_count']({ count: pack.credits })}
                  </p>
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
                    <li>
                      <Check />
                      {m['hotel.pricing.unlimited']()}
                    </li>
                  </ul>
                  <button
                    className="primary-action"
                    disabled={checkout.isPending}
                    onClick={() => buyPack(pack.id)}
                  >
                    {checkout.isPending
                      ? m['common.pricing.processing']()
                      : m['hotel.payment.buy']()}
                    <ArrowRight size={16} />
                  </button>
                </article>
              ))}
            </section>
            <HotelPurchaseNotes />
            <section className="hotel-pricing-foot container">
              <Link href="/settings/billing" className="hero-secondary">
                {m['hotel.payment.billing']()}
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
                <span>{m['hotel.nav.credits']()}</span>
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
              {session?.user ? (
                m['video.library_note']()
              ) : (
                <Link href="/sign-in">{m['video.sign_in']()}</Link>
              )}
            </div>
            {orders.length ? (
              <div className="hotel-order-list">
                {orders.map((o) => (
                  <article key={o.id}>
                    <img
                      width={1280}
                      height={720}
                      src={
                        tracks.find((t) => t.id === o.scene)?.image ||
                        tracks[0].image
                      }
                      alt=""
                    />
                    <div>
                      <h3>
                        {tracks.find((t) => t.id === o.scene)?.title || o.scene}
                      </h3>
                      <p>
                        768P ·{' '}
                        {new Date(o.createdAt).toLocaleString(
                          getLocale() === 'zh' ? 'zh-CN' : 'en-US'
                        )}
                      </p>
                      <span>
                        {o.videoUrl
                          ? m['video.complete']()
                          : ['failed', 'canceled'].includes(o.status)
                            ? m['video.failed']()
                            : m['video.processing']()}
                      </span>
                      {o.videoUrl &&
                        /^\/api\/video\/file\?id=[0-9a-f-]{36}$/i.test(
                          o.videoUrl
                        ) && (
                          <a
                            href={o.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {m['video.open']()}
                          </a>
                        )}
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
              width={1280}
              height={720}
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
            <Link href="/privacy-policy">
              {m['hotel.redesign.legal_privacy']()}
            </Link>
            <Link href="/terms-of-service">
              {m['hotel.redesign.legal_terms']()}
            </Link>
          </div>
          <div className="footer-contact">
            <Link href="/contact">
              <Mail size={16} />
              {m['hotel.nav.contact']()}
            </Link>
            <a href="mailto:2670855280@qq.com">2670855280@qq.com</a>
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
