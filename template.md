# template.md — Panduan Semua Template Undangan Undara

**Cakupan:** Semua template undangan digital yang akan direncanakan, dirancang, dan dibuat bersama ChatGPT. Bukan panduan khusus Zen Atelier ataupun satu gaya visual tertentu.  
**Fungsi:** Brief produksi desain dan interaksi, dari ide → moodboard → aset → contoh layar → coding → integrasi Studio → pengujian.  
**Sumber aturan produk:** prd.md dan AGENTS.md. Jika kontrak produk berubah, selaraskan PRD terlebih dahulu. Jangan mengubah landing page, Pintu, Dashboard, dan template lain hanya karena sedang membuat satu template baru.

## 1. Prinsip untuk setiap template

### Template tetap website undangan — bukan poster Canva

Setiap template Undara adalah **website invitation responsif**. Studio boleh terasa seperti Canva saat mengatur visual, tetapi hasil template tidak boleh berubah menjadi artboard gambar/fixed-layout: tetap gunakan struktur web, alur section, scroll, breakpoint mobile/desktop, semantic/interactive DOM, dan engine fitur bersama. Drag/resize/rotate/layer adalah alat authoring untuk menyusun elemen di dalam sistem website, bukan alasan untuk mengabsolutkan seluruh halaman.

Elemen dekoratif dan visual bawaan boleh bebas dikomposisikan serta diberi edge bleed bila sesuai art direction, namun setiap objek tetap memiliki section/komponen pemilik yang jelas. RSVP, Maps, Countdown, Musik, Wishes, Gift, identitas, tanggal, venue, foto dan data tamu tetap komponen web nyata dan responsif; jangan bake data/fungsi tersebut menjadi gambar atau menggantinya dengan objek bebas. Template dinyatakan siap hanya bila komposisi hasil authoring tetap layak di desktop **dan** HP.

### Kontrak editability elemen bawaan

**Warna individual (5 Oktober 2026):** semua target canvas menyediakan kontrol warna yang benar-benar mengenai paint target: teks/font, latar/transparan, fill/stroke shape, frame dan tint foto/artwork. Warna native harus mengalahkan style inline/gradient bawaan secara scoped tanpa menimpa target anak independen. Raster/SVG dapat diberi warna/tint sebagai satu siluet/objek; bagian di dalam raster memerlukan layer nyata jika ingin dipilih terpisah. Baseline artwork/palet tidak berubah sebelum override dipilih. Latar section memakai override per ID instance; duplikasi menyalin warna awal dan renderer Studio/Preview/public membaca nilai yang sama, dengan fallback desain legacy. Menu Warna global kiri dihapus; desain lama tetap kompatibel. Kontrol Latar/Garis native membutuhkan box frame terpisah: IMG native hanya menawarkan warna/tint, SVG group/path memakai warna geometry; wrapper HTML atau viewport SVG dapat mempunyai latar/garis sendiri. Gambar tambahan sudah mempunyai wrapper frame bersama. Template baru memakai wrapper frame nyata jika warna gambar dan frame harus independen.

Native object terdaftar mendukung lock editing Studio yang terpisah dari proteksi isi data acara. Untuk urutan depan/belakang, sediakan box nyata yang berbagi parent dan instance section; geometri SVG group/path tidak mempunyai kontrol urutan CSS box. Renderer bersama mempertahankan flow responsif dan positioning absolute/fixed yang ditulis template, tanpa memindahkan child DOM React.

Setiap elemen visual yang terlihat pada master template harus memiliki ownership Studio yang jelas; jangan meninggalkan visual penting sebagai markup hardcoded yang tidak bisa dipilih. Gunakan salah satu kontrak berikut sesuai jenisnya:

- **native object** untuk ornamen, panel, divider, icon, decorative group, visual text, dan elemen presentasi bawaan;
- **photo slot** untuk foto customer/template yang memang dapat diganti atau dicrop; deklarasikan `photoCropAspectSlots` pada registry hanya untuk slot yang sizing gambarnya benar-benar merespons rasio crop. Frame cover atau gambar dengan lebar dan tinggi dipaksa tetap tidak membuka kontrol rasio palsu; crop posisi/zoom tetap tersedia.
- **editable copy** untuk narasi yang pemilik boleh ubah dari menu Isi;
- **protected native/system content** untuk data event seperti nama, tanggal, venue, rekening, countdown dan recipient line: isinya tetap dari data, tetapi styling/transform visualnya boleh diedit;
- **protected functional element** untuk RSVP, Wishes, Gift, Maps, Music dan CTA sistem: fungsi/validasi/API tetap dikunci, tetapi presentation yang di-whitelist boleh diedit;
- **section surface** untuk background/padding/layout section.

Targetnya adalah **semua elemen visual penting dapat dipilih atau diatur melalui Studio tanpa mengubah business data atau merusak semantic web behavior**. Parent group boleh menjadi selectable target tambahan untuk memindahkan komposisi sekaligus, tetapi child target tetap dipertahankan untuk edit granular. Semua target visual terdaftar dapat dihapus secara reversible, termasuk presentasi foto/data/komponen; flag hidden mengikuti instance dan dipulihkan melalui Default. Record, file dan engine tidak dihapus.

Setiap template harus punya identitas visual yang berbeda: pilihan komposisi, ritme ruang kosong, karakter tipografi, gaya foto/ilustrasi, ornamen, amplop, susunan galeri, dan motion. Jangan membuat semua tema sebagai satu kerangka identik yang hanya berbeda warna/font. Contoh Zen Atelier adalah referensi **hanya untuk Zen Atelier**; tema baru memakai brief dan moodboard yang disetujui untuk tema itu.

### Kualitas visual wajib menyeluruh — bukan cover-only

**Jangan menaruh hampir seluruh effort desain di Amplop/Cover lalu membiarkan section isi terlihat seperti komponen default tanpa art direction.** Cover memang boleh menjadi hero terkuat, tetapi Greeting, Identity, Event Detail, Date & Time, Gallery, Countdown, Location, RSVP, Wishes, Gift, Closing, dan Footer tetap harus terasa sebagai bagian dari tema yang sama dan memiliki kualitas visual yang disengaja.

Setiap section tidak wajib penuh aset atau dekorasi. “Didisain” dapat diwujudkan lewat komposisi, hierarchy tipografi, ritme whitespace, treatment background/surface, framing foto, divider, ornament kecil, ilustrasi yang relevan, bentuk panel, alignment yang khas, atau motion yang sesuai. Untuk section fungsional seperti RSVP, Maps, Gift, Countdown dan Wishes, fungsi shared engine tetap dipertahankan tetapi presentation-nya harus dipoles agar menyatu dengan tema—jangan dibiarkan terlihat seperti form/card generik yang ditempel setelah cover.

Saat review template, cek **seluruh perjalanan scroll**, bukan screenshot cover saja. Tidak boleh ada pola “cover cantik → halaman berikutnya kosong/generik”. Section isi harus memiliki variasi ritme dan focal point yang cukup agar pengguna tetap merasakan art direction sampai Closing/Footer. Namun jangan menyelesaikan masalah ini dengan menumpuk banyak asset: hindari ornament yang saling bertabrakan, asset yang sama diulang di setiap section, atau dekorasi yang mengganggu teks/form. Targetnya adalah **cohesive richness**, bukan keramaian.

Template belum boleh disebut selesai bila cover sudah polished tetapi mayoritas section isi masih memakai tampilan shared/default tanpa adaptasi visual yang nyata sesuai tema.

### Font dan warna template tidak wajib mengikuti brand website

**Template undangan adalah dunia visualnya sendiri.** Font dan warna setiap template **tidak wajib sama dengan website/aplikasi Undara**. Font brand Undara (mis. DM Serif Display + Roboto), warna brand utama, serta palette Light/Dark aplikasi berlaku untuk chrome produk seperti landing page, marketing page, Dashboard, Studio UI, navigasi, dan kontrol global; aturan itu **bukan preset visual wajib untuk isi template undangan**.

