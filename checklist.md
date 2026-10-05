# Undara — Launch Readiness Checklist

**Status:** Living launch-hardening guide  
**Initial audit:** 17 September 2026  
**Scope:** Production readiness for the general-event Undara SaaS.  
**Canonical product requirements:** `prd.md`  
**Engineering rules:** `AGENTS.md`  
**Implementation history:** `prd.md` → Appendix A

> This file is a launch checklist, not a parallel PRD. If this file conflicts with `prd.md`, `prd.md` wins. When an item is implemented, follow `AGENTS.md`: update `prd.md` only if requirements changed and append implementation history/validation to Appendix A in `prd.md`.

## Tahapan aktif setelah handoff — 3 Oktober 2026

Kerjakan satu batch kecil → verifikasi → commit sebelum membuka batch berikutnya. Status berikut mengacu ke source repo, bukan salinan PRD/chat lama.

**Arahan owner terbaru:** Studio didahulukan. Lanjutkan item Studio di bawah satu per satu sebelum membuka batch storage/auth/custom atau halaman lain. Checkbox implementasi/tes source tidak menggantikan QA browser.

- [x] Warna per elemen di inspector kanan (5 Oktober 2026): latar/garis teks, tint/frame foto dan aset, warna artwork SVG, prioritas native override serta warna field RSVP/Ucapan. Menu Warna kiri dihapus; palet lama tetap kompatibel. Kontrol frame native mengikuti box aktual, tint raster mempertahankan detail. Lokal 537/537 tes, TypeScript dan build webpack 72/72 lulus; lint sama dengan baseline tanpa diagnostic baru. Rincian di Appendix A PRD.
- [ ] QA warna di browser: canvas → Undo/Redo → Preview Desktop/Tablet/HP → Simpan → reload → public, reset warna/transparent, SVG group/ornamen raster, section duplikat dan ID/EN. Runtime browser lokal belum tersedia; parser CSS/SSR tidak menggantikan pemeriksaan pixel atau gesture.

