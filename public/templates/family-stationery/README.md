# Family stationery collection — 8 October 2026

Owner brief: add four Khitanan and four Sangjit themes alongside Taman Doa / Red Thread; replace the flat slide-like feel with photographic materials, believable lighting and physical stationery.

Audience: Indonesian families inviting guests on a phone; the first impression should feel like receiving an invitation. The public path is envelope → cover → readable event details → RSVP. This is an addition to Undara's shared invitation renderer, not a new data model.

## Art direction

| Theme | Key | Event | Cover / envelope | Gallery | Detail section |
| --- | --- | --- | --- | --- | --- |
| Serambi Pagi | `serambi-pagi` | Khitanan | arched / pocket | masonry | greeting |
| Rumah Senja | `rumah-senja` | Khitanan | editorial / wrap | filmstrip | closing |
| Langit Safari | `langit-safari` | Khitanan | playful / sleeve | carousel | greeting |
| Purnama Biru | `purnama-biru` | Khitanan | night / gatefold | stack | closing |
| Giok Abadi | `giok-abadi` | Sangjit | tea / gatefold | stack | greeting |
| Peony Silk | `peony-silk` | Sangjit | romantic / wrap | masonry | closing |
| Imperial Crimson | `imperial-crimson` | Sangjit | ceremony / gatefold | carousel | closing |
| Porcelain Bloom | `porcelain-bloom` | Sangjit | porcelain / sleeve | filmstrip | greeting |

The eight scenes were generated from original text prompts through the image-generation tool before implementation and visually inspected. None contain names, dates, UI, faces or customer content. The supplied reference is the generated photographic world/material, not a screenshot of a finished UI. Live text, paper folds, frames, forms and responsive section layout are implemented in code. Each photographic scene/cutout is one selectable raster image; its frame and native paper parts are separate Studio targets. Individual objects baked into one photo are not independently recolorable.

Production assets: eight opaque 1024 × 1536 `scene.webp`, eight transparent 960 × 640 `detail.webp`, and one 512 × 512 cotton-paper texture. Combined size is 1,779,722 bytes (about 1.70 MiB). WebP derivatives preserve full subjects and transparency; original PNG generations stay outside the application tree. No external stock URLs, new font files, audio files or dependencies.

## Implementation and motion

`family-art-directions.ts` chooses visual compositions only; event eligibility stays in `catalog.ts`. `FamilyStationeryScene` composes section-owned envelopes/covers in normal flow. `FamilyStationeryArtwork` keeps raster/frame targets independent. Whole-scroll styles remain scoped to `family-stationery-invitation` and each theme class.

Actual names, date and category stay visible on the closed envelope, including gatefold designs. Actual recipient text uses the shared personal-link formatter. Images are separate from live text; long names wrap and grow their section. Customer photos are optional in Identity and Gallery, with no stock-person fallback. Sangjit story text appears only when authored.

The one-time paper-opening movement uses transform/opacity with physical hinge origins and 650ms maximum within the existing 700ms handoff. Keyboard, reduced motion and explicit OFF take the shared immediate path; audio remains in the synchronous opening gesture. Repeated Studio controls add no new motion.

Motion review (Emil animate/review-animations + STANDARDS):

| Before | After | Why |
| --- | --- | --- |
| Seal opacity used weak built-in easing | Strong `cubic-bezier(.23,1,.32,1)` at `family-stationery.css:73` | Matches the letter/fold response and avoids slow initial movement |
| Pure-fade photo/header defaults and animated detail cutouts | Rise/glide defaults for live names/photos; cutouts remain still in `template-motion.ts` | Clear spatial continuity; removes decorative movement with no purpose |

**Origin, physicality and timing:** fold/letter duration is a deliberate one-time invitation reveal, within the shared 700ms handoff. Hinges align to the actual paper edges. UI controls add no slow/high-frequency transition. **Performance/accessibility:** transform/opacity only, no scale-from-zero/loops, keyboard/Reduced Motion/OFF are immediate under the stronger repository rule. **Approve (source review)**; browser feel/device audio must be assessed separately.

## Validation boundary

Regression tests cover exact category gating and stable defaults, isolated examples, escaped live data, unique/editable native targets, saved hide/paint/restore state, optional photos, bilingual defaults and authored-copy preservation, contrast, music precedence, OFF, asset dimensions/transparency/size, and the renderer contract. Browser QA runs the real public gallery on a disposable CI server at 320/390/768/1440px, opens each envelope, checks actual images/layout/13 content sections and long-name wrapping, and captures review screenshots. It does not create customer invitations or submit RSVP.

Customer Studio Undo/Redo → save/reload/public, a real paid-event RSVP/Wishes/Maps/Gift/QR path and physical-device/audio behavior remain release QA; public-preview checks are not a substitute. See `checklist.md` and the dated PRD Appendix A entry for observed results.

