"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/Theme/ThemeToggle";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import BurgerMenuContent from "@/components/Layout/Navbar/BurgerMenuContent";
import LanguageToggle from "@/components/I18n/LanguageToggle";
import { useLanguage } from "@/components/I18n/LanguageProvider";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import BrandWordmark from "@/components/Brand/BrandWordmark";
import { isFramedMarketingPath } from "@/lib/marketing-paths";
import { STUDIO_PREVIEW_PATH } from "@/components/InvitationStudio/studio-preview-viewport";

export default function Navbar({ embedded = false }: { embedded?: boolean }) {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const en = locale === "en";
  const [menuOpen, setMenuOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const isLanding = embedded && isFramedMarketingPath(pathname);
  if (pathname === STUDIO_PREVIEW_PATH || (!embedded && isFramedMarketingPath(pathname)) || pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname === "/owner" || pathname.startsWith("/owner/") || pathname === "/partner" || pathname.startsWith("/partner/")) return null;

  return (
    <header className={`undara-navbar relative z-50 w-full text-foreground transition-colors duration-500 ${
      isLanding
        ? "undara-navbar--landing bg-transparent"
        : "bg-transparent"
    }`}>
      <div className="mx-auto flex w-[calc(100%-28px)] max-w-full items-center justify-between gap-2 py-3 sm:w-[80vw] sm:py-4">
        <Link href="/" className="group block min-w-0">
          <BrandWordmark
            showTagline
            className="transition-transform group-hover:scale-[1.01]"
          />
        </Link>
        <div className="flex shrink-0 items-center gap-1 sm:gap-3 [&_.undara-theme-toggle]:!h-8 [&_.undara-theme-toggle]:!w-8 sm:[&_.undara-theme-toggle]:!h-11 sm:[&_.undara-theme-toggle]:!w-11 [&_.undara-language-toggle]:!h-8 sm:[&_.undara-language-toggle]:!h-11 [&_.undara-language-toggle_button]:!h-8 [&_.undara-language-toggle_button]:!min-w-7 [&_.undara-language-toggle_button]:!px-1 sm:[&_.undara-language-toggle_button]:!h-9 sm:[&_.undara-language-toggle_button]:!min-w-10 sm:[&_.undara-language-toggle_button]:!px-2.5">
          <ThemeToggle />
          <LanguageToggle />
          <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={menuOpen ? (en ? "Close navigation menu" : "Tutup menu navigasi") : (en ? "Open navigation menu" : "Buka menu navigasi")}
                  aria-expanded={menuOpen}
                  aria-controls="undara-burger-dropdown"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="undara-burger-toggle !h-8 !w-8 sm:!h-11 sm:!w-11"
                >
                  <Menu className="h-5 w-5" />
                </Button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <button type="button" aria-label={en ? "Close menu" : "Tutup menu"} className="fixed inset-0 z-40 cursor-default bg-transparent" onClick={() => setMenuOpen(false)} />
                  <motion.div id="undara-burger-dropdown" initial={reducedMotion ? false : { opacity: 0, scale: 0.88, y: -12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -10 }} transition={{ duration: reducedMotion ? 0.1 : 0.32, ease: [0.22, 1, 0.36, 1] }} style={{ transformOrigin: "top right" }} className="absolute right-0 top-[calc(100%+32px)] z-50 w-[min(88vw,370px)] max-h-[min(75dvh,650px)] overflow-y-auto !rounded-[28px] border border-primary/35 bg-background/95 p-3 shadow-[0_18px_65px_rgba(75,35,47,0.16)] backdrop-blur-xl">
                    <BurgerMenuContent onClose={() => setMenuOpen(false)} />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
