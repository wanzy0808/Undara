# Taman Doa and Red Thread

Two original Undara invitation compositions for the owner's Khitanan and Sangjit request (7 October 2026). Public, personal, gallery and Studio rendering use the same shared invitation engine and event data.

| Theme | Category | Visual direction | Photos |
| --- | --- | --- | --- |
| `taman-doa` / Taman Doa | `KHITANAN` | Warm ivory / forest green, cut-paper arch garden, kite, folded pocket with an arched letter, Young Serif + Instrument Sans | Optional child/identity image in the shared `cover` slot; carousel gallery |
| `red-thread` / Red Thread | `SANGJIT` | Lacquer crimson / antique gold, cloud scroll, two-loop ceremonial knot, gatefold folio, Bodoni Moda + Manrope | Optional identity image in the shared `cover` slot; stacked gallery |

Cover artwork is code-native geometry in `FamilyCelebrationArtwork.tsx`, not a flattened mockup with customer data baked into it. Names, recipient line, dates and event details are React text sourced from the event. Native groups have stable section-scoped Studio identities for individual paint/transform, reversible hiding and restore. Both themes retain the 15 existing controls and all 13 semantic content sections.

`public/templates/<key>/preview.svg` is an original self-contained 390 × 760 vector cover preview generated from the actual artwork, with isolated catalog demo names/date. It is public demonstration material, not customer data, and it does not replace the live cover renderer. SVG geometry stays resolution independent; no third-party art or customer photos are copied into these folders. Generated raster concept references were inspected for palette, spacing, typography and composition, then translated to editable native geometry; exact pixel equivalence is not claimed. No licensed/private originals are stored here.

All decorative geometry fits inside its own viewport. The cover, content and functional sections retain normal document flow; envelope folds are scoped layers within the stationery. Opening uses the existing synchronous audio gesture and finite parent transition. Keyboard, animation OFF and Reduced Motion open immediately. There is no perpetual animation.

Event-selected music overrides bundled defaults. Copy defaults are localized ID/EN; family-authored copy is preserved. Khitanan requires one child name, Sangjit two partner names; both use the existing date, timezone, start/end and location fields. Wedding-specific sessions are not inferred or enabled. No schema migration, duplicate photo store, guest model, QR, payment or RSVP pipeline is introduced.

Source/SSR validation and production build results are recorded in canonical `prd.md` Appendix A. Signed-in browser/device checks for opening, crop/editing, native selection/restore, Save/reload, public forms and QR remain separate verification work.
