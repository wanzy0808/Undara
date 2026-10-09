"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/Theme/ThemeProvider";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import BrandWordmark from "@/components/Brand/BrandWordmark";
import { isFramedMarketingPath } from "@/lib/marketing-paths";
import UndaraSocialIcons from "@/components/Layout/UndaraSocialIcons";
import { STUDIO_PREVIEW_PATH } from "@/components/InvitationStudio/studio-preview-viewport";

export default function Footer({ embedded = false }: { embedded?: boolean }) {
  const { isDarkMode } = useTheme();
  const pathname = usePathname();
  const isLanding = embedded && isFramedMarketingPath(pathname);
  const { messages } = useLanguage();
  const { footer } = messages;

  if (pathname === STUDIO_PREVIEW_PATH || (!embedded && isFramedMarketingPath(pathname)) || pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname === "/owner" || pathname.startsWith("/owner/") || pathname === "/partner" || pathname.startsWith("/partner/")) {
    return null;
  }

  if (isLanding) {
    return (
      <footer
        className={`${embedded ? "relative" : "absolute bottom-0 left-0"} z-20 w-full border-none bg-background py-3 text-center font-[family-name:var(--font-undara-mono)] text-[10px] tracking-wider text-[var(--foreground)] opacity-50 md:text-xs`}
      >
        © {new Date().getFullYear()} Undara. {footer.rights}
      </footer>
    );
  }

  return (
    <footer
      className={`z-20 w-full border-none bg-transparent transition-colors duration-500 ${
        isDarkMode ? "text-white" : "text-[var(--foreground)]"
      }`}
    >
      <div className="mx-auto w-full max-w-[75%] space-y-12 px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 items-start justify-between gap-8 md:grid-cols-12">
          <div className="space-y-4 md:col-span-6">
            <Link href="/" className="inline-block">
              <BrandWordmark />
            </Link>
            <p className="max-w-sm font-[family-name:var(--font-undara-body)] text-xs font-light leading-relaxed opacity-70">
              {footer.description}
            </p>
            <div className="space-y-1 pt-2 font-[family-name:var(--font-undara-mono)] text-xs opacity-80">
              <p>{footer.customerService}:</p>
              <a
                href="https://wa.me/6282124786516"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[var(--primary)]"
              >
                +62 821-2478-6516
              </a>
            </div>
          </div>

          <div className="space-y-3 text-left md:col-span-6 md:text-right">
            <h4 className="font-[family-name:var(--font-undara-mono)] text-xs uppercase tracking-widest opacity-80">
              {footer.paymentMethods}
            </h4>
            <div className="flex items-center md:justify-end">
              <div
                className={`inline-flex items-center justify-center rounded-2xl border p-3 backdrop-blur-md ${
                  isDarkMode
                    ? "border-white/10 bg-white/5 shadow-lg"
                    : "border-[var(--primary)]/10 bg-white shadow-md"
                }`}
              >
                <Image
                  src="/assets/payments/banks/bca.webp"
                  alt="Bank BCA"
                  width={75}
                  height={25}
                  className="h-6 w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 border-t border-[var(--border)] pt-8 md:grid-cols-4">
          <div className="space-y-3">
            <h5 className="font-[family-name:var(--font-undara-heading)] text-xs font-bold text-[var(--primary)]">
              {footer.products}
            </h5>
            <ul className="space-y-2 font-[family-name:var(--font-undara-body)] text-xs font-light opacity-70">
              <li>
                <Link href="/d-invitation">{footer.digitalInvitation}</Link>
              </li>
              <li>
                <Link href="/guestbook">{footer.qrGuestbook}</Link>
              </li>
              <li>
                <Link href="/event-planner">{footer.weddingPlanner}</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-[family-name:var(--font-undara-heading)] text-xs font-bold text-[var(--primary)]">
              {footer.help}
            </h5>
            <ul className="space-y-2 font-[family-name:var(--font-undara-body)] text-xs font-light opacity-70">
              <li>{footer.faq}</li>
              <li><Link href="/help#terms" className="text-inherit transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{footer.terms}</Link></li>
              <li><Link href="/help#privacy" className="text-inherit transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{footer.privacy}</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-[family-name:var(--font-undara-heading)] text-xs font-bold text-[var(--primary)]">
              {footer.resources}
            </h5>
            <ul className="space-y-2 font-[family-name:var(--font-undara-body)] text-xs font-light opacity-70">
              <li>{footer.templates}</li>
              <li>{footer.articles}</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-[family-name:var(--font-undara-heading)] text-xs font-bold text-[var(--primary)]">
              {footer.followUs}
            </h5>
            <UndaraSocialIcons compact />
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 pt-4 font-[family-name:var(--font-undara-mono)] text-[10px] opacity-50 md:flex-row">
          <p>© 2026 Undara. {footer.rights}</p>
          <div className="flex gap-4">
            <span>{footer.legal}</span>
            <Link href="/help#privacy" className="text-inherit transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{footer.privacy}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