## Prompt provenance

### Serambi Pagi

Scene prompt:

> Use case: photorealistic-natural. Asset type: original full portrait artwork and material/composition reference for a responsive premium Indonesian Khitanan invitation called Serambi Pagi. Generate one standalone 1024x1536 portrait, edge-to-edge scene, NOT a collage or phone mockup. Scene: An intimate sunlit limestone courtyard with a tall rounded Islamic-style arch (neutral architecture, no mosque signage), pale warm travertine steps, a small olive tree to the left, leafy shadows, ivory plaster and muted sage greenery. The arch and steps occupy the lower two thirds, upper third is airy blank ivory plaster. Style: believable editorial photography, fine natural material detail, subtle optical depth, restrained light and shadows, premium physical invitation aesthetic. Palette: sage and limestone. Compose complete objects within the canvas with intentional clear space for future editable web text. No faces, no people, no names, no dates, no letters, no logos, no watermark, no frame UI, no buttons, no rendered text whatsoever. Do not make flat vector art, PowerPoint shapes, cartoon or excessive 3D plastic.

Detail prompt:

> Use case: product-mockup. Asset type: original secondary cutout artwork for the Serambi Pagi responsive invitation, part of the same photographic material world as its cover. Subject: a single small olive sprig with three little clusters of leaves, natural botanical photography, muted sage leaves and light brown twig. One landscape 1536x1024 composition with real transparent background and no backdrop. Tangible studio product photography, natural subtle contact shadow only under subject; restrained material detail, elegant small still life, no flat vector or cartoon, no plastic. Place the complete objects centrally with generous clear space around every extremity. No text, no letters, no logos, no people or faces. Keep alpha truly transparent, not white or checkered.

### Rumah Senja

Scene prompt:

> Use case: photorealistic-natural. Asset type: original full portrait artwork and material/composition reference for a responsive premium Indonesian Khitanan invitation called Rumah Senja. Generate one standalone 1024x1536 portrait, edge-to-edge scene, NOT a collage or phone mockup. Scene: An authentic Indonesian Javanese teak veranda in late afternoon, close tactile view of a terracotta wall, simple carved teak doorframe on right, cream handmade cotton invitation paper laid on a folded brown batik cloth at lower left, a small jasmine sprig. Warm side sunlight and softly blurred wooden interior; no humans or readable carvings. Objects occupy bottom and sides with an uncluttered warm cream center. Style: believable editorial photography, fine natural material detail, subtle optical depth, restrained light and shadows, premium physical invitation aesthetic. Palette: terracotta teak ivory. Compose complete objects within the canvas with intentional clear space for future editable web text. No faces, no people, no names, no dates, no letters, no logos, no watermark, no frame UI, no buttons, no rendered text whatsoever. Do not make flat vector art, PowerPoint shapes, cartoon or excessive 3D plastic.

Detail prompt:

> Use case: product-mockup. Asset type: original secondary cutout artwork for the Rumah Senja responsive invitation, part of the same photographic material world as its cover. Subject: a loosely folded piece of authentic brown and cream Indonesian batik cotton fabric with one small white jasmine sprig beside it, warm amber side light, visible weave. One landscape 1536x1024 composition with real transparent background and no backdrop. Tangible studio product photography, natural subtle contact shadow only under subject; restrained material detail, elegant small still life, no flat vector or cartoon, no plastic. Place the complete objects centrally with generous clear space around every extremity. No text, no letters, no logos, no people or faces. Keep alpha truly transparent, not white or checkered.

### Langit Safari

Scene prompt:

> Use case: photorealistic-natural. Asset type: original full portrait artwork and material/composition reference for a responsive premium Indonesian Khitanan invitation called Langit Safari. Generate one standalone 1024x1536 portrait, edge-to-edge scene, NOT a collage or phone mockup. Scene: A warm refined children's celebration still life: two small realistic handcrafted wooden animal toys, a little elephant and giraffe, resting on beige linen near the bottom edge, tiny natural dried grasses on left, dusty sage wall, cream paper textured empty space above. Tangible toys with actual wood grain, shallow depth of field, morning sunlight. Joyful but elegant, not cartoon, not a nursery advertising poster. Style: believable editorial photography, fine natural material detail, subtle optical depth, restrained light and shadows, premium physical invitation aesthetic. Palette: cream soft sage warm sand. Compose complete objects within the canvas with intentional clear space for future editable web text. No faces, no people, no names, no dates, no letters, no logos, no watermark, no frame UI, no buttons, no rendered text whatsoever. Do not make flat vector art, PowerPoint shapes, cartoon or excessive 3D plastic.

Detail prompt:

