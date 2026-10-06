# Undara

Undara is an event-focused SaaS for Digital Invitation, RSVP, guest management, optional WA Blast distribution, and event-day guestbook/check-in operations. The product is not limited to weddings: each user can create as many event workspaces as needed and activate invitations per event.

> **Undara brand system — 28 September 2026:** The product brand is **Undara** (Undangan + Acara). Canonical typography is **DM Serif Display + Roboto**. The finalized mode pair is **Light = #EDE3D8 Warm Ivory** and **Dark = #703B3B Undara Brown**; Brown is the main Light accent and `#D6B38C` Champagne is the main Dark accent. Invitation-template palettes are not globally recolored.

## Approved Landing Page

The approved landing composition, originally developed under the historical `/pagecontoh` route, now runs **directly in `app/page.tsx`** at `/`. The old `app/pagecontoh/page.tsx` route/file is no longer present in the repository; do not revive it merely because historical notes mention it. The current landing is the canonical reference for subsequent public marketing styling; **do not modify approved content, assets, interactions, layout, animations, controls, or other pages unless the owner explicitly requests that specific change**. Reuse existing components and dependencies before adding new ones.

The current scene consists of the continuous floral background and animated petals, rounded main frame, embedded Navbar/Footer, orbiting Three.js doors, two transparent cloud-copy elements with an outer Rose outline and puzzle/letter-reveal animation, bilingual text, theme controls, audio player, and Instagram link. The active homepage implementation lives in `app/page.tsx`; related pieces live in `components/Landing/`, `components/Layout/`, `components/Theme/`, and `components/I18n/`. Existing UI stack: Next.js, React, TypeScript, Tailwind CSS, Motion (`motion/react`), Three.js/React Three Fiber where already used, and shared UI components. Preserve the exact currently approved visual implementation rather than treating this description as a redesign specification.

Follow the scoped-change and validation contract in `AGENTS.md` and canonical landing requirements in `prd.md`. Former `/jiplak` and `/pintu-lab` routes were retired after approval of the production landing; do not recreate them as an alternative homepage.

## Landing door navigation: one door, then Rose light

The four existing selectable service doors remain unchanged on the approved landing. After a visitor presses `Masuk`, the existing camera zoom continues toward the selected open doorway, its inner service-image plane fades into plain Rose light, and the shared image-free Rose veil takes over during the zoom before the destination route is shown. The camera stops just before the flat portal plane instead of passing behind it and revealing other orbital doors; there is no second door asset or repeated door illustration in the transition. The `/d-invitation`, `/event-planner`, `/guestbook`, and `/undangan-fisik` destinations and the shared sound/reduced-motion behavior remain as before. The retired lab implementation is not used by production.

## Framed public template gallery

The public `/template-design` gallery uses the same frame and visual language as the approved landing and `/d-invitation`: centered 90vw Rose-bordered marketing shell, shared embedded Navbar and Footer, one public floral/petal atmosphere, and a scrollable inner catalog targeting 80vw on desktop. Root-layout Navbar/Footer, ambience and floating music/Instagram controls are suppressed on this framed route to avoid duplicate chrome; the footer inside the frame displays the existing persistent marketing audio controls and Instagram link. Interactive previews remain overlay dialogs outside the scroll-clipped frame. Light/dark and ID/EN follow the shared providers. This scoped gallery update does not alter the approved landing, Pintu or `/d-invitation` layouts.

## Digital Invitation marketing layout and Studio entry

`/d-invitation` uses one responsive content column (88% mobile, 80vw from `sm`, maximum 1100px) from Hero through FAQ, plus consistent section gaps (80px mobile / 96px desktop) without stacked Hero bottom padding. Its Design Studio text/CTA pair remains grouped closely around the center inside that shared column and the `Masuk Studio` / `Enter Studio` arrow CTA opens `/studio` rather than always landing on Dashboard home. `/studio` is an authenticated event-aware entry: with one configured event it enters that invitation's editor, with multiple events it prompts the user to choose, and with no event it offers event creation before Studio can open. A valid owned `invitationId` remains required. The package card on this marketing route uses a rounded Rose outline; the shared FAQ accordion uses rounded Rose-outlined cards and question triggers for all FAQ content. All marketing transitions, the approved landing/Pintu and invitation renderer behavior remain unchanged. `components/DigitalInvitation/MarketingTextReveal.tsx` observes headings/paragraphs/list text against the framed page\'s inner scroll panel and animates gentle opacity/vertical motion. Individual text replays when it leaves that visible panel and returns from either direction, rather than replaying while still visible; FAQ answers added by opening a row are supported. Buttons/phone previews are excluded and reduced-motion preferences are honored. The ID/EN strings and customer-facing copy are unchanged.

## Event Planner framed public page

The public `/event-planner` route now shares the approved framed marketing layout with `/d-invitation`: a Rose-outlined viewport frame, embedded navbar and footer, a single shared floral/petal atmosphere with gentle radial glow, and a scrolling middle panel. Public root layout/navigation/footer/floating-control guards treat Event Planner as a framed route, so no background/music/Instagram or navbar/footer layers are duplicated. The content column uses 88% mobile / 80vw from `sm`, capped at 1100px, with 80px/96px section spacing. Founder, services, portfolio, package, review, FAQ, and consultation content and links are unchanged; card styling follows rounded Undara-brown outlines. Event Planner section reveals replay soft opacity/vertical motion after leaving the inner scroll panel and re-entering, complemented by the shared repeatable text reveal, with reduced motion respected. Its video dialog is portaled to `document.body` so it opens above the clipped frame without changing the video button behavior.