Setiap template boleh menentukan pasangan font, warna dasar, accent, surface, tekstur, tone foto, dan treatment tipografi yang paling sesuai dengan art direction/moodboard tema. Tema Jepang, editorial, klasik, maroon, botanical, monochrome, playful, atau tema lain boleh memiliki palette dan font yang sama sekali berbeda dari UI Undara. Jangan memaksa warna brand `#703B3B` atau font website masuk ke template hanya demi konsistensi merek jika hal itu merusak karakter desain.

Kebebasan ini tetap memiliki guardrail: font harus layak untuk web dan terbaca, kontras warna harus cukup untuk konten penting/form/CTA, fallback font harus aman, loading font tidak boleh merusak performa, dan palette harus tetap kompatibel dengan token/editability Studio yang memang dibuka untuk template tersebut. **Jangan biarkan global CSS brand Undara secara tidak sengaja mengoverride font atau palette bawaan template.** Branding Undara di footer/chrome produk boleh tetap mengikuti sistem brand, sedangkan badan undangan mengikuti identitas tema.

**Khusus tulisan `Una & Dara` yang tampil sebagai copy/dekorasi di dalam template:** warnanya **tidak wajib coklat/warna brand Undara**. Teks tersebut boleh menggunakan warna apa pun yang paling cocok dengan palette dan art direction tema—misalnya putih, hitam, emas, biru, maroon, pastel, atau warna lain—selama kontras dan keterbacaannya tetap baik. Jangan memaksa `Una & Dara` menjadi `#703B3B` hanya karena itu warna brand website.

### Kebebasan komposisi: tidak wajib grid, boxy, atau simetris

Desain undangan adalah karya visual, **bukan dashboard**. Jangan menjadikan grid dua kolom, deretan kartu, kotak berbingkai, teks serba rata tengah, dan pembagian ruang simetris sebagai kerangka wajib atau preset yang terus diulang. Pilih komposisi berdasarkan cerita dan moodboard setiap tema: editorial satu kolom, kolase scrapbook, tipografi di kiri atau kanan saja, split yang tidak sama besar, elemen menyilang, lapisan gambar, objek berputar/diagonal, susunan bebas, atau ruang kosong yang disengaja. Satu template boleh mencampur ritme rapi dan **sedikit chaotic yang terarah**: ukuran, jarak, orientasi, dan penempatan elemen tidak harus seragam selama ada titik fokus dan hirarki yang terasa alami.

**Chaotic bukan berarti berantakan.** Jaga nama, tanggal, venue, CTA, serta form tetap terbaca, bisa disentuh dan dioperasikan; hindari gambar/tulisan bertabrakan tanpa maksud. Komposisi boleh tampak bebas pada desktop dan diatur ulang secara artistik di HP, bukan sekadar diperkecil. Jangan memaksa RSVP atau informasi penting menjadi kolase yang mengganggu fungsi.

**Jika halaman terasa kosong**, jangan otomatis menambah card, outline, ikon stok, paragraf filler, atau ilustrasi yang sama berulang-ulang. Periksa terlebih dahulu skala dan posisi tipografi, ritme whitespace, warna, kontras, serta aset yang ada. Bila memang membutuhkan elemen baru, **boleh membuat aset orisinal khusus template**: background ilustratif, tekstur kertas/kain, sketsa pemandangan, doodle, ornamen, pola, siluet, atau elemen atmosferis yang sesuai art direction. Desain baru boleh berupa SVG/CSS bila sesuai atau aset gambar tersendiri yang disimpan di folder tema; dokumentasikan tujuan, lisensi, ukuran, transparansi, responsivitas, dan optimasinya. Background tidak wajib berupa bunga atau benda dekoratif generik. Jangan membuat aset hanya untuk memenuhi ruang; bisa saja whitespace adalah bagian penting desain.

Prinsipnya: **keunikan komposisi lebih penting daripada keseragaman kotak**, tetapi semua perubahan tetap menghormati 15 komponen/data bersama, keterbacaan, animasi yang dapat dimatikan, serta aturan ilustrasi lengkap/tidak terpotong sembarangan di bawah ini.

Pakai urutan acuan: (1) permintaan spesifik owner, (2) moodboard/gambar referensi yang bisa benar-benar dilihat, (3) aset yang diperiksa secara visual, (4) ide kreatif untuk adaptasi mobile dan desktop. Jika referensi tidak tersedia atau aset tidak cocok, jelaskan bagian yang belum diketahui; jangan menyatakan hasil sudah sama persis.

Sistem pelanggan tetap satu: katalog template, data event, autentikasi, Studio, foto, musik, RSVP/QR, pengaturan section dan rute undangan publik/personal. Template berhak membuat presentasi visual unik, bukan menduplikasi database dan business logic.

## 2. Alur desain bersama ChatGPT — diulang untuk tiap tema

### Quality stack saat owner mengatakan `to design`

Untuk pekerjaan template yang dipimpin lewat ChatGPT/GPT, `to design` berarti jalankan quality stack berikut **di dalam batas brief tema ini**, bukan mengganti requirement Undara:

1. **GPT-Taste (`gpt-taste`) — art direction utama.** Gunakan untuk composition, visual hierarchy, typography, whitespace, density, layout variance, anti-card/anti-grid generik, serta direction motion. Jangan jalankan Taste default dan GPT-Taste sekaligus hanya karena keduanya tersedia; untuk sesi GPT pilih `gpt-taste` sebagai baseline.
2. **Emil Kowalski — motion & interaction craft.** Gunakan `emil-design-eng` dan, bila relevan, `animate` / `review-animations` untuk memilih apakah sesuatu perlu bergerak, kurva easing, durasi, interruption, exit/enter, hover/tap feedback, dan kualitas micro-interaction. Motion harus memperjelas pengalaman, bukan sekadar membuat semua benda bergerak.
3. **Impeccable — review/refinement.** Setelah arah visual jelas, lakukan critique terhadap hierarchy/clarity, polish terhadap konsistensi dan detail, lalu audit/harden/adapt sesuai kebutuhan sebelum menyebut template siap. Temuan Impeccable tidak boleh menghapus karakter tema atau mengubah kontrak produk yang dilindungi.

Urutan kerja default untuk template baru:
`brief + moodboard → gpt-taste direction → implementasi → Emil motion review → Impeccable critique/polish/audit → screenshot HP + desktop → koreksi`.

Semua skill eksternal hanya **quality layer**. Prioritas tetap: instruksi owner → `prd.md` → `AGENTS.md` → `template.md` → skill eksternal. Bila skill menyarankan sesuatu yang bertentangan dengan 15 komponen, responsive web invitation, accessibility, data nyata, brand/tema yang sudah disetujui, atau batas Studio, aturan Undara yang menang.

### Langkah A — Brief

Catat nama tema dan stable key, sasaran jenis acara, kesan yang ingin dicapai, foto atau tanpa foto, palet, pasangan font, batasan layout, pilihan dekorasi, referensi visual, tingkat motion, dan kebutuhan aset. Nama/tanggal/foto demo boleh dipilih bervariasi per tema, tetapi **tidak boleh dipakai sebagai data undangan pelanggan**.

### Langkah B — Moodboard dan screen-by-screen

Buat moodboard warna, font, tekstur, bentuk, komposisi dan contoh tampilan mobile. Siapkan referensi tiap bagian penting: amplop, cover, identitas, detail acara, RSVP, galeri, ucapan, hadiah dan penutup; lengkapi bagian lain dari kontrak 15 komponen. Owner dapat meminta gambar dan aset dipecah satu per satu. Minta persetujuan art direction sebelum coding; jangan menyamarkan contoh moodboard sebagai hasil website final.

