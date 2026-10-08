import Image from "next/image";
import type { InvitationSectionKey } from "@/lib/templates/sections";
import { familyArtworkUrl, familyHasSectionArtwork } from "@/lib/templates/family-art-directions";
import BirthdayStationeryAccent from "@/components/PublicInvitation/BirthdayStationeryAccent";

/** An original, text-free scene is one editable image; its frame is independent. */
export function FamilyStationeryArtwork({ theme, section, className = "", kind = "scene" }: {
  theme: string; section: "envelope" | InvitationSectionKey; className?: string; kind?: "scene" | "detail";
}) {
  const src = familyArtworkUrl(theme, kind);
  if (!src) return null;
  return <div aria-hidden="true" data-studio-native-object={`object:${section}:${kind}-frame`} className={`rf-art-frame ${className}`}>
    <Image data-studio-native-object={`object:${section}:${kind}-art`} src={src} alt=""
      width={kind === "scene" ? 1024 : 960} height={kind === "scene" ? 1536 : 640}
      sizes={kind === "scene" ? "(max-width: 640px) 100vw, 540px" : "270px"}
      loading={section === "cover" || section === "envelope" ? "eager" : "lazy"} />
  </div>;
}

export function FamilyStationerySectionArt({ theme, section }: { theme: string; section: InvitationSectionKey }) {
  if (!familyHasSectionArtwork(theme, section)) return <BirthdayStationeryAccent theme={theme} section={section} />;
  return <FamilyStationeryArtwork theme={theme} section={section} kind="detail" className="rf-section-vignette" />;
}
