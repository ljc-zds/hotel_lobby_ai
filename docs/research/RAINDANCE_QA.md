# RainDance redesign validation

Reference inspected at https://airaindance.com/#make, 2026-10-23. This is a visual adaptation of the reference for the existing HotelLobby product: original brand, templates, routes, production APIs and pricing stay in use.

- Foundation and final `pnpm build` passed, including English/Chinese compiled message checks.
- Browser checks: desktop 1440px, tablet 768px, mobile 390px; no horizontal overflow.
- Verified template preview dialog opens/closes; Animals filter updates cards.
- Verified mobile navigation expands/collapses and language menu switches to `/zh` with translated content.
- Verified FAQ expands; pricing Buy credits navigates anonymous visitors to sign-in with pricing callback. Sign-in shows Google/GitHub and email fields.
- Kept generation state, mutation, task polling and permissions/credit gates. No paid generation or transaction was run.
- Fixed first-render CTA hydration mismatch by delaying session-specific CTA state until hydration.
- `pnpm exec tsc --noEmit` still reports errors in unchanged database templates and analytics scripts/services; no errors in the redesigned blocks after message generation.
- Public font files are Bricolage Grotesque 400/600/700 and Fraunces800, sourced from the reference's self-hosted OFL fonts. Corresponding Google Fonts OFL licenses are stored beside them.
- Reference screenshots: docs/design-references/raindance-{desktop,mobile}.png. Final screenshots: /tmp/hotel-raindance-redesign-{desktop,full,mobile}.png.
- One committed light appearance; reference-led cream, serif display, coral/yellow accents and blue panel intentionally override the design skill's generic anti-default bans. Animations limited to interactive feedback and respect reduced motion.

This review covers local implementation. Release status is verified separately; no production database change is required.