### Langkah C — Aset

Lihat gambar sebenarnya sebelum menentukan penempatan. Audit nama file, transparansi, rasio, resolusi, orientasi, ukuran, crop yang aman untuk teks, dan izin penggunaan. Bedakan background, ilustrasi, ornamen, thumbnail dan foto demo. Simpan turunan web pada folder konsisten per template, misalnya public/templates/<slug>/; jangan menghapus atau menimpa master diam-diam. Master berlisensi privat jangan disimpan di repo publik/web root. Optimalkan turunan gambar untuk web; upload baru milik pelanggan tetap melalui pipeline Sharp → WebP yang sudah ada.

### Aturan kelengkapan aset ilustrasi (semua template)

Sebelum menyusun ilustrasi, periksa gambar **aslinya** dan bedakan aset berlatar opaque (RGB, satu adegan utuh) dengan objek transparan (RGBA). Untuk benda lengkap seperti lampu jalan, sepeda, kamera, pita, pasangan dan tiket, pertahankan kepala, badan, dan kaki/ujung benda **utuh** di viewport; jangan asal memberi `left:-14%`, `top:-50px`, `object-fit:cover`, atau `background-size:cover` yang hanya menampilkan potongan acak. Gambar ilustrasi utuh harus memakai rasio aslinya dan `object-fit:contain` / `width:100%; height:auto`. Jika ilustrasi tidak muat, buat **panel ilustrasi tersendiri dalam alur layout**, kurangi jumlah ornamen, atau pakai varian aset yang memang dipersiapkan untuk cropping. Crop artistik hanya boleh jika referensi memang sengaja memotong objek secara jelas, bukan karena kesalahan responsif.

Aset bergambar adegan sekaligus berlatar kertas (RGB) tidak boleh ditumpuk sebagai PNG transparan: tampilkan sebagai halaman/scene lengkap; data nama/tanggal yang dinamis boleh ditaruh di ruang kosong yang nyata dengan lapisan baca yang tetap kontras. Cek hasil pada lebar HP sempit, viewport rendah dan desktop; benda penuh perlu terlihat pada Cover, amplop, galeri, dan section tanpa tertutup teks atau klip parent. Gunakan aset secukupnya sesuai fungsi artistik, **bukan** membanjiri tiap section dengan dekorasi seragam demi menghabiskan jumlah file. Yang belum dipakai diberi alasan di audit aset. Jaga versi asli; turunan Next Image/WebP dipakai untuk mengurangi beban unduhan, dengan memperhatikan transparansi.

### Langkah D — Blueprint seluruh komponen

Untuk masing-masing 15 komponen pada §3 tentukan struktur mobile/desktop, copy yang memang diperlukan, sumber data, dekorasi, animasi, respons interaksi, fallback data kosong, dan apakah pengguna boleh mengubah propertinya lewat Studio. Musik adalah kontrol global, bukan satu layar scroll. Urutan section isi dapat berbeda sesuai kemampuan sistem, tetapi gerbang amplop tetap mendahului konten dan tidak ada komponen wajib yang dihilangkan dari manifest.

### Langkah E — Review, coding, dan perbaikan

Bandingkan mockup dengan moodboard berdampingan: hierarki tulisan, jarak, posisi ornamen, jenis foto, bentuk tombol dan suasana. Jika visual belum tepat, koreksi dahulu; jangan menambah efek untuk menutup perbedaan. Setelah disetujui, coding bertahap menggunakan sistem bersama, jalankan screenshot browser HP/desktop lalu koreksi bersama owner. Catat dengan jelas mana yang baru spesifikasi, mana yang sudah terimplementasi, dan mana yang telah diuji.

## 3. Kontrak wajib: tepat 15 komponen / kontrol

15 = Amplop Digital + 13 bagian undangan + Musik. Komponen 01 tampil sebagai gerbang sebelum isi; komponen 02–14 adalah isi yang dapat di-scroll; komponen 15 adalah pemutar musik global yang selalu mudah dijangkau, **bukan** section panjang setelah footer. Semua komponen punya toggle ON/OFF di Studio yang berlaku pada renderer nyata dan disimpan tanpa menghapus data terkait.

| No. | Key sistem | Komponen | Kontrak fungsional; presentasi boleh berbeda tiap tema |
| --- | --- | --- | --- |
| 01 | envelope | Amplop Digital | Gerbang sesuai tema; satu tombol utama **Buka Undangan**. Transisi buka hanya sekali; jika OFF, langsung masuk ke isi. |
| 02 | cover | Cover / Hero | Nama/judul acara, tanggal, foto atau ilustrasi sesuai tema dan data event. **Tidak ada tombol Lihat Undangan redundan** setelah amplop dibuka. |
| 03 | greeting | Introduction / Greeting | Salam dan pengantar asli, dengan tata letak dan tipografi khas tema. |
| 04 | identity | Identity / Host / Couple | Identitas host/pasangan dan keluarga sesuai kategori acara; tema boleh memakai foto gabungan atau dua foto jika slot mendukung. Untuk kategori pasangan, siapkan **subsegmen Our Story / Tentang Kami** yang menampilkan cerita asli pasangan bila diisi melalui menu Isi. Jangan memaksa nonwedding menjadi wedding atau membuat cerita palsu. |
| 05 | event | Event Detail | Jenis/rangkaian acara, tempat, informasi agenda yang benar. Jangan menebak awal resepsi dari field jam selesai; pakai data yang tersedia. |
| 06 | dateTime | Date & Time | Tanggal, jam, dan zona waktu valid, tanpa menggandakan seluruh paragraf Detail Acara. |
| 07 | gallery | Gallery / Media | Galeri foto/video atau artwork empty state yang jujur; utamakan motion dan interaksi kaya tetapi tetap lancar di mobile (lihat §5). |
| 08 | countdown | Countdown | Hari, jam, menit dan detik menuju acara nyata; animasi angka halus tanpa flicker. |
| 09 | location | Location / Maps | Venue, alamat, dan tombol **Lihat Lokasi** hanya ketika URL valid. |
| 10 | rsvp | RSVP / Konfirmasi Kehadiran | Form bersama dan status nyata; pilihan hadir/tentatif/tidak hadir, aksi **Kirim RSVP**, konfirmasi serta QR sesuai backend. Mode contoh tidak mengirim data pelanggan. |
| 11 | wishes | Wishes / Ucapan & Doa | Reuse **GuestWishes** dengan form nama + pesan dan daftar ucapan nyata yang disimpan per `Invitation.id`. Studio/katalog hanya menunjukkan form non-submitting; undangan tamu yang terbit menggunakan API shared. Ketika belum ada ucapan, tampilkan empty state jujur, bukan pesan tamu rekaan. |
| 12 | gift | Gift / E-Angpao | Data rekening/hadiah dari pemilik dan aksi salin yang berfungsi; tanpa rekening contoh sebagai data pelanggan. |
| 13 | closing | Closing | Kalimat penutup, nama host/pasangan sesungguhnya dan koreografi visual khas tema. |
| 14 | footer | Footer | Penutup branding yang ringkas, tanpa penjelasan teknis, watermark contoh, atau pemutar musik kedua. |
| 15 | music | Musik | Satu player play/pause bersama. Musik dipicu oleh gestur pembuka bila diizinkan browser; tidak autoplay pada page load. Dapat dimatikan melalui Studio. |

OFF menyembunyikan komponen terkait **tanpa menghapus data**. Fitur yang belum aktif tidak boleh digambarkan seolah-olah dapat menyimpan atau mengirim. Undangan publik dan kanvas Studio memakai komponen visual yang sama; fitur simpan/submit pada mode contoh harus dilindungi.

