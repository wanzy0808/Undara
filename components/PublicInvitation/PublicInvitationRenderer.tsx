"use client";

import { useState } from "react";
import RomanticRoseTemplate from "@/components/PublicInvitation/RomanticRoseTemplate";
import { InvitationLanguageProvider } from "@/components/PublicInvitation/InvitationLanguage";
import type { InvitationLanguage } from "@/lib/invitations/language";
import type { PersonalRsvpGuest } from "@/components/InvitationStudio/rsvp-types";
import UniversalInvitationTemplate from "@/components/PublicInvitation/UniversalInvitationTemplate";
import { InvitationLockedState, type PublicInvitationData } from "@/components/PublicInvitation/PublicInvitation";
import { invitationTemplates } from "@/lib/templates/catalog";
import { parseDesignKey } from "@/lib/templates/design";

/** One dispatcher for normal event URLs, event-specific URLs and personalized guest URLs. */
export default function PublicInvitationRenderer({ invitation, personalGuest, preview = false }: { invitation: PublicInvitationData; personalGuest?: PersonalRsvpGuest; preview?: boolean }) {
  const [language, setLanguage] = useState<InvitationLanguage>(personalGuest?.personalLanguage === "EN" ? "EN" : "ID");
  const key = parseDesignKey(invitation.templateKey).template;
  if (key !== "romantic-rose" && key !== "blank-canvas" && !invitationTemplates.some((template) => template.key === key)) return <InvitationLockedState />;
  return <InvitationLanguageProvider language={language}>
    <div className="relative" lang={language === "EN" ? "en" : "id"}>
      <div className="fixed right-4 top-4 z-50 flex rounded-[var(--undara-control-radius)] border border-primary/30 bg-background/95 p-1 text-xs text-foreground shadow-lg backdrop-blur" role="group" aria-label="Bahasa undangan / Invitation language">
        {(["ID", "EN"] as const).map((option) => <button key={option} type="button" onClick={() => setLanguage(option)} aria-pressed={language === option} lang={option === "ID" ? "id" : "en"} className={`min-h-9 min-w-10 rounded-[var(--undara-control-radius)] px-2 font-semibold focus-visible:outline-2 focus-visible:outline-primary ${language === option ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"}`}>{option}</button>)}
      </div>
      {key === "romantic-rose" ? <RomanticRoseTemplate preview={preview} invitation={invitation} personalGuest={personalGuest} /> : <UniversalInvitationTemplate preview={preview} invitation={invitation} templateKey={key} personalGuest={personalGuest} />}
    </div>
  </InvitationLanguageProvider>;
}