## Three featured invitation templates on /d-invitation

The marketing collection on `/d-invitation` displays up to three READY templates rather than the entire catalog. The public `/api/templates/featured` endpoint aggregates paid Digital Invitation entitlements per invitation and ranks templates by the event's currently selected `templateKey`, counting each paid event once. Empty spots are filled with randomized ready templates; with no sales (or if the aggregation endpoint is offline), three ready templates are selected randomly without making sales claims. Template assignment can change after purchase, so the current metric is paid-event adoption rather than an immutable historical template-at-purchase sales report. No user or order records are exposed. Each card uses a slim 9:19.5 smartphone frame with bezel, notch and a lazy-loaded real preview, matching the Hero's phone proportions. The "Lihat semua template" link still opens the entire shared `/template-design` catalog; no changes to catalog/Studio eligibility.

## Zen Atelier — tema ilustrasi dengan foto pasangan (24 September 2026)

`zen-atelier` ditambahkan sebagai tema READY ke-11 pada tahap sebelumnya tanpa mengubah key lama. **Katalog aktif kini berisi 12 tema bawaan: 6 dengan foto dan 6 tanpa foto**, karena Pencil Reverie (`pencil-reverie`) telah menjadi tema tanpa foto ke-6. Daftar aktual bersumber dari `lib/templates/catalog.ts`, bukan angka historis dalam paragraf ini. Gunakan katalog di `/template-design?template=zen-atelier`, kemudian Studio memilihnya melalui registry yang sama. Tema ini menggunakan palet Zen (krem, sage, terakota), Playfair Display + Inter, amplop surat interaktif, sampul ilustrasi sakura/ensō/pegunungan tinta, foto pasangan editorial dan galeri dari pustaka foto event yang sama, serta semua 15 toggle lama (amplop + 13 bagian + musik). RSVP live tetap memakai `RsvpForm` bersama. Ucapan Tamu sekarang menggunakan `GuestWishes` dan endpoint event-scoped bersama; migrasi `20260924183000_guest_wishes` harus diterapkan di database target dan alur publik diuji sebelum dinyatakan siap produksi. Musik pengguna dan Sharp WebP untuk foto tema lain tidak berubah.

Komposisi sampul, amplop, dan dekorasi setiap bagian memakai PNG yang sudah tersedia di `public/templates/`, melalui komponen khusus Zen Atelier yang di-load terpisah; footer/RSVP/foto galeri tetap renderer bersama. Thumbnail lama tetap tersedia di `/api/template-preview/zen-atelier`. **Repo dan direktori public terbuka: file PNG yang ditampilkan oleh undangan dapat diunduh dari browser.** Keberadaan gambar bertema Zen di repo belum membuktikan semua gambar itu ekspor persis dari moodboard ChatGPT; pemeriksaan visual akhir, hak penggunaan, dan optimasi PNG besar masih perlu dilakukan. File master berlisensi yang benar-benar privat harus disimpan di storage privat di luar Git/web root dengan otorisasi server; `.gitignore` tidak menyembunyikan histori. Lihat `assets/templates/zen-atelier/README.md` untuk panduan aset.

## Historical baseline — ten themes on 22 September 2026 (5 photo / 5 photo-free)

The shared catalog declares ten active built-ins. Five use event-scoped photo slots: Romantic Rose, Eternal Blossom, Modern Maroon, Garden Light and Midnight Romance. Five are entirely photo-free: Botanical Ivory, Classic Pearl, Golden Art Deco, Paper Cut Botanical and Celestial Ink. Seven original template keys remain stable for invitation compatibility; three new themes are added to the existing manifest. A photo-free theme is art-directed through real typography/illustration and does not render customer photos or expose unused photo-slot upload controls; previously uploaded images stay stored on the event if the customer changes themes.

Each template has its own recognizable folded digital envelope, Cover/Hero treatment and section ornaments/layout, while the same shared invitation data and 13 semantic section contract remain in force. `components/PublicInvitation/InvitationThemeScenes.tsx` supplies the nine distinctly designed non-Romantic Rose entry/cover compositions, and `UniversalInvitationTemplate.tsx` keeps shared functionality and themed section layouts in one place. Romantic Rose maintains its existing dedicated renderer. Public `/template-design` supports Dengan foto/Tanpa foto filters and actual lazy template-scene thumbnails; Studio's template selector uses those live scenes too. Do not revive Unsplash demo URLs or duplicate business logic for each theme.

## Universal invitation renderer and local demo assets

Every ready built-in template now opens with an interactive digital envelope ("Buka Undangan"), followed by 13 semantic sections: Cover/Hero, Introduction/Greeting, Identity/Host/Couple, Event Detail, Date & Time, Gallery/Media, Countdown, Location/Maps, RSVP, Wishes, Gift/E-Angpao, Closing and Footer. The themed `components/PublicInvitation/UniversalInvitationTemplate.tsx` supplies the actual public renderer for six built-in themes; `RomanticRoseTemplate.tsx` retains its own presentation. `InvitationPreview.tsx` uses those same components in Studio and in the public gallery. Public invitation routes (main/per-event/personal) share `PublicInvitationRenderer.tsx`, with no separate template-specific APIs or database tables.