**Master template selalu lengkap.** Setiap master wajib tetap mendefinisikan seluruh 13 section isi di atas (ditambah Amplop dan Musik sebagai kontrol khusus). Aksi Studio user seperti reorder, hide/show, duplicate, atau delete bekerja pada **instance section milik undangan user**, bukan menghapus kontrak section dari master template. Restart atau ganti template harus dapat mengembalikan susunan master lengkap. Duplicate instance boleh membuat section yang sama tampil lebih dari sekali pada satu undangan, tetapi renderer/backend fungsionalnya tetap memakai komponen bersama yang aman.

### Wajah template di katalog: Cover / Hero, bukan Amplop

Saat menampilkan kartu pilihan template (termasuk tiga smartphone pilihan di `/d-invitation` dan katalog lengkap `/template-design`), ambil **tampilan Cover / Hero sebenarnya** dari renderer temanya: nama/judul, foto/ilustrasi, tipografi, dan dekorasi yang mencerminkan desain utama. **Jangan jadikan Amplop Digital sebagai thumbnail utama**, karena semua calon pembeli perlu melihat karakter visual undangannya sebelum memilih.

**Popup pilihan template dimulai dari Amplop Digital** (koreksi owner, 1 Oktober 2026). Pengunjung menekan **Buka Undangan** untuk mencoba pembuka tema, lalu melihat Cover/Hero dan menggulir isi. Kartu ponsel sebelum diklik tetap menampilkan Cover/Hero utuh seperti sekarang. Dialog tetap hanya berisi canvas undangan dan tombol keluar; mode contoh tidak boleh mengaktifkan submit form/API produksi. **Canvas Invitation Studio tetap harus menyediakan Amplop Digital** sebagai tahap yang dapat dilihat, diklik untuk mencoba animasi buka, dan diulang dengan kontrol Amplop; kontrol Cover dapat menampilkan isi langsung untuk memudahkan penyuntingan. Pilihan tampilan canvas/preview tidak mengubah nilai toggle Amplop tersimpan atau pengalaman tamu, yang tetap dimulai dari Amplop bila ON. Alur **Buat Undangan** yang tersedia di permukaan lain menuju gateway `/studio` dengan template yang dipilih; pengguna belum login diminta login dahulu, dan bila belum punya acara terkonfigurasi wajib membuat/memilih acara sebelum masuk editor. Template yang dipilih hanya dipasang sebagai perubahan Studio **belum tersimpan** hingga pengguna menekan Simpan Desain.

Ini hanya pengaturan **representasi kartu katalog**: undangan interaktif yang dibuka dari kartu atau dibagikan kepada tamu tetap dimulai dari Amplop Digital ketika toggle-nya ON, lalu Cover dan section selanjutnya. Jangan mengubah urutan buka undangan, 15 kontrol, data pelanggan, atau toggle tersimpan demi thumbnail. Kartu yang menampilkan renderer asli perlu hanya merender cover untuk menghemat performa; saat template belum mempunyai renderer nyata, gunakan gambar contoh cover yang benar dan jangan menampilkan amplop sebagai penggantinya.

### Simpan pilihan tema sampai pengguna siap masuk Studio

Jika pengunjung menekan **Buat Undangan** pada tema di katalog, simpan **hanya key tema** sebagai pilihan sementara pada browser (localStorage + cookie SameSite=Lax dengan masa berlaku tujuh hari), dan bawa key yang sama pada URL selama login → pilih/buat acara → Studio. **Jangan simpan nama/foto/data tamu dalam cookie.** Validasi key terhadap registry template; URL dan browser storage tidak memberi izin Studio atau hak publikasi. Jika pengguna belum login, tampilkan login lalu teruskan tema; jika belum ada acara, arahkan ke input acara dan **setelah acara baru berhasil disimpan** teruskan langsung ke Studio dengan tema tadi. Jika tersedia lebih dari satu acara, pengguna tetap memilih acara tujuan; jangan membuat atau menimpa acara otomatis.

Di Studio, tema pilihan katalog langsung terlihat pada canvas sebagai **perubahan belum tersimpan**. Browser storage bukan pengganti database: desain baru hanya tersimpan untuk acara tersebut setelah **Simpan Desain** berhasil; setelah itu hapus pilihan sementara agar tidak diterapkan diam-diam ke acara lain. Jika pengguna meninggalkan alur sebelum menyimpan, pilihan tema sementara dapat dipulihkan dari browser yang sama selama masa berlakunya. Gagal mengakses cookie/storage tidak boleh memblokir alur URL normal.

**Panel Tema Studio harus siap ratusan template:** menyediakan kolom pencarian dengan tombol/ikon cari yang benar-benar memfokuskan input, filter Semua / Dengan foto / Tanpa foto, urutan Pilihan aktif / Nama A–Z / Nama Z–A, penanda pilihan yang mudah ditemukan, dan tampilan bertahap (mis. 18 kartu + Tampilkan Lagi) agar tidak merender seluruh katalog pada satu waktu. Pencarian bekerja pada nama/kategori/deskripsi dan langsung memperbarui hasil. Tetap pakai Cover/Hero nyata pada setiap kartu, bukan Amplop Digital. Tidak perlu paragraf abu-abu yang menjelaskan hal yang sudah jelas.

## 4. Aturan teks dan CTA — berlaku untuk SEMUA tema dan katalog

**Hapus tulisan yang tidak membantu pengunjung mengambil tindakan.** Jangan tampilkan teks yang menjelaskan mekanisme internal, identitas data contoh, atau cara kerja pratinjau pada kartu template, bawah katalog, panel pratinjau, amplop, cover, atau isi undangan.

**Contoh teks yang harus dihilangkan dari UI:**  
- “Foto dan nama pada pratinjau merupakan data contoh. Untuk memakai foto sendiri, buat acara lalu unggah foto melalui Invitation Studio.”
- “Preview mengikuti renderer undangan publik.”
- “Pratinjau menggunakan data contoh.”, “Renderer siap digunakan.”, “Pratinjau desain Invitation Studio.”, dan keterangan lain yang menjelaskan hal yang sudah jelas.

**Hilang dari UI bukan berarti sistem berubah:** data contoh tetap dipakai pada katalog terisolasi; CTA buat undangan tetap menuju alur login/event yang aman; status penting seperti error, perubahan belum tersimpan, batas upload, dan ketersediaan fitur tetap muncul saat memang diperlukan.

**Aturan tombol dan label:** tombol pertama undangan tepat **Buka Undangan** dalam bahasa Indonesia dan Title Case, bukan BUKA UNDANGAN atau label acak tiap tema. Hapus **Lihat Undangan** di cover jika hanya menggulir isi yang sudah terbuka. Aksi yang benar-benar berbeda tetap memakai nama jelas, misalnya Lihat Lokasi, Kirim RSVP, Salin Nomor Rekening. Tombol mengikuti gaya template; teks/fungsi utama tetap konsisten.

**Tidak ada kata Pratinjau/Preview, watermark mode, badge demo, atau petunjuk developer DI DALAM renderer undangan**, termasuk amplop, cover, galeri, footer. Pada UI Studio boleh ada label kontrol yang benar-benar perlu untuk mengoperasikan editor, tetapi jangan membuat paragraf abu-abu menjelaskan demo. Nama tombol/section memakai kapitalisasi awal kata yang wajar; paragraf memakai ejaan normal. Jangan membuat seluruh tulisan tampak abu-abu pucat; utamakan kontras dan whitespace. Bahasa aplikasi default Indonesia.

Contoh nama, foto, tanggal, hashtag, alamat, ucapan dan rekening pada moodboard **hanya fixture demo**, bukan konten otomatis untuk undangan pelanggan.

