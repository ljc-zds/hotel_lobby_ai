import { useEffect, useState, type ReactNode } from 'react';
import { tracks, type HotelTrack } from '@/types/hotel';
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
import { BuiltWithShipAny } from '@/components/built-with-shipany';
import { HotelGallery } from '@/components/hotel-gallery';
import { HotelGenerator } from '@/components/hotel-generator';
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
          stored.filter(
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
        track: track.title,
        quality,
        date: new Date().toISOString(),
      },
      ...orders,
    ].slice(0, 20);
    setOrders(next);
    try {
      localStorage.setItem('hotel-demo-orders', JSON.stringify(next));
    } catch {
      toast.info('浏览器未允许保存历史，本次演示仍已完成。');
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
    toast.success(`已添加 ${amount} 演示积分，无实际扣款。`);
  }
  return (
    <div className="hotel-site">
      <div className="announcement-bar">
        HOTEL LOBBY AI / 14 个音乐模板 / 两张照片的共同舞台
      </div>
      <header className="site-header">
        <div className="header-inner container">
          <Link href="/" className="brand" aria-label="首页">
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
            aria-label="主导航"
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
              aria-label={menu ? '关闭导航' : '打开导航'}
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
                  <div className="eyebrow">HOTEL LOBBY AI 说唱视频生成器</div>
                  <h1 className="hero-title-exact">
                    你的双人组合。
                    <br />
                    <span>你的段落。</span>
                    <br />
                    一次发布。
                  </h1>
                  <p>
                    预览带声音的 15 秒横屏 Hotel Lobby AI 模板，上传两张照片生成
                    15 秒 16:9 视频。成片恢复所选模板的原音乐；AI
                    会参考模板动作，而非逐帧复制。
                  </p>
                  <div className="hero-actions">
                    <a href="#video-generator" className="hero-primary">
                      制作视频 <ArrowRight size={18} />
                    </a>
                    <a href="#templates" className="hero-secondary">
                      浏览模板
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
                    <a href="#templates" aria-label="浏览橙色街头双人秀模板">
                      <img
                        src={tracks[0].image}
                        alt="橙色影棚里，两位表演者围绕中央吊麦演唱"
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
                    aria-label="浏览音乐模板"
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
                三步，制作一支
                <br />
                HOTEL LOBBY AI 视频。
              </h2>
              <div className="steps-grid">
                {[
                  {
                    title: '上传两张清晰照片',
                    text: '每侧使用一位主体，确保面部清晰、光线均匀。',
                    icon: ImagePlus,
                  },
                  {
                    title: '选择 Hotel Lobby AI 模板',
                    text: '从十四种橙色、酒店、文化灵感和动物场景中选择。',
                    icon: Mic,
                  },
                  {
                    title: '选择画质并生成',
                    text: '选择 480p、720p 或 1080p，体验完整的创作流程。',
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
                    一种双主体
                    <br />
                    <span>说唱视频形式。</span>
                  </h2>
                </div>
                <div className="trend-copy">
                  <p>
                    两个主体、一个悬挂麦克风、固定横屏镜头、交替表演动作和同步节拍。
                  </p>
                  <p>
                    把朋友、情侣、宠物或创作团队放进同一个画面。从两张照片开始，创造属于你的舞台。
                  </p>
                  <Link href="/guide" className="hero-secondary">
                    阅读完整指南 <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </section>
            <section className="photo-guide container">
              <div>
                <div className="eyebrow">HOTEL LOBBY AI PHOTO GUIDE</div>
                <h2>
                  更好的照片，
                  <br />
                  更好的效果。
                </h2>
              </div>
              <div className="hotel-photo-tips">
                {[
                  '每张照片仅一位主体',
                  '正面或略微侧身',
                  '确保眼睛和下颌线可见',
                  '使用原始照片，而非截图',
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
              <h2>生成前的常见问题</h2>
              <div className="hotel-faq">
                {[
                  {
                    q: '应该上传什么照片？',
                    a: '每张照片只包含一位清晰的主体，使用光线均匀、面部可见的 JPG、PNG 或 WebP 原图，文件最大 8 MB。',
                  },
                  {
                    q: '一支视频需要多少积分？',
                    a: '参考站的 480p、720p 和 1080p 分别需要 20、45 和 80 积分。本模板仅演示交互，不会实际扣款。',
                  },
                  {
                    q: '在哪里查看作品历史？',
                    a: '打开“我的作品”即可查看当前浏览器保存的演示记录。演示不会生成新的 AI 视频。',
                  },
                  {
                    q: '照片会上传到哪里？',
                    a: '在这个模板里，照片仅在你的浏览器中预览，不会发送到服务器。请只使用你有权使用的素材。',
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
                    让你的组合
                    <br />
                    成为主角。
                  </h2>
                </div>
                <a className="hero-secondary" href="#video-generator">
                  开始创作 <ArrowRight size={18} />
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
                你的下一次发布。
                <br />
                <span>从这里开始。</span>
              </h1>
              <p>一次购买，按次创作。选择适合你的点数包。</p>
              <div className="hotel-demo-notice">
                模板演示 · 不会收取费用 · 当前演示积分 {credits}
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
                      480p、720p 或 1080p
                    </li>
                    <li>
                      <Check />
                      14 种场景模板
                    </li>
                    <li>
                      <Check />
                      15 秒横屏视频
                    </li>
                  </ul>
                  <button
                    className="primary-action"
                    onClick={() => addCredits(pack.credits)}
                  >
                    演示购买 <ArrowRight size={16} />
                  </button>
                </article>
              ))}
            </section>
            <section className="hotel-pricing-foot container">
              <Link href="/orders" className="hero-secondary">
                查看演示积分 <ArrowRight size={16} />
              </Link>
            </section>
          </>
        )}
        {page === 'orders' && (
          <section className="hotel-page-intro container">
            <div className="eyebrow">ORDERS</div>
            <h1>你的创作空间。</h1>
            <p>查看积分与作品，接着创作下一支视频。</p>
            <div className="hotel-orders-summary">
              <article>
                <span>演示积分</span>
                <strong>{credits}</strong>
                <Link href="/pricing">
                  添加积分 <ArrowRight size={16} />
                </Link>
              </article>
              <article>
                <span>演示作品</span>
                <strong>{orders.length}</strong>
                <Link href="/#video-generator">
                  开始创作 <ArrowRight size={16} />
                </Link>
              </article>
            </div>
            <div className="hotel-demo-notice">
              本页展示当前浏览器的演示数据。
              <Link href="/sign-in">登录账户</Link> 可使用项目原有的账户功能。
            </div>
            {orders.length ? (
              <div className="hotel-order-list">
                {orders.map((o) => (
                  <article key={o.id}>
                    <img
                      src={
                        tracks.find((t) => t.title === o.track)?.image ||
                        tracks[0].image
                      }
                      alt=""
                    />
                    <div>
                      <h3>{o.track}</h3>
                      <p>
                        {o.quality} · {new Date(o.date).toLocaleString('zh-CN')}
                      </p>
                      <span>演示已完成 · 未生成 AI 视频</span>
                    </div>
                    <Link href="/#video-generator">
                      再次创作 <ArrowRight size={16} />
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="hotel-empty">
                <Mic size={36} />
                <h2>舞台已经就绪。</h2>
                <p>选择一个模板，上传两张照片，体验你的第一次创作。</p>
                <Link href="/#video-generator" className="hero-primary">
                  开始创作 <ArrowRight size={18} />
                </Link>
              </div>
            )}
          </section>
        )}
        {page === 'guide' && (
          <section className="hotel-page-intro hotel-guide container">
            <div className="eyebrow">THE HOTEL LOBBY AI GUIDE</div>
            <h1>
              两张照片。
              <br />
              <span>一个共同舞台。</span>
            </h1>
            <p>
              Hotel Lobby AI
              是一种双主体音乐视频形式：一个麦克风、一个横屏镜头，两位主角轮流表演。
            </p>
            <img src={tracks[0].image} alt="橙色双人音乐影棚" />
            <h2>让照片适合舞台</h2>
            <p>
              每张照片只保留一位清晰且获授权的主体。头像用于参考脸部；全身照还能提供发型和服装信息。
            </p>
            <h2>一个可以改写的提示词</h2>
            <blockquote>
              两位主体在纯橙色影棚中交替演唱，一个悬挂麦克风位于画面中央。固定
              16:9 横屏镜头，自然的手势与节拍，保留主体的面部特征和服装。
            </blockquote>
            <h2>检查你的素材权利</h2>
            <p>
              只使用已获得授权的照片。发布前检查完整成片，避免冒充、欺骗或骚扰他人。
            </p>
            <Link href="/#video-generator" className="hero-primary">
              开始创作 <ArrowRight size={18} />
            </Link>
          </section>
        )}
      </main>
      <footer className="site-footer">
        <div className="footer-grid container">
          <div>
            <div className="footer-brand">{envConfigs.app_name}</div>
            <p>两张照片，一次原创发布。</p>
          </div>
          <div className="footer-links">
            <Link href="/pricing">价格</Link>
            <Link href="/what-is-hotel-lobby-ai">{m['hotel.nav.what']()}</Link>
            <Link href="/hotel-lobby-ai-prompts">
              {m['hotel.nav.prompts']()}
            </Link>
            <Link href="/orders">我的作品</Link>
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
            <p>仅使用获授权素材 · AI 创作模板</p>
          </div>
        </div>
        <div className="footer-bottom hotel-footer-bottom container">
          <span>© 2026 {envConfigs.app_name} · 模板演示。</span>
          <BuiltWithShipAny />
        </div>
      </footer>
    </div>
  );
}