RSVP and Guest Wishes have shared real form/API implementations on eligible published invitations; Studio/catalog previews must not submit production data. Guest Wishes production readiness still depends on running its database migration and validating the complete public flow on the target environment. RSVP/Wishes/Gift toggles remain optional and unavailable media, Maps URL or bank details are not fabricated. Photo roles and bank/venue/event data come from the customer's own invitation. Example card images and isolated preview photos use pre-existing local `public/couple.webp`, `public/couple2.jpg`, `public/couple3.jpg` rather than Unsplash. The local assets are demo-only and never substitute for missing customer media.

## Shared invitation template catalog

`lib/templates/catalog.ts` is the **single registry for render-ready built-in templates** (including the Studio preset and preview/category metadata). `/api/templates` publishes that registry alongside published designer submissions as `ready: false` image previews. `lib/templates/use-template-catalog.ts` feeds the public gallery at `/template-design`, the marketing collection inside `/d-invitation`, and the authenticated Studio selection. Studio lists uploaded designer previews as disabled items and allows selection only for `ready: true` templates, so uploaded HTML/ZIP/JSON design packages cannot be mistaken for working invitation renderers. When a newly implemented template is registered once in the master catalog, all three surfaces pick it up automatically after deployment/refresh. Published designer uploads appear as preview-only entries without a code change; they require renderer integration before becoming usable templates.

Public visitors can explore all previews without an account. Choosing a usable template goes through `/dashboard` to login and event creation; `/dashboard/editor` is protected by the server-side Dashboard layout and requires an actual `invitationId`. The preview fixture in `data/templates/preview-invitation.ts` is isolated to gallery/master previews and never reads/writes customer invitation content. Event compatibility uses the registry’s `eventCategories`, separately from visual categories. Every catalog READY theme has exactly one event category. Wedding, Silver Wedding, Golden Wedding, Birthday, Baby Shower and Other use separate Studio/handoff choices; designer presets inherit the base renderer’s category. Silver Reverie serves only Silver Wedding, Golden Keepsake only Golden Wedding, Little Cloud only Baby Shower, and Gathering only Other. All use the shared invitation engine with optional event photos. The catalog now has 19 built-ins, including a dedicated theme for each of the six event categories. Categories with no dedicated theme show an empty state without a borrowed theme or automatic Blank Canvas. Unclassified blank masters stay preview-only; explicitly assigned custom designs retain their existing permissions. Save/Publish and custom handoff validate choices server-side without erasing existing designs.

## Product Model

### Digital Invitation
- Price: **Rp150.000 per event / invitation**.
- One activated event includes:
  - 1 Digital Invitation.
  - 1 invitation template.
  - Publication.
  - RSVP.
  - Guest management, including draggable table/seating layout, freehand bridal routes, event-scoped Save and A4/PDF print with a guest roster.
- Event creation is not capped at three. Additional events are created and activated independently.
- Payment/entitlement is event-scoped; buying one invitation must not unlock every event on the account.
- Event data and invitation design may be prepared before payment. The intended lifecycle is:
  1. `Tambah acara`.
  2. Complete event details.
  3. Save the event to PostgreSQL.
  4. `Buat undangan` for that saved event.
  5. Select and edit a template in Invitation Studio.
  6. Save the template/design.
  7. Publish.
- Before Publish, a user may edit or delete their Rangkaian Acara. After `isPublished = true`, event details are locked: customer APIs reject event-detail edits, unpublish attempts, and event deletion, while unrelated Studio capabilities remain governed separately.
- The Digital Invitation package is required at the **Publish** step, not when creating the event or entering Studio.
- Unpaid Studio sessions are preview-only and may be watermarked. Public rendering remains server-authoritative and requires a configured event, a saved template, a published state, and valid event-scoped Digital Invitation entitlement.
- Wedding family setup has separate mutually exclusive **Anak Tertua / Anak Termuda / Anak Keberapa** radio options for each partner. Only Anak Keberapa reveals and requires a positive numeric input. Shared `weddingParentLine` displays Title Case family text (`Putra Sulung Dari Bapak Chandra & Ibu Juni`, `Putri Bungsu ...`, `Putra Kedua ...`) on the dashboard and all ready invitation themes; underlying entered names remain unchanged. Existing numeric child orders remain compatible. `groomChildPosition` / `brideChildPosition` store the explicit choice separately from numeric `groomChildOrder` / `brideChildOrder`. After pulling, run `pnpm db:deploy` then `pnpm db:generate` for the target database; CI now runs formatter regression tests before building.
- Planned (not yet implemented): same-day wedding sessions for Akad Nikah / Pemberkatan Pernikahan / Prosesi Pernikahan and Resepsi, with guest-specific session invitations through Personal Invitation. Different calendar days require independent events and independently paid invitation packages. Refer to `prd.md` §5.7; the existing timing fields are NOT two wedding sessions.
- End time remains optional. Rangkaian Acara can explicitly choose `Tampilkan “- end” di undangan`; this persists through the existing `receptionTime` compatibility field as the internal `END` sentinel and renders as `- end` in Studio/public invitation output.

### WA Blast Add-on
- WA Blast is **not included** in Digital Invitation.
- **50 WA Blast credits = Rp75.000**.
- Credits are attached to the selected active event.
- The add-on may be purchased repeatedly when more quota is needed.

### Event Planner
- Public service page: `/event-planner`.
- Legacy `/wedding-planner` remains a compatibility route and redirects to Event Planner.
- Consultation service types:
  - Wedding Organizer.
  - Wedding Planner.
  - Silver / Golden Wedding.
  - Baby Shower.