**Nama pasangan baku khusus katalog dan preview contoh semua template:** gunakan **Denny & Christine** (Denny pada `groomName`, Christine pada `brideName`) dari satu fixture `data/templates/preview-invitation.ts`. Jangan membuat nama demo berbeda per tema, termasuk Zen Atelier. Aturan ini hanya berlaku untuk katalog/kartu template dan popup preview berbasis data demo. **Studio milik user, undangan yang disimpan/dipublikasikan, dan undangan personal selalu memakai nama acara asli user**, bukan fixture; jangan mengganti nama melalui fallback yang bisa bocor ke data pengguna. Jangan menampilkan fake review atau fake ucapan seolah berasal dari tamu.

## 5. Motion: animasi tipografi seluruh template; galeri paling ekspresif

### 5.1 Tipografi dan alur scroll

Setiap tema punya *motion direction* berbeda sesuai gaya, bukan satu preset identik untuk semua template. Semua heading mendapat animasi masuk yang lembut bila animasi aktif: fade, muncul dari kiri/kanan, sedikit slide/blur, mask reveal, atau stagger per baris. Nama host/pasangan bisa mendapat koreografi paling menarik; **jangan menganimasikan seluruh paragraf per huruf sampai sulit dibaca**. Nama panjang tetap wrap baik dan selectable, screen reader membaca teks utuh.

Rentang awal yang boleh disesuaikan: durasi 0,4–0,9 detik, slide 8–24px, stagger 0,04–0,12 detik. Animasi boleh replay setelah bagian **benar-benar keluar viewport dan masuk kembali**, bukan reset setiap pixel scroll. Setelah transisi, teks tetap terlihat. Jika reduced motion aktif, toggle animasi OFF, atau IntersectionObserver gagal, isi tetap muncul langsung. Jangan animasikan input ketika pengguna sedang mengetik; hentikan gerak di luar layar untuk menghemat daya.

Amplop memiliki opening motion sesuai art direction dan tetap **satu aksi Buka Undangan**. Cover tidak perlu CTA kedua hanya untuk scroll. Identity menampilkan foto/nama dengan reveal halus; detail acara bisa masuk bergantian; countdown mengganti angka tanpa mengguncang layout; penutup menggunakan animasi yang mengakhiri cerita dengan nyaman.

### 5.2 Galeri Foto = eksplorasi animasi terbesar

Pilih mode/efek yang cocok dengan identitas tema, jumlah foto dan kemampuan perangkat. **Galeri harus terasa kreatif tetapi jangan menumpuk semuanya sekaligus**: carousel + parallax + scale + autoplay tanpa jeda justru mengurangi kualitas.

- **Masonry Grid + Hover/Focus Effect:** komposisi asimetris; reveal bertahap; hover/focus sedikit zoom dan overlay relevan; pada mobile tap membuka foto.
- **Carousel / Swipe:** cocok untuk koleksi lebih besar atau tema yang horizontal. Snap halus, tombol prev/next yang aksesibel, posisi jelas; autoplay tidak wajib.
- **Parallax Scrolling Gallery:** aksen kedalaman beberapa piksel saat terlihat; nonaktif pada reduced motion atau perangkat yang tersendat.
- **Alternatif per tema:** lightbox, clip-mask reveal, polaroid, scrapbook, filmstrip, editorial split, atau Ken Burns lembut; pilih satu bahasa visual dominan.
- 0 foto → artwork tema/empty state jujur. 1 foto → komposisi tunggal. 2 foto → diptych/dua panel. 3–8 foto → masonry/carousel sesuai tema. Banyak foto → lazy-load dan pengalaman tetap lancar. Jangan membuat chip kategori foto jika tidak ada kategori asli dalam data.

Lightbox keyboard Escape, tombol/fokus dapat digunakan tanpa mouse, alt text bermakna, swipe mobile tidak mengunci scroll halaman. Gambar responsif dan lazy loading; ukurannya stabil untuk mencegah layout shift; batasi efek aktif dan utamakan transform/opacity.

## 6. Library dan kemampuan animasi yang SUDAH kita miliki

**Jangan batasi kreativitas pada animasi fade/slide biasa.** Repo Undara sudah punya beberapa library yang dapat dikombinasikan untuk membuat masing-masing template memiliki gerak, kedalaman, dan interaksi berbeda. Daftar ini diverifikasi dari `package.json` dan stack proyek; *terpasang* bukan berarti setiap efek di bawah sudah terimplementasi, sudah lolos uji performa, atau boleh diaktifkan sekaligus.

| Library / teknologi | Kemampuan untuk template undangan | Contoh penerapan yang relevan |
| --- | --- | --- |
| **Motion** (`motion/react`) | Animasi komponen React, variants/stagger, gesture hover/tap/drag, enter/exit, layout transitions, animasi berbasis scroll. | Amplop terbuka, nama pasangan masuk dari kiri-kanan, halaman foto muncul bergantian, carousel geser, kartu ucapan muncul ketika terlihat. |
| **GSAP** (`gsap`) | Timeline koreografi lebih kompleks, urutan animasi presisi, scrub/tween saat scroll bila plugin dan integrasinya tersedia. | Pembukaan undangan multi-lapis, teks/mask reveal, gerak ornamen mengikuti scroll, parallax galeri yang halus. Pastikan plugin yang dipakai memang tersedia sebelum mengimpornya. |
| **Three.js + React Three Fiber** (`three`, `@react-three/fiber`) | 3D/WebGL, depth, kamera, cahaya, material dan interaksi scene. | Amplop atau objek dekoratif 3D, efek ruang/portal mini, album foto berlapis dalam satu tema yang memang memerlukan 3D. Aktifkan hanya pada tema yang sesuai dan sediakan fallback 2D. |
| **React Konva + Konva** (`react-konva`, `konva`) | Kanvas interaktif 2D untuk komposisi objek dan manipulasi posisi/rotasi. | Scrapbook, stiker, potongan kertas, atau album foto yang bisa dipindahkan bila desainnya benar-benar membutuhkan interaksi kanvas. Jangan memakainya untuk teks utama atau form RSVP yang perlu aksesibel. |
| **Tailwind CSS v4 + `tw-animate-css` + CSS native** | Styling responsif, keyframes, transitions, transforms, clip-path, mask, gradients, scroll snap dan efek hover/focus ringan. | Paper-fold, tombol, floating petals, reveal gambar, masonry editorial, filter foto, text masking, microinteraction tanpa beban JavaScript besar. |
| **Lucide React** (`lucide-react`) | Ikon vektor yang konsisten; CSS/Motion bisa memberi transform, reveal atau gerakan halus. | Kontrol musik, panah carousel, penanda lokasi, RSVP, efek indikator scroll seperlunya. |
| **Next.js 16 + React 19** | Komposisi komponen, lazy loading lewat dynamic import, optimasi/pemisahan asset dan state interaktif. | Hanya unduh implementasi tema yang dibuka; mount galeri berat saat diperlukan; hindari mengunduh 3D pada tema 2D. |
| **Sharp** (`sharp`) | Pengolahan aset gambar dan konversi WebP di sisi server, **bukan** mesin animasi. | Optimalkan foto pengguna dan turunan gambar tema agar gallery/parallax tetap ringan di HP. |

**Catatan akurasi:** `@react-three/drei` **tidak tercantum dalam dependency `package.json` saat panduan ini diperbarui**. Jangan menganggapnya tersedia tanpa pemeriksaan dan persetujuan untuk menambah dependency. Native `IntersectionObserver`, `requestAnimationFrame`, CSS dan `prefers-reduced-motion` juga dapat dipakai tanpa menambah library. Jangan memilih library hanya karena tersedia: gunakan opsi paling sederhana yang mampu menghasilkan desain sesuai moodboard dan menjaga performa.

### Contoh kombinasi efek menurut bagian dan arah tema

