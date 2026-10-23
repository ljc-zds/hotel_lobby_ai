import { Link } from '@/core/i18n/navigation';
import { m } from '@/paraglide/messages.js';
import { localizeHref } from '@/paraglide/runtime.js';

import '@/styles/hotel-trust.css';

export function HotelPurchaseNotes() {
  const notes = [
    {
      title: m['hotel.trust.expiry_title'](),
      text: m['hotel.trust.expiry_text'](),
    },
    {
      title: m['hotel.trust.failure_title'](),
      text: m['hotel.trust.failure_text'](),
    },
    {
      title: m['hotel.trust.quality_title'](),
      text: m['hotel.trust.quality_text'](),
    },
    {
      title: m['hotel.trust.privacy_title'](),
      text: m['hotel.trust.privacy_text'](),
    },
  ];
  return (
    <section
      className="purchase-notes container"
      aria-labelledby="purchase-notes-title"
    >
      <h2 id="purchase-notes-title">{m['hotel.trust.heading']()}</h2>
      <p>{m['hotel.trust.intro']()}</p>
      <div className="purchase-notes-grid">
        {notes.map((note) => (
          <article key={note.title}>
            <h3>{note.title}</h3>
            <p>{note.text}</p>
          </article>
        ))}
      </div>
      <div className="purchase-note-links">
        <a href={localizeHref('/#actual-example')}>
          {m['hotel.trust.actual_example']()}
        </a>
        <Link href="/privacy-policy">
          {m['hotel.redesign.legal_privacy']()}
        </Link>
        <Link href="/terms-of-service">
          {m['hotel.redesign.legal_terms']()}
        </Link>
        <a href="mailto:2670855280@qq.com?subject=HotelLobby%20Billing%20Support">
          {m['hotel.trust.billing_support']()}
        </a>
      </div>
      <p className="purchase-review-note">{m['hotel.trust.refund_note']()}</p>
    </section>
  );
}