- Planner packages intentionally do not show fixed pricing; consultation is directed to WhatsApp `+62 821-2478-6516`.

### Guestbook Digital
Guestbook Digital remains the onsite operational service for QR check-in, Usher App, devices, and event-day support.

## Tech Stack

### Core & Framework
- Framework: Next.js App Router / Turbopack.
- Runtime: Node.js >= 22 LTS.
- Package Manager: pnpm >= 11.
- Language: TypeScript.

### Database & Infrastructure
- Database: PostgreSQL.
- ORM: Prisma ORM.
- Deployment: Hostinger VPS (Linux Server).
- CI/CD: GitHub Actions build validation.

### UI & Styling
- CSS Engine: Tailwind CSS v4.
- Component Library: shadcn/ui.
- Iconography: Lucide React.
- Canvas Engine: Konva / react-konva.
- Animation Engine: Motion via `motion/react`.
- Image processing: Sharp.

## Static Assets

Shared runtime assets are centralized under `public/assets/`:

```text
public/assets/
  brand/undara/
  landing/doors/
  landing/ornaments/botanical/
  landing/ornaments/legacy/
  landing/reference/doors/
  marketing/
  demo/invitation/
  payments/banks/
  audio/
```

Template-owned artwork remains under `public/templates/<template>/`. Next.js app metadata icons remain in `app/icon.png` and `app/favicon.ico`. New shared files use lowercase kebab-case with no spaces; avoid adding loose files at `public/` root.

### Homepage woodland composition

The homepage `/` uses a dedicated woodland atmosphere instead of the older cloud/petal treatment. `LandingWoodlandAtmosphere` layers a soft forest silhouette behind the production Pintu and uses botanical branch assets 01–04 as edge framing. `LandingStoryCopy` keeps one restrained editorial copy block and uses branch 05 as its divider. The four-door production scene, portal interaction, Navbar, audio/footer controls and destination routes are unchanged. Other marketing routes may continue using their existing shared `PublicMarketingAtmosphere`.

## Design System