- **Amplop:** Motion untuk gerak flap, segel, surat, dan crossfade; GSAP timeline jika pembukaannya memiliki banyak tahap; 3D hanya bila brief meminta amplop 3D, bukan sebagai standar semua tema.
- **Cover dan tipografi:** variants/stagger Motion atau timeline GSAP untuk judul muncul dari kiri/kanan, clip-mask reveal, perubahan tracking, dan decorative strokes. Tetap gunakan teks HTML nyata dan jangan membuat elemen dekoratif menutupi nama.
- **Galeri (bagian paling kaya animasi):** CSS Grid/Masonry + Motion untuk layout/hover/focus, drag carousel untuk swipe, GSAP *atau* animasi scroll Motion untuk parallax, mask reveal, lightbox dengan enter/exit, dan efek depth 3D bila sesuai tema. Pilih satu teknik utama dan paling banyak beberapa aksen; jangan menjalankan semua engine atas elemen yang sama.
- **Countdown, lokasi, RSVP, hadiah:** animate angka/pergantian state dan feedback tombol dengan Motion/CSS; utamakan respons cepat dan aksesibilitas, jangan menggeser field saat pengguna mengetik.
- **Closing:** timeline tipografi, ilustrasi bergerak pelan, partikel ringan atau fade yang mengikuti art direction; animasi selesai dengan seluruh pesan tetap terbaca.

### Aturan pemilihan library sebelum coding

1. Catat **efek → library → alasan → kebutuhan asset → fallback mobile/reduced-motion** dalam brief tema. Untuk efek sederhana, utamakan CSS atau Motion; untuk koreografi berantai GSAP; untuk 3D Three/Fiber; untuk kanvas interaktif 2D Konva.
2. Pastikan kompatibilitas React/Next, dependency serta plugin yang benar-benar terpasang melalui repo. Hindari memasang paket baru atau mencampur Motion dan GSAP pada properti `transform`/opacity yang sama tanpa orkestrasi jelas.
3. Hormati `prefers-reduced-motion`, kontrol animasi ON/OFF bila tersedia, keterbacaan teks, keyboard/touch, dan fallback bila WebGL gagal. Animasi tidak boleh menahan isi pada opacity 0 atau menghambat RSVP.
4. Lazy-load hanya kemampuan berat yang digunakan tema aktif. Batasi animasi bersamaan, hentikan pekerjaan ketika section tidak terlihat, hindari layout thrashing dan parallax berlebihan; evaluasi HP kelas menengah, bukan desktop saja.
5. Nilai kualitas dari **kesesuaian dengan moodboard dan hasil nyata**, bukan jumlah efek/library. Satu tema bisa minimal dan tenang; tema lain bisa sinematik, playful, scrapbook atau 3D. Tetap berbeda identitas meskipun memakai library bersama.

## 7. Studio, data, dan batasan implementasi

Satu registry template pada lib/templates/catalog.ts digunakan katalog, /d-invitation, dan Studio. Section keys mengikuti lib/templates/sections.ts; renderer pelanggan dan kanvas Studio berbagi tampilan nyata. Tema baru yang masih berupa gambar boleh muncul sebagai referensi visual tetapi **belum dapat dipilih/dipublikasikan** sampai renderer siap.

Foto pelanggan dibaca dari pustaka event yang sama, bukan di-upload ulang untuk setiap tema. Template tanpa foto tidak memaksa foto walaupun event memiliki aset. Upload foto baru tetap melewati Sharp → WebP. Musik satu player, pilihan pemilik event mengungguli default; penghormatan aturan autoplay browser dan mute. RSVP serta QR memakai sistem yang telah ada; jangan membuat tabel atau endpoint palsu demi demo. Wishes memakai model `GuestWish` dan endpoint bersama `/api/invite/[slug]/wishes`; seluruh tema memakai komponen presentasi `GuestWishes`, bukan membuat model/endpoint/form simpan duplikat. **Migrasi GuestWish wajib diterapkan pada database target sebelum mengaktifkan pengiriman ucapan publik.**

Pengaturan font/palet hanya untuk properti yang didukung template dan harus tampak di semua bagian relevan tanpa menghilangkan identitas visual atau mengorbankan kontras. Kemampuan animasi per section dinyatakan jelas bila disediakan. Gunakan lazy loading agar membuka satu template tidak mengunduh kode/aset seluruh katalog. Pertahankan rute publik/personal, validasi server, pembayaran dan akses sesuai PRD.

### Ucapan Tamu menggunakan layanan bersama, bukan teks placeholder

Bagian **Ucapan Tamu** tetap merupakan satu dari 15 section toggle. Nama bagian di Studio cukup **Ucapan Tamu**; jangan menempelkan kalimat "Pengiriman ucapan belum tersedia" pada label saat fitur sudah memiliki API. Renderer tema menampilkan `components/PublicInvitation/GuestWishes.tsx` dalam section `wishes`. Form nama dan pesan hanya aktif pada undangan tamu yang telah terbit, event terkonfigurasi, pembayaran Digital Invitation valid dan akses password (jika dinyalakan) terpenuhi. Kiriman menjadi satu record `GuestWish` milik `Invitation.id`; **jangan membuat record Guest baru, mengubah RSVP, atau menganggap penulis ucapan otomatis terdaftar sebagai tamu**. Balasannya menampilkan pesan asli sebagai teks biasa tanpa HTML/ucapan fiktif. Panjang maksimum nama 80 dan pesan 600 karakter; endpoint menerapkan batas frekuensi kirim dan mengambil maksimal 30 pesan terbaru.

Canvas Studio dan kartu/popup katalog tidak memanggil endpoint produksi, tidak mengirim atau membuat pesan, dan boleh menampilkan form nonaktif untuk menguji visual. Toggle OFF menyembunyikan section tanpa menghapus record pesan; ON kembali menampilkan data event yang sama. Error jaringan ditampilkan hanya ketika benar-benar terjadi, bukan sebagai kalimat tetap yang membuat pengguna mengira fitur belum tersedia.

Penyimpanan ini memerlukan migrasi `prisma/migrations/20260924183000_guest_wishes/migration.sql`: setelah pull jalankan `pnpm db:deploy` dan `pnpm db:generate` terhadap database target sebelum mencoba ucapan publik. Keberhasilan build saja **bukan bukti migrasi sudah diterapkan atau fitur siap produksi**; uji kirim/muat ulang pada event berbayar yang sudah publish dan cek spam/moderasi sebelum layanan publik berskala besar.

### Menu Isi Studio = struktur section dan komponen editable

**Kontrak komponen narasi untuk SEMUA template baru:** selain 15 komponen/section pada §3, setiap tema wajib memiliki **slot teks naratif nyata di dalam section yang sesuai**, bukan empat section baru dan bukan sekadar textbox di Studio. Susun tampilan serta kalimat bawaan sesuai art direction masing-masing tema, tetapi pastikan setidaknya tersedia:

| Slot narasi yang wajib disiapkan | Lokasi dalam 15 section | Fungsi slot text |
| --- | --- | --- |
| **Salam / Pengantar** (`greeting`) | Introduction / Greeting | Mengganti salam atau kalimat pembuka, bukan judul section. |
| **Permohonan Kehadiran** (`attendanceRequest`) | Introduction / Greeting atau Detail Acara | Mengganti kalimat mengundang/memohon kehadiran tanpa mengubah siapa, kapan dan di mana acara berlangsung. |
| **Doa / Harapan** (`prayerWish`) | Introduction / Greeting atau Closing | Mengganti doa atau harapan sesuai jenis acara dan pilihan pemilik; tidak mewajibkan formula agama tertentu. |
| **Ucapan Penutup** (`closing`) | Closing | Mengganti ucapan terima kasih atau kata perpisahan sebelum nama host/pasangan yang bersumber dari data acara. |

