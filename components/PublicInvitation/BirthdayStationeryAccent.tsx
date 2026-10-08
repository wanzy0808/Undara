import type { InvitationSectionKey } from "@/lib/templates/sections";
import { birthdayStationeryAccent } from "@/lib/templates/family-art-directions";

/** Small foil/stamp marks; photographs remain the primary birthday artwork. */
export default function BirthdayStationeryAccent({ theme, section }: {
  theme: string; section: InvitationSectionKey;
}) {
  const accent = birthdayStationeryAccent(theme);
  if (!accent || (section !== "greeting" && section !== "closing")) return null;

  return <div aria-hidden="true" className={`birthday-accent birthday-accent--${accent}`}
    data-studio-native-object={`object:${section}:party-mark-frame`}>
    <svg viewBox="0 0 120 84" fill="none" stroke="currentColor" strokeWidth="1.6"
      data-studio-native-object={`object:${section}:party-mark`}>
      {accent === "cherries" ? <>
        <path d="M40 54Q40 28 69 17M73 58Q81 30 69 17M69 17Q87 8 98 20Q82 28 69 17" />
        <circle cx="38" cy="59" r="17" fill="currentColor" />
        <circle cx="76" cy="63" r="16" fill="currentColor" />
      </> : accent === "candle" ? <>
        <path d="M55 34h10v38H55zM48 76h24M60 30V24" />
        <path d="M60 8Q48 22 60 25Q72 22 60 8Z" fill="currentColor" />
        <path d="M25 29v12M19 35h12M94 41v16M86 49h16" />
      </> : accent === "pennants" ? <>
        <path d="M8 17Q60 55 112 17" />
        <path d="M19 25l19 10-16 18zM50 39h20L60 62zM83 35l19-10-3 28z" fill="currentColor" />
      </> : <>
        <circle cx="60" cy="46" r="29" />
        <ellipse cx="60" cy="46" rx="13" ry="29" />
        <path d="M31 46h58M36 30h48M36 62h48M60 17v58M102 9v14M95 16h14M12 57v12M6 63h12" />
      </>}
    </svg>
  </div>;
}
