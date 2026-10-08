# Disco Bloom — Birthday stationery

Stable key: `disco-bloom`. Only `BIRTHDAY`; the single demo identity is Dara, supplied by the shared fixture. Photos are optional and real invitations use their own event identity/media.

## Art direction and assets

- Materials and image-generation brief: Silver mirrorball, peach cake, coral satin and pink reflections. Editorial photographic still life; no text, names, ages, dates, logos or interface inside the image.
- Source: original built-in ImageGen artwork for Undara, 8 October 2026.
- Web derivative: `scene.webp`, 1024 × 1536, opaque RGB, 87830 bytes, Sharp WebP quality 82. No photographic cut-out or scene cropping. The original generation remains outside the app repository; this folder contains the optimized browser asset.
- Fonts: Syne + Inter; palette is registered in `lib/templates/design.ts` and remains independent of the Undara application shell.
- Cover: Complete photographic scene followed by an offset overlapping live title card.
- Envelope: Satin-colored paper wrap with a rectangular seal.
- Section accent: Mirrorball geometric stamp, authored as editable vector geometry in `BirthdayStationeryAccent.tsx`; it appears only in Greeting/Closing and inherits section ink. Photograph/frame and symbol/frame have independent native targets.
- Rhythm through the invitation: Left greeting, offset portrait, right event, stacked album and right closing.

## Fifteen-control blueprint

Envelope → Cover → Greeting → Identity → Event → Date/Time → Gallery → Countdown → Location → RSVP → Wishes → Gift → Closing → Footer, plus one global Music control. The optional `cover` customer photo belongs to Identity; artwork never substitutes for that photo slot. Stack is the default album, and saved Gallery Settings take precedence. An empty photo library stays empty. Greeting/attendance request/prayer/closing are theme-owned ID/EN narrative slots; authored copy is never automatically translated.

The envelope uses the existing one-shot 650 ms folding motion within the shared 700 ms handoff, direct gesture music, immediate keyboard/reduced-motion/OFF opening, and active palette/font tokens. Native/photo entrances use the shared Studio motion registry, preserving saved overrides and explicit OFF. No perpetual decorative animation or new dependency. Shared RSVP/Wishes/Maps/Gift/countdown/auth/save engines and all fifteen visibility controls remain intact.

## Verification boundary

`tests/birthday-stationery.test.mjs` covers exact event eligibility, canonical demos, escaped live identity, native hide/restore, ID/EN narrative round-trip, readable surfaces, music/motion overrides and WebP bounds. `scripts/template-browser-qa.mjs` exercises the actual public gallery at 320/390/768/1440 px. Observed results and commit rationale belong to `prd.md` Appendix A. Gallery QA does not claim authenticated customer Save/public, physical-device audio or paid-event submission verification.