- Brand: **Undara**.
- Canonical logo implementation: `components/Brand/BrandWordmark.tsx` renders `public/assets/brand/undara/logo.webp` as the shared Undara image lockup. The monochrome image is theme-colored through semantic `currentColor`; DM Serif Display remains the display/heading font outside the logo. Use the canonical `--font-undara-heading` token for display typography.
- Canonical public tagline: **“Melangkah Bersama, Menuju Hari Penuh Makna”**. Public navbar may show it; **dashboard headers use the Undara logo only and do not show the tagline**.
- Logo / primary brand: Undara Brown `#703B3B`.
- Theme pair: **Light canvas `#EDE3D8` / Dark canvas `#703B3B`**.
- Contrast pairing: Brown accents on Light; Champagne accents on Dark.
- Deep hover / pressed Brown: `#5E3030`.
- DM Serif Display: display, headings, titles, branding.
- Roboto: body copy and application UI.
- DM Mono: metadata, status, technical labels.
- Visible UI names and standalone titles (including dashboard frame/panel headings, menu names, metric titles and displayed person/event names) use **Title Case**: capitalize the first letter of each word. Preserve official acronyms/brand spelling (`Undara`, `RSVP`, `VIP`, `WhatsApp`). Sentences/descriptions and user-written messages retain natural capitalization. Customer names and event titles are capitalized **for display only**; their stored values are untouched. Dashboard heading/menu capitalization is scoped in `app/globals.css`, with `dc-ui-name`, `dc-ui-title` and `dc-ui-label` for non-heading labels; new UI should follow the same convention in both ID/EN. See canonical `prd.md` §15.1a and `AGENTS.md` §3.
- Dashboard/operational dropdowns (including RSVP, event, guest, category/tag and WhatsApp selectors) apply the same display-only Title Case in ID/EN; native options are formatted in JSX with `lib/text/display-title-case.ts` because OS popups do not always honor CSS text transformation. Public invitation RSVP status choices are Title Case too. The underlying option values, saved names, RSVP statuses and filters do not change. See `prd.md` §15.1b.
- **QR Undangan / tiket masuk:** Beranda dan Dashboard → Undangan Digital meminta acara lalu tamu existing. Kartu berisi token HMAC `Guest.id` yang sama dengan penerbitan Usher, sehingga scanner `/api/usher/checkin` mencatat tamu yang tepat; QR ini bukan URL untuk membuka undangan. Guest wajib berada pada event owner yang dipilih. Gambar/download memeriksa sesi, ownership serta Digital payment event atau grant manual Owner aktif, private/no-store/no-referrer; rendering tidak membuat Guest atau mengubah check-in. Operasional scan mempertahankan entitlement Guestbook/Usher, origin, event match, signature dan audit/check-in atomik; scan ulang ditolak. Siapkan `QR_SIGNING_SECRET` server yang sama dengan Usher; bila tidak ada, gagal tertutup tanpa fallback unsigned/link. PNG portrait 900 × 1320/300 dpi tetap berupa kartu ucapan krem/cokelat dengan artwork woodland, judul acara, nama tamu canonical, wordmark gambar Undara dan instruksi pintu masuk ID/EN; seluruh pixel QR 640px/quiet zone 4 dipertahankan oleh qrcode/Sharp existing. Nama file memakai judul acara/nama tamu yang dinormalisasi aman. Preview dan download identik; loading/error/retry/empty guest, abort request dan key event/tamu/bahasa menjaga kartu yang dipilih. Popup desktop 48rem, kartu 28rem/70dvh, mobile mengikuti viewport dan header/tutup tetap terlihat saat scroll. Draft/tamu pending tetap mengikuti penerbitan owner existing. `/q/<invitationId>` lama dipertahankan sebagai redirect share yang memeriksa Publish/config/template/entitlement; menu baru tidak mengodekan link itu dan Usher tidak menerimanya sebagai tiket. Tidak ada dependency/migrasi DB baru. Uji perangkat/mesin fisik dan sesi customer produksi tetap perlu dilakukan.
- **QR tiket tamu internal:** Usher dan dashboard RSVP memakai PNG same-origin dari `GET /api/usher/qr`. Server memverifikasi signed token, sesi pemilik acara dan entitlement yang sama dengan penerbitan tiket; token tidak dikirim ke QuickChart/QRServer. Endpoint unduhan RSVP publik tetap memeriksa acara terbit/config, entitlement Digital pemilik (payment/grant manual aktif) dan status hadir. Tidak ada API key atau dependency baru untuk membuat QR.
- **RSVP yang dibagikan:** Form umum meminta nama/WhatsApp, status hadir dan total orang termasuk penerima (1–11, sesuai batas server 10 pendamping); personal memakai profil Guest existing dan kuota 1–30. Status non-hadir menghitung 0 pax terkonfirmasi; kuota diundang tetap independen. Event wedding/kolom tambahan muncul jika diaktifkan pada Studio Isi, divalidasi server, disimpan ke canonical Guest serta terlihat di Dashboard/CSV dengan label event. Nama+nomor pada link umum tidak menjadi izin menimpa Guest existing; gunakan tautan personal untuk recipient yang sudah terdaftar. Konfirmasi menampilkan jumlah tersimpan, dan QR guest setelah Hadir mengikuti grant manual aktif/payment pemilik yang sama dengan RSVP. Publish/config/token/attendance/quota/check-in/rate guards tetap berlaku. E2E browser/DB produksi masih perlu QA.
- Owner Panel provides a responsive Logout button using the same authenticated session endpoint and shared `components/Auth/SessionLogoutButton.tsx` as Admin. The button navigates to Login only after successful session destruction and displays an error otherwise. This UI change requires no new database migration.
- Light canvas: `#EDE3D8`; primary/accent: `#703B3B`.
- Dark canvas: `#703B3B`; primary/accent: `#D6B38C`.
- Undara Brown/Champagne are concentrated on meaningful accents, controls, selected states, links, and headings; page surfaces stay neutral.
- Canonical application button primitive: `components/ui/button.tsx`.
- All application CTA buttons use the same 16px rounded-rectangle geometry and semantic Undara colors: Light `#703B3B` with warm-white text; Dark `#D6B38C` with deep-brown text. Shared `Button`, Studio selected/action states, Dashboard/Usher actions and auth submit consume `bg-primary` + `text-primary-foreground`; legacy pre-Undara button hex values are not used for application-shell buttons. Inputs/filter/dropdowns keep the shared control geometry; navbar/icon-only controls and invitation artwork remain scoped exceptions.
- Primary desktop header/content/footer containers target **80vw**; do not reintroduce fixed `1400px` page wrappers that waste wide-screen space.
- Dashboard chrome can span the viewport, while its customer workspace is capped by the available main pane to avoid sidebar-driven overflow.
- All top-level Dashboard frame titles use the active Undara primary color and Title Case in ID/EN; body copy, guest data and nested row names remain unchanged. Main workspace actions, including Beranda's event link and WA Blast variable-insertion controls, use the shared solid-Rose `Button` with Light white / Dark black text. Grid overrides must not render standard buttons white with Rose text; navigation/account menu and special-purpose controls retain their approved appearance. See `AGENTS.md` dashboard frame/button rule and `prd.md` design notes.
- Beranda defines the canonical customer-dashboard visual language. Rangkaian Acara, Undangan, Personal Invitation, WA Blast, RSVP, Manajemen Tamu/Seating, Usher, feature gates, and reusable dashboard components must use the same neutral surface/card/table hierarchy rather than page-specific styling.
- Dashboard screenshot revision (23 September 2026) supersedes the former neutral sidebar: customer rail and brand block use strong Rose with white navigation (deeper Rose in Dark Mode), distinct hover/active shades and selected-only curved-outside corners. The customer canvas is warm Rose-tinted with neutral cards. Public marketing/navbar/Pintu remain unchanged.
- Dashboard header controls follow the existing public landing-navbar control language instead of maintaining a Dashboard-only variant. Theme and language reuse the same shared components and styling as landing; the Dashboard burger mirrors the landing burger treatment, and the account trigger uses the same restrained transparent/bordered Rose-accented control language.
- Customer Dashboard supports Light + Dark mode through the shared theme provider and Indonesian + English through the shared language provider. Indonesian is the default when no locale preference exists; theme/language controls remain accessible in the Dashboard header.
- Digital Invitation payment does not hide RSVP, Guest Management, or Personal Invitation preparation pages. Users can explore and prepare those workspaces before Publish; Digital Invitation payment is enforced on Publish. WA Blast quota and Guestbook/Usher retain their separate entitlements.
- Dashboard page introductions reuse `DashboardPageHeader` from Beranda; mobile workspaces use 16px side gutters and desktop workspaces target 80vw capped by the available pane. Native checkbox/radio controls are excluded from text-field styling.
- WA Blast is nested under Acara/Events, labeled simply WA Blast; its separate quota purchase remains unchanged.
- Operational content uses one large `DashboardPanel` frame per section; invitation and WhatsApp recipient records are plain responsive rows inside it, not separate mini-cards or forced wide tables.
- Shared dashboard presentation primitives live in `components/Dashboard/DashboardPrimitives.tsx`; extend them for new workspace UI. Real tables/graphs are welcome when backed by actual application data, never filler/mock metrics.
- Customer-facing UI copy avoids decorative sequence numbering; use descriptive labels instead. Real numeric product data (dates, time, price, counts, capacity, quota, child order, metrics) remains visible.
- Public burger navigation omits Beranda/Home because the brand logo already returns home. Indonesian service labels are `Perencana Acara`, `Undangan Digital`, and `Buku Tamu Digital`; `Layanan` retains its submenu. **Signed-out visitors see `Masuk` and `Daftar`; signed-in visitors see one `Dashboard` link instead and no `Daftar`.** `Layanan`/`Paket` use distinct icons.
- Public navbar reads `/api/auth/session` afresh when the burger is opened, so returning from Dashboard/Owner/Admin/Designer to Home shows `Dashboard` instead of stale `Masuk`/`Daftar` without a manual refresh. `lib/auth/dashboard-route.ts` centralizes role-specific dashboard URLs and is shared by navbar and the login dialog. While checking the session, inert placeholders prevent the guest auth buttons from flashing. Logout restores guest actions on the next menu opening; no credentials or role information are stored in localStorage. No database migration is required.
- Burger navigation retains its existing geometry/animation and neutral control surfaces with **Undara-brown labels/icons** in both themes. Login/Register are locked to white popup surfaces with a slight Undara-brown glow and dark text in both themes, Undara-brown outlines, shared rounded-rectangle controls (16px corners, not pills), and matching typography. Registration keeps the close `X` unobstructed, with the `Masuk` switch below the form. Do not restyle the burger or auth dialogs as a side effect of unrelated content work.
- Landing uses the 80vw width as one integrated copy + Pintu composition. The copy may widen and extend downward, with a quote/proof block above a subtle divider and capability checks below it.
- Production Pintu color pair: Light body/frame `#703B3B` + trim `#EDE3D8`; Dark body/frame `#D6B38C` + trim `#703B3B`. Geometry, animation, camera, orbit and lighting stay unchanged by this palette rule.
- Customer testimonials must be sourced from real customer feedback. Never publish invented names, quotes, ratings, or customer claims; use non-attributed brand/service statements until verified testimonials are available.

