# HotelLobby cinema studio refinement

Design references: public SuperOPC previews for Berd (colorful creative workspace) and Offloop (warm cinematic hero). Full member-only case pages were not accessed. This is an adaptation using existing HotelLobby media, not a reproduction of their brand/assets.

Direction: consumer AI music-video studio. Variance6 / motion4 / density4. Single light canvas. Warm real footage is the signature; lavender/lime/peach gallery stages form a visual companion.

Palette: canvas #f5f3ef (oklch .964 .006 80), ink #26251f (.265 .012 85), warm copper #a54b25, lavender #e8e2ee, lime #e3ebca, peach #f0dfcc. Bricolage Grotesque for product UI; Fraunces for cinematic hero only. Existing brand/routes, metadata, consent and backend preserved.

- New HotelCinemaHero uses existing reference footage, explicit style-reference disclosure, native same-page CTAs and play/pause control.
- Autoplay stays muted, respects reduced motion and Save-Data, pauses offscreen, and preserves manual pause. Effect observers/listeners clean up on unmount.
- Gallery uses a wide lead card followed by paired colored stages; mobile collapses to one column. Filters, keyboard modal, template selection and generator sync retained.
- Fixed concatenated class names with cn() so active filters, selected cards and uploaded-photo states receive their proper CSS.
- Generator is a neutral product workspace instead of a blue hard-shadow panel. Supporting sections share thin borders, calmer buttons and coordinated typography.

QA: desktop1440, tablet768, mobile390; no horizontal overflow. English/Chinese homepage verified. Tested pause state, offscreen pause, gallery navigation, Animals filtering, preview modal and choosing Orange Cats Duo into the generator. No paid API request or payment made. pnpm build and translation checks passed. Standalone tsc still has unchanged database/analytics errors; redesigned files have no reported errors.

This review covers local implementation. Release status is verified separately; no database migration is required.