> Use case: product-mockup. Asset type: original secondary cutout artwork for the Langit Safari responsive invitation, part of the same photographic material world as its cover. Subject: one small handcrafted unpainted wooden elephant toy with visible wood grain, a tiny dried grass sprig beside it, cream linen fold under the toy, warm afternoon light. One landscape 1536x1024 composition with real transparent background and no backdrop. Tangible studio product photography, natural subtle contact shadow only under subject; restrained material detail, elegant small still life, no flat vector or cartoon, no plastic. Place the complete objects centrally with generous clear space around every extremity. No text, no letters, no logos, no people or faces. Keep alpha truly transparent, not white or checkered.

### Purnama Biru

Scene prompt:

> Use case: photorealistic-natural. Asset type: original full portrait artwork and material/composition reference for a responsive premium Indonesian Khitanan invitation called Purnama Biru. Generate one standalone 1024x1536 portrait, edge-to-edge scene, NOT a collage or phone mockup. Scene: An elegant blue-hour terrace with midnight indigo stone arches and a distant hazy moon in upper left, one small authentic warm brass hanging lantern on right, translucent ivory drapery at the edge, subtle stars and realistic depth. A quiet open dark navy region in the center. Refined ceremonial night atmosphere, no neon, no fantasy castle, no holiday or festival strings. Style: believable editorial photography, fine natural material detail, subtle optical depth, restrained light and shadows, premium physical invitation aesthetic. Palette: midnight navy brass ivory. Compose complete objects within the canvas with intentional clear space for future editable web text. No faces, no people, no names, no dates, no letters, no logos, no watermark, no frame UI, no buttons, no rendered text whatsoever. Do not make flat vector art, PowerPoint shapes, cartoon or excessive 3D plastic.

Detail prompt:

> Use case: product-mockup. Asset type: original secondary cutout artwork for the Purnama Biru responsive invitation, part of the same photographic material world as its cover. Subject: one complete standing brass lantern with a small candle inside, entire lantern handle, base and feet visible, softly glowing warm light, no hanging chain extending off canvas. One landscape 1536x1024 composition with real transparent background and no backdrop. Tangible studio product photography, natural subtle contact shadow only under subject; restrained material detail, elegant small still life, no flat vector or cartoon, no plastic. Place the complete objects centrally with generous clear space around every extremity. No text, no letters, no logos, no people or faces. Keep alpha truly transparent, not white or checkered.

### Giok Abadi

Scene prompt:

> Use case: photorealistic-natural. Asset type: original full portrait artwork and material/composition reference for a responsive premium Chinese Indonesian Sangjit invitation called Giok Abadi. Generate one standalone 1024x1536 portrait, edge-to-edge scene, NOT a collage or phone mockup. Scene: A refined Chinese Indonesian Sangjit tea-table still life. Celadon jade-green porcelain tea pot and two small cups on a pale stone table at lower right, crimson silk ribbon and a restrained magnolia twig at left, light sage silk textile flowing at the edge. Natural morning window light. Main upper center is calm pale sage and ivory negative space; realistic ceramic glaze and silk weave. No humans, no dragons, no Chinese writing. Style: believable editorial photography, fine natural material detail, subtle optical depth, restrained light and shadows, premium physical invitation aesthetic. Palette: celadon jade warm ivory crimson. Compose complete objects within the canvas with intentional clear space for future editable web text. No faces, no people, no names, no dates, no letters, no logos, no watermark, no frame UI, no buttons, no rendered text whatsoever. Do not make flat vector art, PowerPoint shapes, cartoon or excessive 3D plastic.

Detail prompt:

> Use case: product-mockup. Asset type: original secondary cutout artwork for the Giok Abadi responsive invitation, part of the same photographic material world as its cover. Subject: two little realistic celadon-green porcelain tea cups on a small matching oval tray, delicate ivory magnolia blossom beside them, subtle gold ceramic edge, soft natural light. One landscape 1536x1024 composition with real transparent background and no backdrop. Tangible studio product photography, natural subtle contact shadow only under subject; restrained material detail, elegant small still life, no flat vector or cartoon, no plastic. Place the complete objects centrally with generous clear space around every extremity. No text, no letters, no logos, no people or faces. Keep alpha truly transparent, not white or checkered.

### Peony Silk

Scene prompt:

> Use case: photorealistic-natural. Asset type: original full portrait artwork and material/composition reference for a responsive premium Chinese Indonesian Sangjit invitation called Peony Silk. Generate one standalone 1024x1536 portrait, edge-to-edge scene, NOT a collage or phone mockup. Scene: Luxury ceremonial still life with a small asymmetric arrangement of realistic blush peonies and ivory buds on the upper left, champagne silk with natural folds along the bottom, a pale rose matte plaster wall in the center, a slim ribbon near lower right. Delicate actual flower petals, gentle afternoon window light. Large calm pink-ivory negative space at center. No hearts, no couple, no text. Style: believable editorial photography, fine natural material detail, subtle optical depth, restrained light and shadows, premium physical invitation aesthetic. Palette: blush champagne muted plum. Compose complete objects within the canvas with intentional clear space for future editable web text. No faces, no people, no names, no dates, no letters, no logos, no watermark, no frame UI, no buttons, no rendered text whatsoever. Do not make flat vector art, PowerPoint shapes, cartoon or excessive 3D plastic.