## Public Invitation Architecture

Invitation Studio menyediakan warna per elemen dari inspector kanan: warna teks/latar/garis, fill shape, tint foto/artwork dan warna frame. Rail kiri berisi Katalog, Isi, Teks, Foto, Aset, Musik. Palet desain lama tetap dirender; codec draft/Save dan renderer publik memakai override yang sama. Lihat `studio.md` dan `prd.md` untuk batas ownership, styling komponen protected dan status QA.

Saved Studio templates reopen from Designer or Owner panels and **Simpan** updates the same `DesignerTemplate` ID. DRAFT, REVIEW and PUBLISHED remain editable by their author or Owner/Admin; saving preserves status, including a Published template staying in the catalog. No V1/V2 or version history is needed. First publication still requires Review and Owner/Admin approval; archived custom jobs remain closed, and customer invitation snapshots stay independent.

Invitation identity remains database-first through PostgreSQL/Prisma. Browser cookies/localStorage are not used as the source of truth for event identity.

The invitation root domain is configurable through `NEXT_PUBLIC_INVITATION_ROOT_DOMAIN`. The existing `dcwedding.com` fallback remains for backward compatibility until a separate domain migration is defined; new customer-facing product copy uses the Undara brand and event terminology.

Legacy `/invite/[slug]` routes remain for internal routing/backward-compatible behavior where required by the application architecture.

## Engineering Principles

- **Extend Over Replace:** preserve existing routes, APIs, components, and data flows unless a deliberate migration requires otherwise.
- PostgreSQL/Prisma is the product source of truth; do not introduce mock invitation records.
- Authorization and entitlement checks are server-authoritative.
- Event-scoped guest/RSVP data must not leak or mix across invitations.
- `/dashboard`, Beranda, Pintu navigation, and protected Rose petals remain part of the product foundation.

## Repository Structure

