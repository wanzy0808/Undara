"use client";

import Link from "next/link";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import Navbar from "@/components/Layout/Navbar/Navbar";
import PublicMarketingAtmosphere from "@/components/Layout/PublicMarketingAtmosphere";
import MarketingFrameFooter from "@/components/Layout/MarketingFrameFooter";

/**
 * Owner-supplied terms adapted for Undara. Keep legal/operational promises
 * aligned with actual services and review the text before production use.
 */
const terms = {
  id: {
    title: "Syarat & Ketentuan",
    introduction: "Ketentuan Umum",
    opening: [
      "Syarat dan Ketentuan Pengguna ini mengatur penggunaan layanan Undara, termasuk situs web, fitur undangan digital, RSVP, manajemen tamu, dan layanan acara yang tersedia melalui platform Undara. Dalam dokumen ini, “Undara” merujuk pada penyedia platform, sementara “Pengguna” atau “Anda” merujuk pada pihak yang mengakses atau menggunakan layanan.",
      "Dengan mendaftar dan/atau menggunakan layanan Undara, Anda menyatakan telah membaca serta memahami ketentuan ini. Apabila Anda tidak menyetujuinya, Anda dapat menghentikan penggunaan layanan dan menghubungi layanan pelanggan melalui kanal yang tersedia pada situs untuk menanyakan penutupan akun.",
      "Pengguna bertanggung jawab memastikan bahwa dirinya memiliki kecakapan hukum untuk menggunakan layanan dan mengadakan perjanjian yang mengikat, termasuk memperoleh persetujuan orang tua atau wali apabila dipersyaratkan oleh hukum yang berlaku.",
    ],
    sections: [
      {
        title: "Definisi",
        points: [
          "“Akun Pengguna” adalah akun yang dibuat setelah proses pendaftaran pada Undara.",
          "“Biaya Layanan” adalah harga atau biaya yang diinformasikan untuk paket atau fitur berbayar sebelum pengguna menyelesaikan transaksi.",
          "“Kebijakan Privasi” adalah ketentuan pemrosesan data pribadi yang tersedia pada halaman Kebijakan Privasi Undara.",
          "“Konten Pengguna” mencakup data, teks, foto, gambar, video, musik, dan berkas lain yang diunggah atau dimasukkan oleh pengguna ke layanan.",
          "“Pengguna” adalah pihak yang mengunjungi, mendaftar, atau menggunakan Undara maupun undangan digital yang dipublikasikan melalui platform.",
          "“Transaksi” adalah pembelian paket atau layanan melalui mekanisme pembayaran yang tersedia pada Undara.",
          "“Undangan Digital” adalah halaman undangan acara yang dibuat dan/atau dipublikasikan menggunakan layanan Undara.",
        ],
      },
      {
        title: "Ketentuan Penggunaan",
        points: [
          "Pengguna bertanggung jawab menjaga keamanan akun, kata sandi, dan akses yang diberikan kepada pihak lain. Jangan menggunakan akun atau identitas milik orang lain tanpa kewenangan.",
          "Pengguna wajib memberikan informasi yang akurat ketika mendaftar, melakukan transaksi, atau menggunakan fitur yang memerlukannya, dan memperbarui informasi tersebut apabila berubah.",
          "Pengguna dilarang memakai layanan untuk penipuan, tindakan melanggar hukum, mengganggu orang lain, merusak sistem, atau mengakses layanan secara tidak sah.",
          "Akses ke sejumlah fitur dapat bergantung pada paket, status pembayaran, jenis acara, atau ketentuan khusus yang ditampilkan pada fitur terkait.",
          "Penggunaan data pribadi sehubungan dengan layanan ini dijelaskan lebih lanjut dalam Kebijakan Privasi Undara.",
        ],
      },
      {
        title: "Konten Pengguna",
        points: [
          "Pengguna tidak boleh mengunggah atau menyebarkan konten yang melanggar hukum, mengandung ancaman, penipuan, diskriminasi, pelanggaran privasi, atau pelanggaran hak pihak lain.",
          "Pengguna bertanggung jawab atas kebenaran informasi acara, izin penggunaan foto, video, musik, nama, data tamu, dan konten lain yang dimasukkan ke platform. Pastikan Anda memiliki hak atau izin yang diperlukan untuk menggunakannya.",
          "Pengguna mempertahankan hak atas Konten Pengguna miliknya. Sepanjang diperlukan untuk menyediakan fitur yang dipilih pengguna, pengguna mengizinkan Undara menyimpan, mengolah, menampilkan, dan menyampaikan konten tersebut kepada tamu yang diberi akses. Izin ini terbatas pada penyediaan dan pengoperasian layanan sesuai pengaturan publikasi pengguna dan Kebijakan Privasi.",
          "Undara dapat membatasi akses atau menghapus konten apabila terdapat alasan yang sah, termasuk laporan pelanggaran hak, penyalahgunaan layanan, atau permintaan berdasarkan ketentuan hukum yang berlaku.",
          "Pengguna bertanggung jawab atas dampak dari pengunggahan atau pembagian Konten Pengguna yang dilakukan tanpa hak. Ketentuan ini tidak menghapus kewajiban Undara yang tetap berlaku berdasarkan hukum.",
        ],
      },
      {
        title: "Biaya Layanan",
        points: [
          "Sebagian fitur atau paket Undara dapat dikenakan biaya. Harga, cakupan fitur, dan syarat pembayaran yang relevan ditampilkan pada halaman paket atau proses transaksi sebelum pembelian diselesaikan.",
          "Akses terhadap layanan berbayar mengikuti paket yang dibeli, status transaksi, serta ketentuan khusus yang diberitahukan pada saat pembelian. Biaya tambahan, apabila ada, harus diinformasikan sebelum transaksi terkait dikonfirmasi.",
          "Ketentuan pembatalan, pengembalian dana, atau perubahan paket—jika tersedia—mengikuti informasi yang ditampilkan pada penawaran atau transaksi terkait serta ketentuan hukum yang berlaku.",
        ],
      },
      {
        title: "Jaminan dan Ketersediaan Layanan",
        points: [
          "Undara berupaya menyediakan layanan sesuai fitur dan cakupan paket yang diinformasikan. Akses dapat terpengaruh oleh pemeliharaan, gangguan jaringan, perangkat pengguna, atau layanan pihak ketiga.",
          "Undara tidak menjamin bahwa layanan akan selalu tersedia tanpa gangguan atau bahwa setiap perangkat, browser, dan koneksi akan bekerja secara identik. Apabila terjadi gangguan, pengguna dapat menghubungi layanan pelanggan melalui kanal yang tersedia.",
          "Informasi acara dan Konten Pengguna berasal dari pengguna yang membuat atau mengunggahnya; pengguna bertanggung jawab memastikan keakuratan informasi tersebut. Ketentuan ini tidak mengurangi hak konsumen atau tanggung jawab yang tidak dapat dikecualikan menurut hukum yang berlaku.",
        ],
      },
      {
        title: "Pembatasan Tanggung Jawab",
        points: [
          "Undara tidak membuat atau memverifikasi setiap Konten Pengguna secara otomatis. Kebenaran detail acara, hak atas media, dan informasi yang dipublikasikan menjadi tanggung jawab pengguna yang memasukkannya, sejauh diperbolehkan oleh hukum.",
          "Kami berupaya menjaga keamanan layanan, tetapi penggunaan layanan daring tetap memiliki risiko, termasuk akses tidak sah, penipuan melalui pihak lain, gangguan jaringan, dan perangkat yang terinfeksi. Pengguna disarankan menjaga kredensial akun dan berhati-hati terhadap tautan atau permintaan data yang mencurigakan.",
          "Setiap pembatasan tanggung jawab dalam ketentuan ini berlaku hanya sejauh diperbolehkan hukum dan tidak mengesampingkan hak konsumen, kewajiban perlindungan data pribadi, maupun tanggung jawab yang menurut hukum wajib dipenuhi oleh Undara.",
        ],
      },
      {
        title: "Hak Kekayaan Intelektual",
        points: [
          "Nama, logo, desain, perangkat lunak, dan konten platform yang dimiliki oleh Undara atau pemberi lisensinya dilindungi oleh hak kekayaan intelektual yang berlaku. Pengguna memperoleh hak untuk memakai layanan sesuai paket dan ketentuan yang diberikan, bukan kepemilikan atas kode atau aset platform.",
          "Hak atas Konten Pengguna tetap berada pada pemegang hak masing-masing. Pengguna tidak boleh menggunakan aset platform atau konten pihak lain untuk kepentingan di luar izin yang telah diberikan.",
        ],
      },
      {
        title: "Kebijakan Privasi",
        points: [
          "Pengumpulan, penggunaan, penyimpanan, serta pembagian informasi pribadi dalam penggunaan Undara dijelaskan pada Kebijakan Privasi. Pengguna dapat membacanya sebelum menggunakan layanan dan ketika diperlukan.",
          "Publikasi undangan yang memuat nama, foto, informasi lokasi, atau data tamu harus dilakukan dengan memperhatikan privasi dan izin pihak yang datanya dicantumkan.",
        ],
      },
      {
        title: "Komisi dan Program Mitra",
        points: [
          "Ketentuan komisi hanya berlaku bagi pengguna yang secara terpisah mengikuti program mitra resmi Undara, apabila program tersebut tersedia.",
          "Hak atas komisi, besaran, persyaratan identitas, metode pembayaran, jadwal penarikan, dan prosedur verifikasi—apabila berlaku—akan dijelaskan pada perjanjian atau ketentuan program mitra tersendiri. Tidak ada jadwal pencairan atau nilai komisi yang dijanjikan oleh dokumen pengguna umum ini.",
        ],
      },
      {
        title: "Lain-lain",
        points: [
          "Syarat dan Ketentuan Pengguna ini mengikuti hukum yang berlaku di Republik Indonesia. Penanganan keluhan atau sengketa dilakukan sesuai mekanisme penyelesaian dan kewenangan yang diatur oleh hukum yang berlaku.",
          "Undara dapat memperbarui ketentuan ini sesuai perkembangan layanan atau kewajiban hukum. Perubahan yang memerlukan pemberitahuan atau persetujuan pengguna akan ditangani sesuai ketentuan hukum dan pemberitahuan yang relevan.",
          "Pengguna yang tidak bersedia menerima ketentuan yang diperbarui dapat berhenti menggunakan layanan dan menghubungi layanan pelanggan yang tercantum pada situs untuk menanyakan penutupan akun dan pengelolaan data terkait.",
        ],
      },
    ],
    privacy: "Baca Kebijakan Privasi",
  },
  en: {
    title: "Terms & Conditions",
    introduction: "General Terms",
    opening: [
      "These User Terms and Conditions govern use of Undara, including its website, digital invitations, RSVP, guest management, and event services offered through the Undara platform. In this document, “Undara” refers to the platform provider, and “User” or “you” refers to anyone accessing or using its services.",
      "By registering for and/or using Undara, you acknowledge that you have read and understood these terms. If you do not agree, you may stop using the services and contact customer support through the channels listed on the website to ask about closing your account.",
      "Users are responsible for ensuring that they have the legal capacity to use the services and enter into a binding agreement, including obtaining a parent’s or guardian’s consent where required by applicable law.",
    ],
    sections: [
      {
        title: "Definitions",
        points: [
          "“User Account” means an account created following registration with Undara.",
          "“Service Fees” means the prices or fees disclosed for paid packages or features before a user completes a transaction.",
          "“Privacy Policy” means the personal-data policy available on Undara’s Privacy Policy page.",
          "“User Content” includes data, text, photos, images, video, music, and other files uploaded or entered by a user.",
          "“User” means anyone visiting, registering for, or using Undara or a digital invitation published through the platform.",
          "“Transaction” means the purchase of a package or service through Undara’s available payment flow.",
          "“Digital Invitation” means an event invitation page created and/or published using Undara.",
        ],
      },
      {
        title: "Use of the Services",
        points: [
          "Users are responsible for keeping their accounts, passwords, and any access granted to others secure. Do not use another person’s account or identity without authorization.",
          "Users must provide accurate information when registering, making transactions, or using features that require it, and update that information when it changes.",
          "Users must not use the services for fraud, unlawful conduct, harassment, system interference, or unauthorized access.",
          "Access to certain features may depend on the selected package, payment status, event type, or feature-specific terms displayed in the service.",
          "The Privacy Policy explains how personal data is handled in connection with the services.",
        ],
      },
      {
        title: "User Content",
        points: [
          "Users must not upload or distribute content that violates the law, contains threats or fraud, discriminates against others, violates privacy, or infringes the rights of third parties.",
          "Users are responsible for event-information accuracy and for having the necessary rights or permissions to use photos, videos, music, names, guest data, and other content submitted to the platform.",
          "Users retain the rights to their own User Content. To the extent needed to provide a user’s chosen features, users permit Undara to store, process, display, and deliver that content to invited guests. This permission is limited to providing and operating the service in accordance with the user’s publication settings and the Privacy Policy.",
          "Undara may restrict access to or remove content where there are lawful grounds, including rights-infringement reports, service misuse, or requests made under applicable law.",
          "Users are responsible for the consequences of uploading or sharing content without permission. This term does not remove obligations that Undara has under applicable law.",
        ],
      },
      {
        title: "Service Fees",
        points: [
          "Some Undara features or packages may be paid. Prices, included features, and relevant payment terms are displayed on package pages or during checkout before purchase.",
          "Access to paid services follows the purchased package, transaction status, and specific conditions disclosed at purchase. Any additional fees must be disclosed before the related transaction is confirmed.",
          "Cancellation, refund, or package-change terms, if offered, follow the information shown with the relevant offer or transaction and applicable law.",
        ],
      },
      {
        title: "Service Availability and Warranties",
        points: [
          "Undara aims to provide the services according to the described features and package scope. Access may be affected by maintenance, network issues, user devices, or third-party services.",
          "Undara does not guarantee uninterrupted availability or identical operation across all devices, browsers, and connections. Users may contact customer support through the channels provided when an issue occurs.",
          "Event details and User Content originate from the users who create or upload them; those users are responsible for the accuracy of that information. This does not limit consumer rights or liabilities that cannot be excluded under applicable law.",
        ],
      },
      {
        title: "Limitation of Liability",
        points: [
          "Undara does not automatically create or verify every item of User Content. Subject to applicable law, users are responsible for event details, media rights, and information they publish.",
          "We work to secure the service, but online services can carry risks, including unauthorized access, third-party fraud, network disruption, and infected devices. Users should protect their account credentials and be cautious with suspicious links and data requests.",
          "Any limitation of liability in these terms applies only to the extent permitted by law and does not waive consumer rights, personal-data obligations, or responsibilities that Undara must meet under applicable law.",
        ],
      },
      {
        title: "Intellectual Property Rights",
        points: [
          "The name, logo, designs, software, and platform content owned by Undara or its licensors are protected by applicable intellectual-property laws. Users receive permission to use the service under the purchased package and applicable terms, not ownership of its code or platform assets.",
          "Rights in User Content remain with their respective owners. Users must not use platform assets or third-party content beyond the permission granted.",
        ],
      },
      {
        title: "Privacy Policy",
        points: [
          "Undara’s Privacy Policy explains how personal information is collected, used, stored, and shared when using the service. Users may review it before using the service and whenever needed.",
          "When publishing invitations containing names, photos, venue details, or guest data, users should respect the privacy and permissions of the people concerned.",
        ],
      },
      {
        title: "Commissions and Partner Programs",
        points: [
          "Commission terms apply only to users who separately join an official Undara partner program, if such a program is available.",
          "Commission eligibility, amounts, identity requirements, payment methods, withdrawal schedules, and verification procedures, where relevant, will be set out in separate partner-program terms or agreements. These general user terms do not promise a specific payment schedule or commission rate.",
        ],
      },
      {
        title: "Other Provisions",
        points: [
          "These User Terms and Conditions are governed by the laws of the Republic of Indonesia. Complaints or disputes will be addressed through procedures and competent authorities established by applicable law.",
          "Undara may update these terms as its services or legal obligations change. Changes requiring user notice or consent will be handled according to applicable law and the relevant notifications.",
          "Users who do not wish to accept updated terms may stop using the service and contact customer support via the website to ask about account closure and related data handling.",
        ],
      },
    ],
    privacy: "Read the Privacy Policy",
  },
} as const;