Detail prompt:

> Use case: product-mockup. Asset type: original secondary cutout artwork for the Peony Silk responsive invitation, part of the same photographic material world as its cover. Subject: one restrained arrangement of a blush peony blossom and two ivory peony buds with short stems tied by a champagne silk ribbon, full flowers and ribbon ends visible, no vase. One landscape 1536x1024 composition with real transparent background and no backdrop. Tangible studio product photography, natural subtle contact shadow only under subject; restrained material detail, elegant small still life, no flat vector or cartoon, no plastic. Place the complete objects centrally with generous clear space around every extremity. No text, no letters, no logos, no people or faces. Keep alpha truly transparent, not white or checkered.

### Imperial Crimson

Scene prompt:

> Use case: photorealistic-natural. Asset type: original full portrait artwork and material/composition reference for a responsive premium Chinese Indonesian Sangjit invitation called Imperial Crimson. Generate one standalone 1024x1536 portrait, edge-to-edge scene, NOT a collage or phone mockup. Scene: An intimate Sangjit presentation still life: deep oxblood lacquer backdrop, a polished dark red wooden ceremonial tray with two gold-edged porcelain tea cups near the bottom, a rich crimson silk knot resting beside the tray, a single tiny gold ginkgo sprig on far right. Tangible silk, real lacquer highlights, warm directional studio light. Mostly quiet deep red negative space in the upper two thirds. No dragon, no palace, no crown, no lettering. Style: believable editorial photography, fine natural material detail, subtle optical depth, restrained light and shadows, premium physical invitation aesthetic. Palette: oxblood antique gold cream. Compose complete objects within the canvas with intentional clear space for future editable web text. No faces, no people, no names, no dates, no letters, no logos, no watermark, no frame UI, no buttons, no rendered text whatsoever. Do not make flat vector art, PowerPoint shapes, cartoon or excessive 3D plastic.

Detail prompt:

> Use case: product-mockup. Asset type: original secondary cutout artwork for the Imperial Crimson responsive invitation, part of the same photographic material world as its cover. Subject: one real deep red Chinese ceremonial silk knot with two full tassels, a tiny gold ginkgo sprig beside it, complete knot and tassels visible, realistic tactile silk. One landscape 1536x1024 composition with real transparent background and no backdrop. Tangible studio product photography, natural subtle contact shadow only under subject; restrained material detail, elegant small still life, no flat vector or cartoon, no plastic. Place the complete objects centrally with generous clear space around every extremity. No text, no letters, no logos, no people or faces. Keep alpha truly transparent, not white or checkered.

### Porcelain Bloom

Scene prompt:

> Use case: photorealistic-natural. Asset type: original full portrait artwork and material/composition reference for a responsive premium Chinese Indonesian Sangjit invitation called Porcelain Bloom. Generate one standalone 1024x1536 portrait, edge-to-edge scene, NOT a collage or phone mockup. Scene: Fine blue and white porcelain vase with a small white flowering plum branch at the lower left, a matching tiny tea cup at bottom right, cobalt ink-blue details on the ceramic, an unprinted ivory cotton paper sheet across a pale white linen surface, restrained branch shadow. Bright diffused daylight, tactile ceramics and paper. Calm ivory negative space through center and upper right. No readable Asian characters or symbols, no human. Style: believable editorial photography, fine natural material detail, subtle optical depth, restrained light and shadows, premium physical invitation aesthetic. Palette: porcelain ivory cobalt blue. Compose complete objects within the canvas with intentional clear space for future editable web text. No faces, no people, no names, no dates, no letters, no logos, no watermark, no frame UI, no buttons, no rendered text whatsoever. Do not make flat vector art, PowerPoint shapes, cartoon or excessive 3D plastic.

Detail prompt:

> Use case: product-mockup. Asset type: original secondary cutout artwork for the Porcelain Bloom responsive invitation, part of the same photographic material world as its cover. Subject: one small antique blue-white porcelain tea cup and a small white plum blossom sprig beside it, delicate cobalt botanical ornament on the cup, realistic ceramic glaze. One landscape 1536x1024 composition with real transparent background and no backdrop. Tangible studio product photography, natural subtle contact shadow only under subject; restrained material detail, elegant small still life, no flat vector or cartoon, no plastic. Place the complete objects centrally with generous clear space around every extremity. No text, no letters, no logos, no people or faces. Keep alpha truly transparent, not white or checkered.