**Cerita pasangan / Our Story** (`ourStory`) adalah slot narasi tambahan **wajib tersedia pada setiap tema yang mendukung acara berformat pasangan**, tampil sebagai subsegmen Identitas setelah data pasangan dan sebelum detail acara. Isi field diedit dari menu **Isi** di kiri, termasuk kalimat panjang dan baris baru, dengan batas maksimal 1.600 karakter; klik teks pada canvas memilih visualnya dan inspector kanan hanya mengatur style/motion. Judul tampilan **Our Story / Tentang Kami** dan dekorasinya milik template; **nama pasangan tetap berasal dari data acara**. Ketika cerita belum diisi, jangan munculkan cerita karangan, teks contoh, atau area kosong pada undangan tamu. Segmen mengikuti toggle **Identitas**, tanpa menciptakan section ke-16 atau toggle baru. Untuk acara non-pasangan, menu Isi tidak menampilkan field ini dan renderer tidak menampilkan segmen cerita pasangan. Cerita disimpan per event di `::copy=` dan menggunakan renderer yang sama pada canvas Studio dan undangan publik.

**Penjelasan tambahan, kutipan dan tulisan artistik** (`explanation`, `quote`, atau ID slot spesifik tema) hanya ditambahkan ke menu Isi bila template benar-benar mempunyai teks naratif tersebut di renderer (misalnya `zenQuote` pada Zen Atelier). Jangan mengarang paragraf penjelasan untuk template yang tidak memerlukannya. Susun slot narasi terpisah di level komponen meskipun layout menggabungkannya menjadi satu blok agar masing-masing bisa diedit tanpa mengubah kalimat atau data lain.

**Menu Isi bukan form acara kedua.** Menu ini menjadi navigator struktur section: nama section + toggle ON/OFF, editor wording untuk slot naratif yang memang dimiliki renderer, dan child **Input/Button** hanya bila komponen fungsional tersebut benar-benar ada. Klik text naratif di canvas tetap memilih visualnya, tetapi **wording diedit dari Isi kiri**; inspector kanan hanya typography/warna/posisi/motion yang didukung. Foto dipilih dari canvas/menu Foto, sedangkan fungsi/data bisnis tetap bersumber dari model event/API yang sama. Setiap slot narasi di atas harus mempunyai teks default, batas karakter, identitas field stabil pada manifest/capability, dan jalur renderer nyata → canvas Studio → Simpan Desain → undangan publik/personal yang sama. Penggantian teks harus langsung terlihat serta ikut Undo/Redo; field yang tidak tersedia pada kategori acara/varian template disembunyikan, bukan menghasilkan input palsu. Jangan mengubah teks nama, tanggal, venue, data tamu atau label tetap milik komponen. **Template baru tidak dianggap READY jika slot narasi wajib hanya muncul sebagai input Studio tetapi belum muncul pada undangan sungguhan.**

**Tidak termasuk data yang dibuat ulang di Studio:** nama pasangan/host, urutan anak/orang tua, tanggal dan jam, tempat/alamat/maps, rekening/hadiah, serta data tamu tetap berasal dari source of truth Dashboard. Studio boleh mengubah capability fungsional yang memang disediakan komponen bersama—misalnya RSVP Input Group, custom column, atau style Button—tanpa membuat data paralel atau endpoint baru. Judul/label sistem yang dikunci template tetap tidak boleh dilepas bebas tanpa capability eksplisit. Semua itu tetap berasal dari model acara, komponen bisnis atau capability template yang sudah dimiliki, bukan salinan input terpisah yang dapat bertabrakan dengan Dashboard. Jangan membuka edit semua node teks dengan contentEditable atau memodifikasi source component per pengguna.

**Kontrak data:** renderer Studio dan undangan publik memakai slot default dan override event yang sama; field naratif disimpan **di dalam design key undangan yang sudah terikat pada satu event** (kontrak `::copy=` pada `lib/templates/editable-copy.ts`), tanpa mengubah `Invitation.description`/eventNotes atau menambah kolom DB paralel. Override teks harus terlihat langsung di canvas, ikut Undo/Redo dan indikator belum disimpan, serta hanya tersimpan melalui **Simpan Desain**. Saat berpindah tema, kosongkan override tema sebelumnya agar kata-kata khusus tema tidak bocor ke desain baru; ketika membuka ulang tema yang tersimpan, nilai pengguna dikembalikan. Batasi panjang dan validasi whitelist field saat membaca/menyimpan; jangan pernah mengizinkan properti arbitrer dari browser menimpa data acara. Ketika belum ada override, render copy bawaan tema/data deskripsi acara sesuai aturan lamanya agar undangan lama tidak berubah.

**Status implementasi existing (27 September 2026):** seluruh 12 template built-in aktif memakai slot `greeting`, `attendanceRequest`, `prayerWish`, dan `closing` dari registry `lib/templates/editable-copy.ts`; event berformat pasangan juga mempunyai **`ourStory` sebagai subsegmen Identitas**, dan Zen Atelier mempunyai `zenQuote`. Semua wording tersebut diedit dari menu **Isi** kiri, tersimpan pada design key event, dan dirender oleh komponen publik yang sama. Inspector kanan tidak mengubah isi narasi; ia hanya mengatur properti visual/motion. Template baru wajib mengikuti kontrak ini sebelum READY.


**Kontrak child menu Isi:** section tanpa Input/Button cukup mempunyai toggle ON/OFF. Section dengan Input/Button menampilkan child row yang sesuai dan hanya child itu yang membuka konfigurasi fungsional lebih lanjut. Implementasi awal: RSVP = Input + Button; Ucapan Tamu = Input + Button; Lokasi = Button; Hadiah/E-Angpao = Button. Jangan menampilkan child menu fiktif untuk section lain sampai renderer benar-benar mempunyai komponen tersebut. Text naratif menggunakan `data-studio-copy-field`; Input/Button menggunakan identity canvas yang stabil dan visual override event-scoped yang ikut Undo/Redo serta Simpan.

### Amplop Digital wajib benar-benar terintegrasi dengan Studio

Untuk **setiap template baru yang bisa dikustomisasi**, amplop bukan PNG tetap atau halaman demo terpisah. Perlakukan amplop sebagai bagian dari renderer undangan yang sama dengan Cover. Saat user mengganti palet/font di Studio, preview amplop harus langsung berubah **tanpa harus klik Simpan Desain dahulu**, dan setelah disimpan, undangan publik/personal harus memakai nilai yang sama. Integrasi minimum pada template yang mengizinkan kustomisasi:

- **Palet:** warna background, permukaan kertas/lipatan, teks, aksen segel/ornamen dan tombol memakai token renderer bersama (`--inv-scene-bg`, `--inv-scene-surface`, `--inv-scene-ink`, `--inv-scene-surface-ink`, `--inv-scene-accent`, `--inv-scene-soft`), dengan fallback palet asli tema saat preset dipilih. Gunakan warna campuran dari token untuk shading, bukan warna hardcode yang mengabaikan Studio. Kontras teks harus tetap baik termasuk pada palet gelap. Motif/ilustrasi asli boleh mempertahankan identitas, tetapi ornamen yang secara visual diklaim bisa diwarnai harus memiliki layer/tint yang mengikuti token. PNG/JPG utuh **tidak otomatis dapat diubah warna per-bagiannya**; pecah objek menjadi layer nyata bila desain memerlukan recolor.
- **Font dan isi:** nama/judul pada amplop menggunakan font heading aktif `--inv-heading`, copy lain mewarisi font body; nama/tanggal/penerima diambil dari data acara/tamu yang sudah terhubung, bukan tulisan statis dari mockup. Ikuti aturan kapitalisasi display-only, tanpa memodifikasi database.
- **Kontrol yang sudah ada:** toggle Amplop ON/OFF, pembuka **Buka Undangan**, musik dari gestur klik, kontrol Amplop/Cover di canvas Studio, animasi yang bisa diulang serta reduced motion harus bekerja pada renderer nyata yang sama. Foto/media hanya muncul pada amplop apabila template secara resmi mendeklarasikan slot dan renderer mendukungnya; jangan memperlihatkan picker palsu atau mengunggah ulang data.
- **Batas desain:** untuk template yang secara eksplisit mengunci palet/font, jangan tampilkan pilihan yang tidak bekerja; jelaskan capability saat memilih tema, bukan di dalam undangan. Jangan membuat semua amplop identik demi satu sistem; **shared tokens/data/behavior, art direction tetap milik tema**.

