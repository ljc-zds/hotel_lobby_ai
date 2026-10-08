# Hotel Lobby AI template

## Run

`pnpm install`, copy `.env.example` to `.env.development`, generate `AUTH_SECRET`, then `pnpm db:push` and `pnpm dev`.
A local development configuration and SQLite database were prepared in this workspace (ignored by Git).

## Pages

- `/`: hero, two-photo local upload, resolution selection, fourteen template cards, workflow, photo guide, FAQ.
- `/pricing`: three credit packs. Buttons add local demo credits; no payment is submitted.
- `/orders`: current browser demo credits and generation history.
- `/guide`: format explanation and a reusable prompt.
- `/sign-in`, `/settings`, `/admin`: existing ShipAny account and management functionality.

## Customize

`src/blocks/hotel-site.tsx` assembles the template. `src/types/hotel.ts` contains the 14 editable tracks.
`src/components/hotel-generator.tsx` implements the local upload demo; replace its simulated completion with your authenticated backend when integrating AI.
`src/components/hotel-gallery.tsx` implements filtering and previews. Only track 01 has a supplied sample video; other tracks display their poster.
`src/styles/hotel.css` preserves the public reference design plus template overrides.
Brand name, description and URL use `.env` values. Change the reference branding/contact/assets before publishing your own product.

## Data and scope

Photos are object URLs in page memory, never sent to a server. Demo records/credits are in localStorage on the current browser and are not authoritative billing data.
The template is Chinese. Nine-language content, a blog library, real AI generation and payment integrations are not implemented by this adaptation.

## Verification

Production build and TypeScript check passed. Browser checks exercised category filtering (6 animal templates), poster preview/selection,
two local photo inputs, consent, demo generation, persisted history, demo purchase (+105 credits), and desktop/768px/390px layouts with no horizontal overflow.

## Added top navigation

The full navigation now exposes generator and template anchors, `/hotel-lobby-ai-prompts`, `/pricing`, `/what-is-hotel-lobby-ai`, `/blog`, `/about`, and `/contact`.
New information pages are bilingual MDX under `src/content/pages/`, rendered through the existing static page factory with the common site header and footer.
The blog has three bilingual articles with their own URLs. Original scaffold article URLs remain available for compatibility, but are excluded from the product blog listing.
The language selector supports the two configured locales (English/Chinese), and localizes the navigation and new page content. Existing homepage demo copy remains Chinese.
“My videos” and demo credits link to `/orders`; Account opens `/sign-in` when signed out and `/settings` when signed in.
The contact page does not send messages: a project-owned support channel must be configured before launch. The shared footer now points to `/contact` instead of the reference site's email.