- [x] Cek prioritas canonical pada `prd.md`: brand Undara, general-event, tanpa limit 3 event, publish/entitlement server-authoritative dan event-scoped, serta private `UNDARA_DATA_DIR`. Ini audit prioritas handoff, bukan klaim seluruh Markdown bebas kontradiksi.
- [x] Music Asset Library Studio: 14 lagu bundled dari registry bersama, cari judul/artis, dengarkan tanpa mengganti pilihan, radio pilihan aktif/default, upload event terpisah, dan event playback bersama. Jalur Save lama tetap dipakai.
- [x] Batch musik `1d77985`: 366/366 regression tests, TypeScript dan build produksi 72/72 halaman lulus lokal dan pada GitHub Actions [Build Validation](https://github.com/wanzy0808/Undara/actions/runs/37078220318). [Orphan Audit](https://github.com/wanzy0808/Undara/actions/runs/37078220311) juga success. QA browser terautentikasi tetap terbuka.
- [x] Guard Simpan Desain memeriksa upload musik privat dan legacy sebagai aset AUDIO milik customer + event yang sama di dalam lock delete; draft lama tidak dapat mengembalikan referensi audio yang dihapus. Bukti regresi ada pada `tests/studio-music-save.test.mjs`; konkurensi PostgreSQL nyata tetap perlu QA.
- [x] Guard musik commit [`31b197a`](https://github.com/wanzy0808/Undara/commit/31b197a13bef5adc2ccb7bfcf8fe12e126972e9f): 373/373 tes lokal, TypeScript/build lulus; [Build Validation](https://github.com/wanzy0808/Undara/actions/runs/37082214521) dan [Orphan Audit](https://github.com/wanzy0808/Undara/actions/runs/37082214520) success.
- [x] Lifecycle pan: Space lepas di luar canvas, focus/blur, tab hidden, pointer cancel/lost capture, dan unmount melepas pan; pointer kedua tidak mengambil alih, klik setelah cancel tetap berfungsi, Space pada tombol Amplop/Isi tidak dibajak. 9 regression tests model/lifecycle baru; suite lokal 382/382, TypeScript/build lulus. QA browser pointer/touch masih terbuka.
- [x] Pan commit [`a85b0ef`](https://github.com/wanzy0808/Undara/commit/a85b0efa5237aaa257cc6ac04fc35d77f5c319e4): [Build Validation](https://github.com/wanzy0808/Undara/actions/runs/37082869495) dan [Orphan Audit](https://github.com/wanzy0808/Undara/actions/runs/37082869490) success.
- [x] Scope shortcut Amplop/Isi: Delete/clipboard hanya saat target berada di canvas; input/contenteditable/seleksi teks tidak dibajak. Ctrl/Cmd+Z dan Shift+Z serta Ctrl+Y memakai Undo/Redo desain yang sama dengan toolbar. 6 regression tests baru; suite lokal 388/388, TypeScript/build lulus. Interaksi browser nyata tetap perlu QA.
- [x] Shortcut commit [`fe081a5`](https://github.com/wanzy0808/Undara/commit/fe081a5c2fb1eca1976f22f374580505a3619cad): [Build Validation](https://github.com/wanzy0808/Undara/actions/runs/37083395706) dan [Orphan Audit](https://github.com/wanzy0808/Undara/actions/runs/37083395665) success. Log CI mengonfirmasi 388/388 tes dan build 72/72 halaman.
- [x] Editing Foto dipusatkan di inspector kanan: fokus/crop/rasio/posisi/zoom, urutan/gaya/autoplay/transisi Galeri serta motion. Kiri berisi koleksi/upload/assignment; menu Foto dan pemilihan slot/foto membuka inspector yang sesuai. 6 tes render/wiring baru; lokal 394/394 regression tests, lint panel, TypeScript dan build lulus.
- [ ] Studio Foto: QA browser perpindahan slot/Foto → inspector kanan, crop/urutan/playback, penutupan seleksi, mobile scroll, dan Save → reload → public.
- [x] Ringkas copy seluruh menu Studio: hapus penjelasan berulang di tombol/kartu dan detail implementasi; label editor 8–11px menjadi minimal 12px, aksi utama 14px. Batas upload, error, aksesibilitas serta kontrol yang sama dipertahankan. Lokal 394/394 tes, TypeScript/build lulus; lint 13 file lulus, dua error effect lama terkonfirmasi pada baseline.
- [x] Audit inspector kanan Foto: Perbesaran foto/Bingkai foto dibedakan, rasio hanya pada slot yang mendukungnya, crop mempertahankan rasio/zoom, lost capture batal, zoom presisi/batas tanpa history kosong, serta Parallax piksel dan OFF persisten. Lokal 506/506 tes, lint 11 file, TypeScript dan build 72/72 lulus.
- [ ] Inspector kanan Foto: QA browser semua slot/tema pada desktop/mobile ID/EN Light/Dark; crop/zoom/rasio, ukuran frame, cancel/touch, Parallax OFF/Reset dan Undo/Redo → Simpan → reload → public. SSR/handler fixture belum menggantikan sesi dan visual nyata.
- [ ] Studio menu: QA visual desktop/mobile Light/Dark dan ID/EN untuk keterbacaan, wrapping label, tooltip serta scroll inspector setelah pemadatan copy.
- [x] Tombol Foto memakai Kembali ke bawaan (ID) / Back to default (EN), menggantikan Otomatis; nama aksesibel mengikuti label dan slot. 6/6 regression tests Foto termasuk label ID/EN serta lint PhotoPanel lulus.
- [x] Seleksi/geser frame foto mempelai: pilihan role mengarahkan canvas ke Identitas; klik foto memilih frame tanpa memulai crop dan tetap membuka canvas pada mobile. Crop dimulai eksplisit dari inspector kanan. Handle mengikuti target yang terlambat dimuat. 6 tes baru; lokal 400/400 regression tests, TypeScript, lint lima file/helper dan build lulus.
- [ ] Foto mempelai: QA browser pilih → drag/resize/rotate, Crop → Selesai, pan/zoom/mobile, serta Undo/Redo → Simpan → reload → public. Tes source/observer/SSR tidak menggantikan interaksi pointer nyata.
- [x] Klik background membuka properti section kanan, melepas seleksi native/foto, dan menampilkan Latar di awal. Background pan baru capture setelah drag >3px; tap/cancel/release luar canvas dibersihkan. Warna Amplop/Cover mencapai root scene dan tetap memakai sectionStyles yang sama. 5 tes baru; lokal 405/405, TypeScript dan build lulus; lint lima file tanpa error, satu warning renderer lama.
- [x] Latar section per instance (5 Oktober 2026): duplikasi menyalin warna efektif awal, edit/reset warna tidak mengubah saudara, fallback legacy tetap terbaca, dan background mencapai scene Cover. Lokal 545/545 tes, TypeScript dan build webpack 72/72 lulus; lint tanpa diagnostic baru.
- [ ] Background section: QA browser klik latar → ganti warna → Reset, pan/Space/zoom/touch, Amplop/Isi dan perpindahan dari seleksi foto/native; Undo/Redo → Simpan → reload → public. Warna kini terpisah per ID instance; validasi browser independensi warna dan reset masih terbuka.
- [x] Hapus seluruh jenis target visual native Studio, tombol Hapus kanan, seleksi/crop cleanup, layout kosong dan pemulihan Default/Undo; codec mendukung 512 target dengan selector tetap terverifikasi. Regresi handler/serialization/SSR ditambahkan pada batch `fix(studio): allow reversible deletion of every visual target`.
- [ ] QA browser penghapusan foto/data/tombol/group/section, keyboard dan tombol Hapus, Simpan → reload → public, Default dan Undo pada desktop/HP.
- [ ] Uji browser musik: browse → play/pause → pilih → Simpan → reload → preview/public, ID/EN, ganti template, upload/delete, panel ditutup, tab tersembunyi, dan tidak ada dua player berbunyi. Gunakan akun/event yang benar.
- [ ] Studio resize/rotate: QA delapan handle, sisi/sudut yang tetap, objek berotasi, serta parity Amplop/Isi dan renderer publik.
- [x] Lock dan urutan elemen bawaan (5 Oktober 2026): lock editor tersimpan terpisah dari paint, guard styling/drag/resize/keyboard/Delete, unlock tetap tersedia, serta empat aksi urutan untuk box satu parent/instance nyata. Codec, command editor, runtime DOM fixture, gesture fixture dan SSR inspector diperiksa; lokal 556/556 tes, TypeScript dan build webpack 72/72 lulus, lint tanpa diagnostic baru.
- [ ] Studio layer: QA browser naik/turun satu posisi dan front/back, batas urutan, grup/section terpisah, multi-select aset, lock/unlock/hide, pointer desktop/touch dan shortcut → Undo/Redo → Simpan → reload → public. Fixture DOM/gesture belum membuktikan stacking atau interaksi browser nyata.
- [ ] Studio pan: QA mouse/touch pada 100% dan rentang zoom, Space/focus/tab interruption, dan klik seleksi setelah cancel.
- [x] Fokus shortcut shape: menambah lingkaran/persegi/garis melepas seleksi sebelumnya, memilih layer baru dan memfokuskan canvas; pemilihan objek di canvas/daftar juga memberi fokus. Mobile menampilkan canvas; Delete/Backspace tetap memakai penghapusan/history dan guard input/lock yang sama. Lokal 405/405, TypeScript/build lulus; ESLint identik baseline 4 error + 6 warning, tanpa temuan baru.
- [ ] Shortcut shape: QA browser Tambah Lingkaran → Delete/Backspace → Undo/Redo, seleksi ulang, locked/input, Amplop/Isi/mobile dan Simpan → reload → public.
- [ ] Studio keyboard: QA Delete/clipboard/Undo/Redo pada Amplop/Isi, fokus input/panel luar, IME dan seleksi teks.
- [ ] Studio toolbar follow: QA bounding/handle/inspector saat scroll, zoom, resize dan ganti stage.
- [ ] Production storage: verifikasi volume `UNDARA_DATA_DIR`, dry-run migrasi file legacy, review hasil sebelum apply pada server target.
- [ ] Backup/restore: uji pemulihan PostgreSQL + private media pada environment terpisah; catat hasil nyata sebelum sign-off.
- [ ] Authorization: negative E2E Customer A/B dan role matrix; source hardening 2 Oktober sudah ada, full runtime audit masih terbuka.
- [ ] Custom flow: verifikasi migration deploy dan Owner → assigned Designer → review → handoff/archive dengan file event user.
- [ ] Template/marketing/dashboard: QA flicker/overlap dan seluruh section, lalu device/Light/Dark/ID/EN secara terlingkup.

Implementasi storage/custom/auth yang sudah ada tidak diulang. Fitur ekspansi menunggu fondasi dan bukti QA di atas. `prd.md` Appendix A menyimpan rationale dan hasil per batch.

## Popup kode referral — 4 Oktober 2026

- [x] Beranda: satu tombol `Kode Referral` di aksi atas; input dan `Submit` berada di shared dialog. Form/promo/harga inline dihapus; kode aktif dapat diganti/dihapus dari popup, feedback ID/EN dan abort GET tetap aman. SSR trigger ID/EN, 499/499 tes, lint UI, TypeScript dan build 72/72 lulus lokal.
- [ ] QA browser customer: buka/tutup/Escape/fokus kembali, submit Enter, kode valid/tidak aktif, load/error, ganti/hapus/reopen, serta desktop/mobile Light/Dark/ID/EN dengan persistence sebenarnya.

## Generator QR internal — 4 Oktober 2026

- [x] QR berbagi undangan: QuickChart diganti `qrcode` existing di server aplikasi, PNG 640px/quiet zone 4, pratinjau/unduh dan URL stabil tetap sama. Sesi, owner, ID dan pembayaran tetap diperiksa sebelum encoding; 13 tes handler baru membuat total lokal 441/441 lulus. Lint route/tes baru lulus.
- [x] QR tiket Usher dan dashboard RSVP: kedua renderer eksternal diganti PNG same-origin dengan validasi signed token, sesi/event owner dan entitlement existing/explicit owner grant. 18 tes baru; total lokal 459/459, lint file QR, Prisma generate, TypeScript dan build 72/72 lulus. Penerbitan/check-in dan gate RSVP publik tetap dipertahankan.
- [x] Batch undangan [`9f2b4b6`](https://github.com/wanzy0808/Undara/commit/9f2b4b6fa4de4192b76a6427d33d3df1b707b8c7): [Build Validation](https://github.com/wanzy0808/Undara/actions/runs/37152044594) 441/441 tes dan build 72/72, serta [Orphan Audit](https://github.com/wanzy0808/Undara/actions/runs/37152044583) success.
- [x] Beranda → QR Undangan: pilihan eksplisit dari daftar owner; akses server dari payment per event atau grant manual aktif, draft dengan akses tersedia, grant tidak dianggap payment/penjualan. Pratinjau bersama halaman Undangan, loading/error/retry, download setelah PNG siap, close abort dan ID/EN. Batch menu awal: lokal 464/464, Prisma generate, TypeScript/build 72/72 lulus. Lint file baru/Overview/i18n/tes bersih; error/warning effect lama pada panel Undangan identik parent.
- [x] QR dari hak manual Owner Rp150.000: samakan daftar, PNG/download, redirect scan, varian halaman publik dan media dengan shared entitlement pemilik event. Ownership, Publish/template/config, password serta publikasi guest tetap berlaku; grant yang dicabut tidak membuka QR tanpa payment valid. Media grant-only private/no-store; tidak membuat payment palsu atau migrasi. Hasil validasi dicatat pada Appendix A batch perbaikan.
- [x] Nama unduhan QR mengikuti judul acara tersimpan, dengan normalisasi aman/fallback dan panjang dibatasi; tombol mengikuti filename server. Tujuan QR tetap memakai ID undangan yang sama. Validasi dicatat pada Appendix A batch filename.
- [x] Popup QR: hapus subtitle “Satu QR untuk setiap undangan” dan terjemahan penjelasan lama yang tidak terpakai. Judul/label/aksi singkat serta status yang diperlukan tetap ada. Lokal 499/499 tes, lint dua file UI, TypeScript dan build 72/72 lulus.
- [x] Pratinjau QR Beranda/Undangan: hapus “Tautan terbuka setelah Publish” beserta terjemahannya dan prop preview yang hanya dipakai untuk penjelasan itu. Lokal 499/499 tes, TypeScript/build 72/72 lulus; lint empat file bersih dan temuan panel Undangan identik baseline.
- [x] Kartu download QR Undara (5 Oktober 2026): PNG 900 × 1320/300 dpi, ucapan terima kasih ID/EN, judul acara aman/terbatas dan logo gambar kanonik; semua pixel QR 640px/quiet zone tetap utuh. Lokal 565/565 tes, lint, TypeScript dan build webpack 72/72 lulus. PNG ID/EN/judul panjang diperiksa, tiga varian berhasil dibaca decoder independen; font, lisensi dan logo terverifikasi dalam trace deployment.
- [x] Pratinjau kartu QR sama dengan download (5 Oktober 2026): Beranda dan panel Undangan memakai PNG branded yang sama; tes handler membuktikan bytes preview/download identik untuk ID/EN. Kartu portrait di tengah, batas lebar/tinggi viewport dan tombol di bawah; key undangan/bahasa mereset kesiapan gambar. Guard akses, locale aman dan pemulihan retry diperiksa. Lokal 567/567 tes, lint lima file, TypeScript dan build webpack 72/72 lulus; batas tinggi terverifikasi dalam CSS hasil build. QA browser tetap pada item terbuka di bawah.
- [ ] QA customer hak manual: panel Owner → Beranda QR → preview/download → scan undangan terbit beserta foto/password, lalu revoke grant. Verifikasi record user yang dilaporkan pada database/deployment aktual; tes fixture tidak menggantikan sesi customer.
- [ ] QR Beranda: QA browser sesi customer desktop/mobile Light/Dark/ID/EN, pilih A → B saat gambar memuat, tutup/Escape/fokus kembali, empty/error/retry dan download PNG aktual. SSR/helper tests tidak menggantikan native browser behavior.
- [ ] QR: QA scanner perangkat nyata serta sesi owner → pratinjau/unduh kartu ID/EN → cetak/scan pada domain produksi publik; uji decoder fixture/handler tidak menggantikan kamera, hasil printer atau PostgreSQL/E2E.

## Rebrand Undara — migrasi bertahap (28 September 2026)

- [x] Homepage woodland composition: forest silhouette sebagai depth di belakang Pintu, branch 01–04 sebagai edge framing, branch 05 sebagai divider copy; cloud bubble dan petal ambience tidak dipakai di homepage.
- [ ] Browser QA woodland homepage pada desktop/mobile Light/Dark untuk memastikan ornament tidak menutup Pintu, logo, controls, widget Jelajah, atau footer.

- [x] Konsolidasikan shared static asset ke `public/assets/`; pertahankan `public/templates/<template>/` untuk asset template-owned dan `app/icon.png` untuk metadata icon Next.js.

- [x] Tetapkan nama customer-facing **Undara** (Undangan + Acara) di aturan canonical.
- [x] Tetapkan font **DM Serif Display + Roboto**.
- [x] Finalisasi pasangan mode: **Light `#EDE3D8` / Dark `#703B3B`**; Brown menjadi accent Light dan Champagne `#D6B38C` menjadi accent Dark.
- [x] Canonical application buttons: Light Brown `#703B3B` + warm-white text; Dark Champagne `#D6B38C` + deep-brown text; legacy Rose button hex dihapus dari shared Button dan Studio selected/action states.
- [x] Ubah root metadata, wordmark teks, i18n/footer utama, dan semantic theme tokens tanpa mass-rename identifier internal.
- [x] Dark base berpindah dari black/near-black ke Undara Brown pada token global/dashboard foundation.
- [x] Light brand chrome berpindah dari Rose/pink ke Undara Brown.
- [x] Palette Pintu produksi: Light body `#703B3B` / lis `#EDE3D8`; Dark body `#D6B38C` / lis `#703B3B`, tanpa perubahan geometry/motion.
- [x] Integrasikan logo Undara final melalui `public/assets/brand/undara/logo.webp` dan shared `BrandWordmark`.
- [ ] Audit sisa hardcoded Rose/pink/black pada marketing, auth, dashboard, owner/designer, dan public chrome satu per satu.
- [ ] Audit seluruh customer-facing string `Undara`; pertahankan hanya histori, compatibility, atau legal context yang masih benar.
- [ ] Review Privacy/Terms setelah identitas badan hukum/contact/domain baru dikonfirmasi; jangan mengarang perubahan legal.
- [ ] Review domain, email, Instagram/social handle, WhatsApp label, OpenGraph/SEO image dan manifest setelah aset/akun baru siap.
- [ ] Refactor identifier internal `dc-*` → `undara-*` hanya jika aman dan disertai regression test; compatibility alias boleh dipertahankan selama migrasi.
- [ ] Browser QA Light/Dark + ID/EN untuk landing, marketing pages, auth, dashboard, Studio, owner/designer.
- [ ] CI/build terbaru lulus setelah setiap batch rebrand sebelum batch berikutnya disebut selesai.

**Batas:** palette artwork/template undangan tidak ikut diganti global; template tetap boleh mempunyai identitas warna sendiri.

---

> **Catatan audit dokumentasi (24 September 2026):** ringkasan dan checkbox bertanggal 17 September adalah snapshot historis, **bukan** verifikasi bahwa seluruh status launch masih berlaku pada HEAD atau environment produksi sekarang. Untuk setiap klaim readiness baru, periksa source/CI/migrasi/E2E terbaru dan catat tanggal, commit serta environment. Persyaratan aktif berada di `prd.md` §21; checklist ini hanya alat QA.

## Pemeriksaan terbaru — 26 September 2026

Ringkasan ini memperbarui pembacaan snapshot 17 September di bawah; checkbox lama tetap sebagai catatan audit historis. **Belum ada sign-off produksi.**

| Area | Sudah ada pada source/CI | Masih perlu dibuktikan |
| --- | --- | --- |
| Akun | Resend email verifikasi, reset password, invalidasi sesi reset, pembatasan request per proses; Build Validation `7356c351` lulus. | Konfigurasi `APP_URL`/Resend, pengiriman email nyata, alur klik dan rate limit terdistribusi pada multi-instance. |
| Pembayaran | Invoice `PaymentOrder`, aktivasi server, klaim `PENDING` atomik untuk mencegah aktivasi/kuota ganda; Build Validation `da8e1c25` lulus. | Uji konkurensi PostgreSQL nyata, rekonsiliasi dan pemeriksaan manual end-to-end; bukti transfer masih URL/data di database. |
| Media | Upload `InvitationAsset` baru keluar dari `public/`: source memakai private `UNDARA_DATA_DIR`, authorized media endpoint, Sharp WebP, audio signature/range, dan Build Validation `36984310873` lulus pada `6435f0d`. | Konfigurasi persistent volume production, dry-run/apply migrasi legacy `public/uploads`, backup+restore nyata, dan browser playback/password/personal E2E. |
| Studio | Perbaikan seleksi layer terkunci/overlap `ab1a9de0`; Build Validation lulus. | QA gestur pointer/touch, gambar transparan bertumpuk dan kesetaraan renderer publik. |

Urutan kerja aktif mengikuti Tahapan aktif setelah handoff di atas. Akun/pembayaran dengan PostgreSQL dan email nyata, volume persisten/migrasi legacy, otorisasi lintas akun, E2E dan backup/restore tetap menjadi prasyarat sign-off production, bukan dianggap selesai oleh commit source.

---

## Status legend

- [x] **Audited present** — implementation evidence exists in the repository. This does **not** automatically mean production/E2E verified.
- [ ] **Open** — missing, incomplete, or not yet verified strongly enough for launch sign-off.
- **BLOCKER** — should be resolved/verified before public paid launch.
- **P1** — launch-quality requirement; may be completed during launch hardening.
- **P2** — useful after launch; should not delay the first safe release unless product scope promises it.

---

# 1. Current audit summary

The product core is substantially implemented. Undara is no longer primarily in feature-building mode; the remaining work is mostly **launch hardening, production operations, security verification, and end-to-end validation**.

Current repository evidence already shows:

- [x] PostgreSQL/Prisma is the product source of truth.
- [x] Custom database-backed authentication/session infrastructure exists.
- [x] Passwords are hashed with bcrypt.
- [x] Session tokens are random, stored hashed, and sent through HttpOnly cookies.
- [x] Session cookie uses `SameSite=Lax` and `Secure` in production.
- [x] Email verification data model/route exists.
- [x] Server-side invitation ownership checks exist in important event/payment/upload mutations.
- [x] Publish gate checks configured event, template, payment entitlement, and ownership server-side.
- [x] Published event metadata cannot be edited/unpublished/deleted through the main invitation API.
- [x] RSVP is event/slug scoped and checks configured + published + entitlement state.
- [x] Public RSVP has basic rate limiting.
- [x] Upload API validates ownership, MIME family, size, count limits, and optimizes images.
- [x] New customer InvitationAsset binaries are stored outside the public web root and served through an authorization-aware media endpoint; legacy public files require deployment migration.
- [x] Owner/Designer custom-edit access uses the same private media endpoint and is limited to an explicitly bound active custom job; generic staff role alone cannot read draft customer media.
- [x] GitHub Actions performs install, Prisma client generation, and production build validation.
- [x] Production migration command (`pnpm db:deploy`) is documented.
- [ ] Apply `20261002103500_custom_template_invitation_access` on the target database before using event-bound custom jobs; source/CI success is not proof the production schema is migrated.

Important gaps found in the initial audit:

- [ ] **BLOCKER — real email delivery still needs production verification.** Resend delivery and guards that suppress token logging in production already exist in source; verify provider/APP_URL configuration and real verification/reset delivery instead of rebuilding the implemented email flow.
- [ ] **BLOCKER — password reset / forgot-password needs production E2E verification.** Routes, expiring hashed tokens, password update and session invalidation exist in source. Test actual delivery, expiry/reuse/concurrent requests and login after reset before sign-off.
- [ ] **BLOCKER — payment is currently manual proof-of-transfer + admin confirmation, not a payment-gateway/webhook flow.** Decide whether manual transfer is intentionally the launch payment model. If yes, fully harden and document that operational flow. If moving to a gateway, implement signed webhook verification, idempotency, pending/paid/failed/expired handling, and event-scoped entitlement activation.
- [ ] **BLOCKER — source-level private persistent VPS storage is implemented, tetapi production migration/restore belum sign-off.** Upload `InvitationAsset` baru tidak lagi ditulis ke `public/uploads`; production wajib mengisi absolute `UNDARA_DATA_DIR` pada volume persisten, menjalankan migrasi legacy hingga file publik lama terhapus, lalu membuktikan backup + restore dan browser playback. Object storage eksternal bersifat opsional, bukan kewajiban.
- [ ] **BLOCKER — production backup + tested restore procedure not verified.** Database backup is not complete until a restore has actually been tested.
- [ ] **BLOCKER — production deployment/rollback workflow not verified.** Current GitHub Actions evidence is build validation, not production deployment.
- [ ] **BLOCKER — full authorization audit across every API route is still required.** Important routes already use ownership checks, but launch sign-off requires checking all nested resources (guests, tables, personal invitations, assets, payments, WA Blast, usher/check-in, admin/designer/owner routes).
- [ ] **BLOCKER — critical end-to-end production-like test has not been recorded.** Register → verify → login → create event → save design → payment/entitlement → publish → public invitation → RSVP → organizer sees RSVP must pass as one complete journey.
- [ ] **BLOCKER — production secrets/configuration audit not verified.** Confirm no credentials are committed or exposed to client bundles and that production env separation is correct.
- [ ] **P1 — observability/alerting is not yet launch-signed-off.** Console logging exists, but production error monitoring, health monitoring, and actionable alerts should be defined.

---

# 2. BLOCKER — Authentication & account security

- [x] Registration endpoint exists.
- [x] Login endpoint exists.
- [x] Logout endpoint exists.
- [x] Session endpoint/infrastructure exists.
- [x] Password hashes use bcrypt.
- [x] Login rejects incorrect credentials without exposing whether password was correct.
- [x] Login requires verified email.
- [x] Session token uses cryptographically random bytes.
- [x] Session token is stored hashed in the database.
- [x] Session cookie is HttpOnly.
- [x] Session cookie is Secure in production.
- [x] Session cookie uses SameSite=Lax.
- [x] Session expiry is enforced server-side.
- [x] Verification/resend and password-reset email delivery use the shared Resend sender in source.
- [x] Verification/reset token logging is guarded to non-production environments in source.
- [x] Forgot-password request flow creates an expiring hashed token and uses a uniform known/unknown-email response.
- [x] Password-reset success updates the password and invalidates reset tokens and sessions in a database transaction.
- [x] Login, registration, verification resend, forgot-password and reset-password have process-local rate-limit guards in source.
- [ ] **BLOCKER:** Verify actual verification/resend/reset email delivery and APP_URL/provider configuration on the target environment.
- [ ] **BLOCKER:** Test password-reset expiry, reuse, concurrent requests, session revocation and subsequent login against PostgreSQL; verify session behavior after profile password changes too.
- [ ] **BLOCKER:** Verify auth rate limits behind the production proxy and define distributed enforcement if deployment uses multiple processes/instances.
- [ ] Verify registration validates Terms/Privacy consent server-side as required by `prd.md`.
- [ ] Verify email format and normalization consistently on registration/login/reset flows.
- [ ] Verify duplicate registration race is safely handled by DB uniqueness, not only pre-check logic.
- [ ] Define session management policy: max session age, logout-all-devices behavior if needed, stale session cleanup.
- [ ] Test expired, deleted, forged, and reused session tokens.
- [ ] Test auth behavior behind production HTTPS/reverse proxy.

**Launch acceptance:** A normal user can securely register, receive a real verification email, verify, login, logout, recover a forgotten password, and cannot abuse auth endpoints at unlimited rate.

---

# 3. BLOCKER — Authorization & tenant/event isolation

Undara is multi-tenant and event-scoped. Authentication alone is insufficient. Every sensitive server mutation/read must prove that the current actor is allowed to access the target event/resource.

- [x] Main invitation API resolves owned invitations server-side.
- [x] Payment proof submission verifies `invitationId + ownerId`.
- [x] Invitation upload verifies `invitationId + ownerId`.
- [x] Assigned custom Template Studio media access is event-scoped by `DesignerTemplate.customInvitationId` + active `DRAFT/REVIEW`; role `DESIGNER` additionally requires matching `designerId`, and handoff/archive revokes that staff access.
- [x] Custom Template Studio reuses the user event's existing `InvitationAsset` records without copying customer files into `DesignerAsset`; Template Mode does not expose customer upload/delete controls.
- [x] RSVP guest lookup constrains `guestId` to the current invitation.
- [x] Published event mutation/delete lock exists in the main invitation API.
- [x] Source-level event scoping hardened for Guest workspace/export, legacy Wedding Table mutations, and legacy package activation; none silently fall back to the account's first event anymore.
- [x] Broad `/api/admin/operations` access is limited to `OWNER/ADMIN`; `FINANCE` remains limited to payment operations instead of customer/event administration.
- [x] Payment/invoice reads require both `PaymentOrder.userId` and `Invitation.ownerId` to match the current customer; admin activation rejects inconsistent order↔event ownership.
- [x] CI guard `tests/private-api-origin-guard.test.mjs` requires every session-authenticated private mutation route to use `isTrustedMutationOrigin`.
- [ ] **BLOCKER:** Audit every `app/api/**` route for authentication + role + resource ownership.
- [ ] **BLOCKER:** Verify User A cannot GET event data belonging to User B by changing IDs/query params.
- [ ] **BLOCKER:** Verify User A cannot PUT/PATCH/DELETE User B event.
- [ ] **BLOCKER:** Verify User A cannot read/mutate User B invitation assets by asset ID.
- [ ] **BLOCKER:** Verify User A cannot read/mutate User B guests by guest ID.
- [ ] **BLOCKER:** Verify User A cannot read/mutate User B tables/seating by table/seat/guest ID.
- [ ] **BLOCKER:** Verify User A cannot read/mutate User B Personal Invitations.
- [ ] **BLOCKER:** Verify User A cannot consume or modify User B WA Blast quota.
- [ ] **BLOCKER:** Verify User A cannot access User B payment/proof/transaction data.
- [ ] **BLOCKER:** Verify Usher/QR/check-in mutations are event-scoped and replay/cross-event safe.
- [ ] **BLOCKER:** Audit `/admin`, `/owner`, `/designer`, `/editor`, `/finance` API boundaries for server-side role checks.
- [ ] Verify nested-resource APIs derive ownership from DB relationships rather than trusting `ownerId`/`invitationId` supplied by the browser.
- [ ] Add automated negative authorization tests for cross-user IDs.

**Launch acceptance:** Changing any event/resource identifier to another customer's ID never exposes or mutates that customer's data, regardless of what the UI hides.

---

# 4. BLOCKER — Publish & entitlement integrity

- [x] Event must be configured before publish.
- [x] Event title/venue/date are validated before publish.
- [x] Saved `templateKey` is required before publish.
- [x] Digital Invitation entitlement/payment is checked server-side before publish.
- [x] Payment/entitlement is event scoped in the main publish flow.
- [x] Published event metadata is immutable through the main customer event mutation flow.
- [x] Customer cannot unpublish a published event through the main invitation API.
- [x] Customer cannot delete a published event through the main invitation API.
- [ ] **BLOCKER:** Test direct API attempts to publish without payment.
- [ ] **BLOCKER:** Test direct API attempts to publish Event B using Event A's paid entitlement.
- [ ] **BLOCKER:** Test direct API attempts to publish without template/configured event.
- [ ] Verify public invitation renderer independently requires configured + template + published + valid entitlement, not only `isPublished`.
- [ ] Verify payment revocation/refund policy and its effect on already-published invitations.
- [ ] Verify Studio capabilities after publish match `prd.md` and do not accidentally mutate locked event metadata.

**Launch acceptance:** No frontend manipulation or direct API call can produce a publicly valid unpaid/unconfigured invitation.

---

# 5. BLOCKER — Payment & financial operations

## Current repository model

The audited payment endpoint currently accepts a **proof-of-transfer URL**, stores/updates a single event payment as `PENDING`, and relies on confirmation elsewhere. This is a valid possible business model, but it is not an automated payment gateway.

### Decide launch payment strategy

- [ ] **BLOCKER:** Explicitly choose one launch model:
  - **Manual transfer:** proof submission → finance/admin review → confirmed/rejected → entitlement; or
  - **Payment gateway:** checkout → provider → signed webhook → transaction state → entitlement.

### If launching with manual transfer

- [ ] **BLOCKER:** Define official bank/payment destination and customer instructions.
- [ ] **BLOCKER:** Prefer controlled proof upload/storage instead of arbitrary external proof URL, or document why URL-only is acceptable.
- [ ] **BLOCKER:** Admin/Finance can inspect proof and confirm/reject only with server-side role authorization.
- [ ] **BLOCKER:** Confirmation records `confirmedAt` and `confirmedById` and cannot silently unlock another event.
- [ ] **BLOCKER:** Re-submitting proof cannot create duplicate financial entitlement.
- [ ] **BLOCKER:** Define rejection/resubmission state and customer-facing status.
- [ ] Keep an auditable payment history if operational/legal requirements need it; avoid destructive overwrites that remove important financial history.

### If launching with payment gateway

- [ ] **BLOCKER:** Use provider-generated transaction/order ID.
- [ ] **BLOCKER:** Verify webhook signature server-side.
- [ ] **BLOCKER:** Webhook processing is idempotent.
- [ ] **BLOCKER:** Handle `PENDING`, `PAID/SETTLED`, `FAILED`, `EXPIRED`, `CANCELLED`, and refund/reversal where applicable.
- [ ] **BLOCKER:** Never trust client-side success redirect as proof of payment.
- [ ] **BLOCKER:** Amount/package/event association is verified server-side.
- [ ] **BLOCKER:** Duplicate/reordered webhooks do not double-credit entitlement/quota.
- [ ] **BLOCKER:** Store enough provider references for reconciliation.

### Product pricing integrity

- [x] Canonical Digital Invitation price is Rp150.000/event in product docs.
- [x] WA Blast add-on is documented separately at 50 credits = Rp75.000.
- [ ] Verify server-side price/package data cannot be changed by client request.
- [ ] Verify WA Blast purchase credits only the selected event.
- [ ] Define refund/cancellation/manual correction process for Finance/Owner.

**Launch acceptance:** Money status is server-authoritative, auditable, event-scoped, and cannot be double-applied or spoofed from the browser.

---

# 6. BLOCKER — Uploads, media & durable storage

- [x] Upload requires authenticated user.
- [x] Upload checks event ownership.
- [x] Upload requires configured event.
- [x] Image MIME allowlist exists.
- [x] Audio MIME allowlist exists.
- [x] Image size limit exists (15 MB input).
- [x] Audio size limit exists (10 MB input).
- [x] Per-event image count limit exists.
- [x] Per-event audio count limit exists.
- [x] Images are normalized/optimized through Sharp and written as WebP.
- [x] Random UUID filenames are used.
- [ ] **BLOCKER:** Replace app-local `public/uploads` with durable object storage, **or** formally provision persistent VPS storage that survives deployments and is included in backup/restore procedures.
- [ ] **BLOCKER:** Verify uploaded files cannot execute as application code.
- [ ] **BLOCKER:** Verify delete/replace operations enforce owner/event ownership.
- [ ] Validate actual file content, not only browser-provided MIME metadata, especially audio.
- [ ] Define storage quota/retention per event/account.
- [ ] Define orphan cleanup when DB record creation fails/event is deleted where deletion is allowed.
- [ ] Define cache/CDN strategy for public invitation assets.
- [ ] If private master/template assets are required by `prd.md`, implement private storage + signed access rather than exposing originals publicly.
- [ ] Verify filenames/metadata do not leak sensitive local paths or original private information.

**Launch acceptance:** Customer media survives deploy/restart, is backed up or durably stored, cannot cross tenant boundaries, and untrusted uploads cannot become executable content.

---

# 7. BLOCKER — Database, migrations, backup & recovery

- [x] PostgreSQL + Prisma are established as source of truth.
- [x] `pnpm db:migrate` exists for development.
- [x] `pnpm db:deploy` exists for production migrations.
- [x] Documentation explicitly says build validation does not apply production migrations.
- [ ] **BLOCKER:** Provision automated production PostgreSQL backups.
- [ ] **BLOCKER:** Define backup retention policy.
- [ ] **BLOCKER:** Encrypt/protect backup access appropriately.
- [ ] **BLOCKER:** Perform a real restore test into a safe database and document result/date.
- [ ] **BLOCKER:** Define production migration sequence: backup → deploy migration → deploy app → health check.
- [ ] **BLOCKER:** Define rollback procedure for app release.
- [ ] Define strategy for irreversible/destructive Prisma migrations.
- [ ] Verify DB constraints for unique email, slug, event payment relationship, and other integrity-critical fields.
- [ ] Verify cascade/delete behavior does not accidentally destroy financial/audit data.
- [ ] Add/verify indexes for common event, guest, slug, payment, and RSVP queries before meaningful traffic.

**Launch acceptance:** A failed deployment, migration, or database incident has a documented and tested recovery path.

---

# 8. BLOCKER — Production deployment & infrastructure

- [x] Deployment target is Hostinger VPS/Linux in product docs.
- [x] GitHub Actions Build Validation exists for push/PR to `main`.
- [x] CI installs frozen dependencies, generates Prisma client, and runs `pnpm build`.
- [ ] **BLOCKER:** Provision production domain/DNS.
- [ ] **BLOCKER:** Enforce HTTPS with valid certificate.
- [ ] **BLOCKER:** Configure reverse proxy correctly for Next.js and client IP forwarding.
- [ ] **BLOCKER:** Production process manager/container restarts application after crash/reboot.
- [ ] **BLOCKER:** Define actual deployment workflow; current CI is build validation only.
- [ ] **BLOCKER:** Deployment runs pending Prisma migrations safely before relying on schema-dependent code.
- [ ] **BLOCKER:** Define rollback to previous application release.
- [ ] **BLOCKER:** Verify production environment variables are injected securely and are not committed.
- [ ] Verify `NODE_ENV=production` and secure cookie behavior on the real domain.
- [ ] Verify `APP_URL`, invitation root domain, and callback/public URLs use production domains.
- [ ] Verify filesystem permissions and non-root application execution where practical.
- [ ] Verify firewall exposes only required services.
- [ ] Keep PostgreSQL inaccessible from the public internet unless explicitly secured/required.

**Launch acceptance:** A clean deployment can be repeated safely, HTTPS works, migrations are controlled, crashes recover, and rollback is possible.

---

# 9. BLOCKER — Secrets & security baseline

- [ ] **BLOCKER:** Audit Git history/current tree for committed secrets, database credentials, API keys, private keys, webhook secrets, SMTP credentials, and tokens.
- [ ] **BLOCKER:** Rotate any credential that has ever been committed/exposed.
- [ ] **BLOCKER:** Confirm secrets are server-only and never placed in `NEXT_PUBLIC_*` unless intentionally public.
- [ ] **BLOCKER:** Confirm production DB errors/stack traces are not returned to customers.
- [ ] **BLOCKER:** Add/verify rate limits on sensitive auth/public mutation endpoints.
- [ ] Review CSRF risk for cookie-authenticated state-changing endpoints. SameSite=Lax helps but does not replace endpoint-specific review.
- [ ] Add/verify security headers appropriate to Next.js deployment (CSP strategy, frame protection, MIME sniffing protection, referrer policy as appropriate).
- [ ] Review all user-rendered text/URLs for XSS and unsafe URL schemes.
- [ ] Review Maps/live-stream/music/external URLs for protocol allowlisting where needed.
- [ ] Review image/audio processing against malformed file handling and resource exhaustion.
- [ ] Dependency vulnerability review before launch. Audit `pnpm audit --prod --json` pada 4 Oktober 2026 menandai 12 advisori (4 moderate, 7 high, 1 critical); tidak ada yang berada pada `qrcode` atau rantai dependensinya. Triage/perbarui dependensi dalam batch terpisah: Sharp 0.34.5 memproses upload customer dan terkena [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj); Next 16.3.3 ditandai [GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j), namun pencarian source `app/components/lib` tidak menemukan `ImageResponse`/`next/og` yang menjadi pemicu advisori tersebut. Temuan Prisma optional/transitive juga perlu ditinjau. Ini hasil audit versi dependensi, bukan bukti eksploit atau sign-off keamanan.

**Launch acceptance:** No known credential leak, obvious cross-site injection path, unlimited brute-force endpoint, or production debug leakage remains.

---

# 10. BLOCKER — Critical end-to-end launch test

Run this against a production-like environment with a brand-new customer account. Record date, environment, tester, commit SHA, and result in this section; ringkasan implementasi material dan validasi masuk Appendix A di `prd.md`.

- [ ] **BLOCKER:** Register new account.
- [ ] **BLOCKER:** Receive verification email.
- [ ] **BLOCKER:** Verify email.
- [ ] **BLOCKER:** Login.
- [ ] **BLOCKER:** Complete onboarding/profile if required.
- [ ] **BLOCKER:** `Tambah acara` does not create unwanted blank DB records merely by opening the form.
- [ ] **BLOCKER:** Save a valid event.
- [ ] **BLOCKER:** Reload and confirm event persists correctly.
- [ ] **BLOCKER:** Open `Buat undangan` for the correct event.
- [ ] **BLOCKER:** Select template.
- [ ] **BLOCKER:** Edit invitation content/design.
- [ ] **BLOCKER:** Upload image/music and confirm they survive reload/restart/deploy scenario appropriate to storage design.
- [ ] **BLOCKER:** Save design and confirm `templateKey`/design persist.
- [ ] **BLOCKER:** Attempt Publish unpaid and confirm server rejects it.
- [ ] **BLOCKER:** Complete the real launch payment flow.
- [ ] **BLOCKER:** Confirm entitlement attaches only to that event.
- [ ] **BLOCKER:** Publish successfully.
- [ ] **BLOCKER:** Public invitation opens on its production URL.
- [ ] **BLOCKER:** Unpublished/unpaid/invalid event URL does not expose invitation content.
- [ ] **BLOCKER:** Submit RSVP as a guest.
- [ ] **BLOCKER:** Organizer sees correct RSVP under correct event.
- [ ] **BLOCKER:** Submit wishes if enabled and verify event isolation/moderation behavior.
- [ ] **BLOCKER:** Verify Personal Invitation guest targeting does not leak another event's guest.
- [ ] **BLOCKER:** Verify published Rangkaian Acara cannot be edited, unpublished, or deleted.
- [ ] **BLOCKER:** Logout and verify protected dashboard/API access is gone.
- [ ] **BLOCKER:** Test forgot-password/reset-password end to end.

### Cross-tenant attack test

Create Customer A and Customer B with separate events.

- [ ] **BLOCKER:** A cannot fetch B event by ID.
- [ ] **BLOCKER:** A cannot edit/delete B event by ID.
- [ ] **BLOCKER:** A cannot upload/delete B assets.
- [ ] **BLOCKER:** A cannot fetch/edit B guests.
- [ ] **BLOCKER:** A cannot fetch/edit B tables/seating.
- [ ] **BLOCKER:** A cannot use B payment/entitlement.
- [ ] **BLOCKER:** A cannot use B WA Blast quota.
- [ ] **BLOCKER:** A cannot check in B guests through A's event context.

---

# 11. P1 — Public invitation quality

- [ ] Public invitation is excellent and fully usable on common mobile viewport sizes.
- [ ] Test Android Chrome and iPhone Safari.
- [ ] Test slow/mobile network behavior and image loading.
- [ ] Invalid slug returns a proper not-found experience.
- [ ] Unpublished invitation is inaccessible publicly.
- [ ] Paid/published entitlement is rechecked server-side.
- [ ] Event date/time/timezone render correctly for WIB/WITA/WIT.
- [ ] `END` sentinel renders `- end` consistently.
- [ ] Optional parent/couple fields do not create empty placeholders.
- [ ] Non-wedding categories never show forced wedding wording.
- [ ] Template preview and public output are materially consistent.
- [ ] Long names, long venue, long address, and unusual but valid content do not break layout.
- [ ] Missing optional image/music/gift/maps fields degrade gracefully.
- [ ] Accessibility pass: keyboard basics, labels, contrast, reduced motion, meaningful controls.
- [ ] Metadata/SEO/social sharing preview is intentional for public invitations.

---

# 12. P1 — RSVP, Wishes & anti-abuse

- [x] RSVP public endpoint has basic IP+slug rate limiting.
- [x] RSVP validates attendance status.
- [x] RSVP constrains existing guest updates to the current invitation.
- [x] RSVP limits plus-ones to a bounded value.
- [ ] Verify duplicate RSVP behavior matches product intent; repeated submissions should not accidentally create uncontrolled duplicate guests.
- [ ] Validate/normalize WhatsApp phone numbers consistently.
- [ ] Define RSVP deadline behavior if product uses a deadline.
- [ ] Verify capacity/plus-one rules if event capacity is enforced.
- [ ] Audit Wishes endpoint for event scoping, length limits, spam/rate limit, and moderation.
- [ ] Add abuse protection appropriate to public forms if bot traffic becomes meaningful (rate limiting first; CAPTCHA/challenge only when justified).
- [ ] Ensure organizer views cannot accidentally mix RSVP/Wishes across selected events.

---

# 13. P1 — Guest management, seating & Usher

- [ ] Explicit event selector/scope is always visible where multiple events are possible.
- [ ] Guest CRUD is server-authoritative and event-scoped.
- [ ] Seating mutations are server-authoritative.
- [ ] Seat/table collision handling is safe under concurrent updates.
- [ ] QR token cannot be trivially forged.
- [ ] QR/check-in cannot apply a guest to the wrong event.
- [ ] Repeated scan behavior is defined and safe.
- [ ] Check-in audit information is sufficient for event operations.
- [ ] Usher permissions expose only operational data required by the role when EventMember/P1 team access is implemented.
- [ ] Test event-day workflow on real mobile devices and weak venue connectivity.

---

# 14. P1 — WA Blast

- [x] Product requirement defines WA Blast as separate add-on.
- [x] Canonical package is 50 credits = Rp75.000.
- [ ] Verify provider/integration strategy for production sending.
- [ ] Verify consent/opt-in and messaging compliance requirements applicable to the chosen provider/use case.
- [ ] Quota decrement must be atomic and server-authoritative.
- [ ] Failed send/retry behavior must not double-charge quota incorrectly.
- [ ] Purchase must credit only selected event.
- [ ] Message status/history should be sufficient for support/reconciliation.
- [ ] Rate/throughput/provider failure handling is defined.

> If WA Blast is not part of the first public promise, it may be feature-gated/disabled at launch rather than delaying the safe Digital Invitation core.

---

# 15. P1 — Observability & support operations

- [ ] Add production error monitoring or equivalent centralized exception visibility.
- [ ] Add application health endpoint/health check.
- [ ] Monitor uptime externally.
- [ ] Define alerts for repeated 5xx, app downtime, database connectivity failure, and payment/webhook failure if gateway is used.
- [ ] Logs include useful request/context IDs without leaking passwords, tokens, proof secrets, or personal data unnecessarily.
- [ ] Define support path for payment stuck pending, invitation unavailable, lost media, and failed RSVP.
- [ ] Define who can perform manual financial corrections and how they are audited.
- [ ] Define basic incident procedure: identify → contain → rollback/restore → communicate → postmortem.

---

# 16. P1 — CI/CD & release discipline

- [x] Build Validation runs on push/PR to `main`.
- [x] Frozen lockfile install is used.
- [x] Prisma client generation is part of CI.
- [x] `pnpm build` is part of CI.
- [ ] Add lint/type/test steps as appropriate if not already covered by Next build.
- [ ] Add automated authorization/security regression tests for critical APIs.
- [ ] Add automated publish-gate tests.
- [ ] Add automated payment state/idempotency tests once payment strategy is finalized.
- [ ] Add a production deployment workflow or a documented manual deployment runbook.
- [ ] Record deployed commit SHA/version.
- [ ] Do not deploy when build validation is failing.
- [ ] Keep DB migration and application deployment order explicit.

---

# 17. P1 — Legal, privacy & customer trust

Before accepting public users and payment, review applicable Indonesian requirements with appropriate professional/legal guidance where needed.

- [ ] Terms of Service page exists and is linked at registration.
- [ ] Privacy Policy exists and is linked at registration.
- [ ] Registration consent is stored/handled as required by product/legal decision.
- [ ] Explain what guest personal data is collected (e.g. name, phone, RSVP, check-in).
- [ ] Define organizer/customer responsibility for uploaded guest contacts and invitations.
- [ ] Define data retention/deletion policy.
- [ ] Define account deletion/data export handling if required by policy/law/product promise.
- [ ] Define payment/refund/cancellation terms.
- [ ] Avoid exposing guest phone numbers or private operational data on public invitation surfaces.
- [ ] Establish a contact/support/privacy channel.

---

# 18. P1 — Performance & production capacity

- [ ] Run a production build and inspect major page/API performance.
- [ ] Public invitation does not ship unnecessarily huge media/assets.
- [ ] Images use optimized dimensions/formats and caching.
- [ ] Database queries for guest/event lists are paginated or bounded where lists can grow large.
- [ ] Avoid N+1 query patterns on high-traffic public/event operations.
- [ ] Test concurrent RSVP/check-in behavior at realistic event traffic.
- [ ] Test a realistic large guest list.
- [ ] Define sensible request body/upload limits at reverse proxy and application layers.
- [ ] Verify server disk, memory, CPU, and PostgreSQL connection limits for initial expected traffic.

---

# 19. P2 — Safe post-launch backlog

These are valuable, but should not block the first safe release unless they are explicitly promised in the launch scope.

- [ ] EventMember multi-user/team access (Owner/Admin/Event Operator/Usher) from PRD P1 roadmap.
- [ ] Custom domains.
- [ ] Advanced analytics/reporting.
- [ ] More invitation templates.
- [ ] Advanced template marketplace/designer workflow.
- [ ] Coupon/promo/referral engine.
- [ ] Native mobile app.
- [ ] Advanced automation/CRM integrations.
- [ ] Richer audit log UI.
- [ ] Advanced anti-spam/challenge systems when traffic justifies them.
- [ ] CDN/media transformations beyond initial durable storage needs.

---

# 20. Launch sign-off gate

Undara is ready for a public paid launch only when all **BLOCKER** items below are either checked or explicitly accepted as a documented business/operational risk by the owner:

- [ ] Authentication production-ready: real email verification + password recovery + auth rate limiting.
- [ ] Full API authorization/tenant isolation audit passed.
- [ ] Payment strategy finalized and hardened.
- [ ] Publish/entitlement bypass tests passed.
- [ ] Durable media storage strategy is production-safe.
- [ ] Production DB backup exists and restore test passed.
- [ ] Production deployment, migrations, HTTPS, secrets, restart, and rollback are verified.
- [ ] Critical E2E customer journey passed on production-like environment.
- [ ] Cross-tenant attack test passed.
- [ ] No known launch-critical security issue remains.

### Sign-off record

- **Release candidate commit:** TBD
- **Environment:** TBD
- **Audit date:** TBD
- **E2E tester:** TBD
- **Backup restore test date:** TBD
- **Payment test:** TBD
- **Authorization test:** TBD
- **Decision:** NOT YET SIGNED OFF

---

# 21. Recommended implementation order

Use this order for future coding so launch work does not become random feature work:

1. **Auth production hardening** — email delivery, password reset, auth rate limiting.
2. **Authorization audit** — every API/resource, with cross-user negative tests.
3. **Payment decision + hardening** — manual-transfer production workflow or gateway/webhooks.
4. **Durable media storage** — remove deployment dependency on app-local uploads.
5. **Backup + restore + migration runbook**.
6. **Production deployment/HTTPS/secrets/rollback**.
7. **Critical E2E + cross-tenant testing**.
8. **Observability + operational support**.
9. **Mobile/public invitation QA + RSVP/Wishes hardening**.
10. **Only then resume P2 feature expansion.**

The purpose of this file is to keep future implementation focused on reaching a safe, supportable launch instead of continually adding features without production readiness.


---

# 22. Repo maintainability — audit 24 September 2026 (bukan sign-off produk)

**Ruang lingkup:** tree GitHub berisi 674 entri sebelum pembersihan; audit referensi dilakukan dengan workflow `.github/workflows/orphan-audit.yml` pada setiap perubahan source/aset dan bisa dijalankan manual. File tanpa static import atau tanpa string URL adalah **kandidat review**, bukan bukti aman dihapus: pertimbangkan route Next.js, `import()`, deklarasi `.d.ts` pendamping JavaScript, aset yang tersedia pada galeri Studio, serta URL file yang telah disimpan di database pelanggan. Aturan produk yang aktif tetap di `prd.md`, `template.md` dan `studio.md` merupakan panduan domain.

- [x] Hapus skrip one-shot lama `.github/scripts/modular-template-studio.py` yang menulis PRD dan source versi lama (commit `563abaf1`).
- [x] Pisahkan panel pemilihan template dari `DesignerPanels.tsx` dan pertahankan API re-export, dengan tes source disesuaikan (commit `1203d256`; [Build Validation berhasil](https://github.com/wanzy0808/DC/actions/runs/36009224370)).
- [x] Hapus 10 source orphan tanpa inbound import (commit `08db49b4`; [Build Validation berhasil](https://github.com/wanzy0808/DC/actions/runs/36010088189)).
- [x] Hapus 6 dependensi yatim berikutnya (commit `c3698273`; [Build Validation berhasil](https://github.com/wanzy0808/DC/actions/runs/36010656879)).
- [x] Pada audit sebelum pensiun eksperimen, commit `93db1101` lolos [Build Validation](https://github.com/wanzy0808/DC/actions/runs/36011178677) dan [Orphan Audit](https://github.com/wanzy0808/DC/actions/runs/36011178767). Dua deklarasi `reference-door-*.d.ts` saat itu masih dibutuhkan route lab; file tersebut **telah dihapus bersama engine dan route eksperimen** setelah instruksi owner terbaru. Primitive reusable `components/ui/sheet.tsx` tetap dipertahankan.
- [x] Sesuai instruksi owner, hapus seluruh 11 file route `/jiplak` dan `/pintu-lab` termasuk engine lokal ([commit `9d90ecf6`](https://github.com/wanzy0808/DC/commit/9d90ecf65e3e6c1149a2f5d3410c3bcfc06d35fd); [Build Validation](https://github.com/wanzy0808/DC/actions/runs/36019026551) dan [Orphan Audit](https://github.com/wanzy0808/DC/actions/runs/36019026605) berhasil). Lanjut hapus 19 file pendukung eksperimen orphan (preview CSS/prosedural/orbital, engine/dekorasi, backdrop; [commit `f0368103`](https://github.com/wanzy0808/DC/commit/f0368103e874425a248ec6f41e3cecebfa2b3bb3)); [Orphan Audit](https://github.com/wanzy0808/DC/actions/runs/36019259332) kini hanya melaporkan `components/ui/sheet.tsx` sebagai reusable zero-inbound. [Build Validation source kedua run 36019259303](https://github.com/wanzy0808/DC/actions/runs/36019259303) **berhasil**. Landing `LandingDoorScene.tsx`, `PortalTransition.tsx`, keempat tujuan layanan, dan data event tidak diubah.
- [x] Pisahkan helper validasi event dan lookup/slug legacy dari `app/api/invitations/route.ts` tanpa mengganti endpoint/handler (commit `db44fade`; [Build Validation](https://github.com/wanzy0808/DC/actions/runs/36014049136) dan [Orphan Audit](https://github.com/wanzy0808/DC/actions/runs/36014049101) berhasil untuk commit source).
- [x] Pisahkan UI inspector layer ilustrasi Cover ke `components/InvitationStudio/AssetLayerInspector.tsx` tanpa memindahkan state, shortcut, aturan 15 layer atau penyimpanan ke komponen baru (commit [`3eea60bc`](https://github.com/wanzy0808/DC/commit/3eea60bc54b17e6005af31b12f08d09f4102718f); [Build Validation](https://github.com/wanzy0808/DC/actions/runs/36016774489) dan [Orphan Audit](https://github.com/wanzy0808/DC/actions/runs/36016774492) berhasil).
- [x] Gabungkan aritmetika countdown Universal dan Romantic Rose pada `lib/invitations/countdown.ts` sambil mempertahankan tampilan per tema; tambahkan tes zero-clamp, input tanggal tidak sah dan pemakaian kedua renderer. Commit source [`e89d8300`](https://github.com/wanzy0808/DC/commit/e89d83004bcc7bc5e180f34c85f1fbd5f27d3080), koreksi asumsi tes [`32c455cd`](https://github.com/wanzy0808/DC/commit/32c455cdebb71a57842c2a80e38416883d49d25a). Build commit source pertama gagal pada pemeriksaan pola source tes yang salah; [Build Validation run 36017096159](https://github.com/wanzy0808/DC/actions/runs/36017096159) untuk commit koreksi berhasil menjalankan tes dan build. [Orphan Audit source](https://github.com/wanzy0808/DC/actions/runs/36017055673) juga berhasil.
- [ ] Lanjut audit/refactor bertahap `InvitationDesigner.tsx` (load/save vs interaksi canvas), `UniversalInvitationTemplate.tsx` (presentasi section vs engine RSVP/Wishes/media), operasi server tersisa di `app/api/invitations/route.ts`, `EventPanel.tsx` dan `SeatingChart.tsx` jika batasnya jelas dan tes regresi tersedia; jangan membuat API/data event ganda.
  - [x] Ekstrak operasi urutan layer Studio (drag reorder + front/forward/backward/back) ke `components/InvitationStudio/designer-layer-order.ts`; `InvitationDesigner.tsx` hanya mengorkestrasi state/history. Tes regresi source ditambahkan. (26 September 2026)
  - [x] Pusatkan sinkronisasi outline/marker selection canvas (section, RSVP, section component, copy, foto) ke `useStudioCanvasSelectionMarkers.ts`; lima effect DOM terpisah di `InvitationDesigner.tsx` dihapus. (26 September 2026)
  - [x] Ekstrak request load/save Invitation dan create Template plus helper saved-state/server-revision ke `components/InvitationStudio/designer-persistence.ts`; endpoint persistence tidak lagi tertanam di logika canvas React. Tes regresi source ditambahkan. (26 September 2026)
  - [x] Pusatkan request upload media dan delete asset Studio di modul persistence yang sama; komponen React hanya mengelola busy state, validasi file, dan pembaruan UI. Tes regresi source ditambahkan. (26 September 2026)
  - [x] Ekstrak state/pointer logic Space-drag canvas panning ke `components/InvitationStudio/useStudioCanvasPan.ts`; handler canvas mempertahankan perilaku focus, scroll, dan click suppression. Tes regresi disesuaikan. (26 September 2026)
  - [x] Ekstrak resolver target klik canvas ke `studio-canvas-selection.ts` dan pusatkan dispatcher selection di `InvitationDesigner.tsx`; prioritas RSVP/component/copy/foto tetap mengalahkan parent section dan perpindahan selection kini juga membersihkan multi-select layer yang stale. Build Validation `e8e7c680` berhasil. (26 September 2026)
  - [x] Ekstrak switch tujuh inspector visual kanan ke `StudioSelectionInspector.tsx`; `InvitationDesigner.tsx` turun dari 1708 menjadi 1636 baris dan tetap menjadi pemilik state/history. Source regression + production build berhasil pada commit `c49e770e` (Build Validation run 36222983166). (26 September 2026)
  - [x] Ekstrak toolbar canvas (Restart/Undo/Redo/Save/panel toggle) ke `StudioCanvasToolbar.tsx` dan kontrol Amplop/Isi + zoom ke `StudioStageControls.tsx`; parent hanya mengirim state/callback. Source regression + production build berhasil pada commit `2e316dad` (Build Validation run 36223383295). (26 September 2026)
- [x] Padatkan `README.md` menjadi orientasi repo, setup, source map aktual dan tautan fitur aktif; hapus narasi milestone berulang yang sudah terdapat di Appendix A, perbaiki referensi `GuestManagement*` dan `data/templates/showcase.ts` yang sudah dihapus, pertahankan petunjuk OAuth Google/setup/migrasi.
- [ ] Lanjut audit duplikasi yang *terbukti* antara `AGENTS.md` dan badan utama `prd.md` per domain; keputusan terbaru menang hanya saat konflik dan aturan lama yang kompatibel tetap berlaku. Appendix A adalah histori, bukan rulebook aktif.
- [x] Audit 103 file komponen fitur `.tsx`: seluruh nama sudah PascalCase. Komponen pintu produksi `SimpleDoorLab.tsx` diganti menjadi `LandingDoorScene.tsx` (commit [`f2dbec48`](https://github.com/wanzy0808/DC/commit/f2dbec480ad938fbf0e9539074ddf4f1c8e0cae8); [Build Validation](https://github.com/wanzy0808/DC/actions/runs/36021506334) dan [Orphan Audit](https://github.com/wanzy0808/DC/actions/runs/36021506263) berhasil). Tes `tests/repo-file-naming.test.mjs` menjaga konvensi PascalCase, pemakaian scene oleh homepage dan absennya route lab; assertion awal keliru membaca `TemplateSection` sebagai `Temp*`, diperbaiki di [`a53096ec`](https://github.com/wanzy0808/DC/commit/a53096ec39ee5f4a352cb104bdcda7e1084deb44), lalu [Build Validation run 36022078654](https://github.com/wanzy0808/DC/actions/runs/36022078654) **berhasil**. Nama file/folder publik yang ejaannya tidak baku tidak diubah karena kompatibilitas URL aset undangan.
- [x] Rename jurnal `Dashboard-redesign.md` menjadi `dashboard-redesign-history.md` untuk membedakan catatan implementasi bertanggal dari `prd.md` §6 sebagai aturan aktif; sinkronkan rujukan di AGENTS, README dan pasal aktif PRD tanpa mengubah isi aturan Dashboard atau history Git.
- [x] Koreksi nama metadata `package.json` dari `my-app` menjadi `dc-organizer` tanpa perubahan package versions, lockfile atau database. Nama container/volume Docker pengembangan `doc-postgres` / `doc_postgres_data` tetap dipertahankan demi data lokal yang sudah ada; tidak termasuk rename nama source file.
- [x] Audit lokasi kode Zen Atelier: pindahkan komponen React `ZenArtwork.tsx` dari folder asset-reference ke `components/PublicInvitation/ZenAtelierArtwork.tsx`; perbarui dua import (termasuk dynamic import), tes, panduan aset dan PRD aktif. File media `public/` tidak dipindahkan atau diubah.
- [x] Pindahkan event-selection gateway `StudioEntrySection.tsx` dari folder komponen marketing `DigitalInvitation/` ke domain `InvitationStudio/` karena hanya dipakai `/studio`. Biarkan `DigitalInvitation/StudioSection.tsx` sebagai CTA marketing; perbarui import serta assertion test tanpa mengubah alur, login, event selection atau URL.
- [ ] Audit media `public/` yang besar; hindari penghapusan otomatis. Dua path MP3 Zen Atelier berisi blob yang identik tetapi salah satunya dipakai sebagai default tema dan path lama mungkin telah tersimpan sebagai `musicUrl`. Penghapusan membutuhkan jaminan kompatibilitas URL dan verifikasi penggunaan sebelum dilakukan.

Pemeriksaan CI pada satu commit memvalidasi source pada commit tersebut, **bukan** bukti browser, migrasi, entitlement, ataupun kesiapan produksi penuh. File source yang dihapus tetap dapat diambil melalui Git history bila dibutuhkan.

---

# 23. Studio core editor priority — 25 September 2026

**Current product decision:** pause further animation-library expansion until the Studio has the expected baseline editing tools. The existing curated section-animation catalog stays available; richer element/scene animation work is deferred, not removed.

### P1 — Standard canvas editing before advanced animation

- [x] Select/deselect design objects from the canvas.
- [x] Popup Preview berada di atas seluruh kontrol Studio dengan backdrop merata; Amplop dapat dibuka di Preview, tinggi mengikuti viewport dinamis dan scroll terpisah. (4 Oktober 2026)
- [x] Preview menyediakan tiga bingkai perangkat Desktop/Tablet/HP di atas Studio gelap, tanpa judul terlihat/caption/input pixel/Fit/100%. Iframe memakai viewport internal 1440 × 900 / 768 × 1024 / 390 × 844, otomatis muat beserta bezel/base, scroll internal dan snapshot draft same-origin authenticated; section OFF memakai tampilan tamu tanpa placeholder editor. Validasi perubahan tiga perangkat dicatat pada Appendix A. (4 Oktober 2026)
- [x] Ukuran Preview diperbesar: laptop menargetkan sekitar 80% lebar browser, Tablet/HP 30% lebih besar, tetap auto-fit ke ruang tersedia tanpa mengubah viewport iframe. (5 Oktober 2026)
- [x] Hapus pesan helper kiri bawah untuk pemilihan template, Canvas Kosong dan Kembalikan ke Default, termasuk jalur katalog Designer dan pembersihan notice lama. (4 Oktober 2026)
- [ ] QA browser Preview: Light/Dark, tiga pilihan Desktop/Tablet/HP, bingkai terpusat tanpa judul/caption/pixel/zoom, auto-fit di layar sempit/pendek, media query/viewport units, seleksi aktif sebelum dibuka, `Buka Undangan`, pergantian perangkat tanpa replay, scroll internal, section OFF, Escape/tutup dan kembali mengedit. Browser lokal terblokir `ERR_BLOCKED_BY_CLIENT` pada 4 Oktober 2026; belum ada sign-off visual.
- [x] Move objects by drag.
- [x] Resize from edge and corner handles.
- [x] Rotate from a dedicated handle below the object.
- [x] Layer ordering: bring to front, forward one, backward one, send to back.
- [x] Copy/paste selected design layer with keyboard shortcut.
- [x] Delete selected design layer with Delete/Backspace.
- [x] Audit jalur seleksi/edit lintas jenis elemen: satukan inspector/fokus untuk aset, teks, shape, foto dan native; perbaiki drag antarsection, resize/reset yang mempertahankan style, frame foto per instance, transform Input/Button Ucapan, dan seleksi tombol protected. Field custom RSVP hanya menampilkan properti yang didukung. Validasi unit/codec/SSR, TypeScript dan build pada batch `fix(studio): unify editing across canvas elements`. (3 Oktober 2026)
- [ ] QA browser lintas tema untuk seleksi → drag/resize/crop → shortcut → Undo/Redo → Simpan/reload/public, termasuk duplikat section, input typing, mobile/touch, Space-pan dan lock. Audit source/tes/build tidak menutup QA ini.
- [x] Undo/redo design changes.
- [x] **Add Cut (`Ctrl/Cmd+X`) for selected design layers.**
- [x] **Add proper photo crop controls:** free X/Y crop position, zoom, reset crop; persist per photo slot without modifying the original uploaded asset.
- [x] Add crop mode directly on-canvas so the frame stays fixed while the photo can be repositioned/zoomed inside it.
- [x] Add common aspect-ratio crop presets where appropriate (Original, 1:1, 4:5, 3:4, 16:9) without forcing every template frame to the same ratio.
- [x] Add duplicate shortcut (`Ctrl/Cmd+D`) for selected layers.
- [x] Add lock/unlock layer.
- [x] Add show/hide layer.
- [x] Improve overlapping-object selection and layer list naming so stacked objects are easy to target.
- [x] Add keyboard nudge with Arrow keys and larger Shift+Arrow movement for movable design layers.
- [x] Add snapping/alignment guides for center, section bounds, and nearby objects.
- [x] Add multi-select align/distribute controls (left/center/right, top/middle/bottom, horizontal/vertical distribution).
- [x] Add local Studio canvas zoom controls without changing saved invitation geometry.
- [x] Add zoom reset 100% and Fit-to-workspace controls; zoom remains editor-local only.
- [x] Add Space-drag canvas panning with horizontal/vertical scroll at zoomed sizes.
- [x] Add image layer flip horizontal/vertical and quick center positioning.
- [x] Add native basic shapes (rectangle, circle, line) with fill, border, thickness, corner radius and normal layer transforms.
- [x] Add image corner radius plus generic layer shadow controls for image, shape and text objects.
- [x] Add multi-select/group only after single-layer selection/crop/lock behavior is stable.
- [x] Audit clipboard behavior for text vs image layers and prevent browser text-edit shortcuts from being hijacked while typing.
- [x] Extend copy/cut/paste/duplicate to multi-selected layers while preserving relative placement and group isolation.

### Deferred — richer animation system

- [x] Expand from section animation to **element animation**: text, photo, asset and ornament presets.
  - [x] Fase awal: teks dekoratif, asset gambar/ornamen, dan shape layer memakai katalog 35 preset section yang sama, termasuk durasi/jeda, persistence di designKey, preview/public renderer, IntersectionObserver, dan reduced-motion. Foto slot/gallery tetap tahap berikutnya. (26 September 2026)
  - [x] Section dan object layer sekarang memakai satu `entrance-animation-runtime.ts`; efek selesai tetap bisa di-cleanup saat preset berubah, dan inspector layer punya tombol **Preview animasi** tanpa mereset desain. (26 September 2026)
- [x] Add text choreography such as per-word/per-character stagger where it improves premium templates.
  - [x] Decorative text layer: mode satu kotak/per kata/per huruf/per baris + stagger 0.01–0.15s, memakai semua preset entrance bersama; teks >96 karakter otomatis turun dari per-huruf ke per-kata untuk menjaga performa. (26 September 2026)
  - [x] Built-in editable template copy (Greeting/Closing/Our Story serta copy khusus Zen/Pencil) memakai token visual terpisah `copyMotion=`, shared entrance runtime, whole/per-kata/per-huruf/per-baris, durasi/jeda/stagger, stage replay setelah Amplop terbuka, dan satu Reset atomik untuk isi + motion. (26 September 2026)
- [x] Add photo/gallery choreography, mask reveals and lightweight parallax.
  - [x] Foto Cover/Mempelai/Galeri memakai katalog entrance yang sama; preset reveal/wipe/curtain berfungsi sebagai mask reveal, Galeri punya stagger, dan parallax 0–20 px memakai runtime rAF terpisah dari crop transform. Selection foto membuka inspector kanan, sedangkan ganti foto/crop tetap di menu Foto kiri. Reduced-motion tetap mematikan motion publik/preview. (26 September 2026)
- [x] Use Motion/GSAP selectively for premium timelines; keep simple section entrances on the lightweight shared engine.
  - [x] Empat timeline storytelling opt-in (Romantic Cascade, Editorial Sequence, Luxe Cinematic, Paper Story) memakai GSAP lewat dynamic import hanya saat section naratif memilihnya. Section biasa tetap memakai WAAPI shared entrance runtime; reduced-motion diperiksa sebelum GSAP di-load dan native Zen/Pencil reveal tidak berjalan ganda. (26 September 2026)
- [ ] Keep Three/R3F effects opt-in for selected premium templates only; do not make standard invitation pages depend on heavy 3D.
  - [x] Bundle-boundary regression test memastikan Universal, Romantic Rose, asset-layer renderer, dan Our Story tidak punya eager import `@react-three/fiber`, Drei, `three`, atau GSAP. Premium 3D template sendiri belum diaktifkan, jadi parent item tetap terbuka. (26 September 2026)
- [x] Preserve reduced-motion behavior and mobile performance budgets for every animation preset.
  - [x] Shared runtimes mematikan entrance/parallax/premium timeline pada `prefers-reduced-motion`; budget terpusat membatasi choreography teks 96 motion parts, premium timeline 10 item, dan parallax 12 target. Gallery assignment sendiri tetap dibatasi maksimal 30 foto. Ini code-level guard; profiling device nyata tetap bagian QA/E2E. (26 September 2026)

**Priority rule:** baseline Studio editing (crop/cut/selection/layers/locking/snapping) wins over adding more animation presets until the editor feels dependable for normal designer work.

### Confetti Club — birthday template (3 October 2026)

- [x] Tambah satu template ulang tahun `confetti-club` melalui registry tunggal, dengan palette/font dan musik existing.
- [x] Komposisi amplop/cover/section tersendiri; potret tunggal dan Gallery memakai engine foto shared.
- [x] Native Studio markers dan empat narasi ID/EN; preview birthday terisolasi dari fixture pernikahan/data pelanggan.
- [x] GitHub Actions pada feature commit: **428/428 regression tests**, Prisma generate, TypeScript, build **72/72** dan Orphan Audit lulus; hasil/run tercatat di Appendix A.
- [ ] QA browser desktop/mobile, artwork editing/background/crop, nama panjang, keyboard/Reduced Motion dan Simpan → reload → public.