**Uji wajib per template sebelum READY:** ubah palet terang→gelap dan font dari Studio sambil berada di canvas Amplop, pastikan permukaan/tulisan/ornamen berubah dan kontras terbaca; coba Buka Undangan dan kontrol Cover; simpan lalu muat ulang dan bandingkan dengan URL publik; uji Amplop OFF, musik OFF, dan reduced motion. Jika satu pengaturan tidak memengaruhi amplop padahal tersedia di Studio, implementasinya belum selesai.



## 8. Checklist sebelum menyebut sebuah tema selesai

- [ ] Brief, moodboard, dan aset tema tersebut sudah diperiksa serta disetujui owner; tidak menggunakan visual Zen Atelier pada tema lain tanpa alasan.
- [ ] Semua 15 komponen tersedia; amplop mendahului isi, musik satu kontrol global; ON/OFF tersimpan dan terpantul di kanvas serta undangan tamu.
- [ ] Setiap template baru memiliki komponen narasi nyata untuk salam, permohonan kehadiran, doa/harapan, dan penutup; setiap template baru untuk acara pasangan juga memiliki subsegmen Our Story opsional yang benar-benar terhubung ke menu Isi; teks penjelasan/kutipan hanya diedit apabila benar-benar dirender. Semua default tampil wajar, dan perubahan langsung terlihat di canvas, ikut Undo/Redo, tersimpan untuk satu event serta sama pada undangan tamu; tidak ada input duplikat data acara.
- [ ] Tombol utama bertuliskan **Buka Undangan**, tanpa tombol Lihat Undangan redundan dan tanpa label Pratinjau di dalam undangan.
- [ ] Katalog/Studio bebas copy pengantar data contoh, klaim renderer, dan teks abu-abu penjelasan tak perlu; error dan informasi penting tetap jelas.
- [ ] Foto/nama/venue/rekening demo tidak pernah menjadi konten pelanggan; data kosong, nama/venue panjang, nonwedding, dan foto banyak diuji.
- [ ] Animasi heading halus dan dapat replay setelah keluar-masuk viewport; reduced motion, keyboard dan pembaca layar tetap berfungsi.
- [ ] Galeri punya komposisi serta efek sesuai karakter tema; kondisi 0/1/2/banyak foto dan sentuhan mobile diperiksa.
- [ ] Library animasi dipilih dan digunakan sesuai brief/moodboard (CSS/Motion/GSAP/Three/Fiber/Konva bila relevan), bukan diasumsikan semua dipakai; dependency, reduced motion, fallback dan performa mobile diperiksa.
- [ ] RSVP publik, QR, tautan peta, Gift, musik dan seluruh kontrol yang tersedia benar-benar berfungsi; mode demo tidak menulis data pelanggan.
- [ ] Screenshot HP dan desktop dibandingkan side by side dengan referensi tiap layar; perbedaan yang belum selesai dicatat, bukan diklaim sama persis.
- [ ] TypeScript, tes, build, performa aset dan aksesibilitas dijalankan, dengan hasil nyata dicatat di PRD; push GitHub saja tidak berarti semua tes lulus.

**Cara pakai di chat selanjutnya:** “Buat template [nama tema] mengikuti template.md; mulai brief, moodboard, contoh 15 komponen, dan aset satu per satu sebelum coding.”  
**Penting:** dokumen ini adalah standar produksi; keberadaan checklist bukan bukti setiap template sudah memenuhi semua poin.

### Kontrak Gallery Settings lintas template — 1 October 2026

Template dengan slot foto `gallery` harus mendukung konfigurasi Gallery event-scoped tanpa kehilangan identitas visual master. Mode default adalah **`template`**, sehingga layout Gallery authored milik masing-masing tema tetap digunakan. Bila pengguna memilih renderer bersama dari Studio, opsi yang didukung adalah **Carousel / slider, Kartu bertumpuk, Filmstrip swipe, dan Kolase masonry**. Pergantian mode hanya mengubah presentasi; sumber foto, ID asset, urutan, crop/transform per foto, hak akses event, dan data undangan tetap memakai engine bersama.

Urutan foto yang dipilih harus stabil dan disimpan berdasarkan asset ID, bukan posisi DOM sementara. Carousel/Stack dapat memakai autoplay dengan interval tersimpan, transisi tersimpan, Pause/Resume, navigasi manual dan swipe. Reduced Motion menonaktifkan perpindahan otomatis serta menghilangkan transisi gerak. Animasi entrance foto tetap memakai motion engine shared dan harus dipisahkan dari state visibility slideshow agar slide nonaktif tidak muncul akibat `opacity/transform` inline.

Tambahan checklist Gallery:
- [ ] Mode `Default template` menghasilkan Gallery yang sama seperti sebelum custom setting dipilih.
- [ ] Reorder tersimpan setelah refresh/Save dan sama pada Studio final preview serta renderer publik.
- [ ] Carousel/Stack diuji autoplay ON/OFF, interval minimum/maksimum, Pause/Resume, arrow/dot, swipe, keyboard focus, dan Reduced Motion.
- [ ] Filmstrip dan Masonry tetap menampilkan seluruh foto yang dipilih tanpa slicing tersembunyi.
- [ ] Entrance animation + stagger tidak mengubah visibility slide dan tidak mengganggu selection identity `data-studio-photo-id`.


## Confetti Club — birthday production brief (3 October 2026)

- **Stable key / occasion:** `confetti-club`, ulang tahun; satu nama, tanpa asumsi usia.
- **Art direction:** kertas krem #fff6e5, cobalt #2445ae, coral #f77959 untuk artwork, tinta navy #222c51. Teks coral memakai campuran tinta yang lebih gelap. Syne + Inter; judul besar dan kontrol readable, tanpa microcopy dekoratif.
- **Visual reference:** tiga referensi terpisah (cover, amplop hadiah, RSVP) dibuat sebelum coding. Komposisi diterjemahkan menjadi SVG/CSS native; gambar referensi tidak menjadi UI raster dengan data acara yang dibakukan.
- **Journey:** hadiah/amplop cobalt berlipat dan pita coral → cover tipografi/kue → narasi → potret tunggal opsional → detail/jadwal pesta → kolase kenangan → countdown/lokasi → RSVP/ucapan/hadiah → penutup kue kecil.
- **Media:** `cover` pada Identity dan `gallery` pada album; semua foto berasal dari event. Preview birthday terisolasi memakai portrait demo lokal, bukan pasangan pernikahan. Empty state tidak mengarang foto atau usia.
- **Editing:** native marker pada judul, nama, lipatan/pita, stand/body/icing/candles kue dan dekorasi section; foto memakai crop/focus/transform shared. Background tetap merupakan surface per section.
- **Motion:** opening sekali 650 ms melalui transform/opacity; keyboard/Reduced Motion/OFF langsung. Entrance shared dengan override pelanggan didahulukan.
- **Reusable features:** tidak ada RSVP/Wishes/music/maps/gift/countdown engine kedua dan tidak ada dependency/audio baru.

Release QA yang belum dibuktikan browser:
- [ ] Desktop 1440px serta mobile 320/390px; nama/alamat pendek dan panjang.
- [ ] Tanpa foto, satu foto, banyak foto; crop, geser, Gallery Settings, Simpan → reload → public.
- [ ] Klik/select/resize/delete artwork, edit surface per section, lock dan keyboard/touch.
- [ ] Opening pointer/keyboard, Reduced Motion, section animation OFF, RSVP/Wishes preview read-only dan musik.
