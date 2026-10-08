"use client";

import { useLanguage } from "@/components/I18n/LanguageProvider";
import Navbar from "@/components/Layout/Navbar/Navbar";
import PublicMarketingAtmosphere from "@/components/Layout/PublicMarketingAtmosphere";
import MarketingFrameFooter from "@/components/Layout/MarketingFrameFooter";

const privacyContent = {
  id: {
    title: "Kebijakan Privasi",
    paragraphs: [
      "Kami mengumpulkan informasi pribadi tertentu dari Anda agar Undara dapat memberikan layanan terbaik. Anda akan langsung memberikan informasi pribadi (contohnya saat pendaftaran, pengisian formulir, atau mengunjungi halaman) dan beberapa informasi akan secara otomatis dikumpulkan ketika Anda menggunakan website Undara. Ketika Anda menggunakan aplikasi dan/atau mengunjungi website, kami akan memproses data teknis seperti (namun tidak terbatas pada) alamat IP Anda, halaman yang pernah Anda kunjungi, browser internet yang Anda gunakan, halaman web yang sebelumnya/selanjutnya Anda kunjungi, dan durasi setiap kunjungan/sesi.",
      "Dengan data ini, kami dapat menyelesaikan kesulitan-kesulitan teknis atau memperbaiki kemampuan untuk dapat diaksesnya bagian-bagian tertentu dari aplikasi maupun website. Kami menggunakan informasi pribadi dalam bentuk tanpa nama dan secara keseluruhan untuk memantau lebih dekat fitur-fitur mana dari aplikasi maupun website yang paling sering digunakan, serta untuk menganalisa pola penggunaan.",
      "Anda dengan ini setuju bahwa data Anda akan digunakan oleh pemrosesan data internal kami untuk memberikan layanan yang lebih baik kepada Anda. Kami dapat mempekerjakan perusahaan-perusahaan dan orang perorangan pihak ketiga untuk memfasilitasi atau memberikan aplikasi dan layanan-layanan tertentu atas nama kami, untuk memberikan bantuan konsumen, memberikan informasi geo-location kepada penyedia layanan kami, untuk melaksanakan layanan-layanan terkait dengan informasi pribadi (misalnya tanpa pembatasan, layanan pemeliharaan, pengelolaan database, analisis web, dan penyempurnaan fitur-fitur website) atau untuk membantu kami dalam menganalisa bagaimana layanan kami digunakan, atau untuk penasihat profesional dan auditor eksternal kami, termasuk penasihat hukum, penasihat keuangan, dan konsultan-konsultan.",
      "Para pihak ketiga itu hanya memiliki akses atas informasi pribadi Anda untuk melakukan tugas-tugas tersebut atas nama kami dan secara kontraktual terikat untuk tidak mengungkapkan atau menggunakan informasi pribadi tersebut untuk tujuan lain apa pun. Kami tidak menjual atau menyewakan informasi pribadi Anda kepada pihak ketiga.",
      "Kami dapat mengubah Kebijakan Privasi ini untuk mencerminkan perubahan dalam kegiatan kami. Jika kami mengubah Kebijakan Privasi ini, kami akan memberitahu Anda melalui email atau dengan cara pemberitahuan di website satu hari sebelum perubahan berlaku. Kami menghimbau Anda untuk meninjau halaman ini secara berkala untuk mengetahui informasi terbaru tentang bagaimana ketentuan Kebijakan Privasi ini kami berlakukan.",
      "Dengan menggunakan aplikasi dan/atau mengunjungi website, Anda mengakui bahwa Anda telah membaca dan memahami Kebijakan Privasi ini, serta setuju dan sepakat terhadap penggunaan, praktik, pemrosesan, dan pengalihan informasi pribadi Anda oleh kami sebagaimana dinyatakan di dalam Kebijakan Privasi ini.",
    ],
  },
  en: {
    title: "Privacy Policy",
    paragraphs: [
      "We collect certain personal information from you so that Undara can provide its services. You may provide personal information directly, for example when registering, completing forms, or visiting pages. Some information is also collected automatically when you use the Undara website. When you use the application and/or visit the website, we process technical data, including but not limited to your IP address, pages you visit, the web browser you use, the pages you visited before and after, and the duration of each visit or session.",
      "We use this data to resolve technical difficulties and improve access to parts of the application and website. We use anonymized and aggregated personal information to understand which features are used most often and to analyze usage patterns.",
      "You agree that our internal data processing may use your data to provide better services. We may engage third-party companies and individuals to facilitate or provide certain applications and services on our behalf, provide customer support, share geolocation information with our service providers, perform services related to personal information (including maintenance, database management, web analytics, and website feature improvements), help us analyze how our services are used, or act as our professional advisers and external auditors, including legal advisers, financial advisers, and consultants.",
      "These third parties may access your personal information only to perform those tasks on our behalf and are contractually bound not to disclose or use it for any other purpose. We do not sell or rent your personal information to third parties.",
      "We may change this Privacy Policy to reflect changes in our activities. If we change it, we will notify you by email or through a notice on the website one day before the changes take effect. We encourage you to review this page regularly to stay informed about how this Privacy Policy applies.",
      "By using the application and/or visiting the website, you acknowledge that you have read and understood this Privacy Policy and agree to our use, practices, processing, and transfer of your personal information as described in it.",
    ],
  },
} as const;

export default function PrivacyPolicyPage() {
  const { locale } = useLanguage();
  const content = privacyContent[locale];
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
          aria-label={content.title}
          className="undara-marketing-scroll relative z-20 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"
        >
          <article className="undara-marketing-content flex flex-col gap-16 pb-16 pt-8 md:gap-20 md:pb-24 md:pt-12">
            <header className="undara-marketing-section grid min-h-[min(52dvh,560px)] items-end gap-10 pb-14 lg:grid-cols-[1.06fr_0.94fr] lg:gap-20">
              <div>
                <p className="undara-marketing-kicker">{en ? "Legal / Privacy" : "Legal / Privasi"}</p>
                <h1 className="undara-marketing-title mt-5 max-w-[13ch] font-[family-name:var(--font-undara-heading)] tracking-[-0.035em] text-primary">
                  {content.title}
                </h1>
              </div>

              <div className="max-w-xl border-l border-primary/30 py-5 pl-7 md:pl-12">
                <p className="text-base leading-7 text-muted-foreground md:text-base md:leading-8">
                  {en
                    ? "How Undara handles personal information and technical data when you use the website and its services."
                    : "Penjelasan mengenai cara Undara memproses informasi pribadi dan data teknis saat kamu menggunakan website serta layanannya."}
                </p>
              </div>
            </header>

            <section className="undara-marketing-section undara-editorial-offset-right">
              <div>
                {content.paragraphs.map((paragraph, index) => (
                  <div
                    key={index}
                    className={`py-8 md:py-10 ${index % 2 ? "lg:pl-[6%]" : "lg:pr-[4%]"}`}
                  >
                    <p className="max-w-4xl font-[family-name:var(--font-undara-body)] text-base leading-8 text-foreground/82 md:text-base md:leading-8">
                      {paragraph}
                    </p>
                  </div>
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