- `app/` — Next.js routes, layouts and server API endpoints; retain existing public URLs and event-scoped authorization.
- `components/Landing/Pintu/`, `components/Layout/`, `components/Brand/`, `components/Marketing/` — landing portals, public shell, shared brand and marketing UI. The production four-door landing uses `components/Landing/Pintu/LandingDoorScene.tsx` and `PortalTransition.tsx`; the old `/jiplak`, `/pintu-lab` preview components and their engines are no longer present.
- `components/Dashboard/` — customer event, invitation, RSVP, personal invitation, WA Blast, seating and other operational workspaces. `DashboardPrimitives.tsx` owns shared large-panel UI; `DashboardSidebar.tsx` and `dashboard-navigation.ts` own navigation. `EventPanel.tsx` uses adjacent `EventFields.tsx`, `event-panel-helpers.ts` and `event-panel-types.ts`; `SeatingChart.tsx` coordinates `SeatingPlanCanvas.tsx`, `SeatingPlanPrint.tsx`, `use-seating-plan.ts` and shared seat geometry/types. `lib/seating/` owns the private layout codec, bounded undo/pointer state, client persistence and canonical colors.
- `components/InvitationStudio/` — live event-scoped Studio. The `/studio` event-selection gateway uses `StudioEntrySection.tsx` here, while the unrelated marketing `DigitalInvitation/StudioSection.tsx` remains the landing CTA. `InvitationDesigner.tsx` owns editing state and save operations; `TemplatePanel.tsx`, `AssetPanel.tsx`, `AssetLayerInspector.tsx`, `PhotoPanel.tsx`, `DesignerPanels.tsx` and `InvitationPreview.tsx` handle their existing presentation; `designer-*.ts` define shared state/types/config. `RsvpForm.tsx` is used by public invitation templates; customer Guest Management resides in `components/Dashboard/`, **not** the removed `components/InvitationStudio/GuestManagement.tsx`.
- `components/PublicInvitation/` — real template scenes, shared RSVP/Wishes/music/asset rendering; `UniversalInvitationTemplate.tsx` and `RomanticRoseTemplate.tsx` retain their visual identity while sharing `lib/invitations/countdown.ts`. Theme-specific rendered React artwork, such as `ZenAtelierArtwork.tsx`, lives next to the renderer; `assets/templates/zen-atelier/README.md` remains an asset reference, not a runtime code module.
- `components/Usher/`, `components/Payments/` — operational check-in and package/checkout UI.
- `data/services/`, `data/templates/preview-invitation.ts` — static marketing service content and **demo-only** invitation fixture. Active template discovery uses `lib/templates/catalog.ts` and `lib/templates/use-template-catalog.ts`; do not restore deleted `data/templates/showcase.ts` or parallel template lists.
- `lib/` — reusable feature/domain code, authentication, guest identity, invitation parsing, template registry, security, private-media storage helpers and API helpers; `prisma/` — database schema and **retained** ordered migrations; `public/` — intentional browser-public app/template assets plus legacy customer URLs during migration only; new customer `InvitationAsset` binaries live outside the web root under `UNDARA_DATA_DIR`; `tests/` — source and domain regression tests; `.github/workflows/` — build and orphan-reference audit.

Naming rule: prefer existing semantic modules. Refactor only when a genuine boundary improves maintenance; do not create `V2`/`V3` or new database models for existing event/guest information. Feature `.tsx` filenames use descriptive PascalCase; `app/` route filenames and shadcn `components/ui/` primitives retain framework conventions. Run `tests/repo-file-naming.test.mjs` for the naming guard. Do not rename existing `public/` assets or customer-facing URLs merely for prettier names.

## Getting Started

### Prerequisites
- Node.js >= 22.0.0
- pnpm >= 11.0.0
- PostgreSQL database

### Database migrations

Development migration:

```bash
pnpm db:migrate
```

Production/VPS migration after pulling a version that contains new Prisma migrations:

```bash
pnpm db:deploy
```

`pnpm build` / GitHub Build Validation does **not** apply PostgreSQL migrations. A deployment that updates Prisma schema-dependent application code must run `pnpm db:deploy` against the target production `DATABASE_URL` before the updated app is relied on. If the application returns a database-schema synchronization error while saving/loading events, apply the pending migrations on the server first.

The seating editor requires migration `20261006043000_event_seating_plan`. In **Manajemen Tamu → Pengaturan Meja**, drag tables directly to move them together with their seats or place guests. **Gambar jalur** toggles mouse drawing; click it again or press Escape to return to moving. Use **Tambah meja** to append tables (the count means additions, within 100 per event), then **Simpan denah** to update the event's private layout. Undo/Redo affects layout; guest assignments retain their existing immediate server save. **Cetak** prints the current layout and roster, including unsaved geometry, through the browser's printer/PDF dialog. Long plans use overlapping A4 landscape pages; printing does not auto-save or create a public link.

**Muat ulang** fetches saved data. **Kosongkan denah** separately asks for confirmation, then immediately removes the current event’s tables/routes/seat placements together on the server; guest records, RSVP, pax, tickets and check-in remain intact. It requires a loaded revision and rejects stale table/layout snapshots. Failure keeps the draft; success resets layout Undo and leaves **Tambah meja** available to rebuild the space. It does not require a second Save.

If layout loading fails, move/draw/print remain available on the displayed local plan; Save requires a successful server load and current revision. Reload keeps an edited draft in Undo. `SEATING_STORAGE_UNAVAILABLE` (503) identifies a missing layout table/column or a cached older Prisma client. After pulling schema changes, stop the dev server, run `pnpm db:deploy` and `pnpm db:generate`, then restart `pnpm dev`; the development Prisma singleton otherwise retains its older client. These steps must run in the environment serving the app, not just in GitHub CI.

### Private invitation media on a VPS

Customer photo/music uploads do **not** belong in `public/`. Local development may leave `UNDARA_DATA_DIR` blank and uses `.undara-data`. Production must set it to an absolute, persistent path outside the repository/web root, for example:

```env
UNDARA_DATA_DIR="/var/lib/undara"
```

Create that directory on the target VPS/volume with ownership limited to the application account and include it in the same operational backup/restore plan as PostgreSQL. A redeploy or fresh Git checkout must not delete this directory.

For an existing deployment that still owns legacy `public/uploads/images` or `public/uploads/music` files, first back up both PostgreSQL and those files, then inspect the migration without changing data:

```bash
pnpm storage:migrate-invitation-media
```

If every expected file is found, apply it:

