# Undara — Master Product Requirements Document

**Document Status:** Single Source of Truth  
**Brand:** Undara  
**Repository:** `wanzy0808/Undara`  
**Last Consolidated:** 30 September 2026  
**Documentation Audit:** 30 September 2026 — canonical rules cleaned; obsolete visual history retired  
**Implementation History:** Appendix A (same file)

> Dokumen ini adalah **single source of truth** Undara dan menggantikan requirement yang sebelumnya tersebar di `prd.md`, `prd1.md`, `prdnew.md`, `prd-tambahan.md`, serta PRD legacy lain. Requirement aktif berada di badan utama; histori implementasi disimpan di **Appendix A** pada file yang sama. Jika histori lama bertentangan dengan requirement canonical, **requirement canonical di badan utama yang berlaku**.

---

## 1. Product Vision & Scope

Undara adalah **general-event digital invitation & event operations SaaS**, bukan wedding-only SaaS.

Platform mendukung lifecycle acara dari pembuatan event sampai distribusi undangan dan operasional onsite:

`Account → Event Setup → Invitation Design → Publish → Distribution → RSVP → Guest & Seating → QR / Onsite Check-in`

Jenis event yang didukung minimal:
- `WEDDING` — Pernikahan;
- `SILVER_WEDDING` — Silver Wedding;
- `GOLDEN_WEDDING` — Golden Wedding;
- `BIRTHDAY` — Ulang Tahun;
- `BABY_SHOWER` — Baby Shower;
- `OTHER` — Event Lainnya.

Platform harus dapat berkembang ke engagement, anniversary, corporate/private event, gathering, dan event lain tanpa memaksa data couple/wedding.

Customer-facing brand wajib **Undara**. Nama brand lama hanya boleh muncul pada histori Git atau exact compatibility identifier internal yang masih diperlukan; tidak boleh diperkenalkan kembali pada surface baru.

### 1.1 Identitas Brand Undara

- Customer-facing brand adalah **Undara**. Nama brand lama tidak boleh muncul kembali pada UI, copy marketing, email, dokumen baru, atau asset baru.
- Exact legacy identifier yang masih hidup di source/database (misalnya token/class/cookie lama) boleh dipertahankan sementara **hanya untuk kompatibilitas teknis** sampai migrasinya aman. Identifier tersebut bukan identitas visual dan tidak boleh ditampilkan sebagai brand.
- `components/Brand/BrandWordmark.tsx` dan asset brand aktif di `public/assets/brand/undara/` menjadi sumber brand lockup customer-facing.
- PRD **tidak mengunci hex color atau nama font**. Nilai implementasi aktif mengikuti semantic tokens di `app/globals.css`, komponen brand bersama, dan keputusan desain terbaru di source. Ini mencegah PRD menyimpan beberapa palet/font lama yang saling bertentangan.
- Invitation template adalah artwork mandiri. Palet, font, ornament, dan mood template boleh berbeda dari application/marketing shell selama tetap memenuhi kontrak aksesibilitas dan Studio.
- Nama badan hukum, rekening, domain, email, dan social handle hanya ditulis apabila data operasional aktual sudah dikonfirmasi.

### 1.2 Arah visual publik Undara

Arah visual utama Undara adalah **woodland / forest editorial**: hangat, tenang, organik, premium, dan tidak terasa seperti wedding clip-art.

- Motif utama: siluet hutan, canopy, ranting, daun, sulur/ukiran organik, kabut/fog lembut, cahaya halus, dan ruang kosong yang cukup.
- Ornamen floral besar, bunga tempel, legacy petal ambience, kelopak beterbangan, dan dekorasi romantis generik **bukan bahasa visual global Undara**.
- Halaman marketing selain homepage memakai dua aset hutan khusus Light/Dark dengan siluet lembut di tepi dan ruang tengah yang luas, tenang, serta kontras rendah untuk teks. Jangan memakai ranting panjang berdaun di kedua sisi, lapisan kabut/glow bertumpuk, atau daun jatuh yang meramaikan konten.
- Background harus mendukung hierarki konten. Dekorasi tidak boleh menabrak brand, navbar, heading, CTA, form, atau mengurangi keterbacaan.
- Landing/Pintu boleh memiliki treatment atmosfer lebih kuat; halaman marketing lain memakai versi lebih restrained dari sistem woodland yang sama.
- Ilustrasi woodland homepage mengisi lebar viewport melampaui outline mainframe. Sisi kiri/kanannya melebur lembut ke warna dasar halaman, tanpa batas persegi dari layer yang berhenti sebelum frame. Fade atas/bawah menjaga navbar dan footer tetap terbaca; bingkai serta Pintu tetap jelas di depan atmosfer.
- Dark/Light mode harus mempertahankan karakter woodland yang sama, bukan berubah menjadi dua brand visual yang berbeda.
- **Dark woodland boleh memakai lampion kecil di kedalaman hutan** sebagai ambience khusus malam: jumlah sedikit, ukuran kecil, cahaya hangat/redup, tersebar natural, dan selalu background-only. Lampion tidak boleh terasa seperti festival, tidak boleh memenuhi frame, dan tidak boleh bersaing dengan heading, CTA, Pintu, atau navigasi.
- Light mode tidak wajib menampilkan lampion; karakter siangnya mengandalkan canopy, daun, kabut, cahaya alami, dan ruang kosong.
- Aturan ini berlaku untuk **application/marketing shell**. Template undangan tetap boleh mempunyai tema floral, minimal, Jepang, hitam-putih, atau tema lain sesuai desain template.

---

## 2. Canonical Product Lifecycle

### 2.1 Event → Invitation → Publish

Flow utama yang wajib dipertahankan:

1. User klik **`Tambah acara`**.
2. Form acara dibuka tanpa membuat blank database row baru hanya karena form dibuka.
3. User mengisi data acara.
4. User klik **`Simpan acara`**.
5. Server memvalidasi data minimum dan menyimpan event ke PostgreSQL/Prisma.
6. Event menjadi `eventConfigured = true`.
7. User klik **`Buat undangan`**.
8. Invitation Studio membuka event tersebut menggunakan `invitationId` yang tepat.
9. User memilih template.
10. User mengedit desain/konten Studio.
11. User klik **`Simpan desain`**.
12. `Invitation.templateKey` dan data desain tersimpan ke database.
13. User klik **`Publish`**.
14. Jika event belum memiliki Digital Invitation entitlement, user diarahkan ke paket Rp150.000 untuk `invitationId` tersebut.
15. Setelah entitlement aktif, server mengizinkan publish.
16. Public invitation dapat dibuka dan didistribusikan.
17. Selama `isPublished = false`, user boleh mengedit atau menghapus Rangkaian Acara miliknya.
18. Setelah `isPublished = true`, data Rangkaian Acara menjadi terkunci: user tidak dapat mengedit detail event, menghapus event, atau mengembalikannya menjadi draft/unpublished melalui flow customer biasa.
19. Lock setelah publish wajib ditegakkan server-side; menyembunyikan tombol Edit/Hapus di UI bukan security boundary.

Legacy blank draft dari implementasi lama boleh direuse oleh backend saat menyimpan event agar tidak menghasilkan orphan/duplicate record, tetapi blank draft **bukan** flow produk baru.

### 2.2 Server publish gate

Public invitation hanya boleh diterbitkan apabila seluruh kondisi berikut terpenuhi:
- event dimiliki user yang berhak;
- `eventConfigured = true`;
- data minimum event valid;
- `templateKey` tidak kosong;
- Digital Invitation entitlement untuk event tersebut aktif;
- request publish lolos validasi server.

UI bukan security boundary. Request API yang mencoba melewati urutan tersebut tetap harus ditolak server.

Setelah publish berhasil, Rangkaian Acara bersifat immutable untuk customer: event-detail mutation, unpublish, dan delete harus ditolak backend. Invitation Studio tetap dapat dibuka sesuai capability yang tersedia; lock ini khusus pada identitas/detail Rangkaian Acara dan lifecycle record event.

---

## 3. Technical Stack & Engineering Principles

### 3.1 Core stack

- Framework: Next.js App Router / Turbopack.
- Runtime: Node.js >= 22 LTS.
- Package manager: pnpm >= 11.
- Language: TypeScript.
- Database: PostgreSQL.
- ORM: Prisma ORM.
- CSS: Tailwind CSS v4.
- Components: shadcn/ui patterns.
- Icons: Lucide React.
- Animation: Motion via `motion/react`.
- Seating canvas: Konva / `react-konva`.
- Image processing: Sharp.
- Deployment target: Hostinger VPS / Linux.
- CI/CD: GitHub Actions build validation.

### 3.2 Architecture principles

- **Extend Over Replace:** pertahankan route, API, schema, dan data flow existing bila masih kompatibel.
- **PostgreSQL/Prisma is the source of truth:** jangan membuat mock/fake invitation sebagai data produk.
- **Server-authoritative:** authorization, payment entitlement, quota, capacity, seating collision, publish, dan sensitive mutation harus divalidasi backend.
- **Event-scoped isolation:** guest, RSVP, seating, Personal Invitation, WA Blast, check-in, dan entitlement tidak boleh bocor antar-event.
- **Backward compatibility:** route/field legacy yang masih diperlukan boleh dipertahankan sampai ada migration plan eksplisit.
- `/dashboard`, Beranda, Pintu, dan shared public ambience adalah product foundation. legacy petal ambience telah dipensiunkan atas instruksi owner 28 September 2026 dan diganti `components/Layout/FallingLeaves.tsx`.
- `app/globals.css` dan semantic theme token adalah basis styling aplikasi.
- **Production schema synchronization:** deployment yang membawa Prisma migration baru wajib menjalankan `prisma migrate deploy` / `pnpm db:deploy` terhadap `DATABASE_URL` production. GitHub Build Validation / `pnpm build` tidak dianggap bukti bahwa migration production sudah diterapkan.

---

## 4. Account, Authentication & Roles

### 4.1 Registration & onboarding

Registration awal minimal meminta:
- email;
- password;
- konfirmasi password;
- Terms/Privacy consent.

Dashboard onboarding untuk user umum hanya membutuhkan profil workspace seperti `firstName` / nama panggilan. Data couple tidak boleh menjadi requirement universal.

Data event diisi ketika user membuat Rangkaian Acara.

### 4.1g Profil akun dan keamanan (23 September 2026)

Customer dashboard menyediakan Profil Saya untuk melihat/mengubah nama depan, nama belakang, foto profil pribadi (bukan foto event), dan menampilkan email akun sebagai read-only. Foto JPG/PNG/WebP maksimal 5 MB divalidasi dan ditranscode Sharp ke WebP sebelum disimpan dengan nama acak di folder per-user; URL disimpan di `User.avatarUrl`. Header menampilkan avatar tersimpan, fallback inisial jika belum ada foto. Pengaturan Akun menyediakan ganti password dengan verifikasi password saat ini, hash bcrypt baru dan pencabutan sesi sebelumnya, kemudian membentuk sesi aktif baru. Seluruh mutasi akun diperiksa server-side melalui sesi; user tidak boleh mengubah profil pengguna lain. Email change, provider OAuth password reset, dan pengelolaan notifikasi bukan bagian scope tahap pertama ini.


### 4.1a Konsistensi visual Login dan Daftar (22 September 2026)

Masuk (`/login`) dan Daftar (dialog yang dibuka dari menu navbar maupun tombol Daftar di login) memakai identitas UI publik Undara yang sama: shared typography token, semantic primary accent, permukaan popup yang kontras pada kedua mode, shared control geometry, dan focus state yang accessible. Kartu login lebar baca sekitar 480px di tengah halaman yang responsif; dialog pendaftaran lebar sekitar 490px dengan scroll internal ketika tinggi layar terbatas agar kolom, checkbox dan tombol dapat dijangkau di mobile. Navbar, footer, atmosphere woodland global, dan brand `BrandWordmark` tetap milik layout bersama; jangan menduplikasi dekorasi/pemutar musik atau mengubah landing Pintu.

Kedua formulir memakai Google Icon dan kelas visual form yang sama melalui `components/Auth/`, mendukung ID sebagai bahasa default serta label EN lewat LanguageProvider, fokus keyboard yang terlihat, label input eksplisit, tombol lihat/sembunyikan kata sandi, serta pesan error `role="alert"`. Pendaftaran tetap meminta email, password minimal delapan karakter, konfirmasi password, Terms/Privacy consent dan pilihan newsletter seperti semula; layanan Google, respons API, verifikasi email, redirect `next` yang aman, dan role-based routing tetap dipertahankan. Masuk dan Daftar dari burger menu harus membuka dialog tanpa berpindah halaman. Tautan login/register lama (mis. `/login?register=1&next=...`) tetap berfungsi melalui redirect ke beranda dengan query `auth=register`/`auth=login` yang memunculkan dialog bersama; berpindah Masuk ↔ Daftar di dalam dialog tidak boleh membuat burger menu tertinggal. Jangan membuka Studio/area privat melalui perubahan visual ini.

### 4.1b Shared auth component styling refinement (22 September 2026)

Login dan Daftar harus terlihat sebagai satu keluarga komponen, bukan sekadar memakai warna yang sama. `components/Auth/auth-styles.ts` menjadi sumber kelas bersama untuk card surface, decorative brand eyebrow, title, description, label, field, password-toggle, Google action, separator, error, submit, secondary link dan consent/choice box. Login dan Register memakai ritme spacing, tipografi, outline brand, radius, shadow dan state Light/Dark yang sama. Dialog Daftar tetap dapat scroll di layar pendek dan close `X` tetap mendapat ruang. Perubahan visual tidak boleh mengubah endpoint auth, Google OAuth, safe `next` redirect, verifikasi email, validasi password/Terms, atau role routing.

### 4.1c Login/Daftar sebagai dialog terpusat (22 September 2026)

Tombol **Masuk** dan **Daftar** di burger menu marketing/public membuka modal bersama pada halaman yang sedang dilihat, bukan membuka halaman Login tersendiri. Dialog berada di global `components/Auth/AuthDialogHost.tsx` sekali dari root layout di luar subtree burger, sehingga menutup burger tidak me-unmount dialog. `LoginDialog.tsx` mempertahankan login email/password, Google OAuth, role-based redirect, error server dan toggle password; `RegisterDialog.tsx` tetap punya ketentuan password, consent dan registrasi asli. Aksi link silang Masuk ↔ Daftar berpindah isi dialog yang sama; setelah mendaftar berhasil, tampilkan pemberitahuan verifikasi email pada dialog Masuk. URL lama `/login`, `/login?register=1`, dan `/login?error=google_...` tetap menjadi entry point kompatibel: redirect ke `/?auth=login|register&next=...` untuk membuka popup; `next` harus disanitasi sebagai path internal sebelum dipakai. Jangan mengganti API/auth callback maupun memberikan akses private dari UI saja.

Popup mengikuti viewport, bukan koordinat parent navbar: kelas visual `authCardClass` TIDAK boleh menimpa `position:fixed` milik `DialogContent`. Pada desktop letakkan modal di pusat layar, gunakan padding dan gap yang lebih ringkas untuk Daftar dan `max-height` relatif terhadap `dvh` dengan scroll **di dalam dialog** jika layar pendek. Pada mobile sisakan ruang tepi dan pastikan tombol, consent, maupun close X tetap dapat diakses. Hindari dua popup atau overlay bertumpuk dengan menempatkan satu dialog owner di root layout. Backdrop/popup auth harus berada di atas widget navigasi marketing mengambang (z-index modal lebih tinggi daripada mini-door) dengan overlay override yang spesifik auth, bukan menaikkan semua dialog secara global.

### 4.1d Restore burger and align auth backgrounds to landing (22 September 2026)

Perubahan modal Masuk/Daftar **tidak boleh mengubah layout/animasi navigasi burger** yang sudah disetujui: posisi, dimensi, urutan item, animasi, submenu Layanan dan markup visual lama tetap dipakai. **Seluruh label dan ikon item burger berwarna primary** (`text-primary`, `dark:text-primary`) dalam kondisi default; jangan membiarkan `text-foreground`/`dark:text-foreground` menimpa semantic primary atau membiarkan warna teks default Button menimpa teks Daftar. Item Masuk mempertahankan tampilan `Link` awal dan hanya membatalkan navigasi untuk membuka dialog pada halaman yang sedang terlihat; item Daftar tetap memakai `Button` bersama, bukan native button yang dapat berbeda stylenya. `Navbar.tsx` dan halaman landing/Pintu tidak dirombak untuk kebutuhan auth.

Background **kedua dialog auth** memakai surface yang konsisten dan terbaca pada Light/Dark, dengan glow brand yang sangat tipis bila diperlukan. Semua label, field, helper text, Google button dan copy sekunder di panel putih harus memiliki warna teks gelap yang tetap terbaca di kedua mode. Overlay dialog tidak boleh merusak keterbacaan atmosphere marketing di belakangnya. Jangan memasang lapisan ornament legacy, atau pemutar audio duplikat di dalam popup; gunakan ambience yang sudah dimount oleh halaman di belakangnya. Modal tetap di atas widget mengambang dan formulir tetap readable pada tema light/dark.

### 4.1e Kebijakan Privasi publik dan UI baseline terkunci (22 September 2026)

**Visual freeze:** Atas permintaan owner, gaya burger menu dan dialog Masuk/Daftar yang sekarang wajib dipertahankan pada pekerjaan legal/content mendatang: markup/layout, item/submenu, hover/animasi, ikon dan teks default primary, serta kedua dialog putih dengan glow brand tipis dan form text gelap pada kedua mode. Tidak boleh merombak `BurgerMenuContent`, `Navbar`, `auth-styles`, `LoginDialog`, `RegisterDialog`, atau `ui/dialog` untuk perubahan konten seperti Privacy Policy tanpa permintaan eksplisit. Pernyataan aturan lama yang bertentangan (burger berteks hitam atau card auth dark) dinyatakan tidak berlaku.

**Kebijakan Privasi:** `/privacy-policy` menampilkan naskah Bahasa Indonesia yang diberikan owner dengan nama layanan lama “Viding” diganti “Undara”; tersedia terjemahan EN sesuai language toggle existing. Struktur dan isi klaim inti naskah (data dari pendaftaran/form, pengumpulan data teknis otomatis, analisis anonim/agregat, pemrosesan internal, kemungkinan pihak ketiga dan pembatasan penggunaan mereka, tidak menjual/menyewakan data, notifikasi perubahan satu hari sebelumnya, pengakuan saat memakai layanan) dipertahankan. Link dari consent Daftar wajib membuka `/privacy-policy` dalam tab baru tanpa menutup popup/form pendaftaran atau mencentang checkbox secara otomatis; label Privacy Policy yang sudah ada di footer publik harus memiliki href menuju halaman tersebut tanpa mengubah desain footer. Link Syarat & Ketentuan hanya boleh ditambahkan jika halaman ketentuannya sudah tersedia; halaman `/terms-and-conditions` kini disediakan berdasarkan naskah yang dikirim owner, dengan penyuntingan untuk menghindari identitas dan janji operasional perusahaan lain.

**Pemeriksaan sebelum produksi:** Isi policy berasal dari materi owner, bukan audit pengumpulan data aplikasi yang diverifikasi. Klaim penggunaan analytics/geo-location, pihak ketiga, kontrak pembatasan, tidak menjual data, dan pemberitahuan satu hari harus disesuaikan dengan praktik nyata, provider yang dipakai dan kebutuhan hukum sebelum produksi. Jangan menjanjikan kepatuhan regulasi semata-mata karena halaman sudah ditambahkan.

### 4.1f Syarat & Ketentuan publik dari sumber owner (22 September 2026)

Halaman `app/terms-and-conditions/page.tsx` menyediakan route publik `/terms-and-conditions` dalam Bahasa Indonesia dan Inggris sesuai `LanguageProvider`. Sumber awal yang diberikan owner adalah teks ketentuan Viding, yang memuat ketentuan umum, definisi, penggunaan, konten pengguna, biaya, jaminan, pembatasan tanggung jawab, hak kekayaan intelektual, kebijakan privasi, komisi mitra, dan lain-lain; struktur topik tersebut dipertahankan dalam draft yang disesuaikan untuk Undara.

**Koreksi wajib terhadap materi pihak ketiga:** Jangan mencantumkan PT Aku Bisa Ibadah sebagai badan hukum Undara, alamat/domain/email Viding, angka minimum usia tanpa keputusan bisnis/legal dan enforcement, jadwal pencairan komisi 1–3 hari tanpa program mitra yang benar-benar tersedia, atau lisensi konten selamanya/irrevocable/sublicensable serta pelepasan hak moral secara sepihak. Draft menyatakan kepemilikan Konten Pengguna tetap pada pemegang hak dan izin pengolahan konten hanya sebatas pelaksanaan fitur/publikasi sesuai pilihan pengguna. Klausul garansi/tanggung jawab wajib tidak menyatakan penghapusan semua hak konsumen/kewajiban pelindungan data. Rincian biaya/paket mengikuti penawaran nyata; jadwal/aturan program mitra diatur terpisah jika ada.

**Navigasi dan consent:** Link Syarat & Ketentuan pada label consent di `RegisterDialog` membuka route baru di tab baru, di samping link Kebijakan Privasi yang sudah ada; kedua tautan tidak boleh memeriksa checkbox secara otomatis, menutup popup, mereset field, atau mengubah styling form. Footer publik memberi href `/terms-and-conditions` pada label Syarat & Ketentuan yang sudah ada tanpa mengubah layout/warna. Halaman terms mengikuti shell legal halaman privacy, bukan mengubah landing/Pintu. Semua aturan visual freeze di §4.1e dan `AGENTS.md` tetap berlaku.

**Pra-produksi:** Draft Terms ini belum disetujui penasihat hukum/owner sebagai kontrak operasional final. Konfirmasi data badan hukum serta kontak, pembelian/pembatalan/refund, hak penggunaan media, eligibilitas usia, praktik proteksi data, dan program mitra dengan sistem Undara aktual sebelum dipakai secara komersial.

### 4.2 System roles

Role aplikasi yang tetap dapat digunakan untuk backoffice:
- `OWNER` → `/owner`;
- `ADMIN` → `/admin`;
- `FINANCE` → `/admin` untuk payment/financial operation;
- `DESIGNER` → `/designer`;
- `EDITOR` → legacy designer-compatible role;
- `USER` → `/dashboard`.

Authorization route dan mutation harus dilakukan server-side.

### 4.3 Planned event-team access — P1

Event harus mendukung multi-user/team access melalui model seperti `EventMember`:
- `eventId`;
- `userId`;
- `role`;
- `permissions`;
- `invitedAt`;
- `acceptedAt`.

Default event roles:
- **Owner:** full event access;
- **Admin:** hampir seluruh operasional event;
- **Wedding Organizer / Event Operator:** Guest List, RSVP, Seating, Usher, Guestbook; tanpa Billing, Subscription, Payment Account, atau Digital Gift configuration;
- **Usher:** guest search, QR scan, check-in, table information.

Permission harus diperiksa API/backend, bukan hanya hidden menu.

---

## 5. Event Data Model & Rangkaian Acara

### 5.1 Event identity

`Invitation` saat ini tetap menjadi aggregate utama untuk event + digital invitation demi backward compatibility.

Field penting:
- `id`;
- `ownerId`;
- `slug`;
- legacy `type`;
- `eventCategory`;
- `title`;
- legacy `groomName` / `brideName`;
- optional wedding identity `groomFatherName` / `groomMotherName` / `groomChildOrder` / `brideFatherName` / `brideMotherName` / `brideChildOrder`;
- `venue`;
- `address`;
- `mapUrl`;
- `timezone`;
- `eventDate`;
- `eventConfigured`;
- `ceremonyTime` / `receptionTime` sebagai compatibility timing fields;
- `description`;
- `eventNotes`;
- `templateKey`;
- `musicUrl`;
- `isPublished`;
- `viewCount`;
- `waBlastQuota`.

Legacy field names tidak boleh dianggap universal wedding semantics. `groomName`, `brideName`, `weddingHashtag`, `WEDDING`, dan `ADAT_AKAD` dipertahankan sementara sebagai compatibility storage/routing sampai migration strategy ditentukan. Field nama orang tua hanya berlaku pada `WEDDING` dan tidak boleh dipaksakan ke category event lain.

### 5.2 Unlimited event creation

Tidak ada business rule maksimal 3 event.

User dapat membuat event sesuai kebutuhan. Setiap event diaktifkan/dibayar secara independen.

### 5.3 Event category behavior

Dynamic name fields:
- Pernikahan → nama pengantin pria + wanita; secara opsional dapat menyimpan nama bapak dan ibu untuk masing-masing pengantin;
- Silver/Golden Wedding → nama pasangan 1 + pasangan 2;
- Birthday → satu nama utama;
- Baby Shower → nama keluarga/calon bayi;
- Event Lainnya → custom event title.

Untuk `WEDDING`:
- parent identity bersifat opsional;
- masing-masing pengantin memiliki field nama bapak dan nama ibu sendiri;
- jika salah satu atau kedua nama orang tua tersedia, Studio preview dan public invitation otomatis menampilkan parent line di bawah nama pengantin;
- untuk masing-masing pengantin tersedia pilihan opsional **Anak Tertua / Anak Termuda / Anak Keberapa**; hanya pilihan Anak Keberapa memerlukan input angka positif (lihat §5.4a);
- parent line hanya diturunkan oleh fungsi bersama `weddingParentLine` di `lib/events/parents.ts`: Tertua = `Putra/Putri Sulung`, Termuda = `Putra/Putri Bungsu`, Anak Keberapa = `Putra/Putri Kedua` untuk urutan 2 (dan bentuk angka lain menurut formatter); data asli tidak diubah saat render;
- keterangan keluarga ditampilkan dalam Title Case sesuai §5.4a;
- jika urutan anak kosong, renderer tetap menampilkan `Putra dari ...` / `Putri dari ...`;
- jika hanya satu parent yang diisi, renderer hanya menampilkan parent yang tersedia dan tidak membuat placeholder kosong;
- data parent tidak menjadi syarat `eventConfigured` maupun Publish.

Title predefined category dapat digenerate dari category + identity, misalnya:
- `Pernikahan Rio & Lyvia`;
- `Silver Wedding Budi & Ani`;
- `Ulang Tahun Olivia`;
- `Baby Shower Keluarga Wijaya`.

### 5.4 Required fields before configured

Server minimal memerlukan:
- event category/title;
- identity/name sesuai category;
- event date;
- start time;
- venue.

Optional:
- untuk WEDDING: nama bapak/ibu dan urutan anak masing-masing pengantin;
- end time;
- address;
- Maps URL;
- description;
- notes.

### 5.4a Pilihan Urutan Anak & Format Keterangan Orang Tua (23 September 2026)

- Pada form pernikahan, **masing-masing mempelai** memiliki pilihan tunggal berbentuk radio/bullet check: `Anak Tertua`, `Anak Termuda`, atau `Anak Keberapa`. Hanya pilihan ketiga memunculkan input angka urutan anak positif; angka wajib diisi bila dipilih. Pilihan awal boleh kosong agar data pernikahan lama yang tidak memiliki urutan anak tetap opsional. Nilai numerik lama dibuka kembali pada pilihan ketiga, bukan dianggap otomatis Sulung.
- Urutan anak disimpan tanpa menduplikasi nama/data keluarga: `Invitation.groomChildOrder` / `brideChildOrder` tetap `Int?` numerik; `Invitation.groomChildPosition` / `brideChildPosition` menyimpan pilihan `ELDEST`, `YOUNGEST`, `NUMBER` atau null. Anak termuda tidak bisa disimpulkan dari angka urutan anak tanpa mengetahui jumlah saudara. Saat memilih tertua/termuda, angka urutan sebelumnya dikosongkan; data undangan lama dipertahankan.
- Format tampilan terpusat di `lib/events/parents.ts`: `Putra/Putri Sulung Dari Bapak Chandra & Ibu Juni`, `Putra/Putri Bungsu Dari Bapak Chandra & Ibu Juni`, atau `Putra/Putri Kedua Dari Bapak Chandra & Ibu Juni` untuk urutan 2. Setiap kata pada keterangan keluarga dan nama orang tua yang ditampilkan diawali huruf kapital di Dashboard preview, Studio preview, dan undangan publik seluruh tema. Data nama asli di DB/API dan isi deskripsi tetap apa adanya. Jika parent kosong, jangan tampilkan placeholder.
- Perubahan membutuhkan migrasi DB kolom baru dan regenerasi Prisma sebelum build lokal; server tetap memvalidasi pilihan serta angka, dan kebijakan kunci acara terbit tetap berlaku.

### 5.5 Date/time UX

Field **Tanggal acara** wajib menggunakan input user-facing eksplisit:

`dd/mm/yyyy`

Contoh: `17/09/2026`.

Frontend harus:
- mendukung manual input `dd/mm/yyyy`;
- menyediakan icon/tombol kalender interaktif yang membuka date picker;
- hasil pilihan dari kalender harus kembali tampil sebagai `dd/mm/yyyy`, bukan format locale/browser lain;
- membatasi format menjadi 10 karakter;
- menyisipkan `/` secara konsisten;
- memvalidasi tanggal kalender nyata;
- menolak tanggal invalid;
- mengubah `dd/mm/yyyy` ke `yyyy-mm-dd` sebelum API/database;
- mengubah value database kembali ke `dd/mm/yyyy` saat edit.

Native/internal date input boleh menggunakan ISO `yyyy-mm-dd` sebagai bridge ke calendar picker selama format yang terlihat user tetap `dd/mm/yyyy`.

Field **Waktu mulai** dan **Waktu selesai** wajib memakai format 24 jam eksplisit:

`HH:mm` dengan rentang `00:00` sampai `23:59`.

Frontend harus:
- mendukung input manual `HH:mm`;
- menyediakan icon/tombol jam interaktif seperti pola calendar picker;
- picker aplikasi memilih jam `00–23` dan menit `00–59`;
- tidak menampilkan atau menyimpan format AM/PM;
- memvalidasi waktu 24 jam sebelum event disimpan;
- mempertahankan value `HH:mm` saat dibaca ulang dari database/API;
- `Waktu selesai` tetap opsional; jika user memilih **`Tampilkan “- end” di undangan`**, UI menonaktifkan input waktu selesai dan menyimpan sentinel internal `END` pada compatibility field `receptionTime`;
- renderer Studio dan public wajib menampilkan `- end` untuk sentinel tersebut, sedangkan `receptionTime` kosong tetap berarti tidak ada label waktu selesai.

Zona waktu yang didukung:
- WIB — `Asia/Jakarta`;
- WITA — `Asia/Makassar`;
- WIT — `Asia/Jayapura`.

### 5.6 Event list actions

State/action yang harus jelas:
- event belum tersimpan → `Simpan acara`;
- event tersimpan, belum punya desain → `Buat undangan`;
- desain sudah tersimpan → `Edit undangan` / `Buka Studio`;
- event dapat tetap diedit melalui `Edit acara`;
- event terbit → status `Terbit` dan public action.

---

### 5.7 Sesi pernikahan pada hari yang sama — requirement disetujui (implementasi pending)

Scope khusus `eventCategory = WEDDING`; jangan mengubah form acara umum atau mengasumsikan semua pasangan melakukan akad/pemberkatan. Label Indonesia default untuk prosesi gereja adalah **Pemberkatan Pernikahan** (bukan Holy Matrimony atau Pengukuhan). Pilihan jenis prosesi: **Akad Nikah**, **Pemberkatan Pernikahan**, atau **Prosesi Pernikahan** (netral). Label `Resepsi` tetap terpisah. Label dapat disesuaikan untuk kebutuhan upacara/adat lain tanpa mengganti kategori utama acara.

**Aturan paket dan tanggal**
- Satu record event/invitation hanya memiliki **satu tanggal acara (`eventDate`)**. Pernikahan dengan prosesi dan resepsi **pada tanggal kalender yang sama di zona waktu acara** boleh memiliki dua sesi pada satu event, satu undangan, satu pembayaran Digital Invitation/event. Lokasi dan jam tiap sesi boleh berbeda.
- Jika prosesi dan resepsi **pada tanggal yang berbeda**, user harus membuat **dua Rangkaian Acara**, masing-masing mempunyai `invitationId`, satu tanggal, template, publish gate, dan **paket Undangan Digital berbayar tersendiri**. Jangan menerima atau menyimpan tanggal kedua ke dalam satu event sebagai jalan pintas. Tampilkan petunjuk ini di form sebelum user membayar/menerbitkan.
- Mengisi/mengedit detail acara dan memilih desain boleh sebelum bayar; entitlement tetap ditegakkan di saat Publish sesuai lifecycle canonical, bukan saat memilih sesi. Jangan otomatis membuat invoice, duplicate event, atau menyembunyikan workspace persiapan.

**Rangkaian Acara → Pernikahan**
- Sediakan pilihan sesi: **Prosesi Pernikahan** (jenis: Akad Nikah / Pemberkatan Pernikahan / Prosesi Pernikahan) dan **Resepsi**. Minimal satu sesi aktif; boleh keduanya.
- Setiap sesi aktif memiliki input wajib **waktu mulai** dan **nama lokasi**; input opsional **waktu selesai, alamat, dan tautan peta**. Seluruh sesi berbagi **tanggal acara** dan **zona waktu** milik event. Jangan menyamakan `receptionTime` legacy (waktu selesai acara) dengan **waktu mulai resepsi**.
- Jika kedua sesi dipilih, user boleh mengatur jam dan lokasi berbeda pada tanggal yang sama. Form tidak memaksa prosesi untuk pengguna yang hanya mengadakan resepsi.
- Pada event non-pernikahan, form/jadwal existing tetap dipakai tanpa muncul istilah prosesi pernikahan.

**Pilihan tamu dan rendering**
- Satu undangan per tamu memiliki pilihan cakupan **Prosesi saja**, **Resepsi saja**, atau **Keduanya** jika kedua sesi aktif; bila hanya satu sesi aktif, cakupan otomatis sesi tersebut. Penentuan dilakukan pada daftar/manajemen tamu dan pembuatan/pengeditan Personal Invitation, bukan pada field global event yang akan berlaku untuk semua tamu.
- Simpan cakupan per `Guest`, terikat pada `invitationId`. API validate bahwa pilihan bukan kosong, bukan sesi nonaktif, dan tidak bisa mengarah ke event lain. Saat memilih ulang tanggal/prosesi sebelum Publish, scope guest yang lama harus diperiksa/migrasi secara eksplisit; jangan diam-diam mengubah daftar undangan.
- **Tautan personal** hanya merender sesi yang diizinkan bagi tamu tersebut (waktu/lokasi/peta dan kalender), termasuk pada template alternatif dan preview personal. Filtering wajib dilakukan sebelum data masuk ke komponen publik; jangan hanya menyembunyikan blok via CSS. Tautan publik umum tidak dapat mewakili hak akses per tamu: untuk undangan bersesi terbatas gunakan tautan personal; UI admin diberi penjelasan agar tidak mengirim tautan generik sebagai undangan khusus.
- RSVP/QR dan check-in berikutnya perlu memiliki cakupan sesi yang konsisten: tamu yang mendapat dua sesi tidak boleh diasumsikan pasti hadir di keduanya hanya karena satu RSVP. Rancang data/migrasi dan skenario pengujian sesi sebelum mengaktifkan distribusi massal.
- Publikasi sebuah sesi **tidak berarti** semua tamu diundang ke sesi tersebut. Hak akses event-scoped, password, dan published state tetap berlaku.

**Compatibility dan urutan implementasi**
- Saat ini `Invitation.ceremonyTime` adalah **waktu mulai event**, sedangkan `Invitation.receptionTime` adalah **waktu selesai atau sentinel `END`**, bukan dua sesi. Jangan diam-diam menafsirkan data lama sebagai pemberkatan + resepsi.
- Implementasi harus mencakup perubahan model Prisma + migration, validasi create/update/publish di server, Rangkaian Acara UI, guest/personal invitation API + UI, seluruh renderer publik/preview, serta pengujian same-day/different-day, light/dark dan ID/EN sebelum dinyatakan selesai. Deploy dengan `pnpm db:deploy` untuk migration baru.
- **Status:** requirement/arsitektur tercatat; kode sesi, migrasi database, pilihan per tamu, dan filtering publik **belum diimplementasikan**. Jangan mengklaim fitur sudah tersedia dari perubahan dokumentasi ini.

## 6. Dashboard Information Architecture

### 6.0 Mainframe dashboard (pembaruan 23 September 2026)

Customer `/dashboard` menggunakan **satu mainframe responsif dengan outline brand** yang membingkai sidebar, header, dan konten operasional seperti komposisi landing, tanpa menyalin Pintu, atmosphere woodland, pemutar musik, atau animasi marketing. Sidebar dan konten Light putih, Dark hitam; Primary brand token digunakan pada teks/ikon aksen, outline, hover, dan menu aktif sesuai semantic token dashboard. Brand `BrandWordmark` tampil sekali di sidebar; header menampilkan judul halaman, kontrol tema/bahasa, dan menu pengguna. Frame memiliki tinggi terbatas mengikuti viewport; hanya area konten `dc-dashboard-scroll` yang dapat menggulir, sedangkan sidebar, header, dan drawer mobile tetap berada di dalam frame. Ketentuan ini menggantikan deskripsi header/body yang menggulir bebas atau membentang di luar frame.

**Hierarki final:** hanya panel section besar dan peer-level Beranda yang memiliki frame/garis aksen brand `0,3 cm` di sisi kiri, tiga sudut siku dan hanya sudut kanan atas membulat. Satu `DashboardPanel` memuat judul, aksi, dan isinya; `DashboardMetricGrid` mengelompokkan angka dalam satu frame besar. Baris detail acara, undangan, tamu, RSVP, WA Blast, dan statistik di dalamnya **tidak** diberi frame mini/garis tebal terpisah; gunakan pemisah tipis dan penanda hover/selected hanya bila ada interaksi. Form akun yang berdiri sendiri boleh memakai satu panel besar; input, tombol, badge, modal, denah interaktif, dan mainframe luar memiliki geometri masing-masing. Data nyata dan navigasi mobile harus tetap berfungsi.

**Beranda — QR Undangan (4 Oktober 2026):** Tombol `QR Undangan` di bagian atas Beranda membuka pilihan undangan milik user tanpa berpindah workspace. Daftar diambil saat dibuka dan mengikuti `accessPaid` yang dihitung server: pembayaran paket Digital Invitation `PAID` untuk event tersebut atau hak Digital Invitation manual yang masih aktif dari panel Owner. Hak manual tidak mengubah payment menjadi `PAID` atau dihitung sebagai penjualan. User memilih undangan secara eksplisit, termasuk draft yang memiliki akses; pratinjau dan unduhan memakai `Invitation.id` yang sama melalui endpoint internal existing. Pemilik dapat mengunduh QR draft; scan tetap membuka undangan hanya setelah Publish. Pratinjau tidak menampilkan penjelasan “Tautan terbuka setelah Publish”. Pratinjau/unduhan memakai komponen bersama dengan halaman Undangan, mendukung loading/error/retry dan ID/EN, dan download menunggu gambar berhasil dimuat. Popup memakai judul, label pilihan dan aksi singkat; penjelasan umum seperti “Satu QR untuk setiap undangan” tidak ditampilkan. Pesan hanya muncul saat menjelaskan status loading, error atau akses kosong. Beranda tetap memakai frame, theme, komponen dan action existing.

Sidebar user:
- **Beranda**
- **Acara**
  - Rangkaian Acara
  - Undangan
  - WA Blast
- **RSVP**
- **Manajemen Tamu**
  - Undangan Personal
  - Pengaturan Meja
- **Usher App**

WA Blast ditampilkan sebagai submenu **Acara / Events**, sejajar dengan Rangkaian Acara dan Undangan. **Undangan Personal** berada hanya di submenu **Manajemen Tamu**, bersama **Pengaturan Meja**. Label navigasi dan heading cukup **WA Blast**, tanpa kata Add-on. Pembelian kuota tetap terpisah dari Undangan Digital; perubahan navigasi tidak mengubah entitlement atau harga.

Workspace yang menggunakan data event harus menyediakan explicit event scope. Tidak boleh diam-diam memilih event pertama jika user memiliki lebih dari satu event.

### 6.1 Dashboard access before Publish

Payment Digital Invitation **bukan gate untuk membuka isi dashboard**. Customer harus dapat masuk, melihat, dan menyiapkan workspace terkait invitation sebelum event dipublish atau sebelum Digital Invitation dibayar.

Canonical behavior:
- **Rangkaian Acara**, **Undangan/Studio**, **Personal Invitation**, **RSVP**, dan **Manajemen Tamu** tetap dapat dibuka sebelum Publish/payment;
- RSVP dan Manajemen Tamu tidak menampilkan activation/paywall overlay hanya karena `accessPaid = false`;
- Personal Invitation juga dapat dipersiapkan sebelum Publish; public delivery tetap bergantung pada lifecycle public invitation yang valid;
- Personal Invitation memiliki personalisasi Amplop per Guest yang dapat ON/OFF dari Dashboard. Saat ON, nama berasal dari `personalAddressee` atau fallback `Guest.name`, ditampilkan Title Case tanpa menimpa data sumber. Bahasa sapaan disimpan per Guest sebagai ID/EN; pasangan dengan dua nama yang dipisahkan `&`/“dan”/“and” dirender **“Kepada Yth : Bapak [Nama] dan Ibu [Nama]”** atau **“Dear : Mr [Name] and Mrs [Name]”**. Saat OFF, Amplop kembali generik tetapi token personal, RSVP, WA Blast, seating dan data Guest tetap sama.
- Form Dashboard menampilkan pratinjau sapaan yang berubah bersama nama, jenis penerima, bahasa, dan toggle. Canvas Amplop di Studio menampilkan contoh ID/EN untuk membantu penataan semua tema; contoh tersebut hanya milik pratinjau, tidak disimpan pada undangan dan tidak pernah menjadi nama tamu publik. Tautan personal memakai pengaturan Guest yang nyata; pratinjau katalog umum tetap tanpa contoh nama personal.
- Bahasa personal per Guest juga memilih bahasa awal seluruh undangan yang terbit (Amplop, label/narasi bawaan tiap bagian, tanggal, hitung mundur, RSVP, Ucapan, dan tombol). Undangan publik umum mulai dalam bahasa Indonesia. Tamu dapat mengganti ID/EN melalui kontrol pada undangan terbit; pilihan itu mengubah tampilan saja dan tidak menulis ulang profil Guest. Canvas Studio memiliki kontrol ID/EN di dekat Amplop/Isi untuk memeriksa kedua versi sebelum Publish. Narasi bawaan diterjemahkan otomatis; tulisan bebas pemilik acara, nama, alamat, venue, catatan, dan judul custom harus dipertahankan sesuai input sumber. Untuk narasi template yang ditulis sendiri, Studio menyimpan versi Inggris terpisah (`copyEn`) agar pemilik dapat memeriksa/melengkapinya tanpa mengubah versi Indonesia. Tidak menjanjikan terjemahan mesin untuk tulisan bebas yang belum diberi versi Inggris.
- apabila belum ada data karena undangan belum dibagikan, gunakan empty state normal agar user tetap dapat memahami fungsi halaman;
- payment gate Digital Invitation hanya ditegakkan ketika user menekan **Publish** di **Dashboard → Undangan Digital**; Studio hanya untuk menyusun dan menyimpan desain, tanpa tombol Publish atau pembayaran;
- public RSVP/personal invitation tidak dianggap usable untuk tamu sampai parent invitation memenuhi configured + saved template + published + entitlement gates;
- entitlement produk terpisah tetap berlaku: WA Blast tetap memakai quota/add-on sendiri dan Usher App tetap mengikuti Guestbook Digital bila diperlukan.

Tujuan UX: user dapat mengeksplorasi isi Dashboard dan menyiapkan operasional acara tanpa dipaksa membayar sebelum mencapai Publish.

### 6.2 Desktop dashboard shell

Pada desktop, `/dashboard` memakai **mainframe yang dibatasi viewport**, bukan legacy full-width header/body atau kontainer `max-width: 1400px` yang terpisah. Sidebar dan header tetap di dalam mainframe; hanya pane konten di sebelah sidebar yang scroll. Satu `BrandWordmark` menjadi anchor di sidebar, bukan logo kedua pada header.

Layout canonical:
- mainframe memakai inset desktop sesuai frame marketing yang telah disetujui; tidak memperpanjang body saat isi dashboard tinggi;
- konten di dalam pane menargetkan `80vw` tetapi dibatasi `max-w-full` dan lebar ruang yang benar-benar tersedia setelah sidebar;
- sidebar tetap stabil, dan pada layar sempit gunakan drawer di dalam frame tanpa horizontal overflow;
- panel besar memuat satu section utuh; detail di dalamnya adalah baris tanpa frame mini, dengan pemisah tipis dan kontrol berukuran nyaman;
- selector dan form yang tidak perlu lebar penuh boleh tetap compact; daftar panjang harus responsif tanpa memaksa isi keluar dari frame;
- copy tidak memakai decorative sequence numbering seperti `Workspace / 01`; angka yang merupakan data asli (tanggal, harga, pax, kapasitas, kuota, urutan anak, metrik) tetap ditampilkan.

### 6.3 Dashboard theme & language

Seluruh customer Dashboard dan nested workspace wajib mendukung **Light Mode + Dark Mode** melalui shared `ThemeProvider` dan semantic theme tokens. Tidak boleh membuat page-specific dark palette yang terpisah dari design system.

Canonical behavior:
- Light/Dark Mode mengikuti semantic theme tokens aktif di `app/globals.css`; jangan hardcode palet lama di halaman Dashboard;
- seluruh surface, text, border, selected state, dan CTA harus tetap terbaca pada kedua mode;
- theme toggle harus tersedia dari Dashboard header pada desktop dan tetap dapat diakses pada mobile;
- surface/card/table/input/empty/loading/error state seluruh tab harus terbaca baik pada kedua mode;
- jangan memakai hardcoded light-only background/text bila semantic token tersedia.

Dashboard juga wajib mendukung **Bahasa Indonesia + English** menggunakan shared language state aplikasi:
- default locale adalah **Bahasa Indonesia (`id`)** ketika user belum memiliki preference tersimpan;
- language toggle harus tersedia di Dashboard;
- pilihan locale disimpan melalui mekanisme existing `dc_locale`;
- sidebar, header, Beranda, Rangkaian Acara, Undangan, Personal Invitation, WA Blast, RSVP, Manajemen Tamu/Seating, Usher, form labels, empty state, status, dan dashboard-generated feedback harus mengikuti locale aktif;
- data milik user seperti nama acara, nama tamu, venue, notes, dan invitation content **tidak diterjemahkan otomatis**;
- value teknis/API/database tetap stabil; localization hanya mengubah presentation/copy.

---



## 7. Digital Invitation & Invitation Studio

### 7.1 Event-scoped Studio

Studio dibuka menggunakan exact `invitationId`:

`/dashboard/editor?type=<legacy-type>&invitationId=<event-id>`

`invitationId` adalah source event utama. Parameter `type` hanya compatibility fallback.

Studio tidak boleh kembali memakai global first-WEDDING assumption.

### 7.2 Event data inside Studio

Core event data berasal dari Rangkaian Acara dan dibaca sebagai synced event content:
- title / identity;
- optional wedding parent identity;
- date;
- time;
- timezone;
- venue;
- address;
- Maps;
- description;
- notes.

Studio fokus pada invitation-specific configuration:
- template;
- palette;
- typography template;
- decor/gallery;
- event tag/hashtag compatibility field;
- dress code;
- music;
- canvas undangan langsung sebagai pratinjau interaktif;
- save design. **Publikasi/pembayaran bukan kontrol Studio: hanya melalui Dashboard → Undangan Digital.**

### 7.2.0a Studio template chooser — full portrait preview (24 September 2026)

Daftar pemilihan tema pada panel kiri Studio menampilkan masing-masing Cover/Hero sebagai kartu portrait **utuh dan proporsional** (satu kolom per tema, dengan nama dan kategori foto di bawah gambar), bukan thumbnail landscape terpotong dua kolom. Pilihan terbaru owner: dua kartu berjajar per baris, masing-masing maksimum 152px (~4 cm dalam ukuran CSS standar) dengan rasio portrait 9:19.5 (tinggi sekitar 329px/~9 cm pada lebar maksimum). Kartu mengecil mengikuti lebar inspector bila dua kolom tidak cukup untuk mencapai 152px; template tetap ditampilkan utuh dengan renderer Cover dan lazy loading. Ukuran renderer asli menyesuaikan lebar panel secara responsif; panel sendiri tetap dapat digulir dan lazy render hanya dilakukan saat kartu mendekati area terlihat. Pratinjau Studio di sebelah kanan tetap renderer undangan interaktif, termasuk Amplop Digital. Katalog publik dan kartu ponsel featured tidak ikut berubah. Pilihan tema yang diklik, penyimpanan desain, filter, dan pemisahan data demo/pelanggan tetap menggunakan alur sebelumnya.

### 7.2.0d Kontrol layer di sisi canvas dan shortcut keyboard (24 September 2026)

Saat objek visual dipilih, Studio menampilkan inspector styling di sisi **kanan canvas** sesuai kontrak objek pada §7.2.0b dan `studio.md`. **Delete/Backspace** menghapus layer dekoratif terpilih yang boleh dihapus, **Ctrl/Cmd+C** menyalin propertinya ke clipboard internal Studio, **Ctrl/Cmd+V** menambahkan duplikat dengan ID baru serta offset posisi, dan **Escape** membatalkan pilihan. Amplop dan seluruh section Isi memakai jalur shortcut yang sama. Shortcut mutasi hanya berlaku ketika target keyboard berada di canvas; fokus pada rail/panel luar canvas, dialog preview, input, textarea, select, elemen contenteditable, atau seleksi teks tidak boleh dibajak. **Ctrl/Cmd+Z** menjalankan Undo desain, **Ctrl/Cmd+Shift+Z** menjalankan Redo, dan **Ctrl+Y** juga mendukung Redo. Clipboard internal ini bukan clipboard OS, tidak menyalin foto/gambar ke aplikasi lain dan tidak membaca data clipboard sistem. Batas layer/capability mengikuti §7.2.0b; tombol Undo/Redo dan penyimpanan desain yang sudah ada tetap dipakai. Panel Aset kiri dan renderer undangan publik tetap mempertahankan perilaku yang sudah ada.

**Fokus shape dan shortcut (3 Oktober 2026):** menambahkan Rectangle/Lingkaran/Line dari Aset memilih layer baru, melepas seleksi foto/native sebelumnya, menampilkan canvas pada mobile dan memindahkan fokus ke canvas setelah render. Memilih layer langsung di canvas atau dari daftar juga memindahkan fokus ke viewport tanpa scroll tambahan akibat fokus. Dengan demikian Delete/Backspace memakai jalur penghapusan layer yang sudah ada segera setelah penambahan/seleksi; tidak perlu menekan tombol Aset lalu memindahkan fokus manual. Input/textarea/contenteditable, seleksi teks dan layer locked tetap mengikuti guard shortcut yang sama.

**Aktivasi editor (3 Oktober 2026):** seleksi visual dari canvas/panel dan penambahan/drop aset, teks atau shape membuka inspector kanan serta menampilkan canvas mobile; setelah render/navigasi dan Selesai Crop, fokus kembali ke canvas. Input/contenteditable mempertahankan fokus mengetik. Tombol sistem yang menghentikan bubbling di preview tetap mempunyai jalur seleksi visual. Kontrol native hanya muncul bila key diterima codec; field custom RSVP tetap memakai properti komponen yang didukung. Resize dan reset geometri dari handle mempertahankan style/font/opacity/motion, sedangkan gesture asset/native/crop menjaga kepemilikan pointer dan menghormati Space-pan. Drag lintas section memakai viewport Undara yang benar, tanpa mengubah sistem koordinat tersimpan.

### 7.2.0b Objek dekoratif Aset dan Teks lintas section pada Customer Studio (24 September 2026)

Menu **Aset** mengambil gambar raster turunan publik dari `public/template/` dan `public/templates/` dan tidak pernah mengekspos master privat. Menu **Teks** membuat **objek teks dekoratif baru** (maksimal 180 karakter), bukan mengganti nama, jadwal, nama orang tua, detail tempat, label komponen sistem, narasi tetap template, atau data RSVP. Komponen wajib dan fitur bisnis tetap memakai data bersama serta toggle/izin template yang sudah ada. Ini adalah editor override dekoratif pada **undangan event-scoped**, bukan Designer Studio yang menghasilkan/menjual master baru dan bukan izin memodifikasi sembarang struktur komponen.

Setiap undangan dapat menyimpan maksimal 12 objek dekoratif gabungan (gambar + teks) yang terikat section aktif, dengan koordinat persen relatif pada section, ukuran/lebar, rotasi terbatas, opasitas, dan susunan layer. Teks juga menyimpan string aman (render sebagai teks biasa), ukuran font, warna hex valid, dan pilihan keluarga font heading/body tema; HTML, style arbitrer, URL eksternal, dan perubahan nilai data core tidak diizinkan. Kartu Aset dapat diklik untuk menempel ke Cover, atau diseret lalu dilepas di section yang terlihat untuk memakai koordinat lokasi drop; teks dibuat di section aktif lewat pemilih di menu Teks. Objek yang sudah ditempel dapat digeser dengan pointer/touch lintas section yang terlihat atau dipindah lewat dropdown bagian pada inspector kanan; handle pada objek terpilih mengubah ukuran dan rotasi langsung, tanpa outline putih permanen pada artwork. Section OFF menyembunyikan objeknya tanpa menghapus data. Area utama dan tombol RSVP/Wishes/Gift, lokasi, dan amplop tetap wajib fungsional pada desktop/mobile.

Inspector kanan menyediakan teks/tipe font/warna/ukuran teks bagi objek teks, serta bagian, lebar, rotasi, opasitas, urutan, salin-tempel internal, dan hapus. Delete/Backspace serta Ctrl/Cmd+C/V dan Escape bekerja untuk objek terpilih di Studio tanpa mencuri shortcut pengetikan input, textarea, contenteditable atau teks yang diseleksi. Satu gesture selesai menjadi satu titik perubahan Undo/Redo; desain disimpan saat pemilik menekan **Simpan Desain**, bukan Publish, melalui design key event tersendiri agar preview dan renderer publik menampilkan hasil yang sama. File raster tidak diunggah ulang, tidak ada tabel database/foto/event baru, dan mengganti template mengosongkan override dekoratif tema sebelumnya (Undo dapat mengembalikannya).

**Batas teknis bertahap:** serializer `::layers=` di `Invitation.templateKey` tetap digunakan untuk override dekoratif event demi kompatibilitas fitur sebelumnya, tetapi **bukan** skema proyek master multi-section yang dipersyaratkan `studio.md`. Renderer dan UI wajib tetap menolak section/key/URL/teks/properti yang tidak valid; audit izin role/template, tabrakan objek dengan tombol bisnis, performa, dan hasil CI/browser masih menjadi syarat sebelum mengklaim fitur siap produksi. Master editor Designer, versi template, dan pesanan custom tetap scope terpisah.


### 7.2.0c Designer Studio: protected visual editor untuk template jual dan custom (24 September 2026)

**Tujuan aktif:** desainer berizin dapat login dan membuat/mengedit/menyimpan *master template* di Undara langsung, baik untuk katalog jual maupun pesanan custom event pelanggan, tanpa wajib berpindah ke platform desain lain. **Designer Studio** mengatur komposisi, layer, visual, animasi dan capability lintas section; **Customer Studio** hanya mengganti konten/properti yang diizinkan master. Kedua mode menggunakan renderer/komponen nyata yang sama. Semua komponen bisnis (amplop, identitas/jadwal, RSVP, Ucapan Tamu, hadiah, lokasi, countdown, foto, musik) dilindungi: desain/varian presentasi boleh diubah melalui properti yang di-whitelist, tetapi data wajib, perilaku form, validasi, API, database, aksesibilitas dan otorisasi tetap ditentukan engine bersama. Objek dekoratif boleh diubah bebas jika aman. **Arahan owner 4 Oktober 2026:** semua target visual Studio yang terdaftar—termasuk judul, narasi, foto, presentasi data acara dan wrapper/tombol komponen—boleh dihapus secara visual sampai kosong. Delete menyimpan override `hidden` per target/instance, tanpa menghapus record data, file media atau engine bersama; section dapat dihapus sampai layout kosong. Undo dan Kembalikan ke Default memulihkan presentasinya. Nilai data, logika/API, dan izin tetap tidak dapat diganti dengan kode arbitrer.

**Kanvas Studio (26 September 2026):** Amplop dan Isi tetap halaman desain yang dapat dipilih; interaksi objek dekoratif memakai engine transform bersama lintas section. Canvas Kosong hanya dapat dibuat oleh role OWNER dan DESIGNER, diperiksa lagi pada API penulisan master; pelanggan dan EDITOR tidak dapat memulai master kosong. Footer kecil di bawah canvas menampilkan posisi/jumlah halaman desain aktif, nama section, serta slider zoom 10–500% di kanan bawah. Zoom hanya memperbesar tampilan editor dengan transform viewport, tanpa mengubah lebar layout, reflow, ukuran/koordinat tersimpan, atau hasil publik. Pada semua tingkat zoom, area kosong canvas dapat diseret kiri/kanan/atas/bawah untuk pan; Space+drag tetap tersedia. Angka dihitung dari section yang benar-benar tampil, termasuk duplikasi; kontrak yang sudah ada tetap 15 kontrol visibilitas (14 halaman visual dan satu Musik global), sehingga angka `16/16` hanya muncul bila desain memang memiliki 16 halaman. Elemen bawaan yang saat ini memakai transform visual tersimpan mencakup judul Amplop/Sampul, heading/kicker/divider section, teks naratif berpenanda, tombol visual Location/Gift, elemen RSVP berpenanda, frame foto Cover/Identitas dan foto Galeri per ID aset, dekorasi utama Amplop/Cover/section per tema, serta node tampilan data yang aman seperti nama, venue/alamat, tanggal/waktu, kartu countdown, rekening, ikon, nama/hashtag penutup dan rule dekoratif. Target pada section duplikat memakai `data-section-instance-id` agar transform tiap instance tersimpan terpisah. Struktur internal protected component—misalnya child icon/label dalam satu tombol atau divider, angka/label di dalam satu kartu countdown, field dan perilaku RSVP/Wishes, status runtime, serta helper preview—tetap diperlakukan sebagai bagian komponen/grup dan tidak otomatis menjadi node bebas. Elemen lain yang belum mendukung seleksi/transform langsung wajib dipindahkan bertahap ke capability editor bersama tanpa mengubah fungsi protected component. Status editor penuh belum boleh dinyatakan selesai hanya karena cakupan target visual sudah jauh lebih luas.

**Klik latar section (3 Oktober 2026):** klik area latar kosong pada Amplop/Isi memilih section dan membuka properti kanan; seleksi foto/native sebelumnya dilepas. Pan dari background baru menangkap pointer setelah gerakan melewati 3px, sehingga tap tetap memilih section; Space+drag tetap tersedia. Kontrol **Latar** tampil di awal inspector dan memakai override warna aman `sectionStyles` yang sama untuk Undo/Redo, refresh draft, Simpan dan renderer publik. Pada Amplop/Cover, override juga mencapai root scene di dalam wrapper section dan mengganti background CSS/gradient di sana. Warna tetap mengikuti key section yang sudah ada; instance duplikat sejenis memakai warna bersama, tanpa model penyimpanan baru.

**Lifecycle:** simpan master sebagai draft → validasi/review → terbitkan versi render-ready ke katalog. Undangan pelanggan menggunakan versi master yang ditetapkan plus override event-scoped; perubahan master tidak mengubah undangan yang telah terbit diam-diam. Proyek custom hanya untuk event dan desainer yang ditugaskan secara terotorisasi, melalui preview/revisi/persetujuan; tidak otomatis masuk katalog. Desain visual dari ZIP/HTML/JSON unggahan tidak otomatis siap dieksekusi. Model/format proyek versi baru, migrasi kompatibilitas dengan `DesignerTemplate`/`Invitation.templateKey`, UI editor penuh, dan workflow custom **masih merupakan requirement, bukan fitur yang sudah dikirim**. Aturan operasional/acceptance criteria yang spesifik ada dalam `studio.md`, sedangkan `prd.md` ini tetap menjadi sumber persyaratan produk kanonik. Batas Cover-only §7.2.0b menjelaskan implementasi awal **Customer Studio saat ini**, bukan batas desain akhir Designer Studio.

**Frame foto dan kontrol Ucapan (3 Oktober 2026):** frame Cover/Identitas memakai key native per instance section seperti foto Galeri, dengan fallback untuk override visual legacy. Transform identity pada instance boleh tersimpan untuk menetralkan geometri legacy. Duplikasi/penghapusan section menyalin/membersihkan override frame pada instance tersebut. Isi foto, assignment, motion dan crop tetap mengikuti slot bersama; pengaturan latar tetap per key section. Input/Button Ucapan memakai whitelist transform komponen protected yang sama; penghapusan visual komponen mengikuti arahan 4 Oktober 2026, sementara record form/data tetap utuh.

### 7.2.1 Template-aware canvas & reusable sections

Invitation Studio wajib memperlakukan template sebagai **layout/composition**, bukan sekadar nama atau thumbnail katalog. Ketika user mengganti template, canvas harus langsung memperlihatkan struktur visual template yang dipilih tanpa perlu reload atau save terlebih dahulu.

Section invitation yang berulang harus dibangun sebagai reusable composition agar dapat dipakai lintas template tanpa menduplikasi business logic. Initial optional sections:
- **RSVP**;
- **Wishes**;
- **Gift / E-Angpao**.

Studio harus menyediakan kontrol on/off per section. Ketika dimatikan, section langsung hilang dari canvas; ketika dinyalakan kembali, section muncul lagi tanpa menghapus data event lain. Visibility section wajib tersimpan bersama saved design dan tetap event-scoped.

Core event identity/timing/location tetap tersinkron dari Rangkaian Acara. Section toggle tidak boleh membuat salinan kedua untuk data event tersebut.

`Botanical Ivory` menjadi reference/test template long-form mobile bernuansa ivory/botanical untuk menguji composition, section visibility, dan scrolling canvas. Reference visual tidak boleh menyebabkan aset desain pihak lain disalin langsung.

Pada tahap implementasi awal, visibility section dapat disimpan secara backward-compatible di `Invitation.templateKey` selama parser lama tetap aman. Final public renderer untuk setiap template harus pada akhirnya membaca visibility section yang sama; Wishes persistence sebagai data tamu merupakan capability terpisah dan tidak boleh dipalsukan dengan mock production data.


### 7.2.1a Studio: kanvas utama dan 15 kontrol (23 September 2026)

Studio mengikuti bahasa visual Dashboard/landing melalui shared semantic tokens, satu frame viewport, hierarchy yang tenang, dan tombol canonical. Navigasi alat memakai penanda aktif primary; panel pengaturan dan kanvas scroll terpisah. Panel dapat disembunyikan pada desktop; HP memilih Pengaturan atau Undangan agar keduanya tetap terbaca. Brand tampil sekali melalui BrandWordmark, nama acara menjadi judul kerja, tanpa pengulangan judul/eyebrow/deskripsi. Canvas utama adalah workspace edit interaktif. **Keputusan terbaru 27 September 2026 menambahkan Preview hasil undangan terpisah sebelum Save**: Preview memakai draft saat ini termasuk perubahan yang belum disimpan, renderer yang sama dengan undangan, dan tidak menampilkan selection box, rail section, guides, inspector, atau kontrol transform. Preview default pada viewport HP/mobile sebagai target utama; opsi Desktop hanya merupakan responsive safety check dan tidak mempunyai design state terpisah. Watermark pembatasan konten prabayar yang sudah ada tetap mengikuti kontrak entitlement.

Kontrak terbaru terdiri dari **15 kontrol ON/OFF**: Amplop Digital, Sampul, Salam Pembuka, Identitas, Detail Acara, Tanggal & Waktu, Galeri/Media, Hitung Mundur, Lokasi, RSVP, Ucapan Tamu, Hadiah/E-Angpao, Penutup, Footer, Musik. Default seluruhnya ON; setiap template tetap mengimplementasikan semua bagian, sementara pelanggan boleh menyembunyikannya tanpa menghapus data. Ini menggantikan batas implementasi lama yang hanya menyediakan tiga toggle. Amplop OFF langsung membuka isi; musik OFF menghilangkan player dan audio. Tanpa amplop, musik mulai lewat tombol play manual agar sesuai pembatasan autoplay browser.

Simpan kompatibilitas `sections=` untuk RSVP/Wishes/Gift dan `hidden=` untuk bagian tambahan pada design key event yang sama; tidak membuat schema/API baru. Desain lama mempertahankan nilai tiga toggle dan seluruh bagian tambahan ON. Kedua renderer nyata membaca kontrak sama untuk Studio dan publik. Nama font heading/body ditulis dengan font masing-masing; font katalog dimuat saat diperlukan. Romantic Rose tetap mengunci palet/font dan menjelaskan alasan alih-alih menawarkan kontrol yang diabaikan renderer. Hashtag/dress code yang sudah tersimpan tetap dibaca dari data event dan tampil pada renderer; menu Isi hanya mengubah copy naratif sebagaimana §7.2.1e, bukan menulis ulang kolom event. Studio **tidak menampilkan tombol Terbitkan**; publish tetap hanya melalui Dashboard → Undangan Digital, setelah desain tersimpan dan seluruh syarat pembayaran/konfigurasi terpenuhi. Simpan Desain tidak mengirim ulang status publikasi lama.

**Popup Preview (4 Oktober 2026):** saat Preview dibuka, backdrop menggelapkan seluruh Studio secara merata; rail, toolbar, inspector, layer panel dan handle seleksi tetap di belakang popup. Semua lapisan editor dibatasi pada stacking context shell Studio. Preview dapat membuka Amplop lewat `Buka Undangan` untuk memeriksa isi; form preview tetap non-submitting. Tinggi popup mengikuti viewport dinamis HP dan scroll berada di isi preview, tanpa mengubah draft atau tema Studio.

**Viewport responsif Preview (5 Oktober 2026):** Preview menyediakan tiga pilihan **Desktop, Tablet, HP/Mobile** di tengah atas serta tombol tutup. Sesuai screenshot owner, isi berada dalam bingkai laptop, tablet portrait atau HP yang terpusat di atas Studio yang digelapkan merata, tanpa kartu popup opaque, judul terlihat, caption draft, input pixel, Fit/100% atau kontrol tambahan. Judul aksesibilitas tetap tersembunyi. Setiap perangkat memakai browsing viewport sendiri: HP **390 × 844**, Tablet **768 × 1024**, Desktop **1440 × 900**; angka ini hanya internal dan tidak tampil sebagai kontrol. CSS media query, unit `vw`/`vh` serta JavaScript viewport mengikuti ukuran frame seperti mode responsif pada Inspect. Ukuran tampilan laptop menargetkan sekitar **80% lebar layar browser**; Tablet dan HP **30% lebih besar** dari batas tampilan sebelumnya (tinggi maksimum 560 menjadi 728). Seluruh bingkai tetap otomatis dibatasi ruang tersedia agar muat, tanpa mengubah viewport logis. Undangan menggulir di dalam layar perangkat. Pergantian perangkat tidak mengulang Amplop atau membuat desain kedua. Preview memakai layout tamu: section OFF tidak menampilkan placeholder editor, dan kontrol editor tetap tidak ditampilkan.

Draft dikirim hanya dalam memori dari Studio ke frame same-origin yang telah login, memakai pemeriksaan origin, source window dan bentuk pesan; draft tidak diletakkan pada URL, storage, atau endpoint publik. Frame tidak memuat event/pesan tamu dari backend dan tidak menyimpan draft. Proteksi `preview` untuk RSVP/Wishes serta entitlement existing tetap berlaku; ukuran layar tidak menjadi izin untuk menulis data.

**Pesan helper Studio (4 Oktober 2026):** pemilihan template, Canvas Kosong dan Kembalikan ke Default tidak menampilkan petunjuk di footer kiri bawah. Jangan menambahkan kembali pesan seperti “Template dipilih. Klik Simpan untuk menerapkan”, “Preview dulu bila perlu”, atau uraian reset. Aksi valid membersihkan notice sebelumnya; proses loading/upload/save dan error yang diperlukan tetap menggunakan feedback existing.

### 7.2.1a Template Studio: reusable artwork library (27 September 2026)

Designer/Owner bekerja terutama dengan artwork/sticker yang ditempel dan diolah di canvas. Template Mode menyediakan **Library Saya** lintas draft berbasis model `DesignerAsset`, terpisah dari `InvitationAsset` customer. Upload raster baru menerima JPEG/PNG/WebP maksimal 15 MiB, diverifikasi/di-decode Sharp, auto-orient, resize maksimum 2000×2000 tanpa upscaling, lalu disimpan sebagai derivative WebP quality 82 dengan UUID di `/uploads/designer-assets/<userId>/`. Library hanya dienumerasi oleh akun staff pemilik; Customer Studio tidak mempunyai browser Library Designer. Karena URL derivative berada di web root agar template published dapat merendernya, file tersebut bukan tempat penyimpanan master berlisensi privat.

Library artwork dapat dipakai berulang pada draft template berikutnya melalui drag-and-drop. Customer Studio tetap memakai batas 10 objek tambahan agar editor sederhana, sedangkan Template Mode dapat menyimpan hingga 120 layer visual sebagai batas performa authoring. Foto customer tetap satu koleksi `InvitationAsset` per event. Template Mode memakai dataset demo untuk menguji slot foto dan tidak mengunggah foto/audio ke synthetic invitation; upload foto dan audio customer tetap melalui API event-scoped.

### 7.2.1a Template Studio: Draft → Review → Publish (27 September 2026)

Template Mode staff memakai lifecycle katalog yang terpisah dari publish undangan customer. Tombol utama adalah **Simpan Draft**. Save pertama membuat `DesignerTemplate` status `DRAFT`; Save berikutnya memperbarui record draft yang sama, dan draft dapat dibuka kembali dari Designer Dashboard. Draft tidak tampil pada katalog publik. Designer/Editor mengirim draft melalui **Kirim Review** sehingga status menjadi `REVIEW`; pada status ini penyimpanan desain biasa dikunci sampai Owner/Admin mengembalikannya ke Draft. Owner/Admin mempunyai antrean review dan dapat **Publish ke Katalog** atau **Kembalikan Draft**. Hanya status `PUBLISHED` yang dibaca katalog publik. Default database untuk record `DesignerTemplate` baru adalah `DRAFT`.

### 7.2.1a Draft Studio hanya bertahan selama refresh (25 September 2026)

Selama pengguna tetap mengedit satu undangan di satu tab Studio, perubahan desain yang belum ditekan **Simpan Desain** wajib dipertahankan ketika tab itu di-refresh (F5 / Ctrl+R / Cmd+R). Ini adalah pemulihan sementara dari `sessionStorage` tab itu, **bukan autosave server dan bukan draft lintas sesi**. Yang dipulihkan adalah pilihan template, properti/objek desain, bagian, foto yang dipilih, teks dekoratif, musik yang dipilih, hashtag dan dress code sebagaimana state editor yang belum disimpan. Snapshot harus diikat ke ID undangan, state yang terakhir benar-benar disimpan di server (bukan fallback aset pada renderer yang dapat berubah setelah unggah foto), dan penanda entri navigasi Studio pada browser agar tidak bisa diterapkan ke event lain, kunjungan SPA yang baru, atau menimpa perubahan server yang lebih baru.

**Batas sesi yang eksplisit:** saat pengguna keluar dari halaman Studio menuju halaman lain, berpindah undangan, melakukan logout, menutup tab, atau kembali ke Studio lewat navigasi biasa/Back/Forward, perubahan yang belum tersimpan **tidak dipulihkan**; Studio membaca desain terakhir yang benar-benar disimpan. Snapshot dibersihkan sesudah Simpan Desain berhasil, dan tidak boleh terbawa ke user/event lain. Refresh saat tetap di Studio boleh mengembalikan pekerjaan terakhir dari tab yang sama, termasuk jika pengguna belum menekan Simpan. Jika browser memblokir storage, Studio tetap dapat diedit dan disimpan secara manual, tetapi pemulihan refresh tidak bisa dijamin. Jangan menganggap cache ini sebagai penyimpanan resmi atau menulis draft ke database tanpa tindakan Simpan.

### 7.2.1b Kembalikan ke Default dan koleksi musik (23 September 2026)

Aksi **Ulang dari awal / Kembalikan ke Default** memakai ikon putar ulang pada toolbar canvas bersama Undo/Redo, Preview dan Simpan; hanya ada satu kontrol pemulihan desain. Aksi ini mengembalikan desain penuh ke preset tema saat ini: palet/font, seluruh visibility flag, layout section, native visual termasuk status terhapus, style, copy/narasi, layer dekoratif, assignment/crop/motion foto, konfigurasi visual RSVP dan pilihan musik kembali ke bawaan. Seleksi dan mode crop dilepas, clipboard dikosongkan dan canvas kembali ke Amplop. Tema, data acara serta file gambar/audio pada koleksi media tidak dihapus. Kontrol hanya aktif ketika undangan siap dan tidak busy; pemulihan dapat di-Undo dan baru persisten melalui Simpan. Replay animasi preview tetap merupakan aksi tersendiri.

Unggahan musik dibatasi **2 aset AUDIO per undangan, masing-masing maksimal 3 MB (3 × 1024 × 1024 byte)**. Pemeriksaan jenis, ukuran, dan kuota berjalan pada client serta server; count+create diserialisasi melalui row lock Invitation agar request bersamaan tidak melewati kuota. Panel menampilkan pilihan lagu bawaan, daftar unggahan, jumlah slot, dan Hapus; lagu bawaan tidak memakai slot. Penghapusan aset membebaskan slot, membersihkan referensi musicUrl apabila file itu aktif, serta menghapus file lokal terverifikasi. Unggahan baru otomatis dipilih untuk pratinjau; pilihan disimpan lewat Simpan Desain. Aset lama tidak dihapus otomatis walaupun melampaui batas baru; pengguna dapat menghapusnya sendiri. Pembuatan aset baru melalui URL tidak diperbolehkan karena ukuran file tidak dapat diverifikasi; gunakan uploader binary. URL musik lama masih kompatibel. Ketentuan ini menggantikan batas audio sebelumnya (1 file/10 MB) dan penambahan URL di panel Musik.

Foto tetap melalui Sharp: decode, orientasi otomatis, resize maksimal 2000×2000 tanpa pembesaran, encode WebP quality 82, simpan event-scoped. Batas foto tetap 30 file dan input maksimal 15 MB. **Wishes sekarang memakai shared API dan model GuestWish event-scoped**, bukan placeholder; tetap jangan mengklaim fitur berfungsi pada database target sebelum migrasi GuestWish telah diterapkan dan alur submit publik diuji.

### 7.2.1g Penyimpanan media customer privat di VPS (2 Oktober 2026)

Binary `InvitationAsset` customer untuk **IMAGE** dan **AUDIO** baru tidak boleh ditulis ke `public/` atau mempunyai static-file URL yang melewati authorization. Penyimpanan lokal tetap diperbolehkan tanpa object-storage pihak ketiga: development memakai fallback `.undara-data`, sedangkan production wajib mengisi `UNDARA_DATA_DIR` dengan **absolute path pada disk/volume VPS yang persisten di luar repository dan web root** (contoh operasional `/var/lib/undara`). File disimpan event-scoped di `invitation-assets/<invitationId>/<assetId>.<ext>` dengan nama opaque; database menyimpan URL endpoint `/api/media/invitation-assets/<assetId>.<ext>`, bukan path filesystem.

Endpoint media harus memverifikasi record `InvitationAsset` dan relasinya. Pemilik yang login boleh melihat aset draft miliknya; selain pemilik, media hanya diberikan untuk invitation yang configured, published, dan mempunyai entitlement Undangan Digital yang valid. Invitation ber-password tetap membutuhkan signed access cookie yang sudah dipakai renderer publik; personal invitation mengikuti guest token/published/password access yang sudah ada. Request yang tidak berhak tidak boleh membocorkan keberadaan aset dan dikembalikan sebagai not-found. Audio tetap mendukung byte-range agar seek/playback browser berfungsi. Artwork template/demo yang memang merupakan bagian publik aplikasi tetap berada di `public/` dan tidak mengikuti aturan customer media ini.

URL customer lama `/uploads/images/...` dan `/uploads/music/...` adalah **legacy compatibility saja**. Deployment yang masih memiliki binary lama wajib menjalankan dry-run `pnpm storage:migrate-invitation-media`, lalu setelah backup menjalankan `pnpm storage:migrate-invitation-media -- --apply`; migrasi dianggap selesai hanya bila command sukses dan sumber lama di web root sudah terhapus. Persistent local storage bukan pengganti backup: `UNDARA_DATA_DIR` harus dibackup bersama PostgreSQL dan restore nyata tetap wajib diuji sebelum production sign-off.

### 7.2.1f Ucapan Tamu aktif di undangan publik, bukan placeholder (24 September 2026)

**Perbaikan owner:** label toggle Studio cukup `Ucapan Tamu`, tanpa keterangan menempel `Pengiriman ucapan belum tersedia.` yang membuat label sulit dibaca dan tidak sesuai kondisi fitur. Bagian `wishes` di `UniversalInvitationTemplate.tsx` (termasuk Zen Atelier) dan `RomanticRoseTemplate.tsx` menampilkan satu komponen reusable `GuestWishes.tsx`, bukan teks placeholder. Tamu pada undangan publik yang aktif dapat menulis nama (maksimum 80 karakter) dan ucapan/doa (maksimum 600 karakter), mengirim melalui `POST /api/invite/[slug]/wishes` dan melihat maksimal 30 pesan terbaru dari `GET`. Pesan baru ditampilkan sebagai teks biasa, bukan HTML atau dummy. Identitas penulis pesan adalah **nama yang ditulisnya sendiri**, bukan bukti bahwa ia pemilik suatu record Guest atau sudah RSVP.

**Sumber data dan keamanan:** `GuestWish` di Prisma dimiliki satu `Invitation.id`, dihapus secara cascade bersama event, dan tidak membuat/menimpa `Guest`, RSVP, kuota atau daftar penerima. GET/POST memeriksa eventConfigured, status publish, entitlement Digital Invitation **milik event tersebut**, toggle Wishes, serta akses password menggunakan cookie bertanda tangan ketika diperlukan; POST membatasi ukuran payload/nama/pesan dan memakai public rate limit. Mode Studio/katalog (`preview=true`) hanya menampilkan form nonaktif: tidak GET, tidak POST dan tidak memalsukan kiriman yang tersimpan. Toggle OFF menyembunyikan form/list tetapi **tidak menghapus record ucapan**. Komposisi tiap template boleh berbeda; bukan membuat endpoint atau tabel baru per tema.

**Operasional:** Migrasi `prisma/migrations/20260924183000_guest_wishes/migration.sql` wajib dijalankan di target database melalui `pnpm db:deploy`, lalu `pnpm db:generate` untuk client lokal; CI generate/build berhasil **tidak berarti migrasi produksi diterapkan**. Uji manual setelah deploy: kirim dan refresh pada undangan yang diterbitkan dan dibayar, cek data terisolasi antarevent, uji password, preview tidak mengirim, dan tombol Wishes OFF/ON mempertahankan pesan. Public rate limit saat ini in-memory per instance; untuk produksi dengan trafik tinggi perlu mempertimbangkan rate limiter shared storage dan moderasi/penanganan spam secara terpisah. Jangan mengklaim moderasi/anti-spam lintas-instance sudah tersedia.

### 7.2.1e Studio → Isi: hanya narasi yang didukung template, bukan input acara kedua (24 September 2026)

**Kontrak menu Isi dan kelengkapan setiap template baru:** ikon **Isi** di rail kiri hanya mengubah narasi milik template, bukan data acara. Setiap template **baru** wajib menyiapkan komponen teks naratif nyata untuk **Salam/Pengantar (`greeting`), Permohonan Kehadiran (`attendanceRequest`), Doa atau Harapan (`prayerWish`), dan Ucapan Penutup (`closing`)** di dalam section yang sesuai dari 15 section yang sudah ada, dengan default/capability/batas karakter dan koneksi ke menu Isi, canvas Studio, Simpan Desain, dan undangan publik/personal. Empat slot ini **bukan empat section/toggle baru**; tiap template bebas menentukan komposisi, bahasa doa/harapan yang relevan dan tata letak. Kalimat penjelasan tambahan/kutipan hanya mempunyai field tersendiri bila teks itu nyata di renderer (contoh existing `zenQuote` pada Zen Atelier untuk event berformat pasangan). **Dilarang membuat input Isi yang tidak terlihat pada undangan sungguhan**, dan pengguna tidak diberi input untuk judul/label komponen yang memang terkunci. Kontrak wajib bagi template baru ini tidak berarti semua template lama sudah memenuhi empat slot: implementasi awal Universal/Romantic Rose saat ini baru mempunyai `greeting` dan `closing`, sedangkan Zen Atelier juga mempunyai `zenQuote`. Slot baru pada tema lama harus ditambahkan ke registry `lib/templates/editable-copy.ts` dan renderer terlebih dahulu sebelum tampil di Studio. Checklist implementasi lengkap ada di `template.md` bagian Menu Isi.

**Bukan tanggung jawab menu Isi:** input ulang nama pasangan/host/orang tua, gelar dan urutan anak, judul acara, tanggal/jam, lokasi/alamat, rekening, data tamu/RSVP, serta copy label/form/section bawaan komponen yang terkunci. Itu tetap dibaca dari data acara atau fitur bersama dan hanya diedit pada pemilik data yang berwenang (misalnya Dashboard → Rangkaian Acara), bukan sumber kedua di Studio. Hashtag/dress code dan deskripsi event yang sudah tersimpan tetap dapat dirender seperti sebelumnya, tetapi panel Isi **tidak lagi mengubah kolom-kolom DB tersebut**; `Invitation.description` hanya boleh menjadi fallback salam pembuka untuk undangan lama, bukan tujuan tulis editor baru.

**Our Story / Tentang Kami (24 September 2026):** Tema yang mendukung acara berformat pasangan memiliki satu segmen narasi pasangan **setelah Identity dan sebelum Event Detail**, dengan judul artistik milik tema dan isi cerita yang benar-benar ditulis pemilik undangan melalui menu **Isi** (`ourStory`; maksimum 1.600 karakter, mendukung baris baru). Segmen ini **subbagian Identity**, sehingga mengikuti toggle Identitas pada kontrak 15 komponen yang sudah ada: tidak menciptakan section ke-16, toggle tambahan, atau tabel baru. Isi cerita bersifat **opsional**; jika belum ditulis, renderer dan undangan tamu tidak menampilkan segmen, placeholder, atau kisah fiktif. Nama pasangan tetap berasal dari data event. Hanya event dengan kategori `nameMode: "couple"` yang menampilkan editor dan segmennya; non-pasangan tetap memakai tampilan identity normal. Pengubahan isi cerita mengikuti alur design key `::copy=`, Undo/Redo, Simpan Desain, dan preview/public renderer yang sama. Semua tema yang sudah menggunakan UniversalInvitationTemplate atau RomanticRoseTemplate kini dapat menampilkan segmen ini; layout dan art direction per-tema tidak harus sama. Panduan `template.md` mewajibkan template pasangan baru menyediakan slot Our Story nyata, tetapi tidak memaksa pemilik mengarang cerita hanya untuk mengisi undangan.

**Penyimpanan dan kompatibilitas:** teks naratif milik tema disimpan terikat `Invitation.id` bersama design state melalui segmen `::copy=<URL-encoded JSON whitelist>` di `Invitation.templateKey`, dengan parser/normalizer `lib/templates/editable-copy.ts`, tanpa migrasi DB atau tabel konten kedua. Undo/Redo, dirty state, dan **Simpan Desain** bekerja lewat design key yang sama. Studio mengirim `designKey` belum tersimpan ke renderer untuk feedback langsung; setelah simpan, renderer URL publik/personal membaca override yang sama. Ketika belum ada override, tampilkan copy tema sebelumnya atau event `description` persis seperti perilaku lama. Saat pengguna mengganti tema, teks naratif khusus tema lama tidak boleh otomatis terbawa. Teks di-render sebagai React text biasa (bukan HTML dari user), dibatasi maksimum dan tidak boleh mengubah data acara, label tombol `Buka Undangan` atau aturan section. Isian tidak relevan untuk non-wedding tidak ditampilkan. Tombol ID/EN hanya menerjemahkan label editor, **bukan** mengubah copy yang ditulis pemilik event.

### 7.2.1d Studio: UI ringkas dan pemisahan Publish (24 September 2026)

**Kontrol Foto kanan (4 Oktober 2026):** Perbesaran foto 1–3× memperbesar gambar di dalam bingkai; posisi/ukuran/rotasi/opasitas bingkai berada pada kelompok Bingkai foto, sedangkan Zoom kanvas hanya mengubah viewport editor. Rasio crop hanya muncul untuk slot yang dinyatakan mendukungnya oleh `photoCropAspectSlots` pada registry tema; cover dan frame yang memaksa lebar/tinggi gambar tidak menampilkan pilihan rasio yang tidak berefek. Crop lama tetap tersimpan dan perubahan posisi/zoom tidak boleh menghapus rasionya. Pointer crop yang kehilangan capture dibatalkan; tombol zoom pada batas disabled dan tidak menambah history tanpa perubahan. Parallax memakai piksel (0–20); 0 adalah override OFF yang harus bertahan pada Simpan/reload dan mengalahkan gerak bawaan. Default tema memakai nilai piksel yang benar, dengan runtime/reduced-motion/budget existing.

**Copy menu Studio (3 Oktober 2026):** menu kiri dan inspector kanan memakai judul serta label aksi pendek. Hilangkan deskripsi berulang di tombol/kartu, tutorial permanen dan detail implementasi. Label kontrol minimal 12px, label aksi utama 14px; jangan mengecilkan teks menjadi 8–11px agar panel tampak ringkas. Nama aksesibel, tooltip aksi ikon, nilai kontrol, batas unggahan, state kosong/disabled yang perlu dijelaskan dan pesan error tetap tersedia secara singkat. Aturan ini hanya untuk UI editor, bukan teks dalam artwork undangan.

**Bentuk tombol terbaru:** Landing, Studio dan Dashboard memakai satu bentuk CTA: **persegi panjang bersudut bulat 16px**, tidak memakai pill/rounded-full. Semua komponen reusable mengambil `--undara-control-radius` dari `app/globals.css`; Studio tidak boleh membuat radius khusus untuk Amplop/Cover, filter foto, dropdown urutan atau tombol pencarian. Foreground tombol mengikuti semantic `primary-foreground`; tombol outlined tetap terbaca pada kedua mode. Kecuali kontrol artistik/checkbox/radio/navbar yang memang memiliki geometri berbeda, tidak ada aturan bentuk tombol lain.



**Aturan aktif terbaru (menggantikan arahan UI Studio yang bertentangan di riwayat lama):** Header Invitation Studio hanya berisi navigasi kembali, BrandWordmark, dan tombol shared **Light/Dark + ID/EN** dengan gaya outline brand, radius serta hover yang sama seperti landing page; tombol ID/EN menggunakan state/cookie bahasa aplikasi yang sama dan mengubah copy utama Studio, bukan mengganti konten acara milik pelanggan. Hilangkan banner abu-abu **“Desain bisa disimpan sekarang. Paket diperlukan saat terbitkan.”** karena hak publikasi tetap diurus di Dashboard. Hilangkan **Terbitkan/Publish** dan **tombol/modal Pratinjau tambahan** dari Studio: canvas yang terlihat adalah pratinjau interaktif yang bisa mengubah Amplop/Cover. Tombol **Simpan Desain** tetap ada dan hanya menyimpan desain. Tombol Publish/paket beserta seluruh validasi dan pembayaran ada di **Dashboard → Undangan Digital** saja; penghapusan tombol Studio tidak mengubah backend, entitlement, atau proteksi tampilan prabayar.

Nama/judul di heading Studio ditampilkan memakai `invitationTitleCase` **hanya saat render**: `Pernikahan hendra & reni` terlihat sebagai **`Pernikahan Hendra & Reni`**, tanpa menimpa database atau mengubah judul user lain. Rail alat di kiri harus menyediakan jarak lega antara ikon dan label, ukuran teks terbaca, serta ruang kiri/kanan cukup; canvas utama dipersempit menjadi sekitar **340px** desktop dan maksimal lebar tersedia pada mobile, tetap dapat scroll dan menampilkan renderer template yang sama. Popup kedua tidak boleh digunakan hanya untuk melihat apa yang sudah tampak dalam canvas. Tombol mode Light/Dark dan ID/EN tetap dapat diakses pada viewport mobile. **Memilih Cover dari toolbar tidak boleh menyimpan toggle Amplop OFF**; saat Amplop dibuka, toolbar otomatis berpindah ke Cover tanpa me-remount player musik pada canvas (key renderer tidak mengikuti indikator stage).

**Kerapian tombol, filter, dan panel tema Studio:** Semua tombol terpilih (termasuk filter foto dan tombol Amplop/Isi di canvas) mengikuti semantic Undara `bg-primary text-primary-foreground` pada kedua mode. Jangan mengembalikan hardcoded legacy palette atau `text-black` tanpa semantic foreground. Tombol tidak terpilih tetap outline brand dengan teks warna foreground/aksen, tanpa menambahkan variasi CTA baru. Dropdown pengurutan **Pilihan aktif / Nama A–Z / Nama Z–A** harus memiliki penanda panah custom yang berada sekitar 16px dari sisi kanan, teks punya padding kanan sekitar 44px agar tidak bertabrakan, lebar cukup untuk label, dan tinggi ringkas sekitar 36px. Panel inspector yang memuat pencarian/filter/list template dibuat lebih lebar ke arah kiri (kolom 360px desktop / 380px lebar besar, tidak memperbesar canvas undangan), tinggi item tool rail diringkas menjadi sekitar 74px dengan jarak ikon-label 10px; pada ponsel tetap satu kolom responsif tanpa overflow. Tidak mengubah sortir, pencarian, pilihan tersimpan, atau 15 section.

### 7.2.1c Konsistensi renderer dan kapitalisasi nama (24 September 2026)

Font pilihan pada seluruh tema yang mengizinkan kustomisasi font diteruskan ke nama amplop/sampul melalui token heading/body yang benar-benar dimuat oleh aplikasi. Palet custom memengaruhi permukaan utama, tinta dan aksen amplop/sampul, dengan warna teks terbaca pada permukaan terang/gelap; preset kembali ke artwork asli. Romantic Rose tetap terkunci. Semua nama host/pasangan dan judul acara pada amplop, sampul, identitas, detail dan penutup menggunakan `displayTitleCase` saat render, termasuk data lama. Nama penerima pada password gate juga diformat. Tidak mengubah isi database, pesan, deskripsi, URL, atau hashtag, dan tidak memaksakan uppercase penuh pada nama.

Studio menampilkan retry saat load gagal. Nama toggle **Ucapan Tamu** tidak lagi ditempeli keterangan unavailable; canvas menampilkan form ucapan non-submitting, sementara endpoint shared memproses ucapan pada undangan publik yang sah. Penyimpanan desain mengunci row Invitation yang sama dengan upload/delete musik, memvalidasi bahwa URL upload yang dipilih masih menjadi aset event tersebut, serta tidak menimpa status sudah terbit dengan snapshot lama. Persistence Wishes adalah model GuestWish terpisah dari penyimpanan desain dan RSVP.

### 7.2.2 Scalable template architecture

Undara harus mendukung katalog undangan dalam skala besar — puluhan hingga ratusan template — tanpa membuat aplikasi, backend, database flow, atau feature implementation terpisah untuk setiap template.

Prinsip canonical:

**Satu shared invitation engine + shared event/content data + shared feature logic + banyak presentation/template.**

Template adalah reusable design definition. Template master disimpan satu kali dan dapat digunakan oleh jumlah event/user yang tidak dibatasi. Per-event storage hanya menyimpan identity/configuration yang memang spesifik terhadap event, seperti `templateKey`, section configuration, customer media, dan customization yang diizinkan template.

Business logic dan data contract invitation dimiliki oleh Undara Core dan reusable lintas-template, termasuk:
- event identity/content;
- date/time;
- venue/address/Maps;
- gallery/media;
- RSVP;
- Wishes;
- Gift / E-Angpao;
- countdown bila tersedia;
- closing/footer;
- validation, authorization, event isolation, entitlement, dan persistence.

Template baru tidak boleh menduplikasi API, database model/table, RSVP engine, Wishes engine, Gift engine, payment logic, guest logic, atau ownership logic hanya karena visualnya berbeda.

### 7.2.3 Section-based composition

Invitation disusun dari section reusable yang dapat dikomposisikan, misalnya:
- Cover / Hero;
- Introduction / Greeting;
- Identity / Host / Couple;
- Event Detail;
- Date & Time;
- Gallery;
- Countdown;
- Location / Maps;
- RSVP;
- Wishes;
- Gift / E-Angpao;
- Closing;
- Footer.

Daftar section dapat berkembang. Seluruh template undangan READY wajib mengikuti amplop + 13-section universal di §7.2.3a, dengan isi Identity disesuaikan event category serta toggles RSVP/Wishes/Gift tetap boleh OFF.

Optional section harus dapat diaktifkan/dinonaktifkan tanpa menghapus shared feature/data secara tidak sengaja. Public renderer hanya merender section yang aktif dan valid untuk invitation tersebut.

### 7.2.3a Universal envelope + 13-section contract (22 September 2026)

Setiap template undangan yang READY, termasuk seluruh built-in yang tercatat dalam registry aktif dan semua template baru setelah renderer terintegrasi, WAJIB memiliki amplop digital interaktif dengan tombol **Buka Undangan** sebelum Cover; amplop bukan pengganti Cover, bukan pintu marketing landing. Seluruh renderer real di halaman publik, Invitation Studio, dan galeri template menampilkan section semantik berikut secara konsisten:

1. Cover / Hero
2. Introduction / Greeting
3. Identity / Host / Couple
4. Event Detail
5. Date & Time
6. Gallery / Media
7. Countdown
8. Location / Maps
9. RSVP / Konfirmasi Kehadiran
10. Wishes / Ucapan Tamu
11. Gift / E-Angpao
12. Closing
13. Footer

Tiga feature section RSVP/Wishes/Gift dapat dinonaktifkan oleh customer lewat toggle yang sudah ada; section OFF tidak menghapus datanya. Section dengan media, Maps, atau informasi bank yang belum diisi tidak boleh membuat foto, alamat, nomor rekening atau aksi palsu: tampilkan empty state jujur atau sembunyikan kontennya sambil mempertahankan slot struktural. Identity mengikuti jenis acara (couple, individual, host), bukan selalu wedding. Form RSVP aktif hanya pada undangan publik; preview tidak boleh menyimpan data customer. **Wishes sudah menggunakan shared persistence API:** pada undangan tamu yang aktif, form benar-benar menyimpan pesan dan daftar menampilkan ucapan terbaru; canvas Studio/katalog memakai form visual non-submitting dan tidak pernah menulis database. Model GuestWish event-scoped terpisah dari Guest (identitas penerima/RSVP); toggle Wishes OFF menyembunyikan komponen tanpa menghapus ucapan. Deploy migrasi GuestWish wajib sebelum fitur dipakai di database target.

Template memiliki gaya sendiri untuk amplop, ornamen, frame foto, palette, fonts, animasi, layout dan (bila manifest mengizinkan) urutan section. Feature logic, photo role, countdown, audio, RSVP, keamanan dan data milik shared engine. Komponen publik dan Studio harus merender presentasi yang sama, bukan menampilkan mock section di Studio dan konten berbeda di URL publik. Ketiga jalur URL undangan tamu—utama, per acara, dan personal—wajib melewati satu shared renderer dispatcher. Key dari upload designer baru tetap preview gambar tidak aktif sampai renderer sesuai kontrak ini selesai dibuat dan terdaftar.

Semua contoh foto yang dipakai katalog, gallery fixture, dan Studio default harus mengambil asset yang SUDAH ADA di public/: /couple.webp, /couple2.jpg, /couple3.jpg, /man.jpg, /female.jpg, bukan URL Unsplash. File tersebut hanya dummy/demo; foto undangan pelanggan selalu berasal dari InvitationAsset milik event sendiri, bukan fallback foto demo. Kode tema baru mengambil foto contoh dari manifest/shared fixture, tidak duplikasi file. Sharp WebP tetap wajib untuk semua upload image baru sesuai §7.2.7b.

### 7.2.3c Musik bawaan untuk seluruh template undangan (22 September 2026)

**Integritas Simpan Desain:** URL upload musik privat `/api/media/invitation-assets/` dan legacy `/uploads/music/` hanya dapat disimpan bila masih tercatat sebagai aset AUDIO milik customer dan event yang sama. Validasi berjalan di dalam row lock Invitation yang dipakai upload/delete; draft Studio lama yang merujuk audio terhapus ditolak dengan pesan untuk memilih musik yang tersedia.

Semua template undangan READY wajib menyediakan **musik undangan bawaan** tanpa mengharuskan pengguna terlebih dahulu mengunggah MP3. Satu `lib/templates/music.ts` menyimpan pemetaan stable key ke audio yang sudah tersedia di `public/`; pilihan `Invitation.musicUrl` yang disimpan pemilik event menjadi prioritas, dilanjutkan aset `InvitationAsset` bertipe AUDIO pada event yang sama, baru kemudian musik tema bawaan. Tidak perlu menggandakan audio, menyimpan lagu per pelanggan atau mengubah skema database. Template baru harus mendaftarkan musik default pada manifest musik bersama; jangan memakai track template lain secara implisit dalam produksi.

Player berada di luar subtree amplop yang di-unmount dan digunakan bersama oleh semua renderer template siap (`RomanticRoseTemplate` dan `UniversalInvitationTemplate`), dengan tombol musik **play/pause yang tetap mudah dijangkau** setelah amplop dibuka; lagu di-loop dan pengguna selalu bisa menjedanya. Pada halaman undangan publik, pemutaran dicoba langsung pada gesture klik/tap `Buka Undangan`, bukan autoplay saat page load atau di `useEffect`; jika browser memblokir play, undangan tetap dapat dibuka dan tombol play manual harus tetap berfungsi. Satu undangan hanya memiliki satu elemen audio aktif: hapus player kedua yang sebelumnya berada di footer. Saat berganti ke undangan/preview lain atau meninggalkan komponen, hentikan player sebelumnya. Perhatikan tab tersembunyi dan keyboard accessibility. Preview katalog/Studio **tidak** mengaktifkan musik otomatis (banyak preview card dimount bersamaan); audio hanya bermain jika user menekan play secara eksplisit. Saat audio preview bermain pada route marketing, hentikan sementara musik ambience marketing lalu kembalikan sesuai pilihan mute pengguna setelah preview selesai, sehingga tidak ada dua lagu bertumpuk.

Menu Musik di Studio menampilkan **Koleksi Undara** dari satu registry audio bersama, pencarian judul/artis, penanda **Bawaan Tema**, dan **Unggahan** event yang terpisah. Default tema tampil aktif bila tidak ada pilihan tersimpan atau unggahan event; sumber aktif mengikuti resolver yang sama dengan undangan publik. Koleksi bawaan tidak memakai slot upload. Aksi **Dengarkan** memakai satu player panel dan tidak mengganti pilihan musik; memilih radio memperbarui draft/canvas, lalu **Simpan Desain** atau **Simpan Draft** memakai jalur simpan yang sudah ada. Preview tidak autoplay, dapat dijeda, berhenti saat panel ditutup/tab tersembunyi, dan memakai event playback yang sama dengan player undangan agar lagu tidak bertumpuk. Template Mode dapat memilih koleksi bersama tanpa memperoleh izin upload/delete audio customer.

URL musik warisan yang telah tersimpan tetap dibaca dan dapat didengarkan demi kompatibilitas, tetapi pembuatan aset/audio baru hanya dari URL tanpa binary tidak diperbolehkan sesuai batas upload §7.2.1b. Jangan pasang musik undangan pada halaman Dashboard, landing, guestbook, atau undangan belum terbit. Asset dan lisensi lagu yang digunakan untuk distribusi publik harus dipastikan sesuai hak penggunaan oleh pengelola sebelum rilis komersial.

### 7.2.3b Katalog tema bawaan: sembilan dengan foto, enam tanpa foto (3 October 2026)

Setiap template READY harus punya komposisi nyata yang dapat dibedakan secara visual sebelum dan setelah membuka amplop, bukan hanya pergantian palette, font, stock photo dan border radius pada satu layout. Manifest tunggal `lib/templates/catalog.ts` menyatakan `usesPhotos: boolean`, `photoSlots`, nama dan preset. Katalog bawaan yang diverifikasi dari `lib/templates/catalog.ts` pada 3 October 2026 memiliki **15 template, 9 dengan foto dan 6 tanpa foto**. Confetti Club menambah satu tema ulang tahun; Blank Canvas tetap starter terpisah. Jumlah aktual dan daftar key diperiksa terhadap registry, bukan disalin dari riwayat versi lama:

| Mode | Stable key | Identitas visual, bukan sekadar warna |
| --- | --- | --- |
| Foto | `romantic-rose` | Nuansa Rose, amplop cinta, portrait floral, galeri pasangan |
| Foto | `eternal-blossom` | Album bunga blush/cream dengan portrait oval scallop, nama serif bersusun, amplop kertas bersegel bunga, foto lembar album berwarna dan motion bunga dari dua sisi |
| Foto | `modern-maroon` | Editorial maroon asimetris, foto dengan potongan diagonal dan teks vertikal |
| Foto | `garden-light` | Lengkungan taman botanical dengan cabang daun dan foto melengkung |
| Foto | `midnight-romance` | Latar gelap berbintang, portrait oval, ornamen bulan dan cahaya emas |
| Tanpa foto | `botanical-ivory` | Kartu botanical ivory simetris dengan ilustrasi daun |
| Tanpa foto | `classic-pearl` | Tipografi dan crest oval klasik dengan double ornamental lines |
| Tanpa foto | `golden-art-deco` | Hitam/emas, garis geometri Art Deco dan frame simetris |
| Tanpa foto | `paper-cut-botanical` | Ilustrasi lapisan kertas/cutout daun berwarna sage |
| Tanpa foto | `celestial-ink` | Galaksi tinta, orbit concentric dan konstelasi bulan-bintang tanpa portrait |
| Tanpa foto | `pencil-reverie` | Sketsa pensil dan kolase ilustratif vintage, bukan foto pengguna |
| Foto | `zen-atelier` | Amplop/sampul ilustrasi Jepang, potret pasangan editorial dan galeri foto milik event; ensō, sakura, dan pegunungan tinta |
| Foto | `velvet-horizon` | Senja Mediterranean, arsitektur melengkung, dusty rose, cahaya lilin, dan foto editorial |
| Foto | `serein` | Stationery ivory/plum, amplop surat bersegel, dan album foto editorial |
| Foto | `confetti-club` | Undangan ulang tahun dengan amplop hadiah, kue dua tingkat, judul besar, potret tunggal opsional, dan album kenangan |

Untuk setiap theme, amplop digital tetap punya lipatan/flap dan aksi "Buka Undangan" riil; visual envelope, Cover dan section decoration mengikuti identitas theme berbeda. Foto preview berbasis aset `public/` yang sudah ada, tanpa mengambil URL Unsplash. Tanpa-foto bukan sekadar menyembunyikan tag `img`: tutup, Hero, Identity, Gallery/Media dan dekorasi mengutamakan tipografi, ornamen/ilustrasi dan data event, tidak merender media customer walaupun sebelumnya pernah mengupload foto untuk theme lain. Studio tidak memunculkan input slot/upload untuk theme tanpa foto (koleksi event tetap tersimpan dan muncul bila customer beralih kembali ke theme foto). Gallery/media tanpa foto tetap section semantik ke-6 tetapi menjadi surface story/illustration tanpa menciptakan foto/memori personal palsu. Image-preview-only designer submissions tidak otomatis dipaksa masuk hitungan 6/5 dan tidak selectable hingga renderer asli tersedia.

Galeri publik dan pemilih template Studio menampilkan thumbnail scene visual yang benar-benar digunakan renderer, bukan image sama untuk sejumlah theme; identifikasi jelas melalui badge/filter "Dengan foto" dan "Tanpa foto". Tetap gunakan satu katalog untuk Studio, `/template-design`, `/d-invitation`, tanpa menggandakan API RSVP, assets/customer media, format penyimpanan atau bypass akses Studio. Semua theme tetap menjalankan kontrak 13 section/amplop di §7.2.3a dan integrasi Sharp WebP untuk media upload customer.

**Zen Atelier — pengelolaan aset (24 September 2026):** Aset PNG Zen/Jepang yang sudah ada di `public/templates/` menjadi ilustrasi utama amplop, sampul, dan ornamen 13 section. Komposisi visual berada pada `components/PublicInvitation/ZenAtelierScene.tsx` dan `components/PublicInvitation/ZenAtelierArtwork.tsx` dengan dynamic import khusus tema. Kesesuaian pixel-per-pixel dengan gambar dalam shared chat **belum dapat diverifikasi** tanpa inspeksi visual referensinya; keberadaan nama berkas saja bukan bukti ekspor asli. Semua PNG pada web root bisa diakses publik, dan `.gitignore` tidak melindungi aset yang sudah ada dalam riwayat Git. Simpan master berlisensi privat hanya di storage privat di luar Git/web root dengan otorisasi server. Optimasi PNG yang sekarang masih besar menjadi derivative WebP menjadi tindak lanjut tersendiri; jangan menimpa aset master yang sudah dipakai. Foto customer tetap memakai Sharp/WebP/InvitationAsset; RSVP/Wishes/Gift dan database tidak digandakan.

**Zen Atelier — prompt reconstruction (24 September 2026):** Ikuti `template.md` dan prompt owner: satu amplop dengan aksi Buka Undangan, cover bunga kiri-atas/nama bertumpuk/gunung bawah, foto pasangan lebar via slot cover, galeri dua kolom dengan modal keyboard/swipe, form RSVP bersama berkulit ivory/charcoal, dan musik lokal Zen. Jangan memakai akhir acara sebagai jam resepsi atau kategori foto palsu. RSVP dan Wishes menggunakan layanan bersama yang sudah ada di source; kemampuan produksi pada database target tetap bergantung pada migrasi dan pengujian alur publik yang relevan. Inventaris aset, pemetaan, batas model, dan sisa verifikasi visual dicatat di `assets/templates/zen-atelier/README.md`. 15 key section existing dipertahankan; tidak membuat key cerita fiktif.


**Zen Atelier — Amplop Digital ala Jepang, revisi owner (24 September 2026):** Amplop Zen wajib berkarakter **surat seremonial Jepang berbahan washi**, berbeda dari fotografi amplop gaya Barat dengan segel lilin yang dipakai pada implementasi sebelumnya. Komposisi khusus amplop: lipatan kertas asimetris bertumpuk, ikatan seremonial merah/emas `mizuhiki`, cap merah seperti stempel tinta (bukan wax seal), tekstur ivory, aksen rangka `shoji`, cabang bunga, enso/matahari terakota, dan gunung sumi-e yang sudah disediakan sebagai SVG milik Zen. Nama/tanggal di slip dalam harus diambil dari data undangan aktif. Animasi pembuka mengikuti satu gestur `Buka Undangan` → simpul membuka → lipatan terangkat → surat naik → Cover, menghormati `prefers-reduced-motion`, timer parent dan tombol Amplop/Cover Studio; jangan menambah CTA kedua atau tulisan teknis. **Hanya Amplop Zen yang direvisi:** Cover/Hero, 13 bagian lainnya, katalog Cover-first, database, pembayaran, landing/Pintu dan tema lain tetap tidak berubah. PNG `amplop1.webp` tidak lagi dipakai oleh renderer Zen saat ini, tetapi tetap ada sebagai aset referensi historis. Foto moodboard kanan menjadi inspirasi owner; klaim kemiripan visual eksak memerlukan screenshot browser untuk perbandingan.


**Representasi kartu template:** Kartu katalog lengkap `/template-design` dan kartu smartphone pilihan di `/d-invitation` menampilkan Cover / Hero sesungguhnya, **bukan** Amplop Digital. Render hanya komponen Cover pada kartu untuk menghindari mengunduh keseluruhan section yang tidak ditampilkan; ketika pengunjung membuka contoh interaktif atau tamu membuka URL undangan, alur tetap mulai dari Amplop Digital jika aktif. Aturan ini berlaku untuk seluruh template dan merupakan kontrak visual `template.md`, bukan perubahan 15 toggle atau data event.

**Popup katalog dan alur ke Studio (1 Oktober 2026; koreksi owner):** Kartu ponsel katalog dan featured tetap menampilkan **Cover/Hero utuh** seperti sekarang. Setelah kartu diklik, dialog pilihan template `/template-design?template=<key>` dimulai dari **Amplop Digital**; **Buka Undangan** mencoba pembuka tema lalu menampilkan Cover dan isi. Popup tetap hanya canvas undangan dengan tombol keluar, tanpa panel penjelasan. Ini hanya interaksi contoh, bukan toggle yang disimpan: form preview tidak boleh mengirim data dan pengalaman/toggle undangan pelanggan tetap mengikuti pengaturan event. **Canvas Invitation Studio harus tetap dapat menampilkan Amplop**, memainkan animasi pembukanya dan mengulangnya; sediakan kontrol terpisah untuk memilih tampilan Amplop atau Cover tanpa mengubah pengaturan section event. Alur `Buat Undangan` yang tersedia di permukaan lain mengarah ke gateway `/studio?template=<key>` yang memverifikasi login, lalu menuntut pemilihan/pembuatan acara terkonfigurasi sebelum editor. Pilihan tema hanya diterapkan ke state editor sebagai perubahan belum tersimpan; data dan desain pelanggan yang sudah tersimpan tidak ditimpa sampai Simpan Desain. **Pilihan tema tidak boleh hilang di tengah alur:** simpan slug tema non-sensitif secara sementara di localStorage dan cookie SameSite=Lax (maksimal tujuh hari) ketika CTA diklik, serta teruskan di URL melalui login, pemilihan acara atau pembuatan acara hingga Studio. Cookie/key harus divalidasi terhadap katalog; jangan simpan data pengguna maupun membuka editor anonim dari nilai browser. Pembuatan acara baru yang berhasil dapat membawa pengguna langsung ke editor dengan key tadi; pilihan belum mengganti template tersimpan sebelum Simpan Desain sukses, setelah itu pilihan sementara dihapus. Jika pengguna langsung membuka Studio biasa saat masih ada pilihan yang valid, gateway boleh melanjutkannya tanpa mengubah acara otomatis. **Panel Tema Studio wajib punya tombol/kolom cari, filter foto, pilihan urut A–Z dan Z–A, indikator tema terpilih, serta pagination/progressive listing untuk ratusan template.**

**Sinkronisasi tombol Amplop / Cover Studio (24 September 2026):** Saat pemilik memilih tombol **Amplop** di toolbar canvas, renderer asli tampil pada tahap Amplop Digital (jika section ON). Ketika tombol **Buka Undangan** di dalam kanvas ditekan, animasi tema diselesaikan terlebih dahulu (Zen Atelier menunggu animasi surat; tema lain mengikuti perilaku pembuka masing-masing); **secara otomatis tombol aktif berpindah menjadi Cover bersamaan dengan berpindahnya isi kanvas**. Tombol **Cover** dapat langsung membuka isi untuk pengeditan tanpa mengubah toggle Amplop tersimpan; menekan **Amplop** lagi atau tombol ulang memulai ulang dari amplop. Perilaku tombol ini hanya UI Studio, tidak menambah kontrol pada undangan tamu, tidak mengubah urutan section 15 komponen, dan tidak menulis data sampai Simpan Desain.


**Kontrak palet/font pada Amplop Studio (24 September 2026):** Setiap template baru yang menyediakan kontrol warna/font di Studio **wajib menerapkan nilai yang sama pada Amplop Digital**, bukan hanya Cover dan section isi. Renderer bersama menyuplai `--inv-scene-bg`, `--inv-scene-surface`, `--inv-scene-ink`, `--inv-scene-surface-ink`, `--inv-scene-accent`, `--inv-scene-soft` saat palet custom, plus `--inv-heading` dan font body; implementasi tema memetakannya ke lapis kertas, lipatan, tulisan, segel/ornamen, dan warna tombol yang memang dapat disesuaikan. Preset menggunakan fallback artwork/palet asli; `color-mix` untuk shading, teks kontras untuk palet gelap. Perubahan terlihat langsung pada canvas Amplop, disimpan melalui Simpan Desain lalu identik pada undangan tamu; jangan membuat cache Studio-only/PNG tetap yang tak dapat diwarnai tetapi menampilkan kontrol seolah aktif. Toggle Amplop, pembuka musik lewat gestur, restart/Amplop–Cover, reduced motion, dan slot foto bila didukung tetap memakai sistem bersama. Tema yang **secara jelas mengunci** warna/font (Romantic Rose) tidak perlu pura-pura menyediakan kontrol. Rincian checklist produksi ada di `template.md` bagian Studio. **Zen Atelier:** amplop washi/mizuhiki yang sebelumnya memiliki banyak warna hardcode telah diperbaiki memakai enam token `--jp-*` dengan fallback preset Zen, termasuk lapis kertas, bayangan/lipatan, tulisan surat, ornamen vektor dan warna simpul mizuhiki. Cover dan section lain tidak ikut dirombak.

### Confetti Club — tema ulang tahun (3 October 2026)

Stable key `confetti-club` memakai kertas krem, cobalt/coral, Syne + Inter, amplop hadiah berlipat dengan pita, dan ilustrasi kue dua tingkat. Tema ini mengutamakan kategori `BIRTHDAY` yang sudah ada dengan satu nama. Usia tidak diasumsikan dan tidak ada nama, tanggal, lokasi atau foto pelanggan yang dibakukan dalam artwork. Preset palette/font tetap dapat diganti dari Studio.

Cover bersifat ilustratif; foto customer opsional memakai role `cover` pada Identity, lengkap dengan crop/focus/geser shared. Gallery memakai media event dan kolase default melalui engine Masonry bersama; pilihan Gallery Settings lain tetap didahulukan. Marker native tersedia pada heading, pita, lipatan amplop, bagian kue, nama, detail dan grup komposisi. Narasi greeting/attendanceRequest/prayerWish/closing dapat diedit melalui Isi; RSVP/Wishes, maps, gift, countdown dan musik tetap memakai engine shared.

Animasi membuka amplop berjalan sekali selama 650 ms; keyboard, Reduced Motion dan motion OFF membuka langsung. Entrance native/foto memakai preset shared, mendahulukan override tersimpan dan OFF per section. Tidak ada confetti loop atau dependency baru. Lagu bawaan memakai file DayFox — They Say... yang sudah tersedia.

Kartu katalog dan full preview memakai fixture birthday terisolasi dengan satu nama; fixture pernikahan Una & Dara tetap dipakai tema lain. Preview boleh membuka amplop tetapi tetap tidak menulis RSVP/Wishes atau data pelanggan. QA browser semua variasi tetap merupakan release check terpisah dari CI.

### Serein — tema foto editorial (30 September 2026)

Tema `serein` menambah katalog menjadi **13 tema: 7 dengan foto dan 6 tanpa foto**, melalui registry tunggal. Art direction diserahkan owner kepada asisten: kertas ivory, tinta plum, Crimson Pro + DM Sans, amplop surat berlipat dan segel inisial, sampul tipografi asimetris, identitas pasangan berselang-seling, dan album foto monokrom. Ilustrasi botanical WebP transparan khusus tema mengikuti palet melalui alpha mask; referensi gambar generated diperiksa, bukan ditempel sebagai UI.

Semua 15 kontrol, narasi event-scoped/Our Story, photo roles/focus/crop, native visual ownership, form RSVP/Wishes, maps, gift, countdown dan musik tetap memakai engine bersama. Album publik menyediakan native dialog, Escape, panah keyboard, swipe dan pengembalian fokus; preview tidak membuka dialog atau mengirim data. Motion bawaan memakai preset Studio: nama masuk dari sisi berlawanan, foto cover reveal dari kiri, potret identitas glide kiri/kanan, heading naik/geser lembut, dan foto album rise dengan stagger 70ms. Engine bersama mendaftarkan elemen scene/galeri yang dimuat belakangan, menunggu foto termuat sebelum animasi, mempertahankan transform/opacity customer, serta memutar ulang entrance Serein setelah keluar sepenuhnya dan masuk kembali ke viewport. Override foto/native tetap didahulukan; section yang memilih animasi/timeline menonaktifkan default child agar tidak bertumpuk, sedangkan OFF eksplisit tersimpan dan Reset kembali mengikuti tema. Motion pembuka/isi menghormati reduced motion. Save/public round-trip dan alur tamu berbayar tetap perlu validasi browser/database; registrasi renderer bukan bukti QA live tersebut sudah lulus.

### Botanical Ivory — stationery dan herbarium (30 September 2026)

Stable key `botanical-ivory` tetap **No Photo** (`usesPhotos:false`, tanpa photo slots). Arah visual menjadi undangan stationery ivory dengan tinta olive, tipografi Rufina + Average Sans, nama bersusun asimetris, tangkai botani utuh dan galeri dua lembar herbarium. Preset baru memakai palet `botanical`; palet/font yang sudah tersimpan eksplisit pada event tetap berlaku. Aset owner `greenplant.webp` dan `greenplant2.webp` dipertahankan; renderer memakai derivative WebP transparan yang menjaga rasio asli. Amplop berupa kertas lipat dengan pita olive dan segel daun; satu **Buka Undangan** menggeser pita, mengangkat surat lalu membuka isi lewat engine bersama. Reduced motion/OFF membuka langsung. Cover tidak menambah CTA kedua atau foto pelanggan.

Motion bawaan memakai library/preset Studio yang sudah ada: nama naik/geser, tangkai reveal dari bawah, lembar herbarium tilt-in dan signature penutup soft-scale. Elemen lazy menunggu gambar termuat, replay setelah benar-benar keluar viewport, dan mempertahankan native transform/opacity. Override native/OFF dan section animation/timeline tersimpan tetap didahulukan. Galeri memakai scroll/snap asli dengan swipe serta kontrol keyboard/panah; keyboard dan reduced motion berpindah langsung. Countdown tetap memakai helper bersama dan angka tidak dianimasikan per detik. Seluruh 15 kontrol, Our Story opsional/event-scoped, data host/orang tua/acara, shared RSVP/Wishes, maps, gift dan musik memakai kontrak yang sama; tidak ada section/model/endpoint baru. Brief aset, blueprint dan review ada di `assets/templates/botanical-ivory/README.md`. Referensi desain gambar bukan screenshot implementasi, dan build/tes tidak membuktikan kualitas visual maupun save/public round-trip browser.

### 7.2.3d — Standar produksi untuk semua template undangan (24 September 2026)

Owner menetapkan `template.md` sebagai panduan **UNIVERSAL** untuk membuat semua template baru lewat ChatGPT; desain khusus Zen Atelier hanya salah satu contoh dan **tidak** menjadi palet/komposisi baku untuk tema lain. Alur produksi setiap template adalah brief → moodboard dan contoh setiap layar → audit aset → blueprint semua 15 komponen (amplop + 13 section + musik global) → review visual → coding terintegrasi Studio → pengujian.

Seluruh tema wajib memiliki copy ringkas, animasi tipografi/scroll yang mendukung karakter tema, galeri yang paling ekspresif (misalnya masonry + hover/focus, carousel, parallax yang terukur), reduced-motion/accessibility, serta toggle yang tersimpan. Tombol pembuka berlabel **Buka Undangan** dengan kapitalisasi itu dan tanpa tombol **Lihat Undangan** redundan setelah amplop dibuka; **tidak** ada kata Pratinjau/Preview atau label data contoh di dalam renderer undangan. Katalog/Studio menghilangkan penjelasan filler seperti `Preview mengikuti renderer undangan publik` dan `Foto dan nama pada pratinjau merupakan data contoh. Untuk memakai foto sendiri, buat acara lalu unggah foto melalui Invitation Studio.` tanpa menyembunyikan status error, batasan upload, hak akses atau kesiapan fitur yang memang penting.

Kontrak bisnis §7.2.3a–c tetap berlaku; `template.md` adalah panduan desain/produksi lintas tema, **bukan** bukti implementasi semua efek galeri atau persetujuan mengubah landing/Pintu/template lain.

### 7.2.4 Template-owned presentation and default order

Reusable component tidak boleh membuat semua template terlihat sama. Reuse terutama berada pada behavior, validation, data flow, accessibility contract, dan backend interaction. Template memiliki ownership atas presentation.

Setiap template boleh memiliki:
- typography, palette, background, ornament, artwork, spacing, dan surface treatment berbeda;
- layout/composition section berbeda;
- RSVP/Wishes/Gift presentation yang benar-benar berbeda;
- template-specific animation;
- **default section order** sendiri.

Default section order adalah bagian dari design template. Section yang OFF dilewati tanpa merusak urutan section lain. Sampai ada requirement eksplisit untuk user-reordering, default order template bersifat authoritative.

Jika Studio kelak mengizinkan reorder section, kemampuan tersebut harus dideklarasikan melalui template capability dan tidak boleh memindahkan business logic ke template layer.

### 7.2.5 Section animation control

Template dapat menentukan decorative/template motion default per section.

Canonical behavior:
- jika suatu section tidak memiliki animation capability, Studio tidak perlu menampilkan animation control;
- jika template mendukung animasi pada section tersebut, default mengikuti template;
- user dapat memilih **Animasi ON / OFF**;
- `OFF` hanya mematikan decorative/template motion, section dan function tetap aktif;
- animation toggle terpisah dari section visibility toggle;
- Studio bukan general-purpose animation editor dan tidak memberikan daftar bebas efek yang dapat merusak karakter template;
- functional motion yang diperlukan untuk menjelaskan interaction/state tidak boleh dihilangkan jika membuat UX membingungkan;
- state animation disimpan event-scoped dan tidak mengubah template master untuk user lain;
- implementation menghormati reduced-motion/accessibility preference bila relevan.

### 7.2.6 Template-safe customization capabilities

Customer tidak otomatis dapat mengubah seluruh aspek visual template. Setiap template mendeklarasikan customization capabilities yang aman.

Capability yang dapat diizinkan antara lain:
- editable content/text yang memang relevan;
- customer photos/media;
- music/audio bila didukung;
- accent color atau limited palette bila designer mengizinkan;
- section ON/OFF;
- animation ON/OFF pada section yang mendukung;
- customization lain yang dinyatakan aman oleh template.

Template dapat mengunci:
- typography/font pairing;
- core layout;
- spacing system;
- ornament placement;
- composition;
- button/card treatment;
- structural visual decisions lain yang bila diubah dapat merusak desain.

Studio membaca capability template dan hanya menampilkan control yang valid untuk template aktif.

### 7.2.7 Reusable template contract

Setiap template wajib mengikuti contract yang konsisten, minimal mencakup:
- stable unique key;
- display name;
- description;
- preview/thumbnail;
- asset location;
- supported event/category compatibility bila diperlukan;
- supported sections;
- default section order;
- allowed customization capabilities;
- presentation implementation/theme definition;
- default section animation capability/configuration bila tersedia;
- version/migration strategy bila struktur template berubah material.

Template renderer menerima normalized invitation/event data dari shared engine dan tidak mengambil ownership atas authorization, entitlement, payment, ownership, RSVP persistence, Wishes persistence, Gift transaction, atau security rules.

### 7.2.7a Romantic Rose reference template (22 September 2026)

Template undangan pernikahan `romantic-rose` memakai satu file presentation `components/PublicInvitation/RomanticRoseTemplate.tsx`, dimulai dari amplop digital `Buka Undangan` sebelum Cover. Susunan visual default: Cover, Greeting, Identity, Event, Date & Time, Gallery (jika ada foto), Countdown, Location/Maps, RSVP, Wishes, Gift, Closing, Footer. Data pasangan, event, foto, audio, dan nomor rekening tetap berasal dari record undangan yang sama; tidak ada backend atau database per template.

Upload beberapa foto memakai API asset undangan yang sudah ada, namun assignment foto sekarang memakai shared photo slots (lihat §7.2.7b): cover, personOne, personTwo, dan pilihan galeri tidak lagi harus ditentukan dari urutan foto upload. Undangan lama tetap kompatibel dengan fallback cover/foto kedua/foto ketiga serta galeri seluruh foto bila assignment belum pernah disimpan. Preview Studio memakai presentation Romantic Rose yang sama dengan public renderer; section RSVP/Wishes/Gift mengikuti section visibility state. RSVP menggunakan `RsvpForm` bersama. Wishes memakai komponen GuestWishes dan endpoint shared yang sama dengan tema lain; form nyata hanya aktif pada undangan publik, sedangkan preview Studio tidak boleh mengirim pesan ke event asli. Gift hanya tampil jika aktif dan rekening tersedia. Palette dan typography khusus Romantic Rose terkunci agar kualitas visual terjaga; animation toggle per section dan full capability-aware Studio control masih tahap selanjutnya, tidak boleh diklaim sudah selesai.

### 7.2.7b Global photo library and template-owned photo slots (22 September 2026)

**Geser frame dan crop (3 Oktober 2026):** memilih Foto Mempelai dari menu membawa canvas ke section Identitas pada Isi; klik foto pada canvas memilih frame untuk drag/resize/rotate melalui engine native bersama. Mode crop gambar di dalam frame dimulai secara eksplisit dari tombol **Crop** di inspector kanan dan diakhiri dengan Selesai. Seleksi biasa tidak mengaktifkan crop. Handle mengikuti target walaupun renderer section baru selesai dimuat setelah seleksi. Transform kedua mempelai tetap terpisah pada `nativeVisuals`, sedangkan crop memakai `photos` yang sama; visibility section tidak diubah hanya karena memilih foto.

**Label pilihan foto bawaan (3 Oktober 2026):** tombol pengembalian slot foto memakai **Kembali ke bawaan** (ID) / **Back to default** (EN), menggantikan label Otomatis. Nama aksesibel menyebut label yang sama dan slot terkait. Aksi tetap melepas assignment manual dan crop slot agar resolver memakai foto bawaan yang sama; tidak menghapus aset koleksi.

**Satu event, satu koleksi foto, banyak template:** `InvitationAsset` adalah master koleksi gambar milik undangan/event tersebut. Upload foto sekali melalui authenticated Studio dan reuse asetnya ketika template berganti. Template tidak menyimpan salinan foto dan tidak perlu endpoint, database/table, atau picker khusus per template. Galeri dan role selection tidak boleh membocorkan/menggunakan aset dari event lain. Pengguna dapat mengupload JPG, PNG, atau WebP (maksimal 15 MB/file, 30 gambar/event di jalur undangan saat ini). Server harus decode dan konversi *semua upload image biner baru* memakai Sharp menjadi file WebP nyata dengan resize maksimum 2000 × 2000 (tanpa upscaling) dan kualitas 82; gunakan UUID dan folder per event `public/uploads/images/<invitationId>/<uuid>.webp`. Validasi MIME, izin user dan kepemilikan event, jumlah/ukuran gambar harus tetap server-side. Upload preview gambar oleh designer juga dikonversi otomatis menjadi WebP sebelum file disimpan, tanpa mengubah file paket HTML/ZIP/JSON-nya. Endpoint lama untuk menambahkan image dari URL eksternal tidak boleh digunakan sebagai bypass konversi; item audio tidak terkena ketentuan image. Media lama tetap dapat dibaca, tanpa migrasi massal atau mengganti URL existing.

**Role/slot global, presentasi lokal:** role semantik yang reusable adalah `cover`, `personOne`, `personTwo`, `gallery`. Katalog tunggal `lib/templates/catalog.ts` menentukan role yang benar-benar dipakai oleh suatu renderer lewat `photoSlots`; Studio hanya memunculkan kontrol untuk role yang didukung. Data selection yang event-scoped disimpan dalam desain sebagai stable ID milik `InvitationAsset` serta array ID terpilih untuk galeri (`null` = seluruh koleksi; array kosong = galeri kosong). Fokus objek `top/center/bottom` dapat dipilih per gambar tunggal. Resolver bersama `lib/templates/photo-slots.ts` mengizinkan hanya ID aset image undangan saat ini, menolak ID asing/tidak dikenal, dan mengembalikan URL aktual ke template. Template tetap memiliki kebebasan bentuk bingkai, aspect ratio, lokasi penempatan, dekorasi, dan animasi; koordinat layout foto **tidak diglobalisasi**.

**Studio UX:** menu kiri Foto berisi `Koleksi Foto` (unggah multi-file/lihat aset event) dan `Penempatan Foto` (pilih role, pilih aset yang sudah ada, pilih beberapa foto galeri). **Semua pengaturan editing foto berada di inspector kanan**: fokus, rasio crop, posisi crop, zoom, urutan foto Galeri, gaya Galeri, autoplay/jeda/transisi/durasi, animasi entrance, parallax dan Reset. Pemilihan slot atau foto di kiri membuka inspector kanan yang sesuai; klik area foto di live canvas memakai seleksi yang sama. Pengaturan Galeri tidak diduplikasi di kiri, dan hanya slot yang didukung template/kategori acara boleh diedit. State tetap disimpan melalui `photos=` dan `Simpan desain`, dengan Undo/Redo, pemulihan refresh, preview dan renderer publik yang sama. Pergantian template tidak menghapus aset/assignment, tetapi role yang tidak dipakai oleh template baru tidak ditampilkan. Wedding-specific person roles tidak otomatis diaktifkan untuk acara non-couple. Manifest template yang hanya mendukung `cover` tidak boleh berpura-pura mendukung slot galeri/mempelai.

**Compatibility:** invitation lama tanpa `photos=` pada design key tetap memakai pemilihan decor/cover lama, foto urutan kedua/ketiga bila tersedia, dan semua gambar sebagai galeri. Seluruh media lama tetap dapat ditampilkan di URL existing. Tidak ada migration database untuk tahap ini; jika kolom desain bertambah di masa depan, buat migrasi semantik event-scoped tanpa memaksa tiap template memiliki schema berbeda.

### 7.2.8 Designer-friendly template intake

Designer tidak diwajibkan memahami React, Next.js, TypeScript, Prisma, API, atau backend logic untuk menyumbangkan desain template. Designer menyerahkan design package/reference; developer/AI menerjemahkannya menjadi presentation layer yang mengikuti Template Contract.

Design package idealnya mencakup:
- preview utama;
- font bila berlisensi untuk penggunaan tersebut;
- artwork/ornament/image assets;
- full-page reference atau section reference;
- state visual untuk section interaktif yang didukung.

Minimal reference yang dianjurkan:
- Cover;
- Identity / Introduction;
- Event Detail;
- Gallery bila didukung;
- Location;
- RSVP;
- Wishes;
- Gift;
- Closing.

Penambahan template baru idealnya tidak menyentuh Prisma schema, core RSVP/Wishes API, payment/entitlement, guest isolation, ownership, atau unrelated dashboard logic kecuali template tersebut memperkenalkan capability produk baru yang memang memerlukan perubahan shared engine.

### 7.2.9 Standard template preview and QA data

Undara harus memiliki standard demo/dummy invitation data yang reusable untuk preview dan QA template baru. Demo data tidak boleh bercampur dengan production customer data. Fixture dipilih sesuai kategori tema: tema pernikahan memakai Una & Dara, sedangkan Confetti Club memakai fixture birthday dengan satu nama melalui `getTemplateDemoInvitation`; fixture tidak mengubah data acara ketika pemilik memilih template.

Template baru minimal diuji terhadap variasi:
- identity pendek dan panjang;
- venue/address pendek dan panjang;
- content pendek dan panjang bila field mendukung;
- tanpa customer media;
- satu/sedikit media;
- banyak media sampai batas yang didukung;
- RSVP ON/OFF;
- Wishes ON/OFF;
- Gift ON/OFF;
- Location/Maps ON/OFF bila applicable;
- animation ON/OFF bila applicable;
- kombinasi beberapa optional section OFF.

Template belum siap masuk katalog production bila variasi umum menyebabkan overflow, layout rusak, section kosong yang janggal, atau core interaction tidak dapat digunakan.

### 7.2.9a Katalog visual /template-design

Halaman publik `/template-design` mengambil built-in template dari `lib/templates/catalog.ts`, bukan list contoh/nomor template palsu yang terpisah dari Studio. Kartu desain menampilkan **Cover/Hero** dari `InvitationPreview` yang lazy-load ketika masuk viewport. Popup untuk seluruh built-in READY dimulai dari Amplop Digital, lalu **Buka Undangan** membuka Cover dan isi dengan renderer tema yang sama. Mode preview tetap read-only untuk RSVP/Wishes dan aksi data lain; izin membuka amplop tidak mengubah flag preview menjadi mode publik. Canvas Studio tetap memiliki pilihan Amplop/Cover yang independen. Toggle popup hanya untuk melihat contoh dan tidak menulis database. Preview memakai fixture `data/templates/preview-invitation.ts` yang terisolasi dari konten pelanggan, tanpa label `Pratinjau`/`data contoh` di dalam renderer undangan. Semua built-in READY kini memakai presentasi publik yang sama dengan Studio dan galeri, melalui renderer Romantic Rose atau Universal renderer. Hanya upload designer tanpa renderer yang tetap berupa pratinjau gambar.

Tombol dari katalog publik menuju **gateway `/studio?template=<key>`** yang memeriksa login terlebih dahulu, lalu memilih/membuat acara terkonfigurasi sebelum editor dibuka; key pilihan bertahan lewat URL dan cache browser sementara. Pemilihan/simpan template event dilakukan di Invitation Studio setelah `invitationId` valid; tidak ada bypass auth atau penulisan database dari katalog. Jangan menyebut berkas designer (HTML/ZIP) sebagai template built-in yang sudah dapat dirender tanpa proses integrasi. Permukaan marketing `/d-invitation` dan landing tidak otomatis ikut berubah saat katalog ini diperbaiki.

### 7.2.9b Satu sumber katalog untuk semua halaman (22 September 2026)

`lib/templates/catalog.ts` adalah manifest tunggal untuk template built-in yang **siap dirender**: key, identitas, kategori, thumbnail/preview mode, dan Studio preset milik template didaftarkan sekali. Halaman publik `/template-design`, koleksi `/d-invitation`, dan pilihan template di Invitation Studio wajib membaca API katalog yang sama (`/api/templates` via `lib/templates/use-template-catalog.ts`), tanpa array unggulan/showcase/preset terpisah. Ketika template kode baru terintegrasi dan sekali diregistrasikan ke manifest, tiga permukaan ikut berubah pada deployment/refresh tanpa mengedit tiga halaman.

Designer upload yang telah berstatus `PUBLISHED` di database muncul otomatis lewat API pada galeri publik `/template-design` sebagai `previewType: image`, `ready: false`; etalase ringkas `/d-invitation` hanya menampilkan tiga template READY sesuai §7.2.9d. File HTML/ZIP/JSON yang diunggah belum merupakan komponen React dan **tidak boleh** dapat dipilih sebagai template aktif di Studio/publish sampai developer mengintegrasikan renderer dan mengubah statusnya menjadi ready lewat registrasi master. Jangan menampilkan klaim bahwa foto preview sama dengan output undangan publik apabila belum ada renderer. Studio menampilkan semua entri katalog dengan item `ready:false` nonaktif dan hanya mengizinkan pemilihan `ready:true`. Fallback built-in tetap tersedia ketika query katalog upload tidak berhasil; publik tidak mendapat akses untuk download paket designer secara langsung dari endpoint katalog.

Preview undangan publik dapat dibuka tanpa login, tetapi tombol penggunaan dari `/template-design` atau `/d-invitation` harus melewati gateway `/studio` yang mengarahkan pengguna belum login ke login dan menuntut acara terkonfigurasi sebelum editor; key tema terbawa hingga Simpan Desain. `/dashboard/editor` dan semua turunannya harus tetap diproteksi oleh pengecekan sesi server-side dan editor membutuhkan `invitationId` valid; tidak ada akses anonim ke Studio melalui deep link maupun manipulasi URL.

### 7.2.9c Konsistensi visual galeri publik dengan main frame marketing (22 September 2026)

Halaman `/template-design` merupakan marketing page dengan visual baseline landing terverifikasi `/` dan `/d-invitation`, bukan halaman terpisah dengan full-page putih, navbar/footer tambahan atau dekorasi marketing ganda. Gunakan komponen bersama `Navbar embedded`, `PublicMarketingAtmosphere` dan `MarketingFrameFooter`; bingkai utama di desktop mengikuti shared marketing frame aktif, dengan semantic border/surface dan ruang konten yang responsif. Hanya main bagian tengah yang scroll; navbar dan footer tetap pada tempatnya. Di mobile frame tetap responsif tanpa menyebabkan scroll horizontal. `PublicAtmosphere`, `PublicContent`, Navbar/Footer global dan `MarketingFloatingControls` harus memperlakukan rute ini sebagai framed marketing page supaya tidak menduplikasi atmosphere woodland, pemutar musik, social controls, navbar atau footer. Musik tetap satu player dari marketing provider dan mengikuti pilihan mute/reduced motion. Jangan mengubah landing/Pintu atau desain `/d-invitation` ketika menyamakan shell galeri.

Area isi berbahasa Indonesia default dan responsif terhadap ID/EN navbar; memakai shared typography dan semantic theme tokens aktif. Copy ringkas dan tidak mengulang brand/undangan/galeri secara berlebihan. Kartu katalog harus tetap bersumber dari API/manifest tunggal dan thumbnail real yang lazy-load; filter/pencarian/sort serta preview modal tetap berfungsi tanpa login. Modal preview yang memanjang dibuka di atas bingkai, dapat scroll sendiri, dan tidak terpotong oleh overflow main frame. Tombol pemakaian template membawa pengguna ke Dashboard untuk login/buat event dahulu, tidak membuka Studio anonim. Mode terang/gelap, aksesibilitas keyboard dan interaksi mobile tetap berlaku.

**Kontrak bentuk kontrol tunggal, berlaku 24 September 2026 dan menggantikan seluruh arahan pill sebelumnya:** Tombol CTA aplikasi termasuk landing dan Studio, input satu baris, filter, trigger dropdown dan opsi menu memakai **kotak dengan sudut membulat 16px (rounded rectangle), bukan pill/kapsul** dengan outline brand pada Light/Dark; panel menu custom memiliki radius 18px. Token radius, radius menu, outline ada di `app/globals.css`; pakai `components/ui/button.tsx`, `components/ui/input.tsx` dan `components/ui/control-styles.ts` sebagai sumber bersama, bukan file style khusus halaman. `/template-design` menggunakan source yang sama untuk kolom Cari, chip filter dan Urutkan (Urutan katalog, Nama A–Z, Nama Z–A; ID/EN, Escape, klik di luar), tanpa duplikasi class shape/border. Popup native `<select>` dirender sistem operasi sehingga bentuk opsi tidak dapat dikendalikan penuh; ketika opsi menu harus rounded pakai dropdown custom yang aksesibel. Pengecualian geometry tetap berlaku untuk navbar/control icon khusus yang sudah disetujui, checkbox/radio, textarea multi-baris, dan artistik template undangan; token global tidak boleh mengubah layout/warna frame, Pintu, atau ilustrasi undangan.

### 7.2.9d Etalase ringkas template di /d-invitation (22 September 2026)

Marketing `/d-invitation` menampilkan maksimal **tiga** preview template READY dari manifest/katalog bersama, bukan keseluruhan katalog. Urutan utama diambil dari jumlah event/undangan yang sudah memiliki entitlement Digital Invitation berstatus `Payment.status = PAID` dan `packageKey` termasuk paket Digital Invitation, dikelompokkan menurut `Invitation.templateKey` yang **saat ini tersimpan**. Satu event dihitung sekali melalui relasi Payment unik per invitation; transaksi masih pending, failed/refunded, add-on WA Blast, dan Guestbook-only tidak dihitung. Pada jumlah template berbayar kurang dari tiga, sisa slot diisi pilihan acak dari template siap lain tanpa duplikasi; bila belum ada satu pun penjualan, tampilkan tiga pilihan acak. Jika database tidak dapat diakses, gunakan pilihan acak tanpa klaim peringkat/label best-seller palsu. Tidak ada identitas, data pelanggan, atau angka order pribadi dalam respons endpoint publik.

Keterbatasan data saat ini: template bisa diganti setelah pembayaran, dan tidak ada snapshot immutable template pada saat transaksi. Maka urutan didasarkan pada template yang sedang dipakai pada event berbayar, bukan histori pembelian template yang tak bisa diubah. Jika pelaporan penjualan per-template historis dibutuhkan kelak, perlu snapshot/ledger yang benar; jangan membuat angka atau data semu. Endpoint `/api/templates/featured` mengembalikan hanya kunci template READY untuk marketing. Semua template tetap tersedia di galeri penuh dan Studio melalui manifest dan `/api/templates`, tidak membuat daftar unggulan hardcoded per halaman. Setiap preview ringkas memakai frame smartphone dengan aspek sekitar **9:19.5**, bezel metal gelap, tombol samping dan notch sesuai mockup Hero `/d-invitation`; renderer preview tetap real dan lazy-load. Perubahan tidak memengaruhi hero, Pintu, landing atau pilihan Studio. Header Koleksi Template dan CTA Lihat Semua Template di sebelah kanan dikelompokkan lebih dekat ke tengah frame (wrapper konten bersama maksimal sekitar 1100px, jarak responsif); jangan letakkan keduanya di ujung berlawanan dari keseluruhan area konten. Susunan mobile tetap vertikal. Tombol Lihat semua template memakai kapitalisasi kalimat biasa (tanpa CSS uppercase atau tracking lebar) dalam kedua bahasa. Garis pemisah di bawah header koleksi membentang selebar area konten koleksi, meskipun isi header dan tombol kanan tetap dikelompokkan di wrapper konten bersama ±1100px. Beri jarak lebih lega dari garis ke ketiga preview smartphone (sekitar 56px mobile, 64px desktop). Klik pada HP membuka pratinjau; jangan render tombol Lihat pratinjau tambahan di bawah masing-masing HP.

### 7.2.10 Template performance, lazy loading, and asset isolation

Katalog dengan puluhan/ratusan template tidak boleh membuat setiap public invitation mengirim seluruh code dan asset semua template ke browser visitor.

Canonical performance goals:
- renderer template dapat dipisahkan/load secara independen bila practical;
- asset template lain tidak dimuat hanya karena terdaftar di katalog;
- pertumbuhan jumlah template tidak boleh secara linear memperbesar initial public invitation payload;
- shared runtime/components tetap boleh berada di common bundle bila memang efisien;
- hindari eager import seluruh renderer ke public client bundle bila menyebabkan semua template ikut terkirim;
- Studio/preview boleh memiliki loading strategy berbeda dari public invitation selama tetap terkontrol;
- master/shared assets tidak diduplikasi per customer;
- customer storage terutama bertambah dari uploaded/generated media milik customer, bukan copy template master.

Target architecture untuk shared template asset dapat menggunakan durable object storage/CDN. Premium/proprietary master assets mengikuti anti-copy strategy pada Section 7.4.

### 7.2.11 Separation of responsibilities

Canonical separation:

**Undara Core** memiliki data contracts, database, authorization, event isolation, validation, RSVP/Wishes/Gift logic, Maps/location data, payment/entitlement, dan business rules lain.

**Template Layer** memiliki typography, colors, layout, artwork, ornament, animation, section composition/order, allowed customization capabilities, dan presentation RSVP/Wishes/Gift.

Template layer mengatur cara shared function ditampilkan, tetapi tidak menjadi source of truth untuk persistence, authorization, entitlement, payment, ownership, atau data-security rules.

### 7.3 Template save state

`Invitation.templateKey` adalah indikator bahwa desain/template pernah disimpan.

Configured event tanpa `templateKey` **tidak boleh publish**.

### 7.4 Unpaid template preview & anti-copy strategy

User **boleh** membuka Studio, memilih template, mengedit, preview, dan menyimpan desain sebelum membayar.

Untuk event yang belum memiliki Digital Invitation entitlement:
- preview Studio diberi watermark `PREVIEW • UNDARA`;
- fullscreen preview juga diberi watermark;
- image drag/select dan context-menu boleh dipersulit sebagai deterrent;
- UI harus menjelaskan bahwa template masih preview dan lisensi diperlukan pada Publish.

Client-side anti-copy bukan security boundary. HTML/CSS/JS yang sudah dikirim ke browser tidak dapat dijamin 100% anti-copy.

Untuk template premium/proprietary, target architecture yang lebih kuat:
- catalog hanya memakai thumbnail/low-resolution/watermarked asset;
- master asset berada di private object storage;
- server memverifikasi owner + entitlement event;
- master asset diberikan melalui short-lived signed URL/path;
- final asset tidak dimasukkan ke public frontend bundle sebelum entitlement valid.

### 7.5 Publish behavior

Saat user menekan Publish:
1. Studio membaca state terbaru dari server.
2. Jika event belum configured → publish ditolak.
3. Jika `templateKey` kosong → minta user menyimpan desain.
4. Jika entitlement belum aktif → redirect ke `/packages?package=INVITATION_BASIC&invitationId=<id>`.
5. Jika entitlement aktif → request publish.
6. API melakukan validasi ulang sebelum `isPublished = true`.

### 7.6 Public renderer

Public renderer wajib memeriksa:
- `eventConfigured`;
- saved `templateKey`;
- `isPublished`;
- valid event-scoped payment.

Jika salah satu tidak terpenuhi, renderer mengembalikan locked state dan tidak mengirim final invitation experience.

Renderer harus event-category aware:
- wedding/anniversary dapat memakai dua nama;
- WEDDING menampilkan parent line otomatis per pengantin bila parent identity tersedia;
- birthday memakai satu nama;
- baby shower memakai family/baby identity;
- Other memakai event title.

Timing public menggunakan generic `Mulai` / `Selesai`, bukan asumsi `Akad` / `Resepsi` untuk semua event.

Footer undangan tetap memiliki kontrol ON/OFF, tetapi **tidak boleh menampilkan atribusi promosi** seperti `Created with Undara`, `Made with Undara`, atau `Dibuat dengan Undara` pada undangan yang dipublikasikan. Tampilan footer boleh berupa penutup dekoratif ringkas sesuai tema tanpa menambahkan copy filler. Identitas brand Undara pada situs pemasaran, Dashboard, atau alur operasional tidak termasuk dalam perubahan footer undangan ini.

### 7.7 Public routing & password

Configured event routing tidak memiliki maximum-two business limit.

Public access tetap mendukung legacy routing/alias selama dibutuhkan.

Password protection:
- hash menggunakan bcrypt;
- password hash tidak dikirim ke client;
- access cookie/server gate tetap server-authoritative.

View counter bertambah setelah publish/payment/password gate berhasil dilewati.

Root domain berasal dari `NEXT_PUBLIC_INVITATION_ROOT_DOMAIN`; fallback `dcwedding.com` hanya compatibility sementara sampai migration domain ditetapkan.

---

## 8. Monetization & Entitlement

### 8.1 Digital Invitation

Package key: `INVITATION_BASIC`.

Harga aktif:

**Rp150.000 per event / invitation.**

Satu pembelian membuka **satu event** saja dan mencakup:
- 1 Digital Invitation;
- 1 saved template/design;
- publication;
- RSVP;
- guest management;
- seating/table workflow yang tersedia;
- event invitation media/gallery sesuai kapabilitas Studio.

Payment **tidak diperlukan** untuk:
- membuat event;
- menyimpan event;
- membuka Studio;
- memilih/edit template;
- menyimpan desain;
- internal preview.

Payment diperlukan ketika user ingin **Publish**, kecuali pemilik undangan memperoleh hak Digital Invitation manual yang masih aktif dari panel Owner.

Payment wajib event-scoped. Pembelian Event A tidak membuka Event B. Hak manual Owner adalah override akun yang eksplisit, memakai audit terakhir untuk user pemilik undangan; hak tersebut tidak membuat payment atau penjualan baru.

### 8.1a QR berbagi undangan

Nama PNG mengikuti judul acara yang tersimpan, misalnya `undara-undangan-ulang-tahun-naya-qr.png`, bukan ID database. Server menentukan filename saat permintaan download; judul dinormalisasi untuk nama file/header yang aman dan dibatasi panjangnya, dengan fallback `acara` ketika kosong. Tombol download mengikuti nama dari server. Mengganti judul mengubah nama unduhan berikutnya tanpa mengubah tujuan QR per `Invitation.id`.

Setiap `Invitation.id` milik customer dengan akses Digital Invitation dari pembayaran event `PAID` atau hak manual Owner yang masih aktif mempunyai satu tujuan QR stabil: `APP_URL/q/<invitationId>`. Customer dapat melihat atau mengunduh PNG ketika masih draft; scan membuka slug terbaru hanya setelah event lengkap, terbit, dan entitlement pemilik undangan tetap valid. Endpoint gambar memeriksa sesi, kepemilikan event dan shared server entitlement, sehingga hak manual tidak membuka undangan user lain. Redirect publik memeriksa hak user pemilik undangan, bukan sesi atau hak orang yang melakukan scan. Halaman undangan publik, varian event/personal dan media mengikuti hak yang sama dengan tetap menjaga password serta publikasi tamu; media tanpa payment yang diakses lewat hak manual memakai private/no-store. Pencabutan hak berlaku pada permintaan QR berikutnya kecuali event punya payment valid sendiri. Pembayaran event lain tidak membuka akses, dan hak manual tidak menjadi payment/penjualan. PNG 640px dibuat di memori server Undara memakai library `qrcode` existing, dengan quiet zone 4 modul, tanpa mengirim URL ke layanan QR eksternal atau menyimpan gambar dalam database. QR ini tetap satu per undangan, berbeda dari signed token tamu untuk check-in Usher.

### 8.2 Checkout

`/packages` dan order flow Digital Invitation harus membawa `invitationId` agar payment menempel ke event yang benar.

`PaymentOrder` digunakan untuk checkout/order. `Payment` merepresentasikan entitlement aktif untuk invitation/event.

Manual payment verification/backoffice boleh tetap tersedia melalui role Admin/Finance sesuai implementation existing.

### 8.2a Referral Mitra

- Owner saja yang boleh membuat akun/ID Mitra (`SUPPORT`) dari panel Owner. Pendaftaran publik selalu membuat akun pelanggan; Mitra tidak dapat membuat akun Mitra lain.
- Setelah login, setiap Mitra dapat membuat kode referral acak miliknya sendiri dari panel Mitra (maksimum 20 kode aktif per akun). Owner tetap dapat membuat kode atas nama Mitra dari analitik Owner. Kode harus unik, aktif, dan terikat ke akun Mitra yang masih berperan sebagai Mitra.
- Beranda Dashboard menampilkan satu tombol `Kode Referral` bersama aksi Beranda. Tombol membuka popup berisi kolom kode dan `Submit`; formulir, penjelasan promo dan harga tidak ditampilkan sebagai panel di Beranda. Kode tersimpan dimuat saat popup dibuka, dengan feedback loading/sukses/error dan opsi hapus kode aktif di dalam popup. Pelanggan menyimpan satu kode aktif yang terbawa ke pemilihan paket; kode dapat diganti atau dihapus sebelum invoice dibuat. Checkout juga menyediakan input kode untuk pelanggan yang langsung memilih paket. Popup mengikuti dialog, warna, fokus/keyboard, layout responsif dan ID/EN existing.
- Pada invoice baru, kode aktif memberi diskon **30% untuk `INVITATION_BASIC`** dari harga katalog Rp150.000 (total Rp105.000), atau **15% untuk `GUESTBOOK_DIGITAL`** dari harga katalog Rp2.000.000 (total Rp1.700.000). Perhitungan jumlah bayar bersumber dari katalog aktif dan dilakukan ulang di server, bukan dari nominal yang dikirim browser. WA Blast serta produk lain tidak menerima diskon ini.
- Setiap invoice yang menggunakan kode mengaitkan penjualan ke Mitra pemilik kode. Nilai invoice dan kode terkunci setelah pelanggan melaporkan pembayaran atau mengirim bukti transfer; invoice yang sudah terverifikasi tidak boleh dihitung ulang. Analitik Mitra/Owner menghitung order teratribusi terakhir dan omzet berdasarkan nominal invoice yang benar-benar dibayar.
- Panel Mitra menampilkan setiap invoice berkode dengan harga awal, nominal diskon pelanggan, total bayar, kode, dan status. Ringkasan penjualan terverifikasi menghitung `harga awal − diskon = total dibayar` hanya dari order `PAID`; `PENDING` tetap terlihat beserta potongannya tetapi belum masuk omzet. Order batal/gagal tidak dihitung sebagai penjualan. Nilai diskon adalah potongan pelanggan, bukan komisi/pencairan Mitra; ketentuan komisi memerlukan keputusan produk tersendiri. Panel Owner menampilkan agregasi diskon terverifikasi dan omzet sesudah diskon per Mitra.
- Kode dan pilihan pelanggan saat ini memakai riwayat `AuditLog` yang sudah ada, sehingga pekerjaan ini tidak memerlukan migrasi schema. Perubahan akun, kode, dan harga harus dibatasi oleh validasi role/server serta pemeriksaan origin untuk mutasi.

### 8.3 WA Blast add-on

WA Blast bukan bagian dari Rp150.000 Digital Invitation.

Paket aktif:
- `WA_BLAST_50`;
- **50 credits = Rp75.000**;
- dapat dibeli berulang;
- credit menempel pada event yang dipilih;
- `Invitation.waBlastQuota` default **0** untuk event baru.

WA Blast add-on hanya boleh dibeli/digunakan pada event yang memenuhi rule entitlement yang ditentukan server.

### 8.4 Guestbook Digital

Guestbook Digital tetap produk/service onsite terpisah untuk QR check-in, Usher App, device, dan event-day support.

Paket `GUESTBOOK_DIGITAL` **sudah mencakup entitlement Undangan Digital untuk acara yang sama** tanpa biaya paket Digital terpisah; pembelian untuk acara lain tetap event-scoped. Penawaran marketing mencakup undangan personal yang dikirim manual, revisi desain sebelum publikasi, RSVP/QR tamu, sapaan personal, musik, dasbor, angpao digital, file QR undangan, pengaturan meja/kursi, dua tablet, modem, kru teknis, durasi operasional empat jam, dan dukungan pelanggan 24 jam. Pembagian undangan menurut kelompok tamu, daftar hadiah, serta cetak QR fisik dibicarakan bersama tim sebagai layanan manual; **jangan menyajikannya sebagai kontrol otomatis di Dashboard atau fitur aplikasi yang sudah selesai**. Copy paket membedakan QR undangan yang dapat diunduh dari QR akses tamu dan QR angpao yang perlu disiapkan untuk cetak. Harga paket tetap berasal dari katalog aktif, tanpa perubahan entitlement, checkout, atau harga pada pekerjaan copy ini.

Harga legacy yang pernah tertulis di PRD lama **bukan source of truth**. Jangan hardcode harga Guestbook hanya berdasarkan histori lama; package catalog/keputusan produk terbaru yang berlaku.

### 8.5 Event Planner

Event Planner adalah consultation service, bukan fixed-price SaaS package pada requirement saat ini.

Canonical route: `/event-planner`.

Legacy `/wedding-planner` tetap redirect compatibility.

Layanan konsultasi:
- Wedding Organizer;
- Wedding Planner;
- Silver / Golden Wedding;
- Baby Shower.

CTA: **Konsultasi** ke WhatsApp `+62 821-2478-6516`.

---

## 9. Guest Ecosystem, RSVP & Personal Invitation

### 9.1 Event-scoped guest data

Guest, RSVP, QR, check-in, table, seating, dan personal invitation harus terikat ke `Invitation.id` yang tepat.

Public RSVP menulis guest ke event yang sedang dibuka, bukan global/default event.

Jika belum ada configured event, workspace menampilkan pesan seperti:

**“Silakan buat rangkaian acara dulu.”**

### 9.2 RSVP

**Gambar tiket pada dashboard dan Usher (4 Oktober 2026):** Gambar/pratinjau tiket memakai `GET /api/usher/qr` same-origin dengan encoder `qrcode` di server. Handler memverifikasi token HMAC existing, sesi pemilik event, ownership guest lewat event, serta entitlement Digital Invitation atau explicit owner grant yang sama dengan POST penerbitan tiket. Gambar PNG 640px mempunyai quiet zone 4, private/no-store dan no-referrer; URL atau token tidak dikirim ke renderer QR pihak ketiga. Penerbitan/token check-in tidak berubah. Pemilik tetap dapat menyiapkan tiket tamu pending/event draft sesuai flow existing; unduhan RSVP publik mempertahankan gate terbit, pembayaran dan hadir yang lebih ketat.

**Konfirmasi di halaman undangan — Gratis, aktif otomatis (24 September 2026):** Setiap RSVP yang berhasil disimpan ke canonical `Guest` otomatis mendapat konfirmasi, tanpa pengiriman WhatsApp atau biaya konfirmasi tambahan. Status hadir menampilkan “Terima kasih, [Nama Tamu]” (Title Case tampilan) dan “Kehadiran Anda telah berhasil dikonfirmasi. Kami menantikan kehadiran Anda di hari istimewa kami.” Tidak hadir dan tentatif menggunakan pesan sesuai status, tanpa tiket check-in. Tamu hadir mendapat tautan **Unduh QR Code** berupa PNG berisi token bertanda tangan yang berlaku untuk identitas tamu/acara yang sama; generator berjalan di server sendiri, tidak mengirim token ke layanan QR eksternal. Endpoint memverifikasi signature, acara terbit dengan entitlement valid, dan status hadir sebelum mengeluarkan gambar. RSVP yang sudah tersimpan tetap dikonfirmasi meski konfigurasi QR belum tersedia. Workspace RSVP pemilik memuat ulang data setiap 10 detik saat tab terlihat dan ketika kembali fokus; ini polling, bukan realtime WebSocket. Tidak mengubah toggle visibilitas bagian RSVP atau entitlement undangan existing.

Per event mendukung:
- RSVP status;
- attending/not attending/tentative;
- pax / plus one;
- check-in state;
- QR;
- table;
- CSV export.

CSV export dapat menggunakan nama `dc-organizer-rsvp.csv`.

### 9.3 Personal Invitation

Personal Invitation menggunakan `Guest` sebagai identity source.

Per event mendukung:
- pilih guest existing;
- buat guest baru;
- generate personal token;
- preview;
- edit name/phone;
- publish/unpublish personal link;
- enable/change/disable password;
- personal view count.

API Personal Invitation wajib menerima explicit `invitationId` dan memvalidasi:
- authenticated user;
- ownership/permission;
- configured event;
- entitlement yang diperlukan.

Tidak ada fallback ke first WEDDING event.

Personal public URL menggunakan event slug + personal token.

### 9.4 Guest Category & Tags — P1

Guest harus mendukung:
- category;
- multiple tags;
- custom category/tag;
- edit dan bulk assign;
- filtering di Guest List;
- filtering di Seating Chart;
- filtering saat Invitation Distribution / WA Blast.

Contoh category:
- VVIP;
- VIP;
- Family Groom;
- Family Bride;
- Friends;
- Office;
- Vendor;
- Other.

Acceptance:
- satu guest dapat memiliki category + beberapa tags;
- filter dan bulk update bekerja;
- category/tag tersedia lintas guest/seating/distribution workflow.

### 9.5 Public RSVP Rate Limiting — P0

`POST /api/invite/[slug]/rsvp` wajib memiliki server-side anti-spam/rate limiting.

Target policy awal:
- kombinasi IP + slug + guest/token bila tersedia;
- contoh maksimum 5 attempt/minute/IP;
- over-limit → HTTP `429`;
- optional honeypot / Turnstile / CAPTCHA;
- duplicate submission detection;
- spam/failure dapat dicatat untuk monitoring.

Redis/Upstash Redis/Vercel-KV-compatible storage dapat digunakan.

---

## 10. Seating & Guest Placement

Seating adalah event-scoped dan server-authoritative.

Requirements:
- table milik event aktif harus divalidasi;
- max 100 table per event;
- capacity 1–50 seat per table;
- shape minimal `ROUND`, `RECTANGLE`, `SQUARE`;
- `Guest.seatNumber` nullable;
- kombinasi table + seat harus collision-safe/unique;
- seat assignment dan swap harus atomic;
- target guest dan target table harus memiliki `invitationId` yang sama;
- table full mengembalikan conflict response (HTTP `409`);
- seating roster menerima guest manual atau RSVP eligible/attending sesuai rule produk.

Saat user mengganti event, local seating state harus di-reset agar data event lama tidak tercampur.

---

## 11. WA Blast

### 11.1 Existing product behavior

WA Blast bersifat event-scoped.

Workspace harus mendukung:
- memilih event aktif;
- memilih guest existing;
- input guest baru + WhatsApp number;
- recipient queue;
- selected / remaining quota;
- menghapus recipient dari queue;
- persistent queue/database state.

API key provider tidak boleh dikirim ke frontend.

### 11.1a Template pesan per acara (komponen yang sudah ada di source)

Pengelola acara dapat menyimpan, mengedit dan menghapus template pesan WA Blast per event untuk undangan, pengingat RSVP, pengingat hari acara, dan ucapan terima kasih, memakai `WaBlastTemplate` serta satu sumber data event/tamu. Pesan dapat memuat placeholder terkontrol seperti nama, acara, tanggal, lokasi dan tautan; preview memakai data penerima aktual atau label contoh yang jelas, bukan informasi pelanggan fiktif. **Menyusun, menyalin, atau melihat preview bukan pengiriman massal** dan tidak mengurangi kuota. Tautan undangan publik hanya ditampilkan untuk disalin bila undangan sudah terbit. Pengiriman massal, provider dan penjadwalan backend mengikuti status implementasi serta persyaratan terpisah §11.2, bukan dianggap selesai karena form template pesan tersedia.

### 11.2 Provider integration — P1

Delivery provider nyata masih menjadi integration requirement.

Target provider options:
- Fonnte;
- Wablas;
- Twilio / WhatsApp Business API sebagai alternatif.

Gunakan abstraction seperti `WhatsAppProvider`:
- `sendMessage()`;
- `sendTemplate()`;
- `checkStatus()`;
- `getBalance()`.

Delivery status minimal:
- queued;
- processing;
- sent;
- delivered;
- read;
- failed.

Failed delivery harus dapat diretry dan status disimpan.

### 11.3 WA Blast Top-Up — P2

Tambahan quota dapat dicatat melalui entity seperti `WhatsAppCreditTransaction`:
- `userId`;
- event/invitation context bila diperlukan;
- `quantity`;
- `amount`;
- `type`;
- `paymentId`;
- `status`.

Successful payment menambah quota secara server-authoritative.

---

## 12. Guestbook & Onsite Operations

### 12.1 Usher App

Usher/check-in harus selalu explicit event-scoped. Jangan menggunakan implicit “first paid event” ketika account memiliki beberapa event.

Current onsite capabilities dapat mencakup:
- guest search;
- QR scan;
- manual check-in;
- table information;
- server-authoritative check-in state.

### 12.2 Offline-First Usher — P1 / Critical Onsite

Gunakan IndexedDB untuk critical offline cache; LocalStorage hanya untuk non-critical state.

Local data minimal:
- guest ID;
- guest name;
- QR identifier;
- table assignment;
- check-in status.

Offline flow:
1. QR tetap dapat discan.
2. Guest dapat dicari dari local cache.
3. Check-in masuk pending queue.
4. UI menunjukkan `Offline`.
5. Queue otomatis sync saat online.
6. Conflict resolution mendeteksi duplicate check-in lintas device.

Suggested pending fields:
- `guestId`;
- `deviceId`;
- `checkedInAt`;
- `syncStatus`;
- `retryCount`.

### 12.3 Live Guestbook Wall — P2

Route target:

`/event/[slug]/guestbook-wall`

Wall menampilkan realtime:
- guest name;
- message;
- submitted time;
- optional avatar/photo;
- transition/animation.

Admin moderation:
- approve;
- hide;
- delete;
- optional `autoApproveGuestbook`.

Transport dapat menggunakan WebSocket, SSE, atau realtime provider.

### 12.4 Thermal Label / Wristband Printing — P3

Setelah check-in sukses, Usher dapat memiliki action `Print Label`.

Label dapat memuat:
- guest name;
- category;
- table number;
- QR/guest ID.

Target: Bluetooth/browser-compatible thermal printer.

Printer failure tidak boleh memblokir check-in berikutnya.

---

## 13. Digital Gift / Cashless Angpao — P2

Public Invitation dapat menyediakan optional `Digital Gift`.

Metode:
- bank transfer;
- QRIS;
- payment gateway.

Potential provider:
- Midtrans;
- Xendit.

Data transaksi gift harus terpisah dari billing Undara.

Suggested `DigitalGiftTransaction`:
- `id`;
- `invitationId`;
- nullable `guestId`;
- `provider`;
- `paymentMethod`;
- `amount`;
- `status`;
- `externalTransactionId`;
- `createdAt`;
- `paidAt`.

Owner dapat enable/disable gift. Webhook/callback memperbarui status. Payment secret/sensitive info tidak boleh terekspos melalui unauthenticated API.

---

## 14. Security & Data Compliance

### 14.1 Authorization

Seluruh sensitive mutation memerlukan server-side authentication + ownership/permission checks.

Entitlement, role, guest/event scope, payment, publish, seating, dan check-in tidak boleh hanya bergantung pada UI state.

### 14.2 Sensitive data

- Password disimpan sebagai hash, bukan plaintext.
- Personal invitation password hash tidak boleh muncul dalam normal guest API response.
- Provider secret/API keys hanya server-side.
- Payment/gift callback harus divalidasi sesuai provider.

### 14.3 Data Retention — P2

Event menggunakan `eventDate` sebagai lifecycle anchor.

Baseline target:
- 0–12 bulan setelah event → event/asset tetap tersedia;
- setelah periode retention → event dapat menjadi `ARCHIVED`;
- cleanup dapat mencakup original unused media, temporary asset, dan generated cache.

Data penting seperti guest list, RSVP, guestbook, dan financial transaction tidak boleh blindly deleted bersama media.

Suggested fields:
- `archivedAt`;
- `scheduledDeletionAt`;
- `retentionStatus`.

User harus menerima warning sebelum permanent deletion. Financial record mengikuti retention policy terpisah. Premium package dapat menawarkan retention lebih panjang.

---

## 15. Design System & UX Rules

### 15.1 Sumber visual

- Jangan menjadikan PRD sebagai tempat menyimpan hex color, font stack, shadow, radius, atau ukuran dekorasi yang mudah berubah.
- Semantic theme tokens di `app/globals.css`, shared primitives, `BrandWordmark`, dan komponen layout aktif adalah implementation source untuk detail tersebut.
- Gunakan komponen bersama sebelum membuat variasi visual baru per halaman.
- Invitation artwork tetap scoped ke template dan tidak dipaksa mengikuti palette application shell.

### 15.2 Typography & copy

- Heading, body, metadata, dan control typography harus konsisten melalui token/font utility aktif; jangan hardcode font berbeda per page tanpa alasan desain yang jelas.
- Visible standalone UI names memakai **Title Case** sesuai bahasa, sambil mempertahankan acronym/brand resmi seperti `Undara`, `RSVP`, `VIP`, dan `WhatsApp`.
- Nilai database tidak diubah hanya demi kapitalisasi tampilan.
- Customer-facing copy pendek, kontekstual, dan tidak mengulang kata workspace/acara/undangan tanpa kebutuhan.
- Decorative sequence numbering tidak digunakan sebagai filler. Angka nyata untuk tanggal, waktu, harga, jumlah, kapasitas, quota, urutan anak, metric, atau step proses tetap diperbolehkan.

### 15.3 Controls

- CTA/action memakai shared `components/ui/button.tsx` dan semantic primary tokens.
- Input/filter/dropdown mengikuti shared control geometry dan focus state.
- Jangan membuat button system baru per halaman.
- Icon-only, navbar, theme/language control, dan artwork template boleh memiliki treatment khusus selama tetap konsisten dan accessible.

### 15.4 Layout & surfaces

- Marketing memakai shared framed shell dengan navbar/footer bersama dan scroll area internal yang sudah ada di source.
- Dashboard memakai satu mainframe dan panel besar; hindari frame di dalam frame serta tumpukan mini-card dekoratif.
- Public page mengutamakan komposisi editorial, whitespace, hierarchy, asymmetry terkontrol, dan media/ornament yang menyatu dengan layout.
- Section heading pada marketing harus terbaca tegas dalam satu kali scan: judul utama section memakai display heading yang lebih berat/bold, sementara kicker dan body tetap lebih ringan. Jangan membuat semua level teks memiliki bobot visual yang sama.
- Garis tipis berulang sebagai pembatas dekoratif di marketing **tidak digunakan**. Gunakan spacing, perubahan komposisi, surface, atau ornament organik bila section perlu dipisahkan.
- Layout desktop boleh lebih ekspresif; mobile harus kembali ke flow sederhana tanpa overflow horizontal.

### 15.5 Woodland / forest language

- Global marketing atmosphere mengikuti §1.2: forest silhouette, canopy, branch, leaves, engraved vine, fog, dan glow lembut.
- **Bunga besar dan legacy petals tidak dipakai sebagai ambience global.**
- Falling leaves boleh digunakan secara restrained jika tidak mengganggu interaksi dan motion preference.
- Ornamen sudut kanan atas marketing diarahkan ke **premium engraved vine / sulur organik**, bukan bouquet/floral cluster.
- Home boleh lebih imersif; service, catalog, help, dan legal pages memakai treatment lebih tipis supaya konten tetap dominan.
- Motion harus tenang dan purposeful. Respect `prefers-reduced-motion`.

### 15.6 Pintu

- Homepage mempertahankan konsep empat Pintu layanan dan transisi masuk yang sudah aktif.
- Geometry, camera, orbit, opening behavior, dan navigation hanya diubah bila owner meminta secara eksplisit.
- Pintu harus terasa bagian dari dunia woodland Undara, bukan elemen floral/Rose lama.

### 15.7 User-facing copy

- Default locale adalah Bahasa Indonesia, dengan English melalui shared language state.
- Marketing, Dashboard, Studio, template controls, dan published invitation mengikuti locale aktif sesuai capability masing-masing.
- Brand customer-facing selalu **Undara**.

## 16. Public Marketing & Product Terminology

Digital Invitation marketing harus memakai general-event language, bukan wedding-only language.

Marketing minimum menjelaskan:
- Rp150.000 per event;
- 1 event = 1 digital invitation = 1 saved template/design;
- event dapat dibuat tanpa limit 3;
- payment event-scoped;
- payment diperlukan pada Publish;
- RSVP + guest management termasuk Digital Invitation sesuai feature set;
- WA Blast adalah add-on terpisah.

Guestbook marketing juga harus event-oriented.

### 16.0a Kontinuitas background dan tipografi marketing — 29 September 2026

Seluruh route marketing framed (`/d-invitation`, `/event-planner`, `/guestbook`, `/undangan-fisik`, `/template-design`, `/help`, serta halaman publik lain yang memakai atmosfer bersama) menggunakan dua aset hutan khusus Light/Dark dari `EventPlannerBotanicalAtmosphere`. Detail hutan lembut berada di tepi; area tengah lapang dan rendah kontras agar heading, teks, CTA, dan kartu mudah dibaca. Aset memudar sebelum header/footer dan tetap terlihat di dalam mainframe sekaligus menyambung ke sisi luarnya. Jangan menumpuk radial glow, semak, daun jatuh, atau ranting panjang pada latar ini maupun pada section halaman marketing; warna Champagne tetap boleh dipakai pada teks/kontrol sesuai tema. Hanya panel `main` yang menggulir; bingkai tetap jelas. Homepage tetap memakai woodland khusus yang sudah disetujui.

Katalog dan seluruh chrome halaman marketing memakai shared typography tokens aktif; karya di dalam preview template tetap memakai font tema masing-masing. Copy produk, email, unduhan QR, dan dokumen baru memakai nama Undara. Nomor invoice lama serta ID teknis `dc-*` tetap dibaca untuk kompatibilitas; invoice baru memakai awalan `UND-`.

### 16.1 Guestbook dan Undangan Fisik — main frame marketing

Halaman `/guestbook` dan `/undangan-fisik` menggunakan komposisi frame viewport yang sudah disetujui pada `/d-invitation` dan `/event-planner`: bingkai Rose responsif ±90vw; navbar embedded tetap di atas, footer compact embedded berisi player musik persisten serta Instagram tetap di bawah, hanya `main` di tengah yang scroll. Dekorasi ornament legacy dan Rose glow memakai **satu** `PublicMarketingAtmosphere` per route di dalam scene, bukan overlay dekorasi global tambahan. Semua konten memakai satu lebar tengah 88% mobile / 80vw mulai sm, `max-w-[1100px]`, dengan gap antarsection 80px mobile / 96px desktop. Global `PublicAtmosphere`, `PublicContent`, Navbar, Footer serta `MarketingFloatingControls` harus mengecualikan kedua framed route ini agar tidak menumpuk background, footer, navbar atau kontrol audio/Instagram.

Pakai `ScrollReveal` berbasis panel scroll internal untuk opacity/translateY per section (`once:false`) dan `MarketingTextReveal` untuk animasi ulang teks hanya setelah keluar dari viewport panel lalu masuk kembali, dari arah scroll mana pun; kendali interaktif, animasi `prefers-reduced-motion` dan keyboard tetap berfungsi. Visual kartu mengikuti shared marketing surface, control geometry, dan typography tokens aktif. Pertahankan data fitur/check-in, review/FAQ/paket dan tautan pada Guestbook; pada Undangan Fisik pertahankan ilustrasi cetak, proses pemesanan, target anchor `#proses` / `#konsultasi` di dalam scroll panel serta tautan WhatsApp dan Digital Invitation. Kedua route tetap bisa dikunjungi dari widget Pintu kiri. Jangan mengubah konten, pintu landing, Dashboard atau undangan tamu.

**Model pemesanan Undangan Fisik (30 September 2026; koreksi owner):** Undangan cetak yang **digabung dengan Undangan Digital** boleh dipesan secara satuan sesuai kebutuhan, termasuk satu buah. Undangan fisik yang dipesan **terpisah** dari Undangan Digital atau sebagai produksi **bulk custom** memiliki minimum order **300 pcs**. Tidak ada harga tetap yang ditampilkan: penawaran bergantung terutama pada tingkat kesulitan desain dan spesifikasi cetak yang disepakati melalui konsultasi. Halaman `/undangan-fisik` menjelaskan kedua jalur ini dalam ID/EN dan mengarahkan pengunjung ke Undangan Digital atau WhatsApp. Tidak menyiratkan kalkulator harga, checkout satuan mandiri, atau janji produksi sebelum spesifikasi disepakati. Ketentuan ini menggantikan larangan mengubah konten Undangan Fisik pada paragraf lama di atas.

Menu burger publik menampilkan **Undangan Fisik / Printed Invitation** di dalam submenu Layanan, di samping layanan marketing lain, dengan tautan langsung ke `/undangan-fisik` dan label mengikuti bahasa ID/EN.

Copy halaman marketing berbahasa Indonesia memakai padanan Indonesia untuk istilah umum seperti pemindaian, kehadiran, tempat duduk, lokasi, anggaran, dan sentuhan akhir. Nama layanan/fitur yang memang merupakan identitas produk seperti Undara, RSVP, WhatsApp, Studio, dan WA Blast dapat dipertahankan. Paket Buku Tamu Digital dan FAQ publik harus konsisten menyebut Undangan Digital termasuk untuk acara yang sama.


---

## 17. Key API / Server Contracts

### Invitation/Event API

`POST /api/invitations`
- membuat configured event ketika form valid;
- dapat reuse legacy blank draft yang aman;
- tidak membuat event kosong hanya karena user membuka form;
- untuk WEDDING dapat menerima empat optional parent identity fields dan menyimpannya event-scoped.

`PUT /api/invitations`
- update event/design;
- mempertahankan/update optional wedding parent identity;
- publish guard memeriksa configured state, template, data minimum, dan payment entitlement.

Jika Prisma mendeteksi table/column production belum sinkron (`P2021`/`P2022`), API invitation harus mengembalikan error operasional yang dapat ditindaklanjuti, bukan hanya generic save error. Raw database detail tetap tidak boleh diekspos ke user.

### Guest/RSVP

Guest read/write harus menerima event scope yang jelas dan memverifikasi ownership/permission.

### Personal Invitation

GET/POST/PATCH membutuhkan explicit `invitationId`.

### Seating

Table/seat mutation harus memverifikasi event ownership/scope dan collision.

### Usher

QR/manual check-in harus resolve guest + invitation secara konsisten dan tidak cross-event.

### Public renderer

Tidak merender final invitation tanpa configured + saved template + published + paid state.

---

## 18. Implementation Priority

### P0 — Security Foundation
- Public RSVP rate limiting / anti-spam.

### P1 — Core Operational
- Guest Category & Tags.
- Offline-First Usher.
- WhatsApp gateway/provider integration.
- Multi-user / Event Organizer access.
- Explicit event selector/context untuk seluruh Usher flow.

### P2 — Product Expansion
- Digital Gift / QRIS.
- Live Guestbook Wall.
- WA Blast top-up transaction layer.
- Data Retention Policy.
- private/signed premium template asset delivery.

### P3 — Advanced Onsite Hardware
- Bluetooth thermal name label / wristband printing.

---

## 19. Compatibility & Known Technical Debt

Current compatibility debt yang boleh dipertahankan sementara tetapi tidak boleh menjadi arah produk baru:
- `InvitationType.WEDDING` / `ADAT_AKAD`;
- `groomName` / `brideName`;
- `weddingHashtag`;
- `ceremonyTime` / `receptionTime` naming;
- fallback root domain `dcwedding.com`;
- historical blank invitation draft rows;
- some legacy route aliases.

Target migration harus dilakukan terencana agar existing invitation tidak rusak.

Additional known work:
- final domain migration belum ditetapkan;
- WA provider nyata belum dianggap delivered sampai integration + delivery status benar-benar tervalidasi;
- premium template master-asset privacy perlu private storage bila ingin proteksi lebih kuat;
- production migration execution harus diverifikasi per deployment; source migration file dan successful `pnpm build` saja tidak membuktikan DB production sudah migrated;
- seluruh template renderer baru wajib membaca section visibility/configuration yang sama dengan Studio; renderer legacy yang belum mengikuti contract ini harus dimigrasikan sebelum dianggap production-ready.

---

## 20. Definition of Done

Sebuah feature dianggap selesai hanya jika, sesuai scope feature tersebut:
- requirement product terpenuhi tanpa menghidupkan kembali rule yang sudah superseded;
- data disimpan di PostgreSQL/Prisma bila persistent;
- event isolation terjaga;
- server-side authorization/entitlement diterapkan;
- UI menggunakan design system/canonical Button;
- empty/loading/error/success state tersedia;
- tidak ada mock production data;
- accessibility dasar dan responsive behavior tetap terjaga;
- relevant build/type validation dijalankan/diamati sebelum diklaim PASS;
- perubahan material dicatat dalam Appendix A di `prd.md` dengan affected files, commit, dan validation status.

### Critical end-to-end acceptance

Minimal canonical Digital Invitation journey harus bekerja:

`Tambah acara → input acara (WEDDING dapat mengisi parent identity opsional) → dd/mm/yyyy date dengan calendar picker + waktu 24 jam HH:mm → Simpan acara → database event configured → Buat undangan → parent line otomatis tersedia di preview/template jika diisi → pilih template → canvas berubah mengikuti template → atur section RSVP/Wishes/Gift sesuai kebutuhan → edit → Simpan desain → Publish → unpaid diarahkan ke paket event → payment aktif → Publish sukses → public invitation dapat dibuka.`

Public route harus tetap menolak event yang belum configured, belum menyimpan template, belum published, atau belum memiliki valid event-scoped entitlement.

Untuk deployment yang membawa migration baru, end-to-end persistence baru dianggap siap di environment target setelah `prisma migrate deploy` / `pnpm db:deploy` berhasil diterapkan pada database target. Build CI tidak menggantikan langkah ini.

---

## 21. Documentation Governance

**Satu PRD aktif: `prd.md`.** Badan utama (§1–§21) berisi keputusan produk yang berlaku; Appendix A hanya jejak historis dan bukti implementasi, **bukan daftar perintah untuk coding**. Bila keputusan baru mengganti keputusan lama, perbarui satu pasal di badan utama dan pindahkan alasan/perubahannya ke histori. Jangan menumpuk aturan lama dan baru dalam badan utama dengan label "terbaru" tanpa mengganti rumusan lama.

### 21.1 Hierarki sumber dan status dokumen

| Dokumen | Fungsi dan status | Jika ditemukan konflik |
| --- | --- | --- |
| `prd.md` §1–§21 | **Satu-satunya persyaratan produk aktif** (termasuk keputusan terbaru yang sudah disepakati). | Perbarui pasal yang benar, bukan tambah PRD baru. |
| `AGENTS.md` | Aturan kerja dan engineering global; hanya ringkasan prinsip lintas fitur, bukan catatan setiap iterasi UI. | Harus mengikuti `prd.md` untuk keputusan produk. |
| `template.md`, `studio.md` | Panduan implementasi khusus domain; menjelaskan *cara* memenuhi kontrak PRD. | Persyaratan produk yang berubah wajib diperbarui dahulu di `prd.md`, lalu sinkronkan panduan terkait. |
| `README.md` | Orientasi repo dan petunjuk menjalankan aplikasi; **bukan** PRD/changelog kedua. | Ringkaskan dan tautkan ke PRD; petunjuk teknis harus cocok dengan source nyata. |
| `checklist.md` | Daftar pemeriksaan rilis dan hasil QA bertanggal, **bukan** bukti fitur selesai hanya karena checklist tercentang lama. | Revalidasi terhadap source dan lingkungan target; jangan salin checkbox lama sebagai status terbaru. |
| `dashboard-redesign-history.md` | Jurnal tahapan desain Dashboard; bukan PRD produk aktif. | Ambil keputusan aktif dari §6 dan §15; jurnal tidak boleh menimpa PRD. |
| Arsip Git dari `prd-tambahan.md`, `prd-landing.md`, `prdpaging.md`, `pintu3d.md` | File lama dihapus dari branch aktif setelah audit domain awal; referensi lengkap tersimpan di commit GitHub yang tercantum pada Appendix A. | Jangan gunakan rancangan yang tidak disetujui atau milestone historis sebagai aturan aktif; pakai §6, §7, §11 dan §15 PRD yang berlaku. |
| Appendix A dalam `prd.md` | Riwayat tanggal, keputusan, commit, dan validasi; dapat memuat istilah/versi lama. | Tidak dipakai sebagai rule aktif dan tidak menimpa badan utama. |

Dokumen baru `prd1.md`, `prdnew.md`, `PRD2.md` dan sejenisnya tidak boleh dibuat. Empat dokumen landing/delta/Pintu legacy sudah diaudit dan dihapus dari branch aktif pada konsolidasi ini; jangan membuatnya kembali. Semua perubahan produk selanjutnya harus dimasukkan ke pasal kanonik PRD dan perubahan material dicatat di Appendix A. Untuk membaca detail versi lama gunakan permalink GitHub pada Appendix A, bukan memulihkan rulebook paralel.

### 21.2 Urutan saat ada aturan tumpang tindih

1. Periksa keputusan owner paling baru yang **sudah tercatat dan berlaku** pada pasal produk terkait; tandai rumusan sebelumnya sebagai superseded, bukan menggabungkan dua pilihan yang bertolak belakang.
2. Bedakan target/requirement, implementasi yang benar-benar ada dalam source, dan validasi yang benar-benar telah dijalankan. Klaim historis `PASS` tidak otomatis berlaku bagi commit, database, atau environment terkini.
3. Spesifikasi template atau Studio membatasi **cara visual/teknis**, tidak boleh melemahkan otorisasi server, kepemilikan event, entitlement, RSVP, dan kontrak komponen bersama.
4. Perubahan yang berdampak pada banyak fitur harus mencantumkan komponen/source of truth, kompatibilitas data lama, target mobile/desktop, dan penerimaan QA; jangan menduplikasi model/API hanya untuk menyamakan penampilan.

### 21.3 Tahapan pembenahan dokumentasi (audit 24 September 2026)

- **Tahap 1 — Tata kelola dan tautan [pemeriksaan awal selesai untuk 11 dokumen utama teridentifikasi]:** status dokumen, rujukan `prd1.md` yang sudah tidak ada, heading ganda, lokasi pasal, referensi landing, jumlah tema dalam registry, dan status Wishes yang usang telah ditangani. Ini **bukan** bukti seluruh berkas Markdown di subfolder sudah terinventarisasi atau bahwa semua kontradiksi isi sudah hilang.
- **Tahap 2 — Perbandingan lintas-dokumen per domain:** landing/Pintu, Dashboard, template/Studio, tamu/RSVP, pembayaran/entitlement, security/deployment. Untuk setiap domain: matriks keputusan aktif vs legacy vs implementasi vs pending QA, lalu pindahkan rumusan unik yang masih relevan ke satu pasal PRD.
- **Tahap 3 — Pemadatan aturan:** ringkas AGENTS menjadi engineering guardrails; README menjadi onboarding; pindahkan rincian historis berulang dari badan utama ke ringkasan Appendix A atau arsip Git (jangan hilangkan bukti commit).
- **Tahap 4 — Penutupan:** penghapusan empat sumber historis landing/delta/Pintu selesai sebagai pembersihan terlingkup setelah audit keputusan aktif, referensi dan arsip Git. Audit semua Markdown di subfolder, seluruh rujukan silang, status produk dan QA lintas domain **masih perlu dilanjutkan** sebelum menyatakan konsolidasi repo sepenuhnya selesai.

**Aturan perubahan berikutnya:** edit pasal produk kanonik terlebih dahulu; perbarui hanya panduan domain yang terdampak; catat perubahan material dan validasi yang benar-benar diamati pada Appendix A. Jangan melaporkan build, CI, migrasi atau browser PASS hanya berdasarkan perubahan Markdown.
---

# Appendix A — Implementation History

Appendix ini hanya menyimpan **ringkasan keputusan yang masih membantu memahami state produk sekarang**. Eksperimen visual lama, rebrand bertahap, palet/font yang sudah superseded, route lab, iterasi floral/Rose, dan log commit harian tidak lagi disalin ke PRD; detail tersebut tetap tersedia melalui Git history.

## 28–30 September 2026 — Canonical Undara state

- Brand customer-facing dikonsolidasikan menjadi **Undara**; nama brand lama tidak boleh kembali ke surface baru.
- Landing diarahkan ke **woodland / forest editorial**: forest silhouette, canopy, branch, leaves, fog/glow, fireflies, dan ornament organik. Floral cluster dan rose-petal ambience global dipensiunkan.
- Shared marketing frame/footer/audio/social atmosphere dipakai lintas halaman publik.
- Event Planner menjadi benchmark art direction marketing; service pages lain mengikuti bahasa editorial yang sama tanpa harus menyalin layout persis.
- Marketing pages mendapat rhythm/asymmetry yang lebih editorial; legal pages ikut shared framed marketing shell.
- Full template catalog mendapat stagger desktop yang halus tanpa mengganggu hover interaction.
- ID/EN diperluas ke marketing/catalog dan invitation publishing flow.
- Studio terus bergerak ke object-based editing untuk Amplop dan section Isi, sementara Save tetap di Studio dan Publish dikendalikan dari Dashboard.
- Sapaan Personal Invitation pada Amplop terhubung ke data tamu dan mendukung ID/EN.
- Theme preference Light/Dark persisten setelah refresh.
- Design workflow menggunakan source canonical PRD/AGENTS/scoped docs lebih dulu, lalu prinsip design-quality eksternal bila tersedia.

## 30 September 2026 — PRD cleanup & woodland direction

**Rationale:** PRD telah menumpuk ribuan baris histori desain yang sudah tidak berlaku dan mengandung beberapa identitas lama, aturan Rose/pink, detail font/palet yang saling supersede, serta eksperimen floral/Pintu. Owner meminta dokumen aktif dibersihkan agar keputusan sekarang lebih mudah diikuti.

- Repository reference dikoreksi menjadi `wanzy0808/Undara`.
- Brand contract dipadatkan: customer-facing hanya Undara; exact legacy identifiers hanya compatibility detail.
- Hex color dan nama font tidak lagi menjadi kontrak PRD. Detail implementasi mengikuti semantic theme tokens dan shared brand components di source.
- Canonical public art direction ditegaskan sebagai **woodland / forest editorial**.
- Bunga besar, floral cluster, dan rose-petal ambience dipensiunkan sebagai bahasa visual global; premium engraved vine/sulur, branch, canopy, leaves, fog, dan subtle glow menjadi motif yang dianjurkan.
- Dark Mode boleh menambahkan lampion-lampion kecil yang tersembunyi di kedalaman woodland dengan glow hangat dan kepadatan rendah; Light Mode tetap tanpa kewajiban lampion.
- Design System §15 ditulis ulang agar durable dan tidak mengunci detail kosmetik yang mudah berubah.
- Appendix lama yang sangat panjang dipadatkan. Git history tetap menjadi sumber histori implementasi rinci.

**Area:** `prd.md`.

**Validation:** documentation/source consistency review; tidak ada perubahan runtime pada langkah ini.


## 30 September 2026 — Design skill orchestration & dark woodland lanterns

- Dark Mode woodland boleh memiliki lampion kecil yang jarang dan redup di kedalaman hutan; treatment bersifat background-only dan tidak boleh berubah menjadi festival/string-light visual.
- Repo menambahkan `.agents/skills/undara-design/SKILL.md` sebagai orchestrator lokal untuk design work.
- `AGENTS.md` sekarang mewajibkan design task mengecek global/installed skills dan Library/shared resources sebelum membuat sistem baru.
- Stack desain yang dipin: GPT Taste (`gpt-taste`), Emil Design Engineering + animation skills, dan Impeccable.
- Jika skill global tidak diekspos runtime, agent wajib membaca upstream `SKILL.md` yang dipin di orchestrator dan tidak boleh mengklaim skill tersebut dieksekusi.
- Impeccable tidak dicopy parsial ke repo karena skill tersebut bergantung pada reference/scripts lain; repo menyimpan orchestration + upstream path, sementara instalasi global lengkap tetap menjadi preferred runtime source.

**Area:** `prd.md`, `AGENTS.md`, `.agents/skills/undara-design/SKILL.md`.

**Commits:** `9867802`, `b93403c`, `b8053bd`.

**Validation:** upstream skill paths diverifikasi terhadap repositori publik resmi; CI repository diperiksa terpisah.


## 30 September 2026 — Event Planner service-section hierarchy

- Section layanan Event Planner diperjelas agar tidak terasa seperti dua kolom copy dengan bobot visual yang sama.
- `Apa yang bisa kamu tanyakan?` / `What can you ask about?` sekarang menjadi heading utama besar dan tebal.
- `Mulai dari layanan yang paling mendekati kebutuhan acaramu.` menjadi supporting heading kuat di kolom kanan, diikuti body explanation yang lebih ringan.
- Judul tiap layanan dinaikkan skala dan bobotnya agar alur baca kiri/kanan lebih mudah dipindai tanpa menambah kartu/dekorasi baru.
- Scope hanya hierarchy dan typography pada section tersebut; data package, CTA WhatsApp, routing, dan behavior tidak berubah.

**Area:** `app/event-planner/page.tsx`.

**Commit:** `d8627b8`.

**Validation:** source inspection complete; CI/build observed separately.


## 30 September 2026 — Global marketing heading hierarchy

- Ketebalan heading section Event Planner dijadikan baseline untuk framed marketing pages lain.
- Shared `.undara-marketing-section` sekarang memberi bobot tegas pada `h2` dan `h3`, sementara kicker/body tetap ringan agar hierarchy cepat terbaca.
- `.undara-marketing-display` juga dinaikkan ke bold untuk heading marketing yang memakai utility canonical.
- `components/Marketing/SectionHeading.tsx` diselaraskan agar FAQ dan shared section title mendapat hierarchy yang sama meski tidak selalu berada langsung di wrapper marketing.
- Hero/page title tidak dipaksa ke rule ini; tiap layanan tetap boleh mempertahankan art direction hero masing-masing.

**Area:** `app/globals.css`, `components/Marketing/SectionHeading.tsx`.

**Commits:** `fbb524d`, `7d149e1`.

**Validation:** source review complete; CI/build observed separately.


## 30 September 2026 — Event Planner layout-guard follow-up

- Heading utama pada section layanan Event Planner tetap mempertahankan hierarchy besar/tebal, tetapi batas lebar diubah dari `11ch` menjadi `13ch` agar memenuhi regression guard existing dan menghindari wrapping terlalu sempit.
- Perubahan ini tidak mengurangi rule global heading marketing pada commit sebelumnya.

**Area:** `app/event-planner/page.tsx`.

**Commit:** `2a951f6`.

**Validation:** regression guard penyebab failure telah diidentifikasi dari GitHub Actions log; rerun CI diperiksa terpisah.

## 30 September 2026 — Opsi satuan dan custom Undangan Fisik

**Permintaan owner:** tambah isi halaman Undangan Fisik agar model pesanannya jelas: cetak satuan tersedia bila digabung dengan Undangan Digital; pesanan terpisah atau bulk custom minimal 300 pcs; harga bergantung pada kesulitan desain dan dibicarakan saat konsultasi.

**Implementasi:** hero menyebut kedua jalur, satu section pilihan menjelaskan syarat jumlah dan mengarahkan ke Undangan Digital atau WhatsApp custom, tahap konsultasi meminta jenis pesanan, dan CTA akhir menjelaskan cara penawaran harga tanpa nominal yang dibuat-buat. Copy ID/EN serta prefilled WhatsApp diselaraskan. Aturan produk ditambahkan ke §16.1; tidak ada perubahan pada checkout, paket Digital Invitation, minimum order server, atau template undangan.

**Area/commit:** `app/undangan-fisik/page.tsx`, `prd.md` §16.1 dan Appendix A — commit perubahan ini.

**Validasi lokal:** ESLint, TypeScript, 225 tes regresi, `git diff --check`, dan build produksi lulus setelah rebase pada main terbaru. Build masih mencatat warning lama pada upload asset. QA visual browser lintas viewport belum dilakukan; tidak ada migrasi database.


## 30 September 2026 — Marketing heading consistency sweep

- Audit lintas marketing menemukan beberapa komponen masih memiliki `font-normal` eksplisit atau heading khusus di luar wrapper shared, sehingga rule global sebelumnya tidak selalu terlihat konsisten.
- Explicit section headings pada Digital Invitation, Event Planner, Guestbook, Package, Help, Terms, dan Undangan Fisik diselaraskan ke bobot bold yang sama.
- Hero utama, judul kartu template, dan judul di dalam mockup/preview tidak dipaksa mengikuti bobot section heading agar hierarchy internal tetap terjaga.
- Regression test baru menjaga agar section heading inti tidak kembali memakai `font-normal` dan shared marketing CSS tetap mengunci `h2/h3` ke bobot tegas.

**Area:** marketing components/pages terkait, `tests/marketing-polish.test.mjs`.

**Commits:** `c039e63`, `e87d618`, `bb6e414`, `2816dfe`, `0c420dd`, `9040aee`, `279df9f`, `d427e5f`, `701a33d`, `48a2c32`, `a3588f2`, `21fad9e`, `2ec1f0d`.

**Validation:** source sweep complete; CI observed separately.


## 30 September 2026 — Undangan Fisik di menu burger

**Permintaan owner:** halaman Undangan Fisik harus bisa dibuka dari menu burger publik.

**Implementasi:** tautan `/undangan-fisik` ditambahkan ke submenu Layanan dengan ikon amplop dan label ID/EN dari kamus navigasi. Aturan navigasi dicatat di §16.1.

**Area/commit:** `components/Layout/Navbar/BurgerMenuContent.tsx`, `lib/i18n.ts`, `prd.md` §16.1 dan Appendix A — commit perubahan ini.

**Validasi lokal:** ESLint pada file kode yang berubah, TypeScript, 28 tes marketing/repo, dan `git diff --check` lulus. Browser visual belum diverifikasi; tidak ada migrasi database.

## 30 September 2026 — Cakupan paket Buku Tamu dan copy marketing Indonesia

**Permintaan owner:** perluas daftar manfaat paket Buku Tamu Digital, tampilkan Undangan Digital gratis beserta tautan detail, dan rapikan bahasa Inggris yang masih muncul di copy marketing Indonesia.

**Implementasi:** katalog paket ID/EN, kartu paket dan tautan `/d-invitation`, FAQ Buku Tamu, FAQ Bantuan, serta copy layanan Digital, Fisik, Guestbook, dan Event Planner diselaraskan. Paket Guestbook sudah memberi akses Digital Invitation pada backend; copy lama yang menyebut pembelian tambahan dihapus. Manfaat yang membutuhkan penanganan manual dijelaskan sebagai bahan konsultasi, bukan kontrol aplikasi otomatis.

**Area/commit:** `lib/packages/catalog.ts`, `components/Marketing/PackageShowcase.tsx`, halaman dan sumber teks marketing terkait, `tests/event-planner-redesign.test.mjs`, `prd.md` §8.4 dan §16.1/Appendix A — commit perubahan ini.

**Validasi lokal:** ESLint pada file kode yang berubah, TypeScript, 225 tes regresi, `git diff --check`, dan build produksi lulus. Browser visual serta pemenuhan operasional layanan manual belum diverifikasi; tidak ada migrasi database.


## 30 September 2026 — Sambungan woodland landing melewati frame

**Permintaan owner:** hilangkan kesan latar hutan yang patah di sisi kiri/kanan landing; pertimbangkan background mengisi hingga luar frame.

**Implementasi:** lapisan woodland Light/Dark memakai lebar viewport, dengan pelembutan horizontal pada tepi layar. Fade vertikal, komposisi Pintu, navbar, footer, dan frame tidak diubah.

**Area/commit:** `components/Landing/LandingWoodlandAtmosphere.tsx`, `tests/repo-file-naming.test.mjs`, `prd.md` §1.2 dan Appendix A — commit perubahan ini.

**Validasi lokal:** ESLint komponen, TypeScript, 28 tes marketing/asset, dan `git diff --check` lulus. Visual browser belum diverifikasi; tidak ada migrasi database.


## 30 September 2026 — Atmosfer marketing tanpa ranting panjang

**Permintaan owner:** aksen kiri/kanan halaman marketing terasa tidak natural karena ranting berdaun terlalu panjang.

**Implementasi:** hapus ilustrasi SVG batang diagonal dan susunan tujuh rumpun daun yang dicerminkan. Latar shared marketing memakai kabut bronze/champagne dan bayangan semak rendah yang memudar pada Light/Dark, dengan daun jatuh tetap halus. Perubahan berlaku pada service pages yang memakai atmosfer bersama; komposisi homepage tidak diubah.

**Area/commit:** `components/EventPlanner/EventPlannerBotanicalAtmosphere.tsx`, `tests/event-planner-redesign.test.mjs`, `tests/marketing-atmosphere-continuity.test.mjs`, `prd.md` §1.2/§16.0a dan Appendix A — commit perubahan ini.

**Validasi lokal:** ESLint, TypeScript, 225 tes regresi, `git diff --check`, dan build produksi lulus. Visual browser Light/Dark pada berbagai ukuran layar belum diverifikasi; tidak ada migrasi database.


## 30 September 2026 — Restore shared marketing audio coverage

- Shared marketing ambience memakai track terbaru yang dipilih owner: `/assets/audio/epic-spectrum-forgiveness.mp3`.
- Semua framed marketing routes sekarang juga terdaftar sebagai marketing audio routes, termasuk `/privacy-policy` dan `/terms-and-conditions`.
- Footer/audio controls tetap memakai satu `MarketingAudioProvider` global; tidak dibuat player terpisah per page.
- Regression test menjaga track canonical dan memastikan setiap framed marketing route juga mengizinkan audio.

**Area:** `components/Layout/MarketingAudio.tsx`, `lib/marketing-paths.ts`, `tests/marketing-polish.test.mjs`.

**Commits:** `d79c691`, `83d2022`, `b88c003`.

**Validation:** source inspection complete; CI observed separately.


## 30 September 2026 — Lanskap marketing terlihat menembus mainframe

**Koreksi owner:** versi kabut/bayangan semak sebelumnya nyaris tak terlihat; suasana hutan harus terasa di dalam mainframe dan berlanjut ke luar bingkai.

**Implementasi:** atmosfer bersama menampilkan lanskap Light/Dark yang sudah ada pada lebar viewport, di belakang mainframe transparan, dengan mask vertikal agar header/footer tetap jelas. Kabut, bayangan semak rendah, dan daun jatuh tetap mendampingi tekstur hutan tanpa menghidupkan kembali ranting SVG yang panjang.

**Area/commit:** `components/EventPlanner/EventPlannerBotanicalAtmosphere.tsx`, `tests/event-planner-redesign.test.mjs`, `prd.md` §16.0a dan Appendix A — commit perubahan ini.

**Validasi lokal:** ESLint, TypeScript, 225 tes regresi, `git diff --check`, dan build produksi lulus. CSS keluaran build memuat kedua aset hutan. Browser lokal memblokir URL localhost, sehingga visual Light/Dark belum terverifikasi; tidak ada migrasi database.


## 30 September 2026 — Correct marketing track rollback

- Koreksi rollback sebelumnya: track marketing terbaru yang sudah dipilih owner adalah **Epic Spectrum – Forgiveness**, bukan A Himitsu – Fragile.
- `MarketingAudioProvider` dikembalikan ke `/assets/audio/epic-spectrum-forgiveness.mp3`.
- Regression test diperbarui agar tidak mengunci track lama lagi.
- Fix route coverage audio dari langkah sebelumnya tetap dipertahankan.

**Area:** `components/Layout/MarketingAudio.tsx`, `tests/marketing-polish.test.mjs`, `prd.md`.


## 30 September 2026 — Dua aset hutan tenang untuk marketing selain landing

**Permintaan owner:** background halaman marketing terlalu ramai dan mengurangi keterbacaan; buat aset hutan Light dan Dark khusus di luar landing.

**Implementasi:** dua lanskap hutan WebP baru dengan detail di tepi dan ruang tengah berkabut yang lapang menggantikan pemakaian aset landing di atmosfer marketing bersama. Lapisan gradient semak/glow dan daun jatuh dihapus dari komponen ini. Fade vertikal serta posisi di belakang mainframe dipertahankan; homepage tidak diubah.

**Area/commit:** `public/assets/marketing/atmosphere/forest-light.webp`, `forest-dark.webp`, `components/EventPlanner/EventPlannerBotanicalAtmosphere.tsx`, `components/Layout/PublicMarketingAtmosphere.tsx`, `tests/event-planner-redesign.test.mjs`, `prd.md` §1.2/§16.0a dan Appendix A — commit perubahan ini.

**Validasi lokal:** ESLint, TypeScript, 225 tes regresi, `git diff --check`, dan build produksi lulus. Pemeriksaan visual browser Light/Dark belum tersedia; tidak ada migrasi database.


## 30 September 2026 — Hapus glow berwarna pada section marketing

**Permintaan owner:** sejumlah halaman masih menunjukkan semburat glow kuning atau warna lain setelah aset hutan tenang dipasang.

**Implementasi:** hapus pseudo-element glow radial dari helper editorial bersama serta lima lapisan glow per-section pada Event Planner, Undangan Fisik, dan Bantuan. Kelas helper glow yang tidak lagi dipakai dibersihkan dari halaman Undangan Digital, Guestbook, Undangan Fisik, Bantuan, Katalog, Privasi, dan Ketentuan. Overlay gelap di atas foto hero tetap untuk keterbacaan teks. Landing/Pintu dan aset hutan Light/Dark tetap.

**Area/commit:** `app/globals.css`, halaman marketing yang memakai helper editorial, `app/event-planner/page.tsx`, `app/undangan-fisik/page.tsx`, `app/help/page.tsx`, `prd.md` §16.0a/Appendix A — commit perubahan ini.

**Validasi lokal:** ESLint, TypeScript, 227 tes regresi, `git diff --check`, dan build produksi lulus. Pemeriksaan visual browser belum tersedia; tidak ada migrasi database.

## 30 September 2026 — Referral Mitra di Beranda dan checkout

**Permintaan owner:** pelanggan dapat memasukkan kode referral di Beranda Dashboard; tiap Mitra dapat membuat kode sendiri, sedangkan hanya Owner yang membuat ID Mitra. Kode mengurangi Rp150.000 sebesar 30% dan Rp2.000.000 sebesar 15%.

**Implementasi:** Beranda menyimpan pilihan kode aktif per pelanggan, halaman paket menampilkan harga diskon dan meneruskan kode ke order, serta invoice menampilkan harga awal/potongan/total. Server memvalidasi kode dan menghitung nominal dari katalog sebelum menyimpan order; setelah bukti/laporan pembayaran, nominal dan atribusi dikunci. Mitra membuat kode melalui panelnya sendiri, dan laporan Mitra/Owner membaca atribusi terakhir saat pending order berubah. Owner tetap mengelola akun Mitra dan dapat membuat kode dari panel analitiknya. Riwayat kode/pilihan/atribusi memakai `AuditLog` yang sudah tersedia.

**Area/commit:** `lib/partners/`, `app/api/dashboard/referral`, `app/api/partner/codes`, `app/api/orders`, analitik Mitra/Owner, Beranda Dashboard, pemilihan paket, checkout, `tests/referral-pricing.test.mjs`, `prd.md` §8.2a/Appendix A — commit perubahan ini.

**Validasi lokal:** ESLint, TypeScript, 229 tes regresi, `git diff --check`, dan build produksi lulus. Migrasi database tidak diperlukan; alur pembayaran/akun dengan database dan browser produksi belum diverifikasi.

## 30 September 2026 — Template-by-template editability pass begins with Romantic Rose

- Perbaikan template dilakukan satu per satu agar kualitas visual dan editability bisa diaudit dengan jelas tanpa mengubah banyak renderer sekaligus.
- Romantic Rose dipakai sebagai baseline pertama karena sudah memakai section engine, native visual transforms, photo slots, editable copy, asset layers, RSVP/Wishes/Gift shared components, dan section instances.
- Coverage Studio diperluas dengan selectable parent groups untuk envelope card stack, Cover content group, kedua identity person groups, dan heading group per section.
- Recipient line pada Amplop sekarang menjadi protected native/system object: isi tetap berasal dari data Personal Invitation, tetapi styling/transform visualnya dapat diedit.
- Native visual button objects sekarang dapat menerima typography controls, sehingga tombol bawaan seperti Buka Undangan dapat ditata tanpa membuka business behavior.
- `template.md` sekarang mewajibkan setiap elemen visual penting pada master template memiliki ownership Studio yang eksplisit: native object, photo slot, editable copy, protected functional/system element, atau section surface.
- Functional components tetap dilindungi; targetnya bukan membuat RSVP/Maps/Wishes/Gift menjadi objek bebas, tetapi membuat presentation-nya dapat diatur tanpa merusak API, data, semantics, atau responsive web behavior.

**Area:** `components/PublicInvitation/RomanticRoseTemplate.tsx`, `lib/templates/native-visual-transforms.ts`, `tests/native-visual-transforms.test.mjs`, `template.md`.

**Commits:** `cde1f92`, `26810d9`, `09a8387`, `4ad4a10`, `8b6b0ce`.

**Validation:** source audit complete; CI observed separately.

## 30 September 2026 — Rincian diskon pada perhitungan Mitra

**Permintaan owner:** diskon dari kode referral ikut terlihat dalam perhitungan Mitra setiap kali pelanggan membuat order, dengan status pembayaran tetap jelas.

**Implementasi:** laporan Mitra dan analitik Owner membaca harga awal yang disimpan saat atribusi invoice, membandingkannya dengan nominal order yang otoritatif, serta memperlihatkan diskon dan total bayar per invoice. Ringkasan PAID mengakumulasi harga awal, diskon pelanggan, dan omzet setelah diskon; order PENDING ditampilkan terpisah tanpa menambah omzet. Panel memuat ulang saat jendela aktif dan secara berkala saat terbuka. Atribusi lama tanpa snapshot harga tidak dipaksa memiliki diskon.

**Area/commit:** `lib/partners/sales-summary.ts`, `app/api/partner/sales/route.ts`, `app/api/owner/analytics/route.ts`, `components/Partner/PartnerDashboard.tsx`, `components/Owner/OwnerBusinessInsights.tsx`, `tests/partner-sales-summary.test.mjs`, `prd.md` §8.2a/Appendix A — commit perubahan ini.

**Validasi lokal:** ESLint, TypeScript, 231 tes regresi, `git diff --check`, dan build produksi lulus; data produksi dan browser belum diverifikasi. Tidak ada migrasi database.

## 30 September 2026 — Botanical Ivory editability pass

- Botanical Ivory menjadi template kedua dalam audit satu-per-satu.
- Shared generic renderer sekarang memberi selectable parent group pada heading block tiap section dan pada group host/person di Identity.
- Ornament daun khas Botanical Ivory tetap child native object tersendiri sehingga dapat dipindah, ditransform, atau di-hide tanpa mengubah data section.
- Perubahan shared ini sengaja hanya menambah Studio ownership dan tidak mengubah business logic, data, section order, atau art direction template generik lain.

**Area:** `components/PublicInvitation/UniversalInvitationTemplate.tsx`, `tests/native-visual-transforms.test.mjs`.

**Commits:** `7ec513e`, `6b9299a`.

**Validation:** source audit complete; CI observed separately.

## 30 September 2026 — Eternal Blossom editability pass

- Eternal Blossom menjadi template ketiga dalam audit satu-per-satu.
- Recipient line pada shared envelope sekarang menjadi protected native/system object sehingga styling dan transform dapat diedit tanpa membuka isi data tamu.
- Cover Eternal Blossom mempertahankan target granular untuk flower kiri/kanan, photo frame, inner photo window, kicker, heading nama, tanggal, dan ornament.
- Semua perubahan tetap memakai renderer web yang sama; tidak mengubah RSVP, Maps, Wishes, Gift, Countdown, Music, atau data event.

**Area:** `components/PublicInvitation/InvitationThemeScenes.tsx`, `tests/native-visual-transforms.test.mjs`.

**Commits:** `4a91bb6`, `4458871`.

**Validation:** source audit complete; CI observed separately.

## 30 September 2026 — Modern Maroon editability pass

- Modern Maroon menjadi template keempat dalam audit satu-per-satu.
- Dekorasi `block-left`, `block-right`, dan `monogram` sekarang termasuk removable native decoration sehingga dapat di-hide/delete per invitation tanpa menyentuh nama, tanggal, foto, atau data event.
- Media group, copy panel, photo frame, heading, dan data visual lainnya tetap menggunakan target Studio yang sudah ada.

**Area:** `lib/templates/native-visual-transforms.ts`, `tests/native-visual-transforms.test.mjs`.

**Commits:** `042488b`, `c47cd9c`.

**Validation:** source audit complete; CI observed separately.

## 30 September 2026 — Garden Light editability pass

- Garden Light menjadi template kelima dalam audit satu-per-satu.
- Cover sekarang mengekspos inner photo window sebagai native target terpisah dari photo frame/slot, sehingga frame dan viewport foto dapat ditata secara granular.
- Ring kiri/kanan, sprig kiri/kanan, seal, kicker, heading, tanggal, ornament, dan photo frame tetap selectable/removable sesuai kontrak decorative native object.

**Area:** `components/PublicInvitation/InvitationThemeScenes.tsx`, `tests/native-visual-transforms.test.mjs`.

**Commits:** `dba2a96`, `26cd214`.

**Validation:** source audit complete; CI observed separately.

## 30 September 2026 — Midnight Romance editability pass

- Midnight Romance menjadi template keenam dalam audit satu-per-satu.
- Inner photo viewport pada Cover sekarang menjadi native target terpisah dari photo frame/slot.
- Starfield, moon, star, photo frame, heading, date, dan ornament tetap selectable/removable tanpa membuka business data.

**Area:** `components/PublicInvitation/InvitationThemeScenes.tsx`, `tests/native-visual-transforms.test.mjs`.

**Commits:** `2cffb67`, `8772653`.

**Validation:** source audit complete; CI observed separately.

## 30 September 2026 — Classic Pearl editability pass

- Classic Pearl menjadi template ketujuh dalam audit satu per satu. Isi Cover kini mempunyai satu target grup untuk menggeser dan menata komposisi utuh, sementara bingkai ganda, oval, crest, ornamen, teks visual, nama, dan tanggal tetap target granular.
- Nama dan tanggal tetap berasal dari data acara; grup tidak dapat dihapus sebagai dekorasi. Amplop dan section konten tetap memakai renderer bersama dan fungsi terlindungi.

**Area/commit:** `components/PublicInvitation/InvitationThemeScenes.tsx`, `tests/native-visual-transforms.test.mjs`, `prd.md` — commit perubahan ini.

**Validation:** tes target native/template 40/40 dan regresi penuh 237/237, ESLint file terdampak, TypeScript, serta build produksi lulus. Build menampilkan warning tracing filesystem upload route yang sudah ada; browser desktop/mobile belum diverifikasi pada pass ini.

## 30 September 2026 — Golden Art Deco editability pass

- Golden Art Deco menjadi template kedelapan dalam audit satu per satu. Cover mempunyai target grup komposisi yang dapat ditata sekaligus, sementara kelima bar geometri, permata dan kedua ray, border, diamond, kicker, tanggal, serta ornamen tetap target masing-masing.
- Ornamen individual dapat disembunyikan lewat kontrak native yang tervalidasi. Nama dan tanggal tetap menggunakan data acara dan tidak dapat dihapus sebagai dekorasi; Amplop, section konten, dan komponen bisnis tetap memakai engine bersama.

**Area/commit:** `components/PublicInvitation/InvitationThemeScenes.tsx`, `tests/native-visual-transforms.test.mjs`, `prd.md` — commit perubahan ini.

**Validation:** tes native 34/34, regresi penuh 238/238, ESLint file terdampak, TypeScript, dan build produksi lulus. Build menampilkan warning tracing filesystem upload route yang sudah ada; browser desktop/mobile belum diverifikasi pada pass ini.

## 30 September 2026 — Paper Cut Botanical editability pass

- Paper Cut Botanical menjadi template kesembilan dalam audit satu per satu. Isi Cover memiliki target komposisi untuk memindahkan kartu, teks dan ornament sebagai grup tanpa kehilangan target granular pada tiap elemen.
- Potongan kertas kiri/kanan serta daun kiri/kanan tetap objek terpisah yang bisa dipilih/disembunyikan. Latar tidak dijadikan grup seleksi sebesar section agar klik ruang kosong tetap memilih section. Nama dan tanggal masih bersumber dari data acara.

**Area/commit:** `components/PublicInvitation/InvitationThemeScenes.tsx`, `tests/native-visual-transforms.test.mjs`, `prd.md` — commit perubahan ini.

**Validation:** regresi penuh 239/239, ESLint file terdampak, TypeScript, dan build produksi lulus. Build menampilkan warning tracing filesystem upload route yang sudah ada; browser desktop/mobile belum diverifikasi pada pass ini.

## 30 September 2026 — Canonical template preview names

- Semua template katalog/full preview sekarang memakai sample pasangan canonical **Una & Dara**.
- Fixture preview bersama diperbarui dari Denny & Christine menjadi Una & Dara, sehingga seluruh template yang memakai renderer preview bersama ikut konsisten.
- Data invitation customer tidak disentuh; perubahan hanya berlaku pada demo/preview fixture.
- Regression test menjaga fixture preview agar tidak kembali memakai nama lama.

**Area:** `data/templates/preview-invitation.ts`, `tests/template-card-cover.test.mjs`.

**Commits:** `fd57d26`, `9fdea7b`.

**Validation:** shared preview fixture updated; CI observed separately.

## 30 September 2026 — Preview branding moved outside invitation artwork

- Di Studio invitation yang belum berbayar, watermark diagonal `PREVIEW • UNDARA` dihapus.
- Preview branding diganti menjadi teks kecil `Undara · Copyright` di bawah viewport undangan, bukan di dalam artwork/template.
- Label hanya hidup pada wrapper Studio ketika `accessPaid === false` melalui class `undara-unlicensed-studio`.
- Public/published invitation renderer tidak boleh memuat `Undara · Copyright`, watermark, trademark, atau branding Undara lain di dalam undangan customer.
- Setelah invitation dipublish, output publik tetap bersih tanpa trademark/watermark Undara.

**Area:** `components/InvitationStudio/studio.css`, `tests/studio-ui-cleanup.test.mjs`.

**Commits:** `a1981a6`, `c5911ac`.

**Validation:** source guard added; CI observed separately.

## 30 September 2026 — Remaining template editability passes completed

- Classic Pearl, Golden Art Deco, dan Paper Cut Botanical yang sebelumnya sudah mendapat selectable cover composition kini dipertahankan sebagai bagian dari baseline editability dan dijaga oleh regression tests.
- Pencil Reverie: recipient line Amplop sekarang protected native/system object; Cover heading memiliki selectable parent group; illustration/copy/heart tetap granular.
- Zen Atelier: recipient line Amplop sekarang protected native/system object; shoji, mizuhiki, folds, blossom, mountains, branch/sun dan artwork dekoratif dapat dipilih dan di-hide sebagai decoration tanpa membuka isi data.
- Celestial Ink: orbit layers tetap granular, sementara foreground Cover memiliki `content-group` untuk transform komposisi sekaligus; moon, kicker, names, star cluster, date, dan ornament tetap child targets.
- Native removable-decoration vocabulary diperluas hanya untuk visual authored yang memang dekoratif (blossom, fold, heart, illustration, mizuhiki, mountains, shoji), bukan data event atau functional controls.

**Area:** `components/PublicInvitation/PencilReverieScene.tsx`, `components/PublicInvitation/ZenAtelierScene.tsx`, `components/PublicInvitation/InvitationThemeScenes.tsx`, `lib/templates/native-visual-transforms.ts`, `tests/native-visual-transforms.test.mjs`.

**Commits:** `ec0ba85`, `917f193`, `e6fc852`, `77d87e0`, `1ea87ce`.

**Validation:** source audit complete; CI observed separately.


### 30 September 2026 — Serein editorial invitation

**Owner request:** create one new invitation with assistant-led art direction, following repository rules, design skills and Library/resources. Continued the Serein work and generated section references already present in this session rather than discarding it.

**Implementation:** registered `serein` once in the catalog, added its preset, copy defaults/English translations and existing music track. Lazy Serein envelope/cover and photo-album modules use the same universal web renderer. Added token-aware seal/paper/artwork, asymmetric cover, alternating identity portraits, typography/spacing for all sections, shared forms and functioning public lightbox controls. Studio section/native/copy/photo contracts are retained. No database migration or new business API. Asset brief: `public/templates/serein/README.md`.

**Area:** `components/PublicInvitation/{SereinScene,SereinGallery,InvitationThemeScenes,UniversalInvitationTemplate}.tsx`, `serein.css`, `lib/templates/{catalog,design,editable-copy,music}.ts`, `lib/invitations/language.ts`, theme WebP and catalog regression fixture.

**Commit:** the commit containing this Appendix entry (`feat(templates): add Serein editorial invitation`).

**Observed validation:** TypeScript pass; production Next build pass; regression suite 244/244 pass via `node --import tsx --test`; scoped ESLint no errors (one pre-existing unused `onMoveAssetLayer` warning in Universal renderer); diff whitespace pass; Impeccable detector returned no findings for Serein files. Browser preview server starts when explicitly bound to loopback, but local Playwright capture is blocked by the missing Chromium executable and unsuccessful browser download. Therefore responsive screenshots, Studio palette/font/save/reload and public envelope/lightbox/paid-RSVP QA are **not claimed PASS**. Generated reference images are art direction evidence, not website screenshots.

### 30 September 2026 — Romantic Rose editorial redesign

**Owner request:** redesign only the built-in `romantic-rose` invitation first, using the Undara design workflow/Library while preserving existing template rules, Studio editability and shared business engines.

**Implementation:** Romantic Rose now uses a cohesive “rose editorial letter” art direction instead of alternating generic pink sections/cards. The envelope is a burgundy letter with ivory stationery and an R monogram seal; the Cover is full-bleed photography with editorial typography; Greeting, Couple, Event, Date & Time, Gallery, Countdown, Location, RSVP/Wishes wrappers, Gift, Closing and Footer use varied but coherent asymmetric compositions, stronger typography hierarchy, restrained borders and a burgundy–dusty rose–ivory–champagne palette. Gallery uses a denser editorial mosaic, countdown/date information no longer relies on repeated rounded cards, and primary actions have bounded press/focus behavior with reduced-motion handling.

All event data, Personal Invitation recipient line, photo slots/crop controls, shared RSVP/Wishes/Gift/Maps/Music engines, 13 semantic sections, section instances, native Studio targets and asset overlays remain in the existing renderer contract. No database/API change and no other invitation theme was redesigned.

**Area:** `components/PublicInvitation/RomanticRoseTemplate.tsx`, `components/PublicInvitation/OurStorySection.tsx`.

**Commits:** `a55a2487303add4adc5d8f7a94b99c14b03b86c2`, `20d274677d7cb897b4a937bad60ee96434ca404f`, `817cc6ca0831a708d6eb9712308d67e32ae626a1`.

**Validation:** source-level redesign completed; CI/build status observed separately. Browser desktop/mobile visual QA is not claimed until an actual rendered preview is inspected.

### 30 September 2026 — Phone-only public template catalog

**Owner request:** simplify `/template-design` so the catalog displays invitation designs as phone previews and removes repeated per-card buttons; clicking the phone itself opens Preview.

**Implementation:** each catalog item now uses the existing 9:19.5 phone treatment and real Cover/Hero renderer. The previous large rounded card, photo badge, eye icon, description block and repeated “Lihat undangan/Lihat desain” CTA were removed from the listing. Template name/category remain as compact metadata below the phone. Search, photo/category filters and sorting remain because they are catalog navigation rather than per-template actions. The preview dialog and its authenticated “Buat Undangan” handoff remain unchanged.

**Area:** `app/template-design/page.tsx`, `tests/template-card-cover.test.mjs`.

**Commits:** `35c697ec69e9f6c65224906cc335f2c775399a1e`, `8faf1bdae6586aaa0c9dcafe7386e49145a6fb53`.

**Validation:** source guard confirms the public catalog uses the shared phone Cover renderer and no longer renders the old per-card Eye/CTA interaction. CI/build status observed separately; browser visual QA is not claimed until rendered.

### 30 September 2026 — DDR-style template selection wheel

**Owner request:** change the `/template-design` phone listing from a flat grid into a wheel-like selector inspired by rhythm-game song selection, with the focused card in the middle and the template explanation below it.

**Implementation:** the public template catalog now renders the same real phone Cover/Hero previews in a centered 3D selection wheel. The active phone is largest and front-facing; neighboring phones step outward with reduced scale/opacity, subtle Y offset and opposing Y-axis rotation. Mouse/trackpad wheel advances the focused template while the pointer is over the selector, but releases normal page scrolling at the first/last item. Touch users can swipe horizontally; Left/Right keyboard arrows also change selection. Clicking a side phone brings it to center; clicking the centered phone opens the existing Preview dialog. Only the active template's index/category, name, localized description and a short interaction hint appear below the wheel. No repeated per-card CTA buttons were reintroduced.

The wheel uses a bounded 240ms transform/opacity/filter transition with a strong ease-out curve and disables transition motion under `prefers-reduced-motion`. Search, photo/category filters, sorting, Preview dialog and Studio handoff remain unchanged.

**Area:** `app/template-design/page.tsx`, `tests/template-card-cover.test.mjs`.

**Commits:** `83066317ab8d6b89f86155c23993116d1f5d3b39`, `478a653b8d66c21120dea2a1d7d62f877d17f2e3`, `db1c6da518b43b78e911ede292f5939b3ae1e10f`, `35af5d5f2d830462f94e48bf8d57707b3015e4b5`, `b6987431182622d58c72590b1aa59b57533e3c83`, `1febbbf2522d8d915e0f4dadeef06b1363ad5f0c`.

**Validation:** source guards confirm the wheel markers, 3D transform, non-passive wheel handler, touch selection, center-only Preview action, active description and shared phone renderer. The test file has been checked to contain no literal escaped newline artifacts. CI/build and rendered desktop/mobile browser QA are not claimed until directly observed.

### 30 September 2026 — Serein motion defaults and Studio playback

**Owner request:** make Serein's motion visible using the existing Studio animation collection, including opposing photo entrances and fades/reveals.

**Implementation:** added theme-only presets in `lib/templates/template-motion.ts`, resolved by the shared photo/native runtime and Studio inspectors. Cover names slide from opposite sides; cover photo reveals from the left; identity portraits glide left/right; headings rise/slide; album photos rise with 70ms stagger. Runtime discovers lazy-mounted sections/scenes/gallery, waits for Serein images to load, restores authored CSS after playback, replays Serein entrances after fully leaving/re-entering the viewport and supports the Studio replay button. Explicit photo/native `none` survives serialization; parent section animation/timeline suppresses child defaults while authored object choices win. Removed competing bespoke Serein heading/gallery motion. Existing section/photo/native presets and reduced-motion handling remain shared; no dependency, database or API added.

**Motion review:** rare invitation-viewing context; purpose is delight and spatial consistency. Shared WAAPI uses existing strong ease-out presets, transform/opacity and the sanctioned cover clip reveal; durations 650–900ms suit the invitation's photographic storytelling, and 70ms album stagger is bounded by the existing gallery selection limits. Controls remain usable during playback. Re-entry is limited to fully exiting the viewport, with no ambient loops; reduced motion leaves content visible.

| Before | After | Why |
| --- | --- | --- |
| No Serein photo/name presets; separate heading/gallery effects | Theme defaults use the Studio preset engine | Visible, editable motion without competing engines |
| Targets sampled only on hook mount | Root observer discovers later section/scene/gallery mounts | Lazy-loaded content receives configured motion |
| OFF removed by serialization; completed animation hard to replay | Persist explicit OFF and register replay events | Saved settings and Studio controls remain truthful |
| Entrance could finish before photo download | Wait for image load/error and cancel waits on exit/cleanup | Photo movement is visible instead of animating a blank frame |

**Area:** `components/PublicInvitation/{entrance-animation-runtime,use-section-animations,use-photo-animations,use-native-visual-animations,UniversalInvitationTemplate,SereinScene,SereinGallery}`, `serein.css`, Studio designer/selection/photo/native inspectors, `lib/templates/{template-motion,photo-slots,native-visual-transforms}`, runtime and source regression tests. After syncing current `main`, two obsolete catalog tests were aligned with its existing approved wheel; catalog implementation was not changed.

**Commit:** the commit containing this Appendix entry (`feat(serein): add Studio-native invitation motion`).

**Observed validation:** TypeScript pass; production Next build pass after syncing main; regression suite 253/253 pass via `node --import tsx --test`. Eight new behavioral tests cover defaults/overrides, serialized OFF, section suppression, lazy discovery, viewport/Studio replay, image loading/cleanup, preserved transforms/opacity and reduced motion. Scoped ESLint outside InvitationDesigner has no errors (two existing unused-variable warnings); InvitationDesigner retains its four pre-existing effect-setState errors and six warnings, confirmed against the unchanged HEAD baseline. Diff whitespace pass; Impeccable detector returned no findings for motion/Serein targets. Source motion review passes; perceived timing, rendered desktop/mobile playback and authenticated save/public flow remain unverified because Chromium is unavailable locally. No browser PASS is claimed.

### 30 September 2026 — Unified Template Design selection page

**Owner request:** make `/template-design` feel like one complete page, keep the rotating phone selector as the center of attention, use empty side space for supporting copy, and simplify Search / Filter / Sort so the catalog stays easy to use as the number of templates grows.

**Implementation:** the previous tall hero, standalone photo-filter row and standalone category row were consolidated into one viewport-oriented selection composition. On desktop, the title occupies the left rail, the looping phone wheel owns the wide center column, and explanatory copy uses the right rail; mobile collapses those pieces naturally above the selector. Search is now a compact field, while photo-use and category controls are grouped into one Filter dropdown with a scrollable category area and reset action. Sort remains a neighboring compact dropdown, so Search / Filter / Sort read as one control bar immediately above the wheel. The active template's category, position, name and localized description remain directly below the wheel.

The selector now loops continuously in both directions. Moving forward from the last template returns to the first, moving backward from the first returns to the last, and the visual neighbor calculation also wraps so the first/last phones remain adjacent in the 3D wheel rather than disappearing at an artificial edge. Mouse/trackpad, swipe, keyboard and side-card centering keep the existing interaction model.

**Area:** `app/template-design/page.tsx`, `tests/template-card-cover.test.mjs`.

**Commits:** `49d7c75afbf9f67f2934627c3b58328edf6fc183`, `e5cc1bfb0c58325f312f7d315fb5e5434d8e4864`.

**Validation:** source guards confirm the single viewport-oriented composition, compact search, grouped Filter dropdown, compact Sort dropdown, looping modulo navigation, circular visual distance and shared real phone Cover renderer. CI/build and rendered browser QA remain separate observations.

### 30 September 2026 — Template wheel hydration fix

- Fixed invalid HTML in `/template-design`: the rotating phone item is no longer rendered as a `<button>` wrapper around the real invitation preview.
- Real template previews can contain functional HTML controls such as RSVP submit buttons, so wrapping the preview in another button created `<button><button>...</button></button>` and caused a Next.js hydration warning/error.
- The visual phone shell is now a neutral `<div>`. A transparent absolute-positioned button is rendered as a sibling overlay after the preview content and owns selection/preview interaction, keyboard focus, labels, and `aria-current`.
- Wheel behavior, looping, swipe/scroll selection, center-preview action, and real Cover/Hero rendering remain unchanged.

**Area:** `app/template-design/page.tsx`, `tests/template-card-cover.test.mjs`.

**Commits:** `31802704417fb31291f4f7191fc15d1e67dbe01c`, `0f05143a8a55e3767fc94273823d6b2e431c490d`.

**Validation:** source guard confirms there is no outer keyed button wrapping `TemplateCardCanvas`; the interactive overlay button is a sibling of the rendered preview.

### 30 September 2026 — Roomier template selector composition

**Owner request:** keep the current `/template-design` direction, but use the remaining empty space better: enlarge the phone selector, increase breathing room between the center wheel and left/right copy, and open up the vertical spacing around the compact controls and active-template details.

**Implementation:** the selection room now uses wider desktop side rails and larger inter-column gaps, with additional left/right padding on supporting copy. The center wheel stage expands to 1040px with a taller viewport and larger active phone (up to 252px wide), wider card spacing, slightly stronger depth separation, and a larger perspective field. The Search / Filter / Sort bar remains compact but gets more breathing room above the wheel, while active template metadata moves lower with more separation from the device stage. Right-side explanatory copy is slightly larger and more relaxed. Mobile sizing remains bounded by responsive clamps.

**Area:** `app/template-design/page.tsx`, `tests/template-card-cover.test.mjs`.

**Commits:** `2819f404987d334b30c4f856f57487a8310a8717`, `bca61f450722204262c92e51d76d73856390fe51`.

**Validation:** source guards confirm the larger wheel stage, larger phone clamp, wider desktop gaps, expanded side-copy measure and updated compact-control spacing.

### 30 September 2026 — Floating editorial template selector

**Owner request:** remove the block/panel behind Search / Filter / Sort, strengthen text readability, give the rotating phones more room on all sides, and stop reserving fixed left/right columns for supporting copy.

**Implementation:** `/template-design` now uses a single full-width editorial selection field. Search, Filter and Sort remain grouped functionally but float freely above the wheel without an enclosing card/panel. Input/control typography and contrast were increased for readability. The title is positioned in the upper-left on desktop, while supporting copy is moved to the lower-right, so neither consumes a permanent side column. The wheel expands to a 1180px stage with a taller field and active phone up to 280px wide, with wider horizontal spacing and more vertical separation above and below. Active-template metadata also receives more breathing room and stronger contrast.

Mobile retains normal document flow for the title and controls, while desktop uses the asymmetric corner composition.

**Area:** `app/template-design/page.tsx`, `tests/template-card-cover.test.mjs`.

**Commits:** `f23b62c0e00b4b6650e330922ba06150e96920b9`, `6ec8184b7a28605222aca55104be9d843b4ef938`.

**Validation:** source guards confirm the removal of the 3-column layout and control-panel shell, floating upper-left/lower-right copy, stronger control text, larger wheel stage/phone dimensions, and preserved non-nested wheel interaction structure.

### 30 September 2026 — Stronger floating copy and template controls

**Owner request:** push the upper-left title and lower-right supporting copy farther toward the page edges, make the right-side text wider and less rigidly aligned, and improve readability of Search / Filter / Sort and dropdown text.

**Implementation:** desktop copy is pushed farther outward using negative edge offsets within the marketing frame. The lower-right copy block is widened and intentionally staggered: the descriptive paragraph and interaction hint align right, while the editorial subheading offsets left within the same block so it no longer reads as a rigid text rectangle. Search, Filter, Sort, result count, dropdown headings, filter choices, category choices, reset action, and sort options now use stronger text weight, larger type, and higher contrast borders/text.

**Area:** `app/template-design/page.tsx`, `tests/template-card-cover.test.mjs`.

**Commits:** `3e3333d7fc5386ed0203177ad4f3640dec7b8f5d`, `3a9abf91a3f9565004c8596e57555b4a6bf8c12e`.

### 30 September 2026 — One-page template selector compression and door-widget placement

**Owner request:** remove the “designs available” count, move the door navigator fully inside the marketing frame, raise Search / Filter / Sort, push the title farther left and the supporting copy farther right/down, and compress `/template-design` toward a single-frame desktop composition.

**Implementation:** the result-count label was removed. Desktop title and supporting copy now sit farther toward the frame corners, with the right-side copy widened and arranged as a downward right-aligned cascade rather than a central block. The control row is raised by reducing its top offset and bottom gap. The wheel stays wide but its vertical stage is bounded so controls, phones and active-template metadata fit more tightly within the framed viewport. The shared `MarketingDoorNavigator` now uses frame-aware left offsets (`calc(5vw + 10px)` on mobile, 35px on small screens and 39px on desktop) so the widget sits fully inside the frame on all framed marketing pages instead of straddling the outer edge.

**Area:** `app/template-design/page.tsx`, `components/Layout/MarketingDoorNavigator.tsx`, `tests/template-card-cover.test.mjs`.

**Commits:** `b5d195227d231c94d08689cafb4c58e498b11f09`, `2e51e3517d31ac7c6ed75866e9b4830c016988cf`, `81404e89358a2119478c8fa9c9c5395e28acef42`.

**Validation:** source guards confirm the result count is gone, corner copy is pushed outward, controls are raised, the wheel stage is vertically compressed while retaining width, and the door navigator is positioned inside the shared frame.

### 30 September 2026 — Rebalanced template selector spacing

**Owner request:** fix the cramped `/template-design` composition seen in the latest desktop screenshot, especially the supporting copy that appeared too low/central instead of clearly occupying the right side.

**Implementation:** the upper-left title is pushed slightly farther outward, Search / Filter / Sort are raised while receiving more separation before the wheel, and the wheel itself is shifted slightly lower inside a shorter stage so the composition stays within one framed page. Active-template metadata is pulled closer to the wheel to free lower-right space. The supporting copy no longer uses a negative bottom anchor; it now sits at roughly the right-middle/lower area (`top: 66%`) with a wider measure, keeping the text visibly on the right without colliding with the footer.

**Area:** `app/template-design/page.tsx`, `tests/template-card-cover.test.mjs`.

**Commits:** `e0f354f5d21438447733b78e8e3b7c04150d0251`, `2ca58f6abc58510d80739bb2ba715f016222cd9d`.

### 30 September 2026 — Outer-corner copy placement for template selector

**Owner request:** move the upper-left title slightly lower beneath the logo and push the supporting copy farther right and lower so the center-top and center-bottom areas feel more open around the phone wheel.

**Implementation:** the desktop title remains on the left edge but now starts lower (`top-8` to `top-12` across large breakpoints), while the supporting copy moves farther outward and down (`right: -7rem` to `-11rem`, around `top: 71%`) with a wider text measure. Search / Filter / Sort, phone wheel sizing, and active-template metadata remain unchanged.

**Area:** `app/template-design/page.tsx`, `tests/template-card-cover.test.mjs`.

**Commits:** `96a9daff45cda031a4e87ef89ae51bffc86db750`, `433c3763a79bd34693ea4c272495d0fc323802e6`.

### 30 September 2026 — Corner copy moved farther from template stage

**Owner request:** lower the upper-left title so it sits more clearly beneath the Undara logo, and push the supporting copy farther right and slightly lower to open the center stage around the rotating phones.

**Implementation:** desktop title placement now starts lower beneath the logo while preserving the existing left-edge offset. The right-side supporting copy is moved farther toward the frame edge and down to roughly three-quarters of the stage height, with a slightly wider measure. The wheel, filters, sort controls, and active-template details are otherwise unchanged so the added breathing room comes from corner-copy placement rather than shrinking the selector.

**Area:** `app/template-design/page.tsx`, `tests/template-card-cover.test.mjs`.

**Commits:** `13a550e9367c2e33b04474c992274b5f891a8e34`, `3510b6bfbb24fa74f75f78ae1c53aaa7bdd2fbf1`.

### 30 September 2026 — Distributed corner copy fills highlighted side zones

**Owner request:** use the highlighted empty side zones around the template wheel more deliberately instead of merely nudging the existing text blocks.

**Implementation:** the upper-left and lower-right supporting copy are now structured as tall editorial zones on desktop. The left zone uses a fixed-height flex column so the kicker anchors the top and the main title anchors the lower portion of the highlighted area. The right zone uses its own fixed-height flex column, distributing the description, divider/headline, and wheel hint across the vertical space. This fills the side areas visually while preserving a clear center stage for the rotating phone selector.

**Area:** `app/template-design/page.tsx`, `tests/template-card-cover.test.mjs`.

**Commits:** `398539e4a41c85b95381ae677482be8c7e998142`, `b1723044ad5dbb21d43ea90b7704cb20d52ac12d`.

### 30 September 2026 — React Three Fiber Clock deprecation bridge

**Owner request:** investigate the browser warning `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` and verify that it is not a rendering error in Undara.

**Finding:** Undara does not instantiate `THREE.Clock` directly. The current dependency pair is `three@0.186.0` with `@react-three/fiber@9.7.0`. Three deprecated `Clock` in r183, while R3F 9.x still constructs a Clock internally for its frameloop/Canvas state, so the browser warning originates upstream rather than from Undara scene code.

**Implementation:** added a tiny client-side Three console bridge installed before public 3D surfaces. It suppresses only the exact known R3F Clock deprecation warning and forwards every other Three log, warning, and error unchanged. This avoids hiding real renderer problems and avoids downgrading Three solely to silence a dependency warning. Added source guards confirming exact-message filtering, forwarding behavior, installation order, and the valid non-nested template-wheel button structure.

**Area:** `components/Three/ThreeConsoleBridge.tsx`, `app/layout.tsx`, `tests/three-console-bridge.test.mjs`.

**Commits:** `f4a97d6b4866a8323a95dec45dacc4a62cb5d4fe`, `944070b0b7fd003be593203809e237c992a4ec29`, `b28c322ecbcb625ea9e79b3d45e9854cd99061ec`.

**Validation:** source-level checks pass. GitHub exposes no combined CI statuses or PR workflow runs for the direct-push commit, so a full `next build` result is not claimed here.

### 30 September 2026 — Remove template wheel hint and push corner copy outward

**Owner request:** remove the “Scroll atau geser untuk memilih · klik HP di tengah untuk pratinjau” helper from `/template-design`, move the left editorial copy 5 cm farther left, and move the right editorial copy 5 cm farther right.

**Implementation:** the wheel instruction copy was removed from both rendered markup and locale strings. Desktop corner copy keeps its current vertical distribution, while the left block adds a `-5cm` X translation and the right block adds a `+5cm` X translation. The center wheel and Search / Filter / Sort controls remain unchanged.

**Area:** `app/template-design/page.tsx`, `tests/template-card-cover.test.mjs`.

**Commits:** `44b48e923f1fd323ecf570658f139d296ca700e9`, `b869bb08314a02a8e74d14e1023c911878067d6d`, `e23082167e9592fc14c21e5f6b92125528ebbc48`.
### 30 September 2026 — Botanical Ivory stationery, herbarium and growing motion

**Owner request:** redesign Botanical Ivory following the repository/design-skill/library rules and give it sweet botanical motion; reuse the artwork the owner committed.

**Implementation:** the existing photo-free stable theme now uses warm ivory/olive, Rufina + Average Sans, offset name lines, complete transparent specimens, a folded paper envelope with an olive belly band/seal, a two-page swipeable herbarium gallery, staggered illustrated identity, editorial event/location, an unboxed countdown band and a quiet closing signature. Owner `greenplant.webp` and `greenplant2.webp` remain untouched; display derivatives are alpha WebP at 768 × 1152 (211,760 and 216,666 bytes). New selections use the botanical preset; saved explicit palette/font and event/customer data remain authoritative. Shared Studio motion defaults reveal the plants upward, bring names from opposing sides, tilt herbarium sheets and gently scale the closing signature. Existing lazy discovery, image-load wait, replay, preserved native presentation and event-scoped codecs are reused. Native/section OFF and authored timelines suppress defaults; reduced motion opens immediately. Gallery keyboard navigation is instant, touch scrolling stays native, and there is no autoplay or per-second digit animation. All 15 controls, optional genuine Our Story, shared forms/API/Guest identity, map/gift/music contracts stay intact.

**Area/commit:** `components/PublicInvitation/BotanicalIvoryArtwork.tsx`, `BotanicalIvoryScene.tsx`, `BotanicalIvoryGallery.tsx`, `botanical-ivory.css`, shared scene/Universal/OurStory/native-motion integration, `lib/templates/{catalog,design,editable-copy,template-motion}.ts`, `lib/invitations/language.ts`, `public/templates/botanical-ivory/{greenplant,fern}.webp`, Botanical/native regression tests, historical catalog/marketing/Studio source guards, this PRD and `assets/templates/botanical-ivory/README.md` — commit containing this entry. The catalog application, landing, door scene, dashboard and other theme design sources are unchanged by this redesign.

**Skill/review evidence:** existing repo tokens/components/assets, Library inventory and pinned GPT Taste/Emil/Impeccable instructions informed the bounded theme brief. Actual alpha assets and generated cover/envelope references were inspected; references are not browser screenshots. The brief records all 15 controls, asset extraction, effects/library/fallback choices and the Emil Before/After/Why source-review table. Impeccable's bundled detector ran once over the changed theme/integration surface and returned zero findings. Source review approves implementation, not perceived timing or rendered visual quality.

**Observed validation:** `node --import tsx --test --test-reporter=tap tests/*.test.mjs` **262/262 PASS**; `npx tsc --noEmit` **PASS**; production `next build --webpack` **PASS**. Scoped ESLint: **0 errors**, one pre-existing unused `onMoveAssetLayer` warning in the shared Universal renderer. `git diff --check` **PASS**. The direct Node test invocation avoids this environment's blocked tsx CLI IPC socket while running the same repository test files. Alpha corners, original ratio, derivative byte budgets, no-photo preset/saved selection compatibility, actual identity/optional story, translated gallery controls and native motion/OFF/timeline rules are exercised. Existing source guards were aligned with the owner's current 1450px/84% wheel styling, active-wheel localized description, flexible right copy and canvas-only preview; the separate catalog close-control guard stays in place. These changes preserve the incoming main-branch implementation rather than changing marketing UI. A TypeScript invocation concurrent with Next's generated-type cleanup was rerun sequentially after the build; the final independent type check is the reported result.

**Not established:** Chromium/browser screenshots, actual mobile/desktop animation feel, physical touch, authenticated Studio save/public/personal round-trip, production database state and deployment. No browser/E2E, pixel-equivalence, migration or deployment PASS is claimed.

### 30 September 2026 — Tighten corner-copy rhythm and separate active template details

**Owner request:** tighten the top-to-bottom spacing inside the left and right editorial text zones, while adding a little more separation between the phone wheel and the active template name/details below it.

**Implementation:** the left editorial zone height is reduced from 22/24rem to 16/18rem and the right zone from 22/24rem to 15/17rem, preserving the existing ±5cm horizontal offsets. The active-template details below the wheel now start with a small positive top margin instead of sitting flush against the device stage.

**Area:** `app/template-design/page.tsx`, `tests/template-card-cover.test.mjs`.

**Commits:** `b55daa5e05ebcffebc28489f4ba1e94f214f8b16`, `cff8b2590f19bdd35dd3f9b732efcf5d499932d9`, `f4804d7c9097e6e46463497a7bece632381de960`.

### 30 September 2026 — Template selector copy and landing ornament

**Owner request:** replace the generic Invitation Studio supporting copy on `/template-design`, add an ornamental divider beneath it like the landing page, and tighten the spacing to the headline below.

**Implementation:** the Indonesian supporting copy is now “Temukan desain yang paling terasa seperti ceritamu. Lihat setiap detailnya, lalu pilih yang paling pas untuk membuka hari istimewamu.” with an equivalent English line. The right-side editorial block reuses the landing page botanical ornament asset `/assets/landing/ornaments/botanical/branch-05.webp` as a masked divider directly below the copy. The active-choice headline is pulled closer to the ornament so the right-side text reads as one composition rather than separate fragments.

**Area:** `app/template-design/page.tsx`, `tests/template-card-cover.test.mjs`.

**Commits:** `044857f1ddd75995e0d8a5af3179036b1114a139`, `d73680cb7a90fada4ca949a68fe2bbdd1c08dff0`.

### 30 September 2026 — Canvas-only template preview

**Owner request:** simplify `/template-design` Preview so it shows only the invitation itself, remove the explanatory sidebar, and move the exit control into the preview canvas.

**Implementation:** the Preview dialog no longer renders the left information/sidebar panel, section toggles, or Studio CTA. The invitation canvas now occupies the full dialog and is slightly wider (up to 430px). The close button is a floating circular control inside the canvas area at the upper-right. Preview still starts at Cover by forcing `envelope: false` on the default invitation sections, and backdrop click / Escape behavior remain.

**Area:** `app/template-design/page.tsx`, `tests/template-card-cover.test.mjs`.

**Commits:** `d4f0d119eedb576977a10570eacfdd274f095216`, `2b71e9634a25f603da10a2dfd90582275bfaeeae`, `0ca43eac1e0c655976d85b3db57fc94681bb2244`.


### 1 October 2026 — Catalog previews start at the envelope, cards retain full Cover

**Owner request:** include the digital envelope in every opened invitation preview while keeping the existing full Cover/Hero phone cards before clicking.

**Implementation:** the canvas-only catalog popup now supplies all default sections, including Envelope. Shared catalog `TemplateCanvas` explicitly permits the visual opening action while keeping `preview` enabled throughout the invitation renderer. Generic theme envelopes, Romantic Rose, Zen Atelier, Pencil Reverie and Serein receive this narrow permission; Botanical Ivory already supports its preview opening. The existing theme opening/motion and shared content continue after Buka Undangan. Studio editing defaults keep their existing protected opening/capture behavior. Catalog/featured/Studio cards still render the Cover-only section set and retain their existing layout. Non-ready designer uploads remain honest image previews until renderer integration; no fake envelope or production form is added. No event settings, database fields, API permissions, customer content, popup shell or marketing layout changes.

**Area/commit:** `app/template-design/page.tsx`, `components/Templates/TemplateGalleryCanvas.tsx`, `components/InvitationStudio/InvitationPreview.tsx`, shared Universal/Romantic Rose renderers and theme envelope scenes, `tests/template-card-cover.test.mjs`, `template.md`, this PRD — commit containing this entry.

**Observed validation:** all **262/262 tests PASS** (`node --import tsx --test --test-reporter=tap tests/*.test.mjs`); `npx tsc --noEmit` **PASS**; production `next build --webpack` **PASS**; `git diff --check` **PASS**. Existing card/popup and Zen opening source guards were updated for the envelope-first catalog requirement; shared preview form/data protections still pass. Scoped ESLint reports the same **4 pre-existing errors and 4 warnings** as the relevant HEAD sources (baseline checked through ESLint stdin); no new diagnostic is introduced. Browser interaction/visual QA is not claimed; Chromium remains unavailable in this environment.

### 1 October 2026 — Eternal Blossom flowering album redesign

**Owner request:** redesign Eternal Blossom following repository rules, design skills and Library resources; include sweet animations and downloadable artwork when needed.

**Implementation:** the existing photo-capable stable theme now uses blush/cream stationery, mulberry Playfair Display + Lora lettering, a gently tilted scalloped portrait, complete original transparent flowering branch/sprig, offset names and a folded paper envelope with a floral seal. Identity alternates two actual event portraits; Gallery adapts the shared photo album/lightbox into full-color prints with varied size and gentle overlap. Event/date/location/gift presentation is editorial rather than repeated bordered cards; countdown is an unboxed accent band. All 15 controls, optional genuine Our Story, narrative fields, event photo IDs/order/focus/crops, native Studio targets, shared RSVP/Wishes/Guest APIs, Maps, Gift and Music contracts remain in the same renderer. New selections use the Blossom preset; saved explicit palette/font and customer content remain authoritative. Catalog cards remain Cover-only, opened demos Envelope-first, and Studio editing retains its opening guard.

**Motion:** the existing Studio library reveals the cover photo upward, glides flowers/portraits and names from opposing sides, staggers gallery tilt-in and softly scales greeting/closing art. Motion wrappers isolate seal release, flap rotation and letter lift from native transforms. Saved OFF/animation settings and authored section timelines take precedence; reduced motion and keyboard opening skip the custom wait. Gallery fullscreen/arrow/Escape/swipe navigation stays immediate, without autoplay or animated countdown digits. Lazy discovery, image-load waiting, replay and preserved native/photo presentation use existing hooks; no dependency or second animation system is added.

**Area/commit:** `components/PublicInvitation/{EternalBlossomArtwork,EternalBlossomScene,SereinGallery,InvitationThemeScenes,UniversalInvitationTemplate}.tsx`, `eternal-blossom.css`, shared photo/native hooks, `lib/templates/{catalog,design,template-motion}.ts`, `public/templates/eternal-blossom/{blossom-branch,blossom-sprig}.webp`, Eternal/native regression tests, canonical §7.2.3b art-direction row, this PRD and `assets/templates/eternal-blossom/README.md` — commit containing this entry. Landing/Pintu, catalog application layout, Dashboard, backend and other theme designs are unchanged.

**Assets/review:** repository/Library inventory and pinned GPT Taste, Emil design/animate/review and Impeccable guidance informed the scoped theme. Generated cover/envelope/album references and actual alpha artwork were inspected; references are not website screenshots. The brief records all controls, reference extraction, provenance, sizes, responsive placement, existing effects/fallbacks and the Emil Before/After/Why source review. The two WebP cutouts total 200,274 bytes with original aspect ratios and clear alpha corners. Before push, incoming owner commit `31900e6` was preserved through rebase: its `bungapink1.webp` is byte-identical to the selected original branch, and the existing WebP derivative already uses those bytes. The PNG master is unchanged. Impeccable's bundled detector ran once over the new scene/artwork sources and returned zero findings. Bounded source polish corrected inherited Serein gallery columns/ratios, localized photo-editor wording, removed a no-op catalog editor target and tightened Cover rhythm. No whole-surface rendered approval is asserted.

**Observed validation:** all **265/265 tests PASS** (`node --import tsx --test --test-reporter=tap tests/*.test.mjs`); `npx tsc --noEmit` **PASS**; production `next build --webpack` **PASS**; `git diff --check` **PASS**. Scoped ESLint: **0 errors**, one pre-existing unused `onMoveAssetLayer` warning in the shared Universal renderer. The historical native-object source guard now follows the new lazy Eternal scene while retaining the protected/selectable assertions.

**Not established:** Chromium is unavailable, so browser screenshots, actual mobile/desktop motion feel, physical touch, authenticated Studio save/public/personal round-trip and deployment remain unverified. No browser/E2E, pixel-equivalence, production database migration or deployment PASS is claimed.

### 1 October 2026 — Modern Maroon editorial redesign

**Owner request:** redesign `modern-maroon` with stronger visual experimentation while keeping Undara rules first, using template assets and adding meaningful animation rather than repeating the same centered card composition.

**Design direction:** Modern Maroon is now treated as a fashion-editorial wedding issue rather than a generic maroon skin. The theme uses asymmetric portrait placement, oversized typography, right/left anchored information, deep maroon/ivory/champagne contrast, dense magazine-style photo mosaics, and restrained botanical/fabric artwork. Shared business behavior is unchanged.

**Template-owned assets:** the canonical `public/templates/modern-maroon/` artwork is now used directly across the invitation: flower cascade/cluster, fabric wave, petal fall, gold curve lines, minimal divider, watercolor background and leaf branch. `public/templates/modern-maroon/README.md` documents all ten assets and their intended roles. Shared landing ornament `branch-05.webp` remains a restrained engraved flourish where appropriate.

**Envelope & Cover:** both stages now have dedicated Modern Maroon compositions. The envelope uses an offset ivory stationery panel with a narrow photo strip, champagne rail, maroon block, watercolor/fabric atmosphere and personal-recipient copy. The Cover uses an off-axis large portrait on the right, an overlapping dark editorial name panel on the lower left, large translucent monogram, gold linework and restrained flower artwork. Existing Studio native-object targets remain granular and removable.

**Section composition:** Greeting uses a right-aligned letter block and oversized quote atmosphere; Identity overlaps two portrait scales rather than using an even two-column grid; Event uses a typographic split composition; Date & Time becomes a poster; Gallery uses a dense 12-column masonry-like editorial mosaic; Countdown is one segmented typographic strip; Location is right-anchored; RSVP/Wishes remain shared but receive Modern Maroon presentation; Gift becomes an offset account ticket; Closing uses large right-aligned names and a botanical flourish; Footer switches to a compact dark editorial signature.

**Motion:** Modern Maroon now has template-native default motion and photo motion in `template-motion.ts`. Cover media reveals laterally, couple portraits enter from opposing sides, gallery images use staggered tilt-in motion with subtle bounded parallax, and section objects use varied rise/fade/glide/reveal motion. Defaults yield to saved section-level animation/timeline settings and native-object overrides, and reduced-motion still disables ornamental interaction motion.

**Studio contract:** RSVP, Wishes, Gift, location actions, editable copy, section order/toggles, photo slots/crops, and native visual editing continue to use the shared engines. The default type pairing is now `Syne + Inter` for a more contemporary editorial character. Palette selection remains functional: section surfaces derive from `--inv-bg`, `--inv-surface`, and `--inv-soft` rather than locking the theme to one hardcoded maroon value.

**Files:** `components/PublicInvitation/modern-maroon.css`, `components/PublicInvitation/ModernMaroonArtwork.tsx`, `components/PublicInvitation/UniversalInvitationTemplate.tsx`, `components/PublicInvitation/InvitationThemeScenes.tsx`, `components/PublicInvitation/use-native-visual-animations.ts`, `lib/templates/template-motion.ts`, `lib/templates/catalog.ts`, `public/templates/modern-maroon/README.md`, `tests/modern-maroon-template.test.mjs`.

**Commits:** `a4558a406da62cc1976d51e6464c2a719eb68da8`, `1c4ae7e1e6bf7b6e39c12839ee99ebab6b29cd77`, `a7eefb52096013912e88ed72fa0e5961f30745ae`, `6f5b148436b738243704d9ab00c4fcb980d0c5fb`, `e68a4044fd312b04a0d3c5ad2c6f8ea11f2521fe`, `a13b1176951c3754552c579085e9fac2f437ee2e`, `46f507a6643375c4593d7e0d1835d10e7b4e12ee`, `8569e806c1fe40f0e78fb88aeb799c3c287e260f`, `4544877cea008c5683cf4ba9b0d604f8bc956717`, `95630696c76220bccacf8703835af5eaa4426bb8`, `8f3fbb5ce24756ce43b2762015e6ef96325c8ea4`, `0e72096bf6b22416de7cf5cf915d4a4528e8a939`, `730aa7a1f2661cc26407a20ef8b9420cc065f723`, `5cbaa38139c27048ce9d544b8a8e79eb6b15d482`, `dec9684cc5f462f67d0d0e88cf588fe38bc8f35b`, `bc5fecef4ca9bc22d3d98f40c66d0182243f097b`, `6952aa24a1b9d083f245414f2a47d8dc99fd61ab`, `4b92184f8a13a042bfe260a59ffdc87ac582ce62`.

**Validation:** source guards confirm the dedicated Modern Maroon section layouts, shared RSVP/Wishes/Gift wiring, canonical asset references, default motion registration, reduced-motion CSS, modern font preset and palette-aware section surfaces. The repository's raster-normalization workflow is scoped to public image changes and does not run for these code-only commits; no full GitHub `pnpm build` result is claimed here.

### 1 October 2026 — Modern Maroon motion flicker fix

Modern Maroon default native-object and photo entrance motion is now one-shot per mounted element. The shared entrance runtime still supports replay for themes that intentionally use it, but Modern Maroon no longer clears its played state or cancels active presentation when an element leaves the viewport. This prevents cover/section photos and artwork from flashing back to their entrance state while scrolling the tall preview modal. Explicit Studio motion replay events remain supported.

Files: `components/PublicInvitation/use-native-visual-animations.ts`, `components/PublicInvitation/use-photo-animations.ts`, `tests/modern-maroon-template.test.mjs`.

### 1 October 2026 — Botanical Ivory romantic editorial rebalance

**Owner request:** redesign `botanical-ivory` so the no-photo theme no longer leans too heavily on plants, while preserving its romantic wedding context, following the repository rules/design workflow/library-first approach, and adding purposeful animation.

**Design direction:** Botanical Ivory now reads as romantic ivory stationery first and botanical second. Warm ivory paper, editorial Rufina typography, intertwined-ring marks, ribbon geometry, ampersand seal, vow-like copy and deliberate negative space carry the romance. Existing transparent botanical artwork remains available but is intentionally reduced to small low-opacity accents on the envelope, Cover, Greeting/Closing and a quiet single-event identity detail instead of framing every section. Couple Identity is now typography-led; Event and Location use ring ornaments; the photo-free Gallery is no longer a herbarium and instead presents two swipeable romantic keepsakes (“Dua hati, satu janji” and “Satu hari, satu selamanya”) using rings/ribbon motifs.

**Motion:** the existing shared Studio/native motion system remains authoritative; no second animation engine was added. Cover names enter from opposing sides with a 60 ms stagger, ring marks soft-scale, supporting copy/date fade, Gallery keepsakes tilt in, and the remaining botanical accents only fade rather than “grow” across the page. Envelope release/letter lift continues through the existing `motion/react` scene with reduced-motion and OFF handling. Changing countdown digits remain still. Saved section timelines/native animation overrides continue to suppress template defaults.

**Compatibility and Studio contract:** stable key `botanical-ivory`, the 15-control invitation contract, no-photo slots, shared RSVP/Wishes/Gift/Maps/Music/data engines, editable copy, palette/font overrides and Cover-first catalog preview behavior are unchanged. Legacy Gallery native group/art keys (`specimenOne-group`, `specimenTwo-group`, `specimen-branch-art`, `specimen-fern-art`) are deliberately retained behind the new keepsake presentation so persisted Studio transforms/animation overrides continue to resolve. Decorative ring/monogram objects use native-object ownership; protected event/customer data remains protected.

**Area/commits:** `components/PublicInvitation/{BotanicalIvoryArtwork,BotanicalIvoryScene,BotanicalIvoryGallery,UniversalInvitationTemplate}.tsx`, `components/PublicInvitation/botanical-ivory.css`, `lib/templates/{template-motion,catalog,design,editable-copy}.ts`, `lib/invitations/language.ts`, and `tests/botanical-ivory.test.mjs`. Implementation commits: `850a207435ca1e0e09a136e9a5d6f2b8db42a357`, `f630db046ce0f5808406ff8452a30467f782e871`, `fe52d09703b5374e45cdb228e4a962e62bd5749e`, `9ef7c6f4ce38c2b5130aef5a9379567eef1915e1`, `dfe17ebf871cc2a90ead61de448600fe0b4a51ec`, `9b3755fdd8a63fa99397d08a971db4d7dff1b77a`, `e621737ebdf641cac6b81817d846109a025c7c33`, `a4d8f0453b9df789d26f17eece8f3e5b46b71c0d`, `0e11a125c2dc073c96f9de9985b17dfb5cd8409c`, `2920db5e40074016ccc58cd33bf9a0b92b841d20`, `f89d4a1087f5254a6d73f9f1739b10c571da2367`.

**Design workflow evidence:** current theme/shared renderer/assets and Studio motion primitives were inspected first. The scoped Undara design orchestrator and template rules drove the art direction; Emil design-engineering guidance was used for restrained transform/opacity motion, short stagger, keyboard immediacy and reduced-motion behavior. The runtime did not expose GPT Taste or Impeccable as executable installed skills, so no claim is made that those packages were run.

**Observed validation:** source-level regression inspection confirms the Gallery no longer imports/renders plant artwork, the no-photo catalog contract remains intact, legacy Gallery native keys are preserved, romantic ring/ribbon objects are native-owned, the shared renderer uses “Galeri Kisah” and the new footer monogram, Botanical default motion targets the new objects, ID/EN copy exists, and the Botanical regression test expectations were updated. Additional existing Studio/template/marketing source guards contain no stale Botanical herbarium/symbol/footer assumptions. A full local Node test run, TypeScript build, browser screenshot, authenticated Studio round-trip and deployment were not observed in this connector-only environment and are therefore not claimed as PASS.

### 1 October 2026 — Garden Light twilight garden editorial redesign

**Owner request:** redesign `garden-light` with broad visual freedom, library/skill guidance, permission to source additional assets if genuinely useful, and purposeful animation. Existing Garden Light assets were sufficient, so this pass reused the repository’s ten committed theme WebPs instead of introducing new third-party imagery or ambiguous licensing.

**Design direction:** Garden Light is no longer the generic “bright botanical” branch with repeated leaf sprigs and circular green decoration. It now tells a golden-hour-to-twilight garden celebration: pale sage and warm ivory move toward antique-gold light, real photography is framed editorially, the illuminated wedding arch acts as the Cover portal, and recognisable celebration objects create a different scene in each section. Default typography is now `Young Serif + Instrument Sans`; fresh/bare Garden Light selections use the new `gardenGlow` palette while previously saved explicit palette/font selections continue through the existing design-key resolver.

**Asset world:** the existing files `01_ornate_golden_birdcage.webp` through `10_romantic_lit_wedding_arch.webp` are now mapped deliberately instead of leaving the theme dependent on CSS leaves. Birdcage anchors the envelope and selected date/gift atmosphere; parasol supports Gallery/Wishes; lantern arrangements and hanging lanterns create warm-light accents; tea table supports Event; illuminated swing supports Identity/Closing; ivory bicycle supports Location; fountain supports Countdown; glowing garland supports Cover/Gallery; the lit wedding arch is the primary Cover signature. Decorative assets are native Studio objects and use full-object `object-fit: contain` presentation. Cover lantern and Gallery parasol placement was pulled back inside the viewport to avoid accidental object cropping.

**Envelope and Cover:** Garden Light now has a dedicated renderer rather than the old generic ThemeEnvelope/ThemeCover branch. The envelope layers a hanging lantern, birdcage and ivory letter with real recipient/name/date data and a short seal/letter release interaction. The Cover layers the complete illuminated arch and garland behind the real customer Cover photo, adds a restrained lantern arrangement, and uses an editorial name/date/caption panel. The catalog remains Cover-first while an opened invitation still begins at the envelope according to the shared product flow.

**Sections and shared engines:** Greeting, Identity, Event, Date & Time, Gallery, Countdown, Location, RSVP, Wishes, Gift and Closing receive different garden-prop accents rather than one repeated botanical treatment. Identity keeps the real `personOne`/`personTwo` photo slots; Gallery keeps every real customer Gallery photo and uses an asymmetric editorial grid; RSVP and Wishes continue through the shared form/message engines with the established Zen presentation mode; Maps, Gift copy action, countdown data, Music, event data, recipient data, section ordering/toggles and protected business content remain shared. No database, endpoint, payment, Guest or package contract was introduced.

**Motion:** Garden Light now owns default photo and native-object choreography in the existing Studio motion library. Cover photo reveals upward; couple portraits glide from opposite sides; Gallery photos tilt in with a short stagger. Arch, garland, lanterns, birdcage, section props, headings and closing signature use restrained rise/glide/fade/soft-scale motion based on spatial placement. Countdown values remain still. Garden Light viewport entrances are one-shot to avoid re-trigger flicker on long invitation scrolling, while explicit Studio replay remains supported by the shared runtime. The native runtime waits for Garden Light artwork images before entrance. Reduced-motion, native OFF, section animation/timeline overrides and keyboard opening can bypass the custom envelope wait immediately.

**Implementation:** dedicated files are `components/PublicInvitation/GardenLightArtwork.tsx`, `GardenLightScene.tsx`, `GardenLightGallery.tsx`, `garden-light.css`, `public/templates/garden-light/README.md`, and `tests/garden-light-template.test.mjs`. Shared integration touches `InvitationThemeScenes.tsx`, `UniversalInvitationTemplate.tsx`, `use-native-visual-animations.ts`, `use-photo-animations.ts`, `lib/templates/{template-motion,catalog,design,editable-copy}.ts`, `lib/invitations/language.ts`, `tests/native-visual-transforms.test.mjs`, and the Modern Maroon replay regression guard. Representative implementation commits: `7ed31b616c648acd05e60e2724563ec4298eed3c`, `9a1fe7df7238998146e50736c4a1db9a8839afe9`, `656476d7da5e482a252bd18b63dbd231f6b77ca6`, `8c585eb1f6bcadeddbbc1e5930ef55f753d45616`, `eb1a1439389006b48fc74cb40b9b93e1d4e6eed9`, `54d3767d9100a9a345d675fac04644e6f4d3354f`, `43c89f9aa383c0428d1a9018cf7fbe1676b44e79`, `4af358ffd894f8fbd6e34d4011d763c27d163b0b`, `0ab6a0b6912e6e5853ca1bdd787a0137ec8bbdd7`, `95fb2a5d7d17186afd869d0f07c91ba983e14e3d`, `cefecbff94d1de9cd497ebc552b36e9e6632acf8`, `fa5c6449522fa2c9c3805415067ca2139085ad5a`, `4d6ee2932e899d63f91edef171ecdb6a5152ddf0`, `89aeddac5a12c4765ed7f98fde0a2ae0c96a8eb6`, and `d8762fea6d0d2593b32ebe29d3861a8835b2b349`.

**Design workflow evidence:** the current Garden Light renderer, shared invitation engine, Studio native/photo animation hooks, catalog/design tokens and the complete Garden Light asset inventory were inspected before redesign. The repository’s Undara design orchestrator and `template.md` governed the work. GPT Taste/Emil/Impeccable were not exposed as executable installed runtime skills in this session; their pinned/upstream guidance informed layout variance, anti-generic composition, purposeful short motion, reduced-motion behavior and polish. No claim is made that unavailable packages were executed.

**Observed validation:** current-source assertions returned **20/20 PASS** for the scoped redesign contract: dedicated Garden renderer present; old generic Garden branch and BotanicalSprig condition removed; real Cover and Gallery photo slots preserved; Gallery renders all photos rather than slicing them; all ten Garden assets are mapped; full-object contain rules and non-negative Cover/Gallery prop placement are present; section artwork/Gallery integration resolves; `gardenGlow + youngInstrument` is the preset; photo/native motion defaults are registered; countdown value targets are absent from motion defaults; Garden native/photo entrance is one-shot; native motion waits for artwork; the old Garden native-editability regression was replaced with the new arch/garland/lantern/birdcage contract; reduced-motion CSS exists; and envelope OFF/timeline handling bypasses the custom wait. The generic InvitationFonts loader was inspected and loads catalog families dynamically, so no special loader branch was required for Young Serif/Instrument Sans.

**Not established:** the GitHub connector environment does not provide a local checkout/browser build runner here, and no GitHub Actions status/workflow run was observed for the redesign commits during this pass. Therefore no full Node test suite, TypeScript check, production build, browser screenshot, physical-touch test, authenticated Studio save/reload/public round-trip, deployment or rendered pixel-quality PASS is claimed.

### 1 October 2026 — Garden Light post-redesign hardening

A follow-up source audit after the twilight redesign fixed two integration details without changing the approved art direction or shared business behavior. Garden Light section ink no longer passes CSS expressions such as `var(...)` or `color-mix(...)` into the hex-only contrast helper; default sections now keep the active palette ink, while an explicit section background still uses `readableInk` against that concrete saved color. This preserves custom palette behavior instead of silently falling back to black.

The decorative firefly atmosphere on Envelope and Cover is now owned by `object:envelope:fireflies` and `object:cover:fireflies`. The generic native-decoration whitelist recognizes `firefly/fireflies`, so Studio Delete/Backspace can hide those decorations without touching protected content. Their template default is a single fade entrance; there is no continuous twinkle loop. English photo semantics were also completed for `Foto` and `Galeri foto`.

Follow-up commits include `8c64ee0eb259f1f9bf6644b8948fc004e16f3f20`, `6672a84638e3cd317d3fec06cb55747623101ab5`, `14fe7f2bd60490db8894131fa4821cb3a72c3526`, `447e5ac5ac368e78fca3f89308948e9134a15521`, `fffee5e9a5fc490e91d3aae63ccc792d157234a7`, `ab640e86eef9b0859239b576b2cee366607776d6`, `c6aebe7c2c1b24dd7115c498ca48c2836e50e357`, and `0214e78293a302812ae63d32434757bf4065cce4`.

### 1 October 2026 — Midnight Romance private midnight salon redesign

**Owner request:** after the Garden Light pass, redesign `midnight-romance` with the same Undara rules, skill/library-first workflow, broad visual freedom and meaningful animation. Ten Midnight Romance WebP assets were already committed to the repository before implementation, so this redesign uses the local asset set rather than introducing external stock.

**Design direction:** Midnight Romance is no longer the previous generic navy template built mainly from a moon, starfield and oval portrait. It now reads as an intimate private midnight salon: deep navy velvet, dark sapphire surfaces, burgundy, champagne-gold light, warm ivory text, baroque furniture, candlelight, reflective objects and restrained celestial ambience. Celestial imagery is secondary atmosphere; the emotional center remains the couple/event photography and romantic night setting. The default type pairing is `Bodoni Moda + Manrope`, and the fresh default palette is `midnightVelvet`.

**Asset world:** all ten committed WebPs are deliberately mapped: `01_ornate_candlelit_lantern.webp` for Envelope/Greeting; `02_baroque_chaise_lounge.webp` for Identity/Closing; `03_burgundy_light_garland.webp` for Envelope/Cover/Gallery; `04_navy_rose_wedding_arch.webp` as the primary Cover portal; `05_parisian_tea_table.webp` for Event; `06_celestial_rose_mirror.webp` for Identity/Gallery; `07_gothic_candelabra.webp` for Date & Time/RSVP; `08_golden_rose_carriage.webp` for Location; `09_crescent_moon_chandelier.webp` for Envelope/Cover/Countdown; and `10_sapphire_perfume_bottle.webp` for Wishes/Gift. Decorative assets use native Studio ownership and full-object `object-fit: contain` rendering.

**Envelope and Cover:** Midnight Romance now has a dedicated renderer. The Envelope layers a crescent chandelier, candlelit lantern, burgundy garland and a dark ivory-edged letter with protected recipient/name/date content and a short letter/seal release. The Cover layers the complete navy rose arch and chandelier behind the real Cover photo, uses a restrained burgundy garland near the lower composition, and places the names/date/romantic caption in an editorial panel. The old generic ThemeEnvelope configuration and the old moon/starfield Cover branch were removed.

**Sections:** shared invitation business/data engines remain authoritative. Couple Identity still uses real `personOne`/`personTwo` slots with crop/edit behavior, now styled as offset midnight portraits with motion-safe CSS `translate` rather than authored `transform`. Gallery keeps every customer photo in an asymmetric editorial grid and moves the celestial mirror outside the photo grid so decoration never covers customer media. Event, Date & Time, Countdown, Location, RSVP, Wishes, Gift and Closing use distinct salon props. Generic Calendar/MapPin/Gift icons are suppressed for Midnight because candelabra/carriage/perfume already provide the section cues. RSVP and Wishes continue through shared engines using the established Zen presentation mode; Maps/Gift copy actions, Music, countdown/event/recipient data, section order/toggles and protected content are unchanged.

**Motion:** Midnight Romance now owns default photo and native-object choreography through the existing shared motion library. Cover reveals upward; couple portraits glide from opposite sides; Gallery photos tilt in with a short stagger and subtle photo parallax; arch, chandelier, garland, salon props, section headings and closing names use restrained reveal/glide/fade/soft-scale entrances. Countdown values are intentionally excluded from default animation. Viewport entrances are one-shot alongside Modern Maroon and Garden Light to avoid scroll flicker on tall previews, while explicit Studio replay remains available. Native motion waits for Midnight artwork images. Reduced Motion, keyboard opening, native OFF and section animation/timeline overrides can bypass the custom envelope wait immediately.

**Files:** new dedicated implementation files are `components/PublicInvitation/MidnightRomanceArtwork.tsx`, `MidnightRomanceScene.tsx`, `MidnightRomanceGallery.tsx`, `midnight-romance.css`, `public/templates/midnight-romance/README.md`, and `tests/midnight-romance-template.test.mjs`. Shared integration touches `InvitationThemeScenes.tsx`, `UniversalInvitationTemplate.tsx`, `use-native-visual-animations.ts`, `use-photo-animations.ts`, `lib/templates/{template-motion,catalog,design,editable-copy,native-visual-transforms}.ts`, `lib/invitations/language.ts`, `tests/native-visual-transforms.test.mjs`, plus shared Modern Maroon/Garden Light one-shot guards.

**Representative commits:** `8129e48f3a1efcfdfca0b4622c60dde08d6a34ce`, `83abac674fa53182edfd06fc5fbfc718746155bb`, `4c115103a30acb8dca94c4ad6c978d67ef59fa5b`, `2a16bcd92a4003241e2bbd4212da4863c2c54768`, `4e9778b66e2893d9e17b01cf54339015e9d5ff67`, `6956278663a25db21fb622a531a4a54ac91eea35`, `8c734034cf21051fd7bb025a2c80b24fdce725d6`, `8828983d477645d530331aa0834a5522adbb9496`, `0806f84b5990d79ee4097b337c2eed4a33cf19f5`, `b9a2bdcc5fee1e09ee583bdf1d3294051258a4d1`, `6cd7346222414f620f0117f87c0fdc218038bab2`, `07d1d37489c6b8a2c1c4e77a79c273d8ba2639cf`, `ae0bbbb80975483fd2a6f64b90a1cd9b55d07ec4`, `7a6aa1f090369e800a93f098f5660a149abe0fe9`, `5e280d0a10d9894784acfa1ed1127c2c56de9153`, `2fb169f65393392f3ea84d5d14c15286aa694003`, `ae161e854d7c86b219d73c746f68827b79775c1a`, `6581b46bb7d267bfe7ec4d4280e52f99bbc2e7fb`, `911d1b6d05de5793927d831b9a36befc566d3ebf`, `a696e50984700c7a274fb0ed03c53ffb59c55605`, `486c64f9eaed7f3d0d584d0fabba93bb30adf8c4`, and `6cf5be5b07508c77bbc51204d9458e1d1a2245e1`.

**Design workflow evidence:** the current Midnight renderer, shared invitation engine, Studio native/photo motion hooks, current catalog/design tokens and the full local Midnight asset inventory were inspected first. The repository Undara design orchestrator and scoped template rules governed the implementation. GPT Taste/Emil/Impeccable are not exposed as executable installed runtime skills in this session; their pinned guidance informed composition variance, anti-generic layout, purposeful short motion, reduced-motion behavior and polish. No claim is made that unavailable packages were executed.

**Observed validation:** a current-source audit after the final polish returned **33/33 PASS** for the scoped redesign contract: dedicated renderer present; old generic Cover/Envelope branches removed; Cover and Gallery photo slots preserved; Gallery renders every photo and mirror decoration no longer overlays customer media; Midnight section/gallery/shared RSVP/Wishes/Maps/Gift integration resolves; generic Calendar/MapPin/Gift markers are suppressed; all ten assets are mapped with contain rendering; couple offsets use motion-safe `translate`; photo/native motion defaults are registered; countdown digits are not native motion targets; native/photo playback is one-shot and native waits for artwork; envelope OFF/timeline bypass exists; palette/font/catalog/copy/ID-EN translations resolve; night glow is a removable native decoration; and both old Midnight native regression plus shared one-shot guards are updated.

**Not established:** the container has no authenticated/project checkout and cannot resolve GitHub over the network, so a full local Node test suite, TypeScript production build, browser screenshot, physical-touch pass, authenticated Studio save/reload/public round-trip and deployment are not claimed. GitHub Actions/commit status should be checked separately when available.

### 1 October 2026 — Studio configurable Gallery controls

**Owner reference/request:** mengikuti referensi Viding Studio, menu Foto di sisi kiri membutuhkan pengaturan Gallery yang dapat mengurutkan foto, menyalakan/mematikan autoplay, memilih bentuk/presentasi Gallery, menentukan arah/jenis transisi foto, dan mengatur waktunya.

**Implemented direction:** kontrak foto event-scoped yang sudah ada diperluas, bukan dibuat subsystem baru. `PhotoAssignments` sekarang dapat menyimpan `gallerySettings` di token `photos=` yang sama dengan assignment/crop/motion: presentasi `template | carousel | stack | filmstrip | masonry`, autoplay, interval 2–12 detik, transisi `slide-left | slide-right | fade | zoom | rise`, dan durasi transisi 0.2–2 detik. Field baru bersifat backward-compatible; design key lama tanpa setting Gallery otomatis memakai `Default template`.

**Studio kiri / Foto → Galeri:** daftar foto yang dipilih dapat di-reorder melalui drag-and-drop atau tombol Naik/Turun. Panel yang sama menyediakan Gaya Galeri, Autoplay ON/OFF, Jeda Slide, Transisi Slide, Durasi Transisi, serta **Animasi Saat Muncul** memakai preset photo-motion Undara dengan Durasi dan Jeda Antar Foto. Semua perubahan memakai `change()`, sehingga mengikuti history Undo/Redo, dirty state, refresh draft dan Save yang sudah ada.

**Renderer:** `ConfigurablePhotoGallery` adalah renderer bersama yang hanya aktif bila presentasi bukan `template`; default tetap memakai Gallery authored masing-masing theme. Universal templates dan Romantic Rose sudah memakai resolver yang sama. Carousel dan Stack memiliki arrows, dots, counter, swipe, autoplay serta Pause/Resume. Autoplay berhenti saat hover/focus sementara tanpa membatalkan pause manual, dan tidak berjalan pada Reduced Motion. Filmstrip memakai horizontal scroll-snap; Masonry tetap merender seluruh foto.

**Motion isolation:** untuk mencegah konflik dengan existing `useInvitationPhotoAnimations`, state visibility slide berada pada outer figure sedangkan `data-invitation-photo-slot="gallery"` dan `data-studio-photo-id` berada pada wrapper foto di dalamnya. Dengan demikian entrance/parallax dapat bekerja pada foto tanpa membuat slide nonaktif muncul akibat inline opacity/transform. Identitas per-foto Studio tetap dipertahankan.

**Representative commits:** `45e42d4b72ebdb70cff853fa0f3ca1d73b2407e0`, `12d322450802190ca575de5e4dd3d4d8a15de43d`, `347225b0041f098f510d782899467df0c2da4f23`, `f45cc89da0a76535d53e9fc0a2424089d1444dbe`, `91658e5bb972c75f2b602156f7cbfad33b38ebb9`, `1ea6a571ba4e063dfed6f04f71b15219aafb307e`, `baf5532285b7114c0e1b32a8d35f4db7e4294b8a`, `dc5bbb10d6a3c195701f3443f491de2ec8495327`, `6ad49e89fe78b678742b26c54700afe82de62a76`, `c3e43de883e2a82dabaeb11186490de58f6be237`, `deca8d10117a7ec40e7cd660a2add9b6c9f9a395`, `6ec775f9bb3b78c55870980cb4c7fd758e704d10`, `80105b4a013f848eac68519fc5c1aedb54aec1d9`, `197a557f10064307ae7966b9ae48d48865e47599`, `d407d6b9170fc1fa48fec25e3390335d0dfdcfaa`, `3c75ff03cd8aa2675ed611825bb4616ef35c9b37`, `10e0c2b3530e20180017984c666c66810ed28bb7`, and `215b756a3b02c79639373d57504a7c4002708e8e`.

**Observed validation:** a scoped source audit after renderer/motion isolation returned **27/27 PASS** for model sanitization/serialization, legacy fallback, left-panel reorder/playback/transition/entrance controls, Designer history wiring, final-preview propagation, autoplay/reduced-motion behavior, entrance-wrapper isolation, Studio photo identity, all four custom layouts, Universal/Romantic Rose integration and regression coverage. Reorder indexing and touch-swipe indexing were additionally hardened for strict TypeScript/browser edge cases.

**Not established:** GitHub source access in this session does not provide a full local project/browser runner. Full TypeScript production build, Node test suite execution, rendered screenshot comparison, physical mobile swipe, authenticated save/reload/public round-trip and deployment are not claimed until observed separately.

### 1 October 2026 — Classic Pearl heirloom atelier redesign

**Owner request:** continue the invitation redesign sequence with `classic-pearl`, following the Undara rules/design workflow/library guidance and adding purposeful animation. The theme remains intentionally **photo-free**.

**Design direction:** Classic Pearl is no longer the old centered oval + gem composition. It now reads as an **heirloom couture / pearl atelier**: porcelain ivory, warm paper white, champagne gold, pearl lustre, bridal objects, engraving-like lines, generous negative space and Cormorant Garamond + Manrope typography. Romance comes from names, protected event identity, heirloom objects and editorial composition rather than forcing customer photography into a no-photo template.

**Envelope and Cover:** the dedicated Envelope keeps a traditional stationery ritual with real recipient/name/date data, bridal garland, candelabra, ivory letter and a short seal/letter release. The Cover deliberately breaks the recurring centered-card formula: a vertical ledger line establishes the left editorial column, large partner names are offset rather than sharing one centerline, the complete wedding arch sits on the right, chandelier enters from the upper-left, tiara anchors the lower-right, garland sits low as atmosphere, and a short pearl trail terminates the ledger. The previous `oval-frame`, gem hero and legacy generic Classic scene/envelope configuration were removed.

**Asset world:** all ten committed Classic Pearl WebPs are used through native Studio-owned objects: ornate candelabra, Victorian chaise, pearl baroque mirror, pearl perfume, gold pearl tiara, crystal chandelier, bridal tea table, ivory-gold wedding arch, bridal garland and golden carriage. Current section mapping intentionally varies props rather than repeating one ornament: Greeting=mirror, Event=tea table, Date & Time=candelabra, Countdown=chandelier, Location=carriage, RSVP=garland, Wishes=perfume, Gift=tiara, Closing=chaise. Full-object art uses `object-fit: contain`.

**Identity and Gallery:** Identity remains typography-led and photo-free, using mirror + tiara as the bridal focal point while partner names and parent lines remain protected event data. Gallery is honestly titled **Galeri Kenangan / Keepsake Gallery**, not a fake photo gallery. It uses three asymmetric editorial vignettes—promise/tiara, memory/perfume, reflection/mirror—rather than repeated cards or hidden photo slots. The shared configurable photo Gallery introduced in Studio is gated by `usesPhotos`, so stale/custom Gallery settings cannot turn Classic Pearl into a photo template.

**Shared engines:** RSVP and Wishes remain on shared Undara engines using the established Zen presentation style; Maps and Gift copy actions remain functional shared controls. Music, countdown, event/recipient data, section ordering/toggles, editable narrative copy, native transform ownership and public behavior are unchanged. Generic Calendar/MapPin/Gift icons are suppressed because themed candelabra/carriage/tiara objects already provide the visual cues. Decorative pearl/line/art objects can be hidden in Studio, while date, names, parents, recipient data and functional controls remain protected.

**Motion:** Classic Pearl uses the existing native motion runtime only. The ledger reveals vertically; chandelier glides from the left; arch glides from the right; garland reveals laterally; tiara soft-scales; partner names enter from opposing sides; pearl trail follows after the primary composition. Gallery promise/memory vignettes use short tilt-in entrances and the final mirror vignette rises more quietly. Countdown digits are excluded from native motion. Entrances are one-shot to avoid scroll flicker, native playback waits for artwork, and Reduced Motion / native OFF / section timeline overrides remain authoritative. The custom Envelope interaction uses transform strings + opacity so it does not fight the shared transform ownership model.

**Implementation:** dedicated files are `components/PublicInvitation/{ClassicPearlArtwork,ClassicPearlScene,ClassicPearlGallery}.tsx`, `components/PublicInvitation/classic-pearl.css`, `public/templates/classic-pearl/README.md`, and `tests/classic-pearl-template.test.mjs`. Shared integration touches `InvitationThemeScenes.tsx`, `UniversalInvitationTemplate.tsx`, `use-native-visual-animations.ts`, `use-photo-animations.ts`, `lib/templates/{template-motion,catalog,design,editable-copy,native-visual-transforms}.ts`, `lib/invitations/language.ts`, and shared native/motion regression guards.

**Representative commits:** initial implementation `12123459f095e3aac48639a6328ae591d06eb13c`, `f75538e7fdfe859dd4abdb4460a479ef7da11e5f`, `46a0405301a1545a418625dedccc415044c8fdbc`, `3d463d6d1010b34a753dc64fd02ffdb2df561ddd`, `1b5dea5de0ff59a0b279f1b202b71b1339b58e12`, `814586e2574be1813aec33ad2f8a835b4f9d4d9b`, `62ac85c7ade18c586d888193790ef286fe858ae5`, `f63463e96c54b8aad6da67e35c17f5aa9a415d7b`, `f564bf7e17e2a1e8ef8df7161dce11180f741242`, `311949739ddeb992ea046fff13a5b6478db688fa`, `6a28bc496ec77d2a6eec067a5a3f8cea26d215c3`, `e8f771021329dbbc916b5d42ca490af830757422`; final refinements preserved from the live main branch include `af7ff3aa8e6e36afed355042b70a36ba215e00ec`, `92ab38f9b8072f2e8d2f5cef9eb22934f9beaaf3`, `1d3111c6f9020dadfb655bd6f6962b3c508e1073`, `c7dc0267d11c14fd61feaf600d9af7988aad1672`, `969a6add96be8213023d996c141060e5be16c0ab`, `8b0a0dcb06bf1d726b94cd1f37789b1bdeb95d28`, `db16628831dc273712b7c7e66f974d16b27d7723`, `ec1d2257069bc8ef2f65610efaa88ec05d03d396`, `87f880b3faf56f632db4818b3c03e2714f8a3a71`, `6075e450fc435f3ae2fb755457b4e856e9ce5ff2`, and `3f1107a4e6e2dabc0bc3fbeb9606e6fc5bac21c1`. Those live refinements were synced rather than overwritten.

**Observed validation:** after syncing the concurrent refinements, a scoped current-source audit returned **45/45 PASS**. It confirms the dedicated renderer and restored Envelope composition, removal of the legacy oval/gem branch, no-photo contract, `usesPhotos` Gallery safety gate, all ten assets and contain rendering, asymmetric Cover/keepsake structures, protected identity data, shared RSVP/Wishes/Maps/Gift actions, themed icon suppression, current native motion groups with no countdown-value animation, one-shot/wait-for-images behavior, envelope OFF/timeline bypass, Reduced Motion CSS, removable pearl decoration ownership, palette/font/catalog/copy/ID-EN wiring, and current regression/README guards. The asymmetric-cover README follow-up is commit `de1018faf5e9fb3ddb8fcd4e863b621dcfa377f9`.

**Not established:** no full local production build, TypeScript project check, browser screenshot comparison, physical mobile interaction, authenticated Studio save/reload/public round-trip or deployment is claimed from this connector-only pass. GitHub Actions/status is checked separately when available.

### 1 October 2026 — Golden Art Deco Gatsby soirée poster redesign

**Owner request:** after confirming the completed Classic Pearl pass, redesign `golden-art-deco` and explicitly avoid another monotonous Cover that repeats the centered frame/arch/name structure used by other themes.

**Design direction:** Golden Art Deco is now a **1920s Gatsby theatre poster / soirée ticket** rather than the previous generic centered diamond-and-gem composition. It remains photo-free. Fresh designs use `decoNoir` (lacquered noir, warm ivory, champagne gold and deep antique-gold soft tone) with `Poiret One + Montserrat`. The Cover is intentionally asymmetric: a thin editorial rail runs down the left, stepped architectural bars occupy the upper-right, the fan emblem behaves like a restrained sunburst at upper-left, partner names form oversized offset poster typography in the left-middle, the second name steps inward, the date is vertical on the far-right, the complete Gatsby arch anchors the lower-right, and the champagne tower balances the lower-left. There is no centered photo frame, centered hero card, nested diamond stack, or generic gem ornament.

**Envelope:** Golden Art Deco now has a dedicated Envelope instead of the generic `ThemeEnvelope` branch. It is composed as a vertical admission ticket with twin rails, crystal drapery garland, candelabra, fan emblem, ticket notches, protected recipient/name/date content and a diamond seal. The ticket lifts briefly during opening. Reduced Motion, native Animation OFF, keyboard opening and authored section timelines can bypass the custom opening wait.

**Asset world:** all ten committed local WebPs are mapped through native Studio-owned objects: Gatsby archway, gold-pearl fan emblem, champagne tower, vintage gramophone, Art Deco oval mirror, golden crystal candelabra, paired Art Deco lanterns, Art Deco dessert table, ivory-gold chaise lounge and crystal drapery garland. Full-object art uses `object-fit: contain`. Section mapping deliberately varies its object vocabulary: Greeting=lanterns, Event=gramophone, Date & Time=candelabra, Countdown=champagne tower, Location=arch, RSVP=lanterns, Wishes=mirror, Gift=dessert table and Closing=chaise.

**Identity and Gallery:** Identity is typography-led and photo-free, with mirror/chaise/fan atmosphere while names and parent lines stay protected event data. The default Gallery is renamed **Vignette Malam / Evening Vignettes** and contains three different editorial scenes—`Sebuah Kilau` with champagne tower, `Sebuah Irama` with gramophone and `Sebuah Pantulan` with mirror. These are template-owned romantic/celebration vignettes, not fabricated customer memories, and no photo slot is created.

**Shared engines:** RSVP and Wishes remain on the shared Undara engines with the established Zen presentation style. Maps, Gift copy action, Music, countdown/event/recipient data, section ordering/toggles, editable narrative slots and public rendering remain shared. Generic Calendar/MapPin/Gift icons are suppressed for this theme because its candelabra/arch/dessert-table artwork already supplies the visual cue. Real event date, names, parents and functional data stay protected; decorative rails, stepped geometry and asset artwork can be hidden/transformed through Studio native-object ownership.

**Motion:** the theme uses the existing native motion library only. Envelope/cover rails reveal vertically, the stepped motif reveals laterally, Gatsby arch glides from the right, fan soft-scales, champagne tower rises, names enter from opposite sides and the vertical date reveals independently. Gallery first/second vignettes use short `tilt-in` entrances while the mirror scene rises more quietly. Countdown values are not native motion targets. Viewport motion is one-shot together with Modern Maroon/Garden Light/Midnight Romance/Classic Pearl to avoid scroll flicker; explicit Studio replay remains available, and native playback waits for Golden artwork images.

**Implementation:** dedicated files are `components/PublicInvitation/{GoldenArtDecoArtwork,GoldenArtDecoScene,GoldenArtDecoGallery}.tsx`, `components/PublicInvitation/golden-art-deco.css`, `public/templates/golden-art-deco/README.md`, and `tests/golden-art-deco-template.test.mjs`. Shared integration touches `InvitationThemeScenes.tsx`, `UniversalInvitationTemplate.tsx`, `use-native-visual-animations.ts`, `use-photo-animations.ts`, `lib/templates/{template-motion,catalog,design,editable-copy,native-visual-transforms}.ts`, `lib/invitations/language.ts`, `tests/native-visual-transforms.test.mjs`, and the shared one-shot motion guards.

**Representative commits:** `a548e1a8c9b4d7dc1382d19dfc23c475cd5feff1`, `1e7730f21090148862cd52d9a430296adb975b1c`, `c7f39f188f7182d692d3772cda3ac850b05f14e6`, `b08e8f507e00ec8bff10f8937130fadc784a5628`, `b3cf889db66daac206c24f6ab5f8a03d97143e7e`, `053bb6df27a731b478df6b2ec82632b986d3e9f1`, `975fd20da3174ad59c449a448782b1e421a65a56`, `e5741c145a937c48e3edb9bfa1768d32d1743679`, `c87c7459de2d4a60acb8c6da14054033a7eb8efb`, `bfb6d2b907b5a5b121503f2df2c13dcd7893bf67`, `514a5b3ca30d025db3247a44689447db5c891f92`, `5b3bcfa6006b66d8391e470742a0cae0c09acfba`, `8ed4845533a2a7ddd9778bbf54654d3a5b97cc86`, `ad28449b3c89e1c28a55ca936b6ee0fd1a6e5499`, `2815e76681dd7a67b859a446ba60355891cfb109`, `4b8b24e7b17e24b1e9ca28f152213064108440bc`, `7a96e0a323cbb35417d48a31c9e27ae1d1f0bc51`, and `a46bb42c226359711e3cdfd8945fbb84b4e90d85`.

**Design workflow evidence:** current Classic Pearl was inspected first as the immediate anti-monotony comparison, along with the old Golden renderer, shared Universal engine, motion/native ownership utilities and the ten newly committed Golden assets. The repository Undara design orchestrator, `template.md`, and Library-first rules governed implementation. GPT Taste/Emil/Impeccable were not exposed as executable installed runtime skills in this session, so no claim is made that those packages were executed; their pinned principles informed hierarchy variance, spatial motion restraint and the final anti-generic review.

**Observed validation:** current-source audits after the final integration returned **46/46 PASS** across dedicated scene routing, removal of the old Golden generic Cover/Envelope, root/section/Identity/Gallery integration, explicit anti-centered Cover geometry, all ten local assets, contain rendering, no-photo contract, shared RSVP/Wishes/Maps/Gift actions, generic icon suppression, `decoNoir + poiretMontserrat` preset, ID/EN copy, photo-free Gallery vignettes, native motion registration, no countdown-value motion, one-shot/wait-for-images behavior, Reduced Motion CSS, removable rail/steps ownership, replacement of the obsolete diamond/gem native regression, and alignment of shared Modern/Garden/Midnight/Classic motion guards.

**Not established:** this connector workflow did not provide a local project checkout/browser execution path for a full Node test suite, TypeScript production build, screenshot comparison, physical mobile interaction, authenticated Studio save/reload/public round-trip or deployment. Those are not claimed as PASS. GitHub Actions/commit status is checked separately when available.

### 1 October 2026 — Pencil Reverie illustrated memory journal redesign

**Owner request:** continue the template redesign sequence with `pencil-reverie`, keep its Cover visually distinct from the other invitations, use the available asset library (including reuse when useful), follow Undara template/design rules, and add purposeful animation.

**Design direction:** Pencil Reverie remains a **photo-free illustration template**, but the old full-scene illustration Cover has been replaced by an **editorial illustrated memory journal / love-letter desk**. A slightly rotated paper sheet creates the main field; oversized names sit off-axis on the left; the seated couple sketch anchors the lower-right; the streetlamp provides a tall right-side counterweight; camera, keepsake ticket, polaroid and ribbon form a restrained memory-object layer. `bungaandlampbg.webp` is no longer used as the Cover background. The result intentionally avoids the centered stationery, symmetrical poster, arch-first and layered botanical compositions already used by other Undara themes.

**Palette and typography:** the stable `pencil` palette is tuned to warm paper `#f2e9dd`, cream surface `#fffaf2`, graphite `#302c2a`, dusty-rose accent `#b96f7e` and muted paper rule `#d4bfb3`. Fresh Pencil designs now use `youngInstrument` (**Young Serif + Instrument Sans**) while persisted customer palette/font choices remain authoritative.

**Asset/library use:** all fifteen existing local Pencil WebPs stay active: `bingkai`, `couplesitting`, `streetlamp`, `camera1`, `loveticket`, `polaroidlove`, `ribbon`, `bookstack`, `casette`, `bycicle`, `loveballon1`, `bungaandlampbg`, `bungabg`, `bungabg1` and `sepedabg`. The redesign did not require remote artwork or fabricated customer photography. Section art uses complete contained objects and deliberately varies by section instead of repeating one decorative badge.

**Section composition:** Greeting becomes a narrow letter column; Identity combines the real couple/parent data with the seated sketch and paper-note structure; Event and Date & Time use offset journal scraps; the photo-free Gallery is a responsive six-column illustrated memory board with the existing keyboard/touch lightbox; Countdown pairs a small backward clock with static data cells; Location, RSVP, Wishes, Gift and Closing use different marginal keepsakes. Shared event data, optional Our Story, the 15 visibility controls, section ordering, RSVP, Wishes, Maps, Gift, Music and public behavior remain on the universal invitation engine.

**Studio ownership:** the new Cover preserves the established selectable group contracts `object:cover:heading-group`, `object:cover:illustration-group`, `object:cover:main-art` and `object:cover:copy-panel`, while child objects such as couple/lamp/camera/ticket/polaroid/ribbon remain independently selectable. Recipient/date/name/parent/business data remain protected through the existing native-content rules. Gallery preview clicks stay non-destructive in Studio.

**Motion:** Pencil Reverie now registers a dedicated `pencilReverieNative` map in the shared native motion runtime instead of relying on the old Pencil-specific IntersectionObserver reveal. Cover paper reveals first; copy rises; partner names slide from opposing sides; lamp reveals upward; couple soft-scales; ticket/polaroid tilt in; camera/ribbon glide in. Sections use short rise/slide/glide/tilt/reveal entrances. Playback is one-shot while scrolling, waits for local artwork, and honors native OFF, authored section timelines and Reduced Motion. Countdown values are explicitly not native motion targets. The opening letter keeps one short gesture-driven page-turn transition; the slow backward-clock hands remain the only thematic loop and are disabled by `prefers-reduced-motion`.

**Narrative:** Pencil gets explicit journal-themed editable defaults and matching ID/EN translation entries rather than inheriting only the older generic fallback. Greeting, attendance request, prayer wish and closing remain normal editable narrative slots.

**Implementation files:** `components/PublicInvitation/{PencilReverieScene,PencilReverieArtwork}.tsx`, `components/PublicInvitation/pencil-reverie.css`, `InvitationThemeScenes.tsx`, `UniversalInvitationTemplate.tsx`, `use-native-visual-animations.ts`, `lib/templates/{template-motion,catalog,design,editable-copy}.ts`, `lib/invitations/language.ts`, `tests/pencil-reverie.test.mjs`, and `public/templates/pencil-reverie/README.md`.

**Representative implementation commits:** `38fddcd0b0de6eac3f6e12ed82c4ed01b3673122`, `a2b85970e5bcb6b4c3f4d537aa8ac277b871912f`, `cd0c0f0d0929a0968b4181734b5abdcf2ab746f2`, `eff7ccf81aecb2a1f2b85a3accbd1ca06b75b110`, `59d79b40ae3631c5e6edfad7f967a62a97c1eeb1`, `7be8b841d8c4cf1c543e4c867df5e0b70a61f07e`, `28f03c74f2182f0f167f2b4567a6092e4bd4be32`, `37ed7095bae24407438ff92932abcc3ce05cb2b3`, `afa190595cc1f99148540249acbfeeb497f63236`, `e6479f1a92646c087b6b7094ee78371664944259`, `9394f19bcaab0d6543aa3df41f1eb2578421c325`, `141422c2b5569d63f72186c5f05a899b1ec91f8a`, `c195353d9627be61f72b8a3aa23da57ad8c8ed65`, `bae671fc4d346f9742a582f971f68f71477b1862`, `b2141fa39f812a07616e8564a206d3f22fec2fa9`, `4aac52dfd7021574e20d4b8f38f257a7d2985187`, `98b68a41451df87f91f1e041d3b86733aee1f835`, `304590de06ec130ff241b831631490b462a78a9a`, `09a02514d3b9dc3a610b5ffde232efedca682ce9`, and `7447b4246d630f7150e2c60f0ecd4d4bbf869de7`.

**Design workflow evidence:** the live Pencil renderer, universal invitation engine, all fifteen local Pencil assets, current Studio/native-motion contracts, `template.md`, repository Undara design orchestrator and neighboring redesigned themes were inspected before implementation. GPT Taste, Emil Animate/Review and Impeccable are not exposed as executable installed runtime skills in this session; their pinned upstream guidance was used as design/review guidance for anti-generic composition, restrained transform/opacity motion, reduced-motion behavior and final polish. No claim is made that unavailable packages were executed.

**Observed validation:** GitHub Actions **Build Validation** run `36872046484` on code HEAD `7447b4246d630f7150e2c60f0ecd4d4bbf869de7` completed successfully. `pnpm test` reported **324 tests, 324 passed, 0 failed**. Next.js **16.3.3** compiled successfully, and static generation completed **72/72 pages**. This validates the source regression suite and production build for the redesign.

**Not established:** that CI run does not prove rendered visual comparison, physical mobile interaction, authenticated Studio save/reload/public round-trip or deployment. Those are not claimed as PASS.


### 2 Oktober 2026 — customer invitation media dipindah dari public web root ke private persistent VPS storage

**Owner request:** benahi risiko foto/musik customer yang sebelumnya tersimpan di `public/uploads` sehingga siapa pun yang mengetahui static URL dapat membukanya, tanpa mewajibkan storage eksternal seperti R2/S3.

**Implementation:** upload `InvitationAsset` baru sekarang membuat asset ID opaque, tetap mendecode/mentranscode gambar dengan Sharp ke WebP, lalu menulis binary ke private data root di luar `public/`. Development fallback berada di `.undara-data`; production fail-closed bila `UNDARA_DATA_DIR` tidak diisi absolute path. Database menyimpan authorized media URL `/api/media/invitation-assets/<assetKey>`. Endpoint media memeriksa asset row + owner; akses non-owner membutuhkan invitation configured + published + paid, dan proteksi password memakai signed cookie yang sama dengan public renderer. Jalur personal invitation dapat memakai published personal token/access yang sudah ada. Audio melayani byte ranges. Delete customer asset menghapus private file; legacy static URL masih dapat dihapus dengan guard lama selama transisi.

**Legacy/deployment:** `.gitignore` kini mengecualikan `.undara-data/` dan `public/uploads/`. Script `scripts/migrate-invitation-media.ts` menyediakan dry-run secara default dan `--apply` untuk menyalin legacy binary ke private storage, memperbarui `InvitationAsset.url`/active `musicUrl`, lalu menghapus file publik. Template artwork di `public/templates` sengaja tidak dipindah karena memang bagian renderer publik. Production tetap belum dianggap selesai sampai persistent volume dikonfigurasi, legacy media dimigrasikan, backup/restore diuji, dan playback/browser E2E diverifikasi pada server target.

**Affected areas:** `lib/storage/private-media.ts`, `app/api/invitations/assets/{upload,[assetId]}/route.ts`, `app/api/media/invitation-assets/[assetKey]/route.ts`, `scripts/migrate-invitation-media.ts`, `.env.example`, `.gitignore`, `package.json`, dan regression tests.

**Representative commits:** `e6355b9c8bf31c078244c707d979b041284eda25`, `8fd0c1debd9deec28bf8c9bcbc6f14a075cbdb76`, `abadc44aa1a31aae94e1ea19106addd8e3cfa0e0`, dan `6435f0d93d707dc1a356814e1449ad66ea6a40c2`.

**Observed validation:** GitHub Actions **Build Validation** run `36984310873` pada code HEAD `6435f0d93d707dc1a356814e1449ad66ea6a40c2` selesai **success**: Prisma generate, seluruh source regression tests, dan Next.js production build lulus. **Orphan Audit** run `36984310816` juga selesai **success**. Ini memvalidasi source/build termasuk rewrite referensi legacy, bukan konfigurasi disk production atau migrasi data nyata.

**Not established:** belum ada bukti `UNDARA_DATA_DIR` production benar-benar menunjuk persistent volume, belum menjalankan legacy migration pada server customer data, belum menguji backup+restore media, dan belum menjalankan browser E2E upload → reload → publish/password/personal invitation → image/audio playback pada environment target.

### 2 Oktober 2026 — custom Designer job memakai foto user dengan akses event-scoped

**Owner request:** Owner/Designer yang mengerjakan custom invitation harus dapat memakai foto yang sudah di-upload user, tanpa membuka seluruh media customer kepada role staff atau menyalin file customer ke library Designer.

**Implementation:** custom request baru dibuat Owner dengan memilih User, event draft, dan Owner/Designer yang menangani. `DesignerTemplate.customInvitationId` mengikat draft custom ke tepat satu `Invitation`. Event harus configured, belum publish, dan sudah mempunyai template awal tersimpan. Template Studio custom memuat data event asli beserta `InvitationAsset` event tersebut, sehingga foto dapat dipilih untuk Cover/mempelai/gallery serta di-crop, diurutkan, diposisikan, dan diberi visual motion. Generic template master tetap memakai fixture/demo dan tetap membersihkan photo assignment customer saat disimpan.

**Media authorization:** endpoint private invitation media tidak memberikan bypass berdasarkan role saja. Customer owner tetap mempunyai akses event miliknya. OWNER/ADMIN hanya mendapat staff access bila ada custom job aktif untuk invitation tersebut; DESIGNER selain membutuhkan custom job aktif `DRAFT/REVIEW` juga wajib cocok dengan `designerId`. Template Mode tidak mengaktifkan upload/delete customer file dan tidak menyalin binary ke `DesignerAsset`. Saat Owner melakukan handoff, custom template diubah menjadi `ARCHIVED`; query media hanya menerima `DRAFT/REVIEW`, sehingga akses staff dari job itu berhenti otomatis. Custom-bound draft juga ditolak dari jalur Publish katalog.

**Workflow:** Owner panel sekarang mempunyai `Buat Custom Request` untuk memilih User → Event → Owner/Designer. Designer Dashboard menandai `Custom User` dan membuka draft yang ditugaskan. Designer mengirim hasil ke Owner untuk review; Owner dapat meminta revisi atau mengonfirmasi hasil ke event user yang sama. Owner yang menjadi author draft dapat handoff langsung. Jalur assignment lama dipertahankan untuk draft legacy yang belum memiliki binding.

**Database/deployment:** migration `prisma/migrations/20261002103500_custom_template_invitation_access/migration.sql` menambah nullable FK/index `DesignerTemplate.customInvitationId → Invitation.id`. Target production wajib menjalankan `pnpm db:deploy` sebelum fitur ini digunakan.

**Representative commits:** `ecd702235f5c8cf22745d833ba1a69ab704e9c17`, `748d9d16cc5e03c8e5bf357557380cecaeb76292`, `d89d7f8b632e5b13e125dc663246490def77e410`, dan `6ab2a2d9c217f16dc6bf64289f5bc210685cfcc3`.

**Observed validation:** GitHub Actions **Build Validation** run `36997144519` pada code HEAD `6ab2a2d9c217f16dc6bf64289f5bc210685cfcc3` selesai **success**: Prisma generate, source regression tests termasuk custom-media guards, dan Next.js production build seluruhnya lulus.

**Not established:** migration belum dibuktikan diterapkan pada database production, belum ada browser E2E nyata Owner → Designer → review → handoff dengan file customer pada server target, dan full cross-tenant authorization audit Undara masih merupakan launch blocker terpisah.


### 2 Oktober 2026 — authorization/event isolation hardening pass

**Owner request:** lanjutkan blocker authorization setelah private media/custom Designer access, dengan prinsip bahwa User A tidak boleh dapat membaca atau mengubah resource User B hanya dengan mengganti ID API.

**Implementation:** source-level audit menemukan beberapa fallback/role boundary yang terlalu longgar walau sebagian besar route sudah memakai owner scoping. `/api/guests` sekarang membutuhkan event eksplisit (kecuali mode `all=1` yang memang account-scoped); `/api/guests/export` wajib menerima `invitationId` dan memverifikasi `id + ownerId`; legacy `/api/wedding-tables` tidak lagi memakai wedding event pertama akun dan setiap create/update/delete sekarang diturunkan dari event/table yang benar; legacy `/api/packages` juga wajib menunjuk `invitationId` milik customer dan tidak membuat blank event otomatis.

**Role boundary:** `/api/admin/operations` sebelumnya menerima `FINANCE`, sehingga role pembayaran dapat membaca surface administrasi customer/event dan menjalankan perubahan non-payment. Boundary tersebut dipersempit menjadi `OWNER/ADMIN`; `FINANCE` tetap diterima di `/api/admin/payments` yang memang domainnya.

**Mutation-origin defense:** semua route privat yang memakai sesi login dan mempunyai `POST/PUT/PATCH/DELETE` sekarang diwajibkan memakai `isTrustedMutationOrigin`. Guard ditambahkan pada event save/create/delete, guest/seating, customer media upload/delete, Personal Invitation, WA Blast/template WA, Usher/check-in/QR, profile/avatar, dashboard preference, dan route privat legacy yang tersisa. Test `tests/private-api-origin-guard.test.mjs` melakukan recursive audit terhadap `app/api/**/route.ts` dan membuat CI gagal bila private session mutation baru lupa origin guard.

**Payment ownership integrity:** customer invoice detail/history sekarang mengharuskan `PaymentOrder.userId = current user` sekaligus `PaymentOrder.invitation.ownerId = current user`. Admin/Finance activation mengambil owner event dan memblokir order yang `userId`-nya tidak cocok dengan `Invitation.ownerId`, sehingga row korup/manual tidak dapat menghasilkan entitlement atau WA quota lintas akun.

**Regression coverage:** `tests/tenant-isolation.test.mjs` mengunci event-scoped Guest/export/table/package behavior, Finance-vs-admin boundary, custom-media scoping, private mutation origin guards, dan payment order ownership integrity. Source guard ini adalah defense-in-depth dan regression prevention; ia bukan pengganti E2E dua akun.

**Representative commits:** `4a028e80e2dd370c5f7197ac7a0354be65b4b49c`, `8e245f6e1fdb1627dae5937d776aa33cb1b409db`, `5213c8c94efc6e4a021b373183f43347394fb616`, `4dc41bdb850bdef9e270c85b261f2e37843cbb77`, `1d2a9d492fc1c8197a799232746c3b125b738a77`, `46693b246d9c2bd766821e3cf07cc7c0a8e46a64`, dan `9b46f46fe401aa5dcd2ed18e9ad3e1205aa7496e`.

**Observed validation:** GitHub Actions **Build Validation** run `37001082730` pada code HEAD `9b46f46fe401aa5dcd2ed18e9ad3e1205aa7496e` selesai **success**: Prisma generate, seluruh source regression tests termasuk recursive private-mutation audit, dan production build lulus. **Orphan Audit** run `37001082710` juga **success**.

**Not established:** blocker authorization belum dianggap selesai penuh sampai production-like negative E2E dijalankan memakai sedikitnya Customer A dan Customer B untuk event, asset, guest, table/seating, Personal Invitation, WA Blast, payment, QR/check-in, plus role matrix Admin/Owner/Designer/Editor/Finance. Build/source audit tidak menggantikan pengujian request nyata terhadap PostgreSQL.

### 3 Oktober 2026 — library musik Studio dapat dibrowse, didengarkan dan dipilih

**Owner request:** cek repo/handoff/chat sebelumnya, benahi rencana secara bertahap dan hasilkan commit kecil yang teruji. Audit canonical PRD pada baseline `e31a42e` mengonfirmasi Undara, general-event, tanpa limit 3 event, event-scoped entitlement, serta private persistent media sudah menjadi aturan aktif. Snapshot chat/file lama tidak menggantikan source repo.

**Implementation:** `lib/templates/music.ts` kini mendaftarkan seluruh 14 audio bundled satu kali, menyertakan judul/artis untuk pencarian, mempertahankan musik default lama, dan memberi Velvet Horizon mapping eksplisit tanpa mengubah lagunya. `MusicPanel.tsx` menampilkan Koleksi Undara, Bawaan Tema, Musik Aktif, Unggahan event, serta legacy saved music. Satu player preview dimulai dari gesture Dengarkan; audition tidak memanggil setter pilihan musik. Pemilihan radio memakai state/musicUrl dan API Simpan Desain/Simpan Draft yang sudah ada. Kuota upload serta akses event/custom tetap tidak berubah.

**Playback:** player Studio/undangan/marketing memakai konstanta event bersama dari `lib/invitations/music-playback.ts`; mismatch event `dc-*` vs `undara-*` diperbaiki. Preview menghentikan player lain, tidak autoplay, mendukung retry dan pause ketika panel keluar/tab tersembunyi. Gesture biasa tidak menyalakan kembali ambience selama preview bermain; play marketing eksplisit menggantikan preview.

**Affected areas:** `components/InvitationStudio/{MusicPanel,DesignerPanels,InvitationDesigner}.tsx`, `components/{Layout/MarketingAudio,PublicInvitation/InvitationMusic}.tsx`, `lib/templates/music.ts`, `lib/invitations/music-playback.ts`, `tests/studio-music-library.test.mjs`, serta aturan scoped `studio.md` dan status `checklist.md`.

**Implementation commit:** [`1d77985fbce5c06bb918cb001fca76644be8ce4d`](https://github.com/wanzy0808/Undara/commit/1d77985fbce5c06bb918cb001fca76644be8ce4d) — `fix(studio): restore shared music library and track previews`.

**Observed validation:** 7 regression tests baru memeriksa isi library terhadap file MP3 nyata/signature, default semua READY theme, shared resolution, render radio/default/legacy/ID/EN, serta quota upload. Source akhir batch ini lulus 366/366 regression tests melalui `node --import tsx --test tests/*.test.mjs`, lint file baru, TypeScript, Prisma generate, dan Next.js 16.3.3 production build (72/72 static pages). Wrapper `pnpm test` tidak dipakai lokal karena CLI tsx tidak dapat membuat IPC socket di runtime ini; loader Node menjalankan suite yang sama.

**Not established:** browser Chromium tidak tersedia di runtime; tidak ada klaim browser/audio-device QA, authenticated Save/reload/public round-trip, deploy, database migration, konfigurasi persistent volume, atau backup/restore production.

**Checkpoint GitHub (3 Oktober 2026):** code commit `1d77985` telah tersimpan pada `main`. [Build Validation run 37078220318](https://github.com/wanzy0808/Undara/actions/runs/37078220318) dan [Orphan Audit run 37078220311](https://github.com/wanzy0808/Undara/actions/runs/37078220311) keduanya **completed/success**. Log job `111072744761` mengonfirmasi **366 tests, 366 passed, 0 failed**, Prisma generate, Next.js compile/TypeScript, dan **72/72 static pages**.

**Plan checkpoint:** commit dokumentasi `docs: align launch plan with verified repository evidence` memperbarui `checklist.md` agar email/reset/rate-limit yang sudah diimplementasikan tidak kembali menjadi tugas membangun ulang. Pemeriksaan source meliputi `lib/notifications/email.ts` serta route login/register/resend/forgot/reset. Pengiriman email nyata, konkurensi PostgreSQL, session verification, rate-limit production, storage migration, restore, tenant E2E dan browser musik tetap open. Validasi batch dokumentasi: source cross-check dan `git diff --check`; tidak ada perubahan kode atau klaim deployment baru.

### 3 Oktober 2026 — Simpan Desain menolak referensi upload musik yang tidak tersedia

**Owner request:** bereskan Studio terlebih dahulu, satu checklist dan commit kecil per batch.

**Problem/fix:** guard musik pada PUT `/api/invitations` hanya mengenali `/uploads/music/`, padahal upload baru memakai URL privat `/api/media/invitation-assets/`. `assertInvitationMusicAsset` kini memeriksa kedua jalur sebagai aset AUDIO milik owner dan event yang sama, setelah row lock Invitation diperoleh dan sebelum update. Referensi audio terhapus, audio event/customer lain, serta file IMAGE ditolak dengan HTTP 409 dan pesan yang diteruskan Studio. Koleksi bundled, pengosongan pilihan, dan URL musik eksternal warisan tetap kompatibel.

**Affected files/commit:** `app/api/invitations/route.ts`, `lib/invitations/music-selection.ts`, `tests/studio-music-save.test.mjs`, `checklist.md`, dan `prd.md` §7.2.3c/Appendix A; commit batch ini berjudul `fix(studio): reject unavailable private music on save`.

**Observed validation:** 7 regression tests baru menjalankan validator dengan fixture aset lintas event/customer, simulasi delete sesudah load, IMAGE, default/legacy, penanganan error API oleh Studio, dan wiring guard di dalam lock. Suite lokal lulus **373/373**, lint helper lulus, Prisma generate dan TypeScript lulus, serta build Next.js 16.3.3 lulus **72/72** static pages. Tidak ada perubahan skema atau migrasi database.

**Not established:** fixture validator bukan bukti transaksi PostgreSQL nyata atau authenticated Save/reload/public E2E. Instalasi Chromium dicoba tetapi unduhan binary gagal; QA browser/audio dan produksi tetap terbuka.

**Commit/CI checkpoint:** [`31b197a13bef5adc2ccb7bfcf8fe12e126972e9f`](https://github.com/wanzy0808/Undara/commit/31b197a13bef5adc2ccb7bfcf8fe12e126972e9f) tersimpan pada `main`; [Build Validation 37082214521](https://github.com/wanzy0808/Undara/actions/runs/37082214521) dan [Orphan Audit 37082214520](https://github.com/wanzy0808/Undara/actions/runs/37082214520) selesai success.

### 3 Oktober 2026 — pan Studio tidak tersangkut setelah fokus/gesture terputus

**Problem/fix:** keyup Space sebelumnya hanya didengar canvas, sehingga pindah fokus sebelum Space dilepas dapat meninggalkan mode pan aktif. Gesture juga tidak dibersihkan saat window blur, tab hidden atau pointer capture hilang, dan pointer kedua dapat mengganti sesi pertama. Controller pan kini memiliki cancel terpisah dari pointer-up normal, lifecycle listener global yang dibersihkan saat unmount, serta satu pointer aktif. Cancel tidak menelan klik seleksi berikutnya. Space pada tombol Amplop/Isi dan kontrol interaktif tidak lagi diprevent oleh shortcut pan.

**Affected files/commit:** `components/InvitationStudio/{studio-canvas-pan.ts,useStudioCanvasPan.ts,InvitationDesigner.tsx}`, `tests/{studio-canvas-pan,studio-ui-cleanup}.test.mjs`, `studio.md`, `checklist.md`, dan Appendix A ini; commit batch berjudul `fix(studio): release canvas pan after interrupted gestures`.

**Observed validation:** 9 regression tests baru mengeksekusi controller/lifecycle dengan fixture viewport dan EventTarget: scroll dua arah, pointer kedua, threshold drag/click, cancel, capture hilang, Space keyup di luar canvas, blur, tab hidden dan listener cleanup. Wiring canvas serta guard tombol diperiksa pada source. Suite lokal lulus **382/382**, lint controller/hook, Prisma generate, TypeScript dan build Next.js 16.3.3 **72/72** static pages lulus.

**Not established:** tes fixture bukan QA browser pointer/touch, device, parity visual layer/resize/rotate atau save/public round-trip. Tidak ada perubahan layout, koordinat desain tersimpan, skema maupun deployment.

**Commit/CI checkpoint:** [`a85b0efa5237aaa257cc6ac04fc35d77f5c319e4`](https://github.com/wanzy0808/Undara/commit/a85b0efa5237aaa257cc6ac04fc35d77f5c319e4) tersimpan pada `main`; [Build Validation 37082869495](https://github.com/wanzy0808/Undara/actions/runs/37082869495) dan [Orphan Audit 37082869490](https://github.com/wanzy0808/Undara/actions/runs/37082869490) selesai success.

### 3 Oktober 2026 — shortcut Studio dibatasi ke canvas dan Undo/Redo keyboard terhubung

**Problem/fix:** listener shortcut layer sebelumnya berjalan di seluruh window ketika ada objek terpilih; berpindah fokus ke rail/panel luar tidak menghentikan Delete/clipboard. Guard sekarang mensyaratkan target berada di viewport canvas dan tidak sedang mengetik. Contenteditable kosong/plaintext-only ikut dilindungi. Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z dan Ctrl+Y pada canvas memakai fungsi Undo/Redo desain yang sama dengan toolbar, melalui handler React saat ini agar tidak menangkap history lama. Busy state, komposisi IME, event yang sudah ditangani dan seleksi teks dihormati.

**Canonical alignment:** §7.2.0d kini mengikuti kontrak canvas bersama Amplop/Isi pada `studio.md`, bukan aturan Cover-only dan limit 12 layer yang sudah digantikan oleh capability/layer contract §7.2.0b. Tidak menambah limit baru atau mengubah clipboard OS.

**Affected files/commit:** `components/InvitationStudio/{studio-canvas-shortcuts.ts,InvitationDesigner.tsx}`, `tests/{studio-canvas-shortcuts,studio-ui-cleanup}.test.mjs`, `studio.md`, `checklist.md`, dan `prd.md` §7.2.0d/Appendix A; commit batch berjudul `fix(studio): scope canvas shortcuts and enable keyboard history`.

**Observed validation:** 6 regression tests baru memeriksa mapping keyboard Ctrl/Cmd, redo, shortcut browser lain, IME/Alt/defaultPrevented, target di dalam/luar canvas dan text-control guard dengan fixture, serta wiring ke action React saat ini. Source akhir lulus suite lokal **388/388**, lint helper, Prisma generate, TypeScript, dan Next.js 16.3.3 build **72/72** static pages.

**Not established:** QA keyboard/pointer browser terautentikasi, perubahan desain → Save → reload → public, dan parity visual masih terbuka. Implementasi keyboard memakai history desain yang sudah ada; tidak mengubah model history atau skema database.

**Commit/CI checkpoint:** [`fe081a5c2fb1eca1976f22f374580505a3619cad`](https://github.com/wanzy0808/Undara/commit/fe081a5c2fb1eca1976f22f374580505a3619cad) tersimpan pada `main`; [Build Validation 37083395706](https://github.com/wanzy0808/Undara/actions/runs/37083395706) dan [Orphan Audit 37083395665](https://github.com/wanzy0808/Undara/actions/runs/37083395665) selesai success. Log job `111088562413` mengonfirmasi 388 tests, 388 pass, 0 fail dan build 72/72 halaman.

**Plan checkpoint Studio:** sesuai arahan owner “beresin Studio dulu”, `checklist.md` mendahulukan QA Studio dan memisahkan resize/rotate, layer, pan, keyboard serta toolbar follow menjadi item tersendiri. Musik Save/reload/public dan seluruh browser QA tetap open. Commit dokumentasi `docs: prioritize Studio QA and record verified fixes` hanya memperbarui `checklist.md` dan checkpoint Appendix A; validasi `git diff --check`, tanpa perubahan source atau klaim QA/deployment baru.

### 3 Oktober 2026 — editing Foto dipusatkan di inspector kanan

**Owner request:** menu Foto masih mempunyai pengaturan editing di kiri; pindahkan pengaturan editing ke kanan.

**Implementation:** `PhotoPanel` kini berisi koleksi/upload dan pemilihan role/aset saja. Fokus/crop/rasio/posisi/zoom serta urutan/gaya/autoplay/jeda/transisi Galeri memakai `PhotoEditingControls` di dalam `PhotoSlotInspector` kanan. Entrance/parallax tetap memakai satu motion inspector; kontrol Galeri yang sebelumnya menduplikasi motion di kiri dihapus. Menu Foto dan pemilihan slot/aset memanggil seleksi foto bersama, melepas seleksi/crop lama dan membuka properti yang sesuai. Slot mengikuti capability template/kategori; template tanpa foto tidak memperoleh inspector foto dari aksi menu tersebut.

**State/interaction:** callback existing `change()` untuk crop, fokus, urutan dan gallerySettings diteruskan melalui `StudioSelectionInspector`; token `photos=`, history, refresh draft, Save dan renderer tetap dipakai bersama. Kontrol editing dinonaktifkan saat save/loading, tombol tutup tetap tersedia dan membersihkan mode crop. Drag urutan Galeri berhenti di inspector agar tidak masuk ke handler drop aset canvas. List urutan mempunyai scroll terbatas; kontrol memakai shared Button, semantic tokens dan target sentuh 44px.

**Canonical update:** §7.2.7b dan aturan Foto/Galeri `studio.md` kini menetapkan lokasi editing di kanan. Pilihan/upload/assignment tetap di kiri; urutan/playback foto merupakan pengecualian eksplisit terhadap pengelompokan fungsi umum. Histori Gallery 1 Oktober menyimpan lokasi lama sebagai jejak implementasi, bukan aturan aktif.

**Affected files/commit:** `components/InvitationStudio/{PhotoPanel,PhotoEditingControls,PhotoSlotInspector,StudioSelectionInspector,InvitationDesigner}.tsx`, `studio.css`, `tests/{studio-photo-inspector,gallery-settings,studio-ui-cleanup}.test.mjs`, `studio.md`, `checklist.md` dan `prd.md`; commit batch berjudul `refactor(studio): move photo editing controls to right inspector`.

**Observed validation:** 6 regression tests baru merender panel kiri/inspector kanan: tidak ada editing di kiri, crop tersimpan, urutan Galeri dan filter ID/aset, playback conditional, ID/EN dan disabled saat save, serta wiring seleksi/callback. Source akhir lulus **394/394** regression tests, lint empat file panel/inspector, Prisma generate, TypeScript dan Next.js 16.3.3 build **72/72** static pages. Tidak ada perubahan skema atau API penyimpanan.

**Not established:** render SSR dan pemeriksaan source bukan QA browser visual/pointer/mobile, audio nyata, atau authenticated Save → reload → public. Item tersebut tetap terbuka pada checklist.

### 3 Oktober 2026 — copy menu Studio ringkas dan terbaca

**Arahan owner:** kurangi tulisan kecil dan penjelasan di tombol edit. Kartu Foto kini memakai nama slot/thumbnail tanpa deskripsi/status berulang; tombol assignment dipendekkan menjadi Otomatis, Kosongkan dan Semua foto. Petunjuk panjang Teks/Aset/Musik/Warna, subtitle Canvas Kosong, metadata folder/format berulang dan penjelasan teknis GSAP dihapus. Hint pemilik isi di kanan disingkat; penjelasan autoplay yang disabled tersedia lewat tooltip/nama deskripsi aksesibel.

**Readability/scope:** label editor 8–11px menjadi minimal 12px, label aksi/kartu utama 14px. Perubahan CSS terbatas pada shell/kontrol Studio; tipografi artwork undangan tetap milik renderer masing-masing. Batas upload, kuota, error/state kosong, nilai kontrol, nama aksesibel serta fungsi/history/persistence tetap tersedia. Aturan aktif diperbarui pada §7.2.1d dan `studio.md`.

**Affected files/commit:** panel Foto/Teks/Aset/Musik/Warna/Tema, inspector aset/teks/copy/RSVP/native/section, kontrol crop/stage dan `studio.css` di `components/InvitationStudio`; assertion copy pada delapan file regression tests; `studio.md`, `checklist.md` dan `prd.md`. Commit batch berjudul `refactor(studio): simplify menu copy and improve readability`.

**Observed validation:** suite **394/394** tes lulus setelah assertion kalimat lama diperbarui; Prisma generate, TypeScript dan Next.js build **72/72** halaman lulus. Lint **13** file TSX berubah lulus. Dua file lainnya (`AssetPanel.tsx`, `StudioPhotoCropOverlay.tsx`) masih memiliki masing-masing satu error `react-hooks/set-state-in-effect`, ditambah satu warning dependency pada crop; menjalankan lint pada source commit parent mengonfirmasi temuan yang sama sebelum batch ini. Tidak ada perubahan skema/API.

**Not established:** QA visual browser pada desktop/mobile Light/Dark, ID/EN dan interaksi live belum dilakukan; checklist tetap terbuka. Kelulusan lint seluruh repo tidak diklaim.

### 3 Oktober 2026 — label pengembalian foto ke bawaan

**Keputusan owner:** ganti Otomatis menjadi **Kembali ke bawaan** (ID) / **Back to default** (EN). Label singkat ini menjelaskan aksi kembali ke pilihan bawaan tanpa menambah deskripsi tombol. Nama aksesibel menyebut label yang sama dan slot terkait; callback assignment/crop tetap sama.

**Affected files/commit:** `components/InvitationStudio/PhotoPanel.tsx`, `tests/studio-photo-inspector.test.mjs`, `studio.md`, `checklist.md` dan `prd.md` §7.2.7b/Appendix A; commit batch berjudul `fix(studio): clarify photo default button label`.

**Observed validation:** **6/6** regression tests Foto lulus, termasuk visible label/nama aksesibel ID dan EN; lint `PhotoPanel.tsx` dan `git diff --check` lulus. Perubahan hanya copy, tanpa perubahan penyimpanan/schema/API. QA visual browser tetap terbuka.

### 3 Oktober 2026 — seleksi frame foto mempelai dan crop eksplisit

**Masalah/perilaku:** pilihan role Foto tidak menavigasikan canvas dari Amplop ke Identitas; handler foto juga memulai crop bersamaan dengan seleksi frame dan menutup canvas mobile. Pemilihan menu sekarang membawa viewport ke section yang sesuai, klik foto mempertahankan canvas untuk memilih frame, dan tombol Crop di inspector kanan memulai crop secara eksplisit. Mode Selesai tetap mengembalikan handle frame yang memakai engine drag/resize/rotate native bersama.

**Target readiness:** observer handle kini mencari ulang target saat DOM renderer dimuat/diganti, memperbarui ResizeObserver ke node terpilih, menyatukan event scroll/resize/mutasi per frame dan membersihkan semua subscription/frame saat seleksi berubah atau komponen unmount. Tidak menambah engine transform atau token penyimpanan baru; `photo:personOne` dan `photo:personTwo` tetap memakai transform terpisah pada `nativeVisuals`, crop pada `photos`. Memilih role tidak mengubah visibility section.

**Affected files/commit:** `components/InvitationStudio/{InvitationDesigner,PhotoEditingControls,PhotoSlotInspector,StudioSelectionInspector,StudioNativeTransformHandles}.tsx`, helper baru `studio-native-target.ts`, `tests/{studio-native-target,studio-photo-inspector,native-visual-transforms}.test.mjs`, `studio.md`, `checklist.md` dan `prd.md` §7.2.7b/Appendix A; commit batch berjudul `fix(studio): restore portrait frame editing`.

**Observed validation:** 6 tes baru memeriksa mount portrait yang terlambat, measurement yang digabung per frame, pelepasan/penggantian target, cleanup, inspector kedua portrait serta codec/CSS transform independen. Suite lokal **400/400**, TypeScript, lint lima file panel/handle/helper dan build **72/72** halaman lulus. Build pertama mengalami panic saat membaca cache persistence Turbopack; cache tersebut dipindahkan ke scratch dan rebuild dengan cache baru lulus tanpa perubahan source tambahan.

**Not established:** tidak ada browser untuk QA gesture visual/pointer/touch, interaksi crop nyata atau authenticated Save → reload → public; item checklist tetap terbuka. Tidak ada perubahan schema/API, data acara atau master template.


### 3 Oktober 2026 — klik background untuk properti section

**Masalah/perilaku:** pan background menangkap pointer sejak pointerdown; tap dapat ditargetkan ulang ke viewport canvas sehingga seleksi section hilang. Background pan kini menunggu gerakan >3px sebelum capture/scroll, sedangkan Space mempertahankan pan eksplisit. Pending tap dibersihkan saat pointerup/cancel di luar canvas, blur dan unmount. Klik section melepas seleksi native/foto dan membuka kembali inspector kanan; kontrol Latar dipindahkan ke awal inspector tanpa menambah penjelasan UI.

**Efek visual/persistence:** wrapper Amplop/Cover sebelumnya menerima warna tetapi scene di dalamnya masih memakai background tema sendiri. CSS override kini memakai marker eksplisit serta variabel warna lokal pada wrapper, sehingga root scene mengikuti warna section tanpa mewarnai section lain atau preview lain. Warna memakai sanitasi hex dan token `sectionStyles` yang sudah ada; tidak ada perubahan schema/API, data acara, visibility atau pipeline Simpan. Instance duplikat dengan key sejenis tetap berbagi styling section yang sama seperti sebelumnya.

**Affected files/commit:** `components/InvitationStudio/{InvitationDesigner,SectionInspector}.tsx`, `studio-canvas-pan.ts`, `useStudioCanvasPan.ts`, `components/PublicInvitation/UniversalInvitationTemplate.tsx`, `lib/templates/section-styles.ts`, `tests/{studio-canvas-pan,invitation-section-styles,studio-ui-cleanup}.test.mjs`, `studio.md`, `checklist.md` dan `prd.md` §7.2.0c/Appendix A. Commit batch berjudul `fix(studio): enable section background selection`.

**Observed validation:** lima tes baru memeriksa tap/jitter tanpa capture, threshold drag/suppression, pending tap setelah cancel, release di luar canvas/cleanup listener, serta nilai/aturan scoped background Amplop/Cover. Assertion source pan lama disesuaikan ke wiring mode Space; threshold diperiksa lewat tes perilaku. Suite lokal **405/405**, Prisma generate, TypeScript dan Next.js build **72/72** halaman lulus. Lint lima file helper/hook/inspector/style/renderer lulus tanpa error; satu warning `onMoveAssetLayer` tidak dipakai pada Universal sudah ada di source parent. `git diff --check` lulus.

**Not established:** QA klik/drag pointer dan touch langsung pada browser serta Undo/Redo → Simpan → reload → public tetap terbuka. Build/source tests tidak diklaim sebagai verifikasi gesture atau round-trip terautentikasi.


### 3 Oktober 2026 — fokus canvas untuk shortcut hapus shape

**Masalah/perilaku:** menambahkan shape dari tombol Aset hanya memilih ID baru; fokus tetap pada tombol di panel luar canvas sehingga guard shortcut menolak Delete/Backspace. Pointer selection pada layer juga mencegah fokus native tombol tanpa memberi fokus ke viewport. Penambahan shape sekarang membersihkan seleksi sebelumnya, memilih layer baru, menampilkan canvas mobile dan memberi fokus setelah render. Pemilihan layer memberi fokus langsung dari canvas atau setelah navigasi/scroll dari daftar. Perubahan berlaku pada lingkaran, persegi, garis dan pemilihan layer dekoratif yang memakai fungsi seleksi bersama.

**Scope/persistence:** penghapusan tetap melalui `removeAssetLayer`/history desain yang sama; guard target canvas, field teks, IME, text selection, busy state, lock dan komponen protected tidak diperluas. Tidak ada perubahan schema/API, token penyimpanan atau UI copy; Undo/Redo serta Simpan tetap memakai jalur sebelumnya.

**Affected files/commit:** `components/InvitationStudio/InvitationDesigner.tsx`, `studio.md`, `checklist.md` dan `prd.md` §7.2.0d/Appendix A. Commit batch berjudul `fix(studio): restore shape delete shortcuts`.

**Observed validation:** suite regression yang sudah ada **405/405**, termasuk shortcut canvas dan codec/renderer shape, lulus; Prisma generate, TypeScript serta Next.js build **72/72** halaman lulus. Perbandingan ESLint pada file berubah dengan source parent menghasilkan **4 error + 6 warning** pada keduanya dan **0 temuan baru**; kelulusan lint penuh tidak diklaim. `git diff --check` lulus. Perubahan fokus diperiksa pada source; tidak menambahkan tes yang hanya menyalin baris implementasi.

**Not established:** QA browser nyata Tambah Lingkaran → Delete/Backspace → Undo/Redo, seleksi ulang dari canvas/daftar, input typing, lock, Amplop/Isi/mobile serta Simpan → reload → public tetap terbuka. Tes source/build tidak diklaim sebagai verifikasi keyboard browser.

### 3 Oktober 2026 — audit dan perbaikan editing lintas elemen Studio

**Temuan/perilaku:** audit jalur shared untuk aset gambar, shape, teks, frame foto/galeri, heading/copy/dekorasi/data bawaan, section, RSVP, Ucapan, Location/Gift dan tombol sistem menemukan beberapa celah yang serupa dengan fokus shape. Penambahan/drop aset dan navigasi seleksi sekarang membersihkan pilihan yang bertabrakan dan mengaktifkan inspector/fokus canvas secara konsisten. Selesai Crop mengembalikan fokus setelah overlay dilepas; field teks tetap mempertahankan shortcut native. Tombol sistem yang menghentikan bubbling di preview tetap bisa dipilih melalui capture tanpa menjalankan aksi publiknya.

**Transform/persistence:** resize native sebelumnya membangun ulang hanya lima properti geometri sehingga style/font/opacity/motion hilang; sekarang seluruh properti dipertahankan. Reset handle hanya mereset geometri. Penanda viewport lama pada asset gesture diperbaiki untuk drag antarsection, auto-scroll dan Space-pan, dengan alias legacy tetap didukung. Pointer lain tidak dapat mengambil alih/membatalkan gesture asset/native/crop. Frame Cover/Identitas menggunakan key per instance dan ikut clone/cleanup section, sementara legacy base override tetap terbaca; identity transform per instance dapat menetralkan geometri base. Input/Button Ucapan kini diterima codec; field custom RSVP tidak lagi menampilkan kontrol native yang tidak didukung. Assignment/crop/motion foto, data protected, latar per key section, capability pelanggan dan engine API tetap memakai kontrak sebelumnya; tidak ada migrasi schema.

**Affected files/commit:** `InvitationDesigner.tsx`, `StudioNativeTransformHandles.tsx`, `StudioPhotoCropOverlay.tsx`, `StudioSelectionInspector.tsx`, helper `studio-canvas-dom.ts`, renderer `InvitationAssetLayers.tsx`, `native-visual-transforms.ts`, helper `native-visual-resize.ts`, tes seleksi/resize/codec/SSR inspector serta assertion integrasi terkait; `studio.md`, `checklist.md` dan `prd.md` §7.2.0c/0d/Appendix A. Commit batch berjudul `fix(studio): unify editing across canvas elements`.

**Observed validation:** **419/419** tes lulus, mencakup dispatch kategori/priority seleksi, key/codec/selector frame foto per instance, transform Ucapan, geometri delapan handle (anchor/zoom/bounds), retensi style/motion serta render inspector yang hanya menawarkan kontrol didukung. Suite compliance source untuk 14 tema ready tetap lulus. Prisma generate, TypeScript dan Next.js build **72/72** halaman lulus. ESLint pada file implementasi dibanding source parent mempunyai **0 temuan baru**; baseline tetap Designer 4 error/6 warning, asset renderer 3 error, Crop 1 error/1 warning, sedangkan file implementasi lainnya bersih. Lint penuh tidak diklaim lulus. `git diff --check` lulus.

**Not established:** fixture ancestor/geometry dan SSR inspector bukan QA browser. Hit testing/render semua artwork, gesture desktop/touch, fokus keyboard nyata, lock, reduced-motion, semua variasi tema dan Simpan → reload → public tetap memerlukan QA browser. Internal protected component tetap diedit lewat properti grup/komponen; editor seluruh node bebas tidak dinyatakan selesai.

## 3 October 2026 — Confetti Club birthday invitation

**Request / rationale:** Owner meminta satu template undangan ulang tahun tambahan. Menambah komposisi birthday tersendiri sambil mempertahankan engine dan hasil perbaikan editability Studio.

**Implementation:** Satu entry registry `confetti-club`, palette Confetti + Syne/Inter; lazy scene/artwork dan CSS scoped. Amplop hadiah membuka ke cover kue; Identity memiliki potret tunggal opsional dan Gallery kolase shared. Empat narasi default khusus ulang tahun dilokalisasi ID/EN dan tetap mendahulukan teks pelanggan. Seluruh fitur publik dan 15 kontrol Studio memakai kontrak yang sama. Fixture birthday terisolasi menggantikan pasangan hanya pada preview tema ini. Musik memakai audio existing tanpa perubahan file audio.

**Area / files:** `lib/templates/{catalog,design,music,editable-copy,template-motion}.ts`, `lib/invitations/language.ts`, `data/templates/preview-invitation.ts`, `TemplateGalleryCanvas.tsx`, shared scene/Universal renderer, `ConfettiClub{Scene,Artwork}.tsx`, `confetti-club.css`, `public/templates/confetti-club/`, template regression/compliance tests, `template.md` dan `checklist.md`.

**Commits:** [`f78c62c`](https://github.com/wanzy0808/Undara/commit/f78c62cdbb0d05cc9116dc891764631b029715d2) — `feat(templates): add Confetti Club birthday invitation`; follow-up `fix(templates): strengthen Confetti Club form contrast`.

**Validation observed on feature commit:** [Build Validation 37112836921](https://github.com/wanzy0808/Undara/actions/runs/37112836921) passed: **428/428 tests, 0 failures**, Prisma generate, TypeScript and Next.js build **72/72** pages. [Orphan Audit 37112836954](https://github.com/wanzy0808/Undara/actions/runs/37112836954) passed. Nine new regression tests cover registry, birthday fixture, narrative/localization, native artwork markers, motion overrides, preview/keyboard guards, readable controls, bundled music precedence and palette contrast.

**Follow-up polish / validation scope:** Form boundaries now have a separate cobalt blend (65%; computed contrast 3.42:1 against paper and 3.58:1 against field surface); placeholder opacity increases to 70%. The palette regression reads these CSS values and enforces 3:1 for boundaries and 4.5:1 for placeholder text. Latest follow-up test/build outcomes are recorded by the automatic GitHub Actions checks on its commit. Local execution is unavailable because the supplied environment cannot connect. Browser/E2E and real mobile/desktop editing have not been run.

## 4 October 2026 — Invitation-share QR generated inside Undara

**Request / rationale:** Owner menanyakan apakah QR perlu API pihak ketiga, apakah dapat dibuat sendiri, dan keamanan pemakaian library. Gunakan encoder standar `qrcode` 1.5.4 yang sudah menjadi dependency; tidak menambah dependency atau menulis ulang algoritma QR.

**Implementation / area:** `app/api/invitations/qr/route.ts` membuat PNG 640px di memori runtime Node dengan quiet zone 4 dan error correction M. QuickChart/fetch dihapus; sesi, ID, owner, pembayaran, tujuan permanen `APP_URL/q/<invitationId>`, header private/no-store, filename dan download tetap dipertahankan. Tes handler menjalankan encoder PNG sebenarnya dan helper entitlement/target dengan batas auth/database diganti fixture. `README.md`, `AGENTS.md`, §8.1a dan `checklist.md` diselaraskan. Tidak ada migrasi DB. Commit: `fix(qr): generate invitation codes on the application server`.

**Observed validation:** 441/441 source regression tests lulus melalui `node --import tsx --test tests/*.test.mjs`; CLI `pnpm test` diblokir IPC socket EPERM pada environment ini. ESLint route/tes baru dan `git diff --check` lulus. Build awal gagal pada cache Turbopack lama; build dengan cache baru dan CI masih menunggu hasil pada saat commit. TypeScript awal mendeteksi Prisma client lokal yang belum mengikuti schema saat ini; CI menghasilkan client dari schema lebih dulu. Tidak ada klaim QA browser, scanner nyata, database atau deployment.

**Dependency review:** Audit produksi selesai dengan 12 advisori (4 moderate, 7 high, 1 critical), tanpa advisori pada `qrcode` atau rantai dependensinya. Ini pemeriksaan advisori yang diketahui, bukan jaminan seluruh aplikasi aman. Triage Sharp/Next dan dependency lain dicatat di checklist untuk batch keamanan terpisah. Renderer tiket Usher/dashboard RSVP masih ditemukan pada source dan dijadwalkan sebagai batch berikutnya.

## 4 October 2026 — Usher and RSVP dashboard ticket images generated inside Undara

**Request / rationale:** Menuntaskan jalur QR internal setelah audit source menemukan token tiket pada Usher dikirim ke QuickChart dan pada dashboard RSVP ke QRServer. Mencegah token dikirim ke renderer eksternal tanpa mengubah kontrak check-in.

**Implementation / files:** `app/api/usher/qr/route.ts` menambah GET PNG Node dengan validasi signed token/batas panjang, sesi, guest milik event owner dan entitlement existing (termasuk explicit owner grant). PNG 640px dirender di memori oleh `qrcode`, dengan private/no-store, no-referrer, nosniff dan pratinjau/download. POST penerbitan tiket beserta trusted-origin guard tetap dipertahankan. `components/Usher/utils.ts` mengarahkan gambar ke endpoint tersebut; `components/Dashboard/RsvpAnalyticsPanel.tsx` memakai helper yang sama. `tests/usher-qr-image.test.mjs`, `AGENTS.md`, `README.md`, §9.2 dan `checklist.md` diperbarui. Tidak menambah dependency, schema atau migration. Commit: `fix(qr): render owner guest tickets without external services`.

**Observed validation:** 18 tes baru menguji signature asli dengan secret fixture, no-session/token palsu/guest hilang/owner lain/unpaid/wrong package, explicit grant, PNG real/filename/headers/dimensi, error generic, POST trusted-origin, helper same-origin dan guard renderer eksternal. Total lokal **459/459 tests**, lint seluruh file QR yang berubah, Prisma generate, TypeScript dan Next build **72/72** halaman lulus. Pencarian `quickchart|qrserver` pada `app/components/lib` tidak menemukan renderer eksternal tersisa. Runtime/stub test memakai batas auth/DB fixture, sehingga bukan klaim PostgreSQL/E2E atau scanner nyata. Generated Prisma artifacts hanya diregenerasi untuk validasi dan tidak dimasukkan ke batch ini.

**Previous batch CI observed:** [`9f2b4b6`](https://github.com/wanzy0808/Undara/commit/9f2b4b6fa4de4192b76a6427d33d3df1b707b8c7) mempunyai [Build Validation](https://github.com/wanzy0808/Undara/actions/runs/37152044594) success: **441/441 tests**, Prisma generate, TypeScript dan build **72/72**. [Orphan Audit](https://github.com/wanzy0808/Undara/actions/runs/37152044583) success. Ini mengatasi validation pending yang tercatat saat commit pertama; CI batch tiket ini masih menunggu push.

## 4 October 2026 — View invitation QR from Beranda

**Request / rationale:** Owner meminta menu di Beranda untuk melihat QR setelah memastikan satu QR berbagi undangan berlaku per event, bukan per akun. Sediakan akses langsung tanpa menambah workspace atau mencampur QR check-in tamu.

**Implementation / files:** `InvitationQrMenu.tsx` menambah trigger pada hero `DashboardWorkspaces.tsx`, dialog shared yang memuat daftar dari endpoint owner existing, pembayaran per event melalui helper `invitation-qr.ts`, pilihan eksplisit dan preview per ID. Request dibatalkan ketika menu ditutup, dibuka ulang atau unmount. `InvitationQrPreview.tsx` dipakai bersama oleh menu dan `InvitationWorkspacePanel.tsx`; gambar PNG private same-origin, loading/error/retry, penanda draft serta download yang hanya aktif setelah gambar berhasil dimuat. Localization memakai `useDashboardI18n.ts`; native selector menampilkan Title Case tanpa mengubah data. `tests/dashboard-invitation-qr.test.mjs`, `README.md`, `AGENTS.md`, checklist dan §6.0 diselaraskan. Backend entitlement/signature/publish dan schema tetap memakai kontrak existing. Commit: `feat(dashboard): view invitation QR from Beranda`.

**Design / validation observed:** Komponen Button/Dialog/controlStyles dan semantic theme existing dipakai. Panduan Undara serta upstream Taste/Impeccable craft-floor dibaca; paket global tidak tersedia dan launcher Impeccable tidak berjalan, sehingga ini penerapan metode melalui konteks/source proyek, bukan klaim plugin lengkap dieksekusi. Lima tes baru menguji pilihan menurut payment event (paid draft diterima, account-only grant ditolak), URL preview/download per ID, trigger ID/EN tanpa pemilihan otomatis, disabled download/loading/draft, dan judul aman pada SSR. Lokal **464/464 tests**, Prisma generate, TypeScript serta Next build **72/72** halaman lulus. Lint file baru/Overview/i18n/tes bersih; `InvitationWorkspacePanel` tetap mempunyai satu error effect dan satu warning dependency yang sama dengan source parent, tanpa temuan baru. `git diff --check` lulus. Generated Prisma artifacts dipakai untuk validasi lalu dikembalikan, tidak dicommit.

**Validation limits:** SSR dan helper tests bukan pengujian klik/pointer/fokus di browser atau PostgreSQL. Runtime Playwright ditemukan tetapi browser Chromium lokal belum tersedia; QA desktop/mobile Light/Dark/ID/EN, Escape/close/focus return, ganti undangan saat PNG memuat, retry, serta download aktual dengan sesi customer tetap terbuka di checklist. CI akan berjalan pada commit; hasil lokal tidak dianggap deployment.

## 4 October 2026 — Invitation QR honors manual Owner package access

**Request / cause:** Customer sudah diberi hak Undangan Digital Rp150.000 dari panel Owner tetapi QR tidak tersedia. Publish dan daftar undangan existing mengakui audit grant manual, sedangkan menu Beranda, PNG, redirect serta halaman publik masih mensyaratkan payment `PAID`. Samakan jalur berbagi QR dengan entitlement existing tanpa membuat payment atau penjualan palsu; ketentuan aktif ini menggantikan pembatasan grant-only pada batch QR sebelumnya.

**Implementation / files:** `components/Dashboard/invitation-qr.ts` dan `InvitationQrMenu.tsx` memakai `accessPaid` hasil server, dengan empty copy ID/EN disesuaikan di `useDashboardI18n.ts`. `app/api/invitations/qr/route.ts` memakai `hasAccountDigitalInvitation` sesudah lookup event milik requester. `app/q/[invitationId]/route.ts` memilih owner ID dan memeriksa entitlement pemilik aktual sambil mempertahankan Publish/config/template serta redirect no-store. Ketiga halaman `app/invite/[slug]/...` dan `app/api/media/invitation-assets/[assetKey]/route.ts` memakai helper yang sama, dengan password, publikasi guest dan scope staff/media tetap dijaga. Media dari grant saja tidak memakai cache publik immutable. QR tetap satu per `Invitation.id`, pembayaran tetap event-scoped, grant audit tidak diubah, dan tiket check-in tidak berubah. Tes menu/PNG/personal diperbarui; `tests/invitation-manual-access.test.mjs` dan `tests/helpers/package-access.mjs` menguji handler asli serta helper produksi dengan batas database diganti fixture. §6.0, §8.1/8.1a, `AGENTS.md`, `README.md` dan checklist diselaraskan. Commit: `fix(qr): honor manual Owner access across invitation sharing`.

**Observed validation:** 34 tes tambahan membuat total **498/498 tests** lulus. Cakupan meliputi PNG asli preview/download dengan grant Digital/Guestbook, lookup audit terbaru, pencabutan hak tanpa payment, payment valid tetap berlaku, akun lain/metadata palsu ditolak, failure lookup tertutup, redirect slug terbaru, draft/config/template, ketiga renderer publik, password dan media grant-only private/no-store. ESLint seluruh file kode/tes yang berubah, `git diff --check`, Prisma generate, TypeScript serta Next build **72/72** lulus. Generated Prisma artifacts hanya dipakai untuk validasi lalu dikembalikan; tidak ada schema, migration atau dependency baru. CI commit masih menunggu push saat catatan ini dibuat.

**Validation limits:** Belum membaca/mengubah record customer yang dilaporkan atau menjalankan sesi browser/database produksi dan scanner nyata. QA customer grant → lihat/unduh → scan → revoke masih terbuka di checklist. Pemeriksaan handler dengan fixture membuktikan jalur kode, bukan deployment atau keadaan akun tersebut.

## 4 October 2026 — QR download filename follows the event title

**Request / implementation:** Nama `undara-undangan-<database-id>-qr.png` sulit dikenali. `lib/invitations/qr.ts` menggunakan slugifier event existing untuk nama berdasarkan judul tersimpan, membatasi bagian judul 80 karakter dan memberi fallback `acara` saat kosong. `app/api/invitations/qr/route.ts` memilih `title` dari event milik requester dan mengirim filename melalui Content-Disposition; `InvitationQrPreview.tsx` mengikuti nama server tanpa override ID pada anchor. §8.1a dan checklist diperbarui. Commit: `fix(qr): name downloads after the event`.

**Observed validation:** `tests/invitation-qr-route.test.mjs` memverifikasi filename preview/download, judul terbaru, aksen, slash/quote/CRLF, judul kosong dan batas panjang melalui handler/encoder sebenarnya; payload tetap URL per ID. Total **499/499 tests**, lint semua file kode/tes berubah, Prisma generate, TypeScript, Next build **72/72** dan `git diff --check` lulus lokal. Generated Prisma artifacts dikembalikan setelah validasi; tidak ada dependency/migration baru. CI menunggu push saat commit; unduhan browser produksi belum diuji langsung.

## 4 October 2026 — Referral code entered through a Beranda popup

**Request / implementation:** Owner meminta satu tombol `Kode Referral`, lalu popup untuk memasukkan kode dan `Submit`. `components/Dashboard/ReferralCodePanel.tsx` memakai shared Button/Dialog/controlStyles, judul dan tombol tutup ID/EN, label input/fokus awal, loading/status, submit dan hapus kode aktif. Kode tersimpan dimuat on-demand; close/unmount membatalkan GET agar respons lama tidak menimpa input, dan submit ditahan selama load/save. Panel, penjelasan promo, harga dan link paket dilepas dari Beranda; `DashboardWorkspaces.tsx` menempatkan trigger bersama aksi Beranda. API validasi/persistensi referral, diskon dan invoice memakai jalur existing. §8.2a dan checklist diselaraskan. Commit: `refactor(dashboard): enter referral codes in a popup`.

**Design / validation observed:** Panduan Undara serta pinned upstream Taste dan Impeccable distill/craft-floor dibaca; global skill/launcher tidak tersedia, sehingga ini penerapan panduan pada komponen existing, bukan klaim plugin dijalankan. Refinement struktural memakai desain sistem proyek, tanpa art direction atau aset baru. SSR ID/EN memverifikasi trigger dialog tanpa form/promo inline. Lokal **499/499 tests**, ESLint kedua file UI, Prisma generate, TypeScript, Next build **72/72** dan `git diff --check` lulus. Generated artifacts dikembalikan; tidak ada dependency, schema atau migration baru. CI menunggu push saat commit. Klik/fokus/keyboard/submit dengan sesi customer dan visual desktop/mobile Light/Dark belum diuji di browser; QA tetap terbuka.

## 4 October 2026 — Remove redundant QR popup copy

**Request / implementation:** Owner meminta tulisan seperti “Satu QR untuk setiap undangan” dihilangkan. `components/Dashboard/InvitationQrMenu.tsx` menghapus subtitle beserta import description yang tidak dipakai. `useDashboardI18n.ts` menghapus terjemahannya dan dua penjelasan QR lama yang sudah tidak memiliki pemanggil. Judul dialog, label pilihan, aksi dan status loading/error/akses/draft tetap tersedia. §6.0 dan checklist diselaraskan. Commit: `refactor(dashboard): remove redundant QR popup copy`.

**Observed validation:** Pencarian source memastikan copy yang dihapus tidak memiliki pemanggil lain; dialog memakai judul aksesibel dan Base UI hanya memasang `aria-describedby` saat description terdaftar. Lokal **499/499 tests**, ESLint kedua file UI, Prisma generate, TypeScript, Next build **72/72** dan `git diff --check` lulus. Generated Prisma artifacts dikembalikan; tidak ada perubahan dependency, schema atau migration. CI menunggu push saat commit; QA browser tetap terbuka pada checklist.

## 4 October 2026 — Remove publish helper text from QR previews

**Request / implementation:** Owner meminta “Tautan terbuka setelah Publish” ikut dihapus. Shared `components/Dashboard/InvitationQrPreview.tsx` menghapus penjelasan dan prop `isPublished` yang hanya dipakai untuk menampilkannya. Pemanggil pada `InvitationQrMenu.tsx` dan `InvitationWorkspacePanel.tsx`, terjemahan pada `useDashboardI18n.ts`, serta tes SSR existing diselaraskan. QR draft tetap dapat disiapkan; guard Publish di server tidak berubah. §6.0 dan checklist diperbarui. Commit: `refactor(qr): remove publish helper text`.

**Observed validation:** Lokal **499/499 tests**, Prisma generate, TypeScript, Next build **72/72** dan `git diff --check` lulus. ESLint preview/menu/i18n/tes bersih; satu error `set-state-in-effect` dan satu warning dependency pada panel Undangan identik dengan HEAD sebelum perubahan. Generated Prisma artifacts dikembalikan; tidak ada dependency, schema atau migration baru. CI menunggu push saat commit; QA browser tetap terbuka.

## 4 October 2026 — Audit Studio right inspector and repair photo controls

**Request / findings:** Owner meminta cek kontrol kanan yang error/tidak berguna dan fungsi Zoom foto. Source kontrol foto, frame native, section, input/button, teks dan aset ditelusuri. Masalah terkonfirmasi: rasio ditawarkan pada cover/fixed-size image yang tidak menerapkannya; drag crop membuang `aspect`; perubahan rasio saja tidak memperbarui live crop; zoom overlay membulatkan nilai slider dan tetap aktif di batas; beberapa default Parallax memakai pecahan di bawah resolusi runtime, dan OFF hilang saat serialisasi.

**Implementation / area:** Lima komponen inspector/crop pada `components/InvitationStudio/` memakai label Perbesaran foto/Bingkai foto, capability rasio dari `lib/templates/catalog.ts`, snapshot crop lengkap, sinkronisasi prop tanpa setState effect, pembatalan lost capture serta zoom dua desimal dengan tombol batas disabled. `photo-slots.ts` mempertahankan override Parallax 0 dan menolak nilai malformed; `template-motion.ts` memakai default 2–4.5px. Mesin motion, reduced-motion dan kepemilikan media tetap melalui jalur existing. Tes inspector/gesture/template-motion serta §7.2, `studio.md`, `template.md` dan checklist diselaraskan. Commit: `fix(studio): make photo inspector controls match their effects`.

**Observed validation:** Tujuh regresi tambahan menguji capability rasio tanpa mutasi crop lama, handler pointer/zoom asli dengan fixture DOM/hooks, pointer kedua/lost capture, perubahan rasio saja, presisi/batas zoom, OFF setelah serialisasi/reload dan displacement Parallax sebenarnya dengan fixture viewport. Lokal **506/506 tests**, ESLint seluruh sebelas file kode/tes yang berubah, Prisma generate, TypeScript, Next build **72/72** dan `git diff --check` lulus. Cache Turbopack awal rusak (SST truncated); build output lama dipertahankan dan build ulang dengan cache baru lulus. Generated Prisma artifacts dikembalikan; tidak ada dependency, schema atau migration baru. CI menunggu push saat commit. Ini audit source dan handler/SSR/runtime fixture; bukan sign-off browser, Save/database/publik atau visual perangkat nyata.

## 4 October 2026 — Reversible deletion for all registered Studio visuals

**Request / rationale:** Owner meminta elemen dapat dihapus sampai kosong dan dipulihkan ke default. Whitelist dekorasi lama memblokir judul, foto, data acara, tombol dan grup, serta sanitizer membuang hidden pada target tersebut. Arahan ini menggantikan larangan penghapusan presentasi; source data, file, validasi/API dan izin tetap terlindungi.

**Implementation / area:** `native-visual-transforms.ts` menerima hidden untuk setiap key terdaftar, tetap menolak selector arbitrer, meningkatkan batas ke 512 target/256 KB token dan memberi CSS removal prioritas atas inline display. `InvitationDesigner.tsx` memakai satu jalur hapus visual untuk shortcut/tombol kanan, menjaga busy/input guards, mengosongkan seluruh seleksi setelah hapus dan Default, serta menghapus section terpilih melalui Delete/Backspace (Amplop memakai visibility resmi). Dua inspector shared menambahkan tombol singkat Hapus/Delete dari canonical Button. Reset penuh yang sudah ada memulihkan native hidden dan layout; foto/audio unggahan tetap berada di koleksi event. Persyaratan aktif §7.2, `AGENTS.md`, `studio.md`, `template.md` dan checklist diselaraskan. Tes visual/selection/tema lama disesuaikan dengan content-locked tetapi presentation-removable. Commit: `fix(studio): allow reversible deletion of every visual target`.

**Observed validation:** Enam regresi baru menjalankan command editor asli dengan fixture state/fokus: 21 jenis target, codec reload, isolasi instance/geometri, layout kosong, Default/Undo, batas 512 target, key invalid, busy state, binding inspector dan SSR ID/EN. Lokal **512/512 tests**, Prisma generate, TypeScript, Next production build dan `git diff --check` lulus. Build lokal workingtree juga memuat perubahan preview paralel yang tidak termasuk commit ini; CI untuk tree commit menunggu push. Inspector/codec/tes baru bersih dari lint; jumlah lint baseline Designer (4 error/6 warning), fixture selection (1 error alias this), dan tes native (1 warning unused) tidak bertambah. Generated Prisma artifacts dikembalikan; tidak ada dependency/schema/migration baru. QA browser desktop/HP, Save server dan renderer publik pada event nyata tetap terbuka.


## 4 October 2026 — Preview overlays Studio and template selection stays quiet

**Request / cause:** Preview menampilkan rail, toolbar, inspector dan handle editor di depan popup karena z-index Studio 70–130 tidak dibatasi stacking context, sedangkan Dialog body-portal berada di z-index 50. Owner meminta backdrop merata dan kemudian melarang pesan “Template dipilih. Klik Simpan untuk menerapkan” di kiri bawah yang muncul kembali.

**Implementation / area:** `studio.css` mengisolasi lapisan shell editor; `StudioFinalPreviewDialog.tsx` memakai viewport dinamis, overscroll terlokalisasi, caption singkat ID/EN dan `allowEnvelopeOpen` untuk memeriksa isi. `InvitationDesigner.tsx` membersihkan notice pada load/pemilihan template valid, termasuk katalog Designer, Canvas Kosong dan Kembalikan ke Default; seluruh variasi petunjuk pemilihan/reset dihapus. Notice kegagalan dan proses kerja tetap tersedia. Tidak ada perubahan renderer alternatif, data, API, musik, schema atau dependency. §7.2.1, `studio.md` dan checklist diselaraskan. Commit: `fix(studio): repair preview overlay and clear template hints`.

**Observed validation:** Source regression Studio **61/61** dan `git diff --check` lulus pada checkout ini; assertion lama yang mewajibkan caption reset diganti dengan guard agar petunjuk terlarang tidak muncul kembali. Perbaikan popup yang sama sebelumnya telah melewati 512 tes, lint Preview dan Next build 72/72 di sesi sebelumnya; checkout sesi ini tidak memiliki dependency lokal untuk mengulang full build/lint. Full regression/build GitHub CI menunggu push pada saat commit. QA visual browser tetap terbuka: sesi browser sebelumnya tidak tersambung. Tidak ada klaim sign-off desktop/HP, Save/database atau event customer.


## 4 October 2026 — Studio preview follows responsive device viewports

**Request / cause:** Owner meminta Preview HP/Desktop mengikuti mode responsif Inspect. Implementasi lama hanya mengubah lebar div 390/760 px di browser Studio, sehingga media query, viewport units dan JavaScript tetap memakai viewport editor.

**Implementation / area:** `StudioFinalPreviewDialog.tsx` menambahkan preset HP 390 × 844 / Desktop 1440 × 900, input dimensi dan Fit/100%. `StudioPreviewViewport.tsx` mempertahankan dimensi iframe logis ketika tampilannya diperkecil dan mengirim snapshot draft yang sedang diedit. `StudioPreviewFrame.tsx` merender shared `InvitationPreview` di browsing context sendiri, dengan Amplop interaktif dan Escape ke parent. `studio-preview-viewport.ts` membatasi dimensi serta memeriksa origin/source/payload dan hanya mengirim draft ke path frame yang diharapkan. `app/studio/preview/page.tsx` memerlukan login dan tidak mengambil data event; Navbar/Footer disembunyikan hanya pada path frame tersebut. Snapshot tidak memakai URL, browser storage, API publik atau autosave.

Shared `InvitationPreview`, `RomanticRoseTemplate.tsx` dan `UniversalInvitationTemplate.tsx` memisahkan presentasi editor melalui `editorPreview`, sehingga final preview menghilangkan section OFF, placeholder dan overflow editor sementara proteksi form/data `preview` tetap aktif. Pergantian viewport tidak meremount renderer; perubahan desain masih memakai design key draft. Kontrak publik, default canvas edit, entitlement, database dan schema tidak diubah. Tes baru meliputi skala/dimensi, origin/source/path, transfer draft, payload tidak valid, serta SSR kedua renderer untuk section OFF dan form preview; assertion integrasi Studio, gallery dan section styles diselaraskan. §7.2.1a, `studio.md` dan checklist diperbarui. Commit: `feat(studio): add responsive device preview viewports`.

**Observed validation:** `node --import tsx --test tests/*.test.mjs` **522/522 PASS**; `pnpm exec tsc --noEmit` **PASS**; production `next build --webpack` **PASS**, termasuk 72/72 static-generation entries dan route dynamic `/studio/preview`; Prisma generate lokal **PASS** untuk build, tanpa migrasi database. ESLint komponen viewport/dialog/helper/page dan guard Navbar/Footer **PASS**; diagnostic pada tiga renderer/shared preview yang disentuh sama dengan HEAD (error/warning lama, tanpa diagnostic baru). `git diff --check` **PASS**. GitHub CI pada commit ini menunggu push saat pencatatan.

**Browser limitation:** Next start tanpa hostname mengalami `uv_interface_addresses`; dev server dengan hostname 127.0.0.1 berhasil ready. Namun Cloud Browser menolak URL fixture lokal dengan `net::ERR_BLOCKED_BY_CLIENT`, sehingga tidak ada klaim QA visual, resize/media-query browser, scroll, keyboard maupun verifikasi HP asli. Fixture demo dan perubahan path untuk QA sudah dihapus/dipulihkan; guard login produksi tetap tersedia. Save/database/publication event customer tidak diuji atau diubah.


## 4 October 2026 — Minimal preview with three device mockups

**Request / rationale:** Owner memberikan tiga screenshot referensi dan meminta Preview dibagi menjadi Desktop, Tablet dan HP, tanpa judul, pixel atau kontrol tambahan. Referensi menampilkan satu perangkat terpusat di atas editor gelap; UI dimensi/zoom dari implementasi sebelumnya kini digantikan pemilihan perangkat ringkas.

**Implementation / area:** `StudioFinalPreviewDialog.tsx` memakai shared Dialog transparan sepanjang viewport dengan backdrop gelap merata, pilihan Desktop/Tablet/HP serta tombol tutup; hanya judul aksesibilitas yang tersembunyi. Caption draft, input dimensi dan Fit/100% dihapus. `studio-preview-device.module.css` membentuk bezel HP/tablet dan layar/base laptop, memakai hardware netral serta kontrol dari token/komponen Undara existing. `StudioPreviewViewport.tsx` mempertahankan satu iframe dalam subtree stabil, memusatkan seluruh bingkai dan otomatis mengecilkan tampilannya agar muat, termasuk pada layar sempit/pendek. `studio-preview-viewport.ts` menambahkan viewport Tablet 768 × 1024 dan geometri bingkai; viewport HP/Desktop, snapshot draft authenticated, origin/source/path guards dan preview non-submitting tetap melalui jalur existing. Section OFF, scroll internal, Amplop serta Escape tetap dimiliki renderer/frame yang sama. Persyaratan aktif §7.2.1, `studio.md`, checklist dan regresi terkait diselaraskan. Commit: `refactor(studio): simplify preview into three device mockups`.

**Observed validation:** Lokal **522/522 tests PASS**, termasuk auto-fit bezel/base pada tiga perangkat dan ruang sempit/pendek, transfer draft serta SSR section OFF/form guards pada kedua renderer. ESLint dialog/viewport/helper/tes Preview, TypeScript, production `next build --webpack` **72/72** dan `git diff --check` **PASS**. TypeScript/build pertama menemukan cache dev route dari dua fixture QA lama yang sudah dihapus; setelah cache generated itu dikeluarkan, pemeriksaan dan build lulus. Prisma generate lokal hanya untuk validasi build; artifacts generated dikembalikan sebelum commit. Tidak ada dependency/schema/migration atau perubahan event customer. GitHub CI menunggu push saat pencatatan.

**Verification limit:** Pembatasan Cloud Browser lokal `ERR_BLOCKED_BY_CLIENT` dari pemeriksaan sebelumnya masih menjadi batas QA. Gambar owner, source, geometri perangkat dan CSS hasil build diperiksa, tetapi belum ada sign-off visual/keyboard/scroll/pergantian perangkat di browser; tidak ada klaim screenshot final, Save/database atau perangkat nyata telah diuji.


## 5 October 2026 — Larger Studio preview devices

**Request / implementation:** Owner meminta laptop mendekati 80% layar serta Tablet/HP sekitar 30% lebih besar. `StudioPreviewViewport.tsx` kini mengukur lebar browser di callback ResizeObserver dan menargetkan 80% lebarnya untuk seluruh bingkai laptop, dengan batas ruang tersedia. Batas tampilan portrait dinaikkan dari tinggi 560 ke 728 (+30%); Tablet/HP tetap otomatis mengecil pada layar sempit/pendek. Ukuran logis iframe dan subtree renderer yang sama tetap dipakai. Kontrak ukuran aktif §7.2.1, `studio.md` dan checklist diperbarui. Commit: `fix(studio): enlarge preview device mockups`.

**Observed validation:** Lokal **522/522 tests**, ESLint viewport, TypeScript, production `next build --webpack` **72/72** dan `git diff --check` **PASS**. Prisma generate hanya untuk validasi build; artifacts generated dikembalikan sebelum commit. GitHub CI menunggu push saat pencatatan. QA visual browser belum diverifikasi ulang; akses localhost sebelumnya diblokir `ERR_BLOCKED_BY_CLIENT`. Tidak ada perubahan schema/dependency atau penulisan data event customer.