export default function TermsAndConditionsPage() {
  const { locale } = useLanguage();
  const copy = terms[locale];
  const en = locale === "en";

  return (
    <div className="relative isolate flex min-h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <PublicMarketingAtmosphere />

      <div data-undara-marketing-frame className="undara-marketing-frame">
        <div className="undara-marketing-frame-header">
          <Navbar embedded />
        </div>

        <main
          tabIndex={0}
          aria-label={copy.title}
          className="undara-marketing-scroll relative z-20 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"
        >
          <article className="undara-marketing-content flex flex-col gap-16 pb-16 pt-8 md:gap-20 md:pb-24 md:pt-12">
            <header className="undara-marketing-section grid items-end gap-10 pb-14 ">
              <div>
                <p className="undara-marketing-kicker">{en ? "Legal / Terms" : "Legal / Ketentuan"}</p>
                <h1 className="undara-marketing-title mt-5 font-[family-name:var(--font-undara-heading)] tracking-[-0.035em] text-primary">
                  {copy.title}
                </h1>
              </div>

              <div className="max-w-[70ch]">
                <p className="text-base leading-7 text-muted-foreground md:text-base md:leading-8">
                  {en
                    ? "The rules that govern access to Undara, paid services, user content, transactions, and platform responsibilities."
                    : "Ketentuan yang mengatur penggunaan Undara, layanan berbayar, konten pengguna, transaksi, dan tanggung jawab platform."}
                </p>
                <Link
                  href="/privacy-policy"
                  className="mt-7 inline-flex border-b border-primary/45 pb-2 text-sm font-medium text-primary transition-colors hover:border-primary"
                >
                  {copy.privacy}
                </Link>
              </div>
            </header>

            <section className="undara-marketing-section undara-editorial-offset-left py-12 md:py-16">
              <div className="grid gap-8 ">
                <div>
                  <p className="undara-marketing-kicker">{copy.introduction}</p>
                  <h2 className="undara-marketing-heading mt-4 font-[family-name:var(--font-undara-heading)] tracking-[-0.025em] text-primary">
                    {en ? "Start with the general agreement." : "Mulai dari ketentuan umumnya."}
                  </h2>
                </div>
                <div className="space-y-5">
                  {copy.opening.map((paragraph, i) => (
                    <p key={i} className="text-base leading-8 text-foreground/82 md:text-base md:leading-8">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </section>

            <section className="undara-marketing-section undara-editorial-offset-right">
              <div>
                {copy.sections.map((section, index) => (
                  <section
                    key={index}
                    aria-labelledby={`undara-terms-section-${index}`}
                    className={`py-9 md:py-12 ${index % 2 ? "lg:pl-[5%]" : "lg:pr-[4%]"}`}
                  >
                    <div>
                      <h2
                        id={`undara-terms-section-${index}`}
                        className="undara-marketing-subheading text-primary"
                      >
                        {section.title}
                      </h2>
                      <ul className="mt-6 space-y-4">
                        {section.points.map((point, pointIndex) => (
                          <li
                            key={pointIndex}
                            className="border-l border-primary/25 pl-4 text-sm leading-8 text-foreground/82 md:text-base"
                          >
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                      {index === 7 ? (
                        <Link
                          href="/privacy-policy"
                          className="mt-7 inline-flex border-b border-primary/45 pb-2 text-sm font-semibold text-primary transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          {copy.privacy}
                        </Link>
                      ) : null}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          </article>
        </main>

        <MarketingFrameFooter />
      </div>
    </div>
  );
}