```bash
pnpm storage:migrate-invitation-media -- --apply
```

The apply run moves the database URLs to the authorized media endpoint and removes migrated binaries from the old public web root. Treat any non-zero exit, missing file, or leftover customer binary in `public/uploads` as incomplete migration; investigate before production sign-off.


## Documentation Governance

- `prd.md` §§1–21 is the sole active product requirement source; its Appendix A records historical changes and dated validation, **not** new implementation commands.
- `AGENTS.md` governs engineering and cross-feature constraints; `template.md` and `studio.md` are scoped production/implementation guides; `checklist.md` tracks unfinished work and launch QA. See `prd.md` §21 for precedence.
- Legacy `prd-tambahan.md`, `prd-landing.md`, `prdpaging.md` and `pintu3d.md` are intentionally retired. Their archive references are preserved in `prd.md` Appendix A; do not recreate them.
- This README is for project orientation and operating instructions, **not another dated PRD or changelog**. Past landing, dashboard, template and Studio implementation notes have been consolidated into the canonical PRD and Git history. For changes not yet verified in a browser or against the target database, consult `checklist.md`; a successful build is not production sign-off.

## Active Feature Pointers

- Public marketing: `app/page.tsx`, `app/d-invitation/page.tsx`, `components/Landing/Pintu/LandingDoorScene.tsx`, `components/Layout/`. Preserve the approved four-door landing and image-free Rose entry transition. Current visual specifications are in `prd.md` §15.
- Dashboard: `app/dashboard/page.tsx`, `components/Dashboard/`. Its current one-mainframe, large-section-panel, white/black with Rose accents and ID/EN rules are in `prd.md` §6. `dashboard-redesign-history.md` is an implementation journal, not a competing design spec.
- Invitation themes and customer editor: `lib/templates/catalog.ts`, `components/PublicInvitation/`, `components/InvitationStudio/`, `template.md`, `studio.md`. The live catalog contains the authoritative ready status, photo capabilities and theme keys. Preview names and images belong only to `data/templates/preview-invitation.ts`, never to customer records.
- Guests and event data: the existing event-scoped `Guest` model is shared by Personal Invitation, RSVP, seating, WA Blast and Usher. Do not introduce duplicate guest tables. `lib/templates/music.ts` owns built-in songs; `GuestWishes` uses its existing per-event model/API.
- Personal invitations reuse the owner's invitation design saved in Edit invitation/Studio. Choose Bapak / Ibu / Bapak & Ibu, enter names in the compact Name field (bulk paste remains supported), adjust Reguler/VIP/VVIP, choose the saved invitation title and Create personal links. Each pending row retains its own editable salutation, stored separately from the canonical guest name in the existing envelope addressee. This writes recipient links only; design editing/saving and parent publication stay in their existing invitation workspace. Personal drafts support Publish all/individual publication and Copy link/WhatsApp composer actions, with current parent/entitlement gates. Canonical Guest IDs/profiles and safe batch retries remain shared with RSVP/seating/check-in. See `prd.md` §9.3.
- Deployment: after pulling migrations, apply `pnpm db:deploy` to the **target** PostgreSQL instance before relying on schema-dependent features, then generate the Prisma client as needed. A GitHub build does not migrate your local/production database. Verify login, paid/published invitations, RSVP/Wishes, QR and real media storage separately; unresolved launch checks are in `checklist.md`.

## Google sign-in setup and diagnostics (23 September 2026)

The existing Google action on both Login and Daftar uses a server-side authorization-code flow: `/api/auth/google` → Google → `/api/auth/google/callback` → user/session database → the role-appropriate area. This feature **requires per-environment OAuth credentials**; a successful production build or the presence of the Google button does not prove that the local/private setup is complete. The tracked `.env.example` intentionally contains blank placeholder values, not the operator's local secrets.

For local development, use an OAuth Client ID/Client Secret for **Web application** in Google Auth Platform and place these in your private `.env.local` along with `APP_URL="http://localhost:3000"`. In that same Google client, add `http://localhost:3000/api/auth/google/callback` exactly as an Authorized redirect URI. Open the app in the browser as `http://localhost:3000` (not its advertised LAN address `http://192.168.x.x:3000` when APP_URL and redirect registration use localhost), and restart `pnpm dev` after changing server env. Keep credentials out of chat, screenshots, logs, NEXT_PUBLIC_* variables, and git commits. Production must register the exact HTTPS callback for its own public domain. The Google token exchange happens on the server, and a real account/session additionally requires the local PostgreSQL database and schema to be ready.

Troubleshooting: `google_config` indicates that client credentials are unavailable on the server; `redirect_uri_mismatch` is Google's own error when its registered redirect URI does not exactly match the authorization request; `google_state` indicates the short-lived CSRF cookie did not survive or did not match (check same browser/site origin, cookie settings, and elapsed time); `google_denied` means the Google authorization was cancelled; `google_token` indicates token exchange failure (check client ID/secret pairing and callback configuration); `google_profile` means the API could not supply a verified email; `google_database` indicates account/session persistence failed (check PostgreSQL/Prisma). The auth callback now uses non-sensitive codes in the existing Login popup rather than treating every failure as the same generic error. A provider-side access restriction may depend on the configured app Audience/publishing state; check the exact Google screen rather than assuming the same cause for every failure. Do not assert end-to-end sign-in until it has been verified with the operator's actual credentials and browser; avoid touching the approved auth/burger appearance while troubleshooting.
