import type { InvitationSectionKey } from "@/lib/templates/sections";

/** Crisp geometric linework; both loops retain their own editable paint target. */
export function SilverLoops({ section = "cover", className = "" }: { section?: InvitationSectionKey; className?: string }) {
  return <div aria-hidden="true" data-studio-native-object={`object:${section}:silver-loops-art`} className={`sv-loops ${className}`}>
    <svg viewBox="0 0 280 340" fill="none">
      <g data-studio-native-object={`object:${section}:loop-one-art`} className="ot-accent-art" stroke="currentColor" strokeWidth="2">
        <ellipse cx="125" cy="112" rx="77" ry="102" transform="rotate(-23 125 112)" />
        <ellipse cx="125" cy="112" rx="70" ry="95" transform="rotate(-23 125 112)" />
      </g>
      <g data-studio-native-object={`object:${section}:loop-two-art`} className="ot-soft-art" stroke="currentColor" strokeWidth="3">
        <ellipse cx="158" cy="222" rx="90" ry="104" transform="rotate(28 158 222)" />
        <ellipse cx="158" cy="222" rx="82" ry="96" transform="rotate(28 158 222)" />
      </g>
    </svg>
  </div>;
}

/** Individually editable rounded paper blades, with no text or event facts. */
export function GoldenFan({ section = "cover", className = "" }: { section?: InvitationSectionKey; className?: string }) {
  return <div aria-hidden="true" data-studio-native-object={`object:${section}:golden-fan-art`} className={`gk-fan ${className}`}>
    <svg viewBox="-70 0 540 300" fill="none">
      {[-70, -50, -30, -10, 10, 30, 50, 70].map((angle, index) => <g key={angle}
        data-studio-native-object={`object:${section}:fan-blade-${index + 1}-art`} className={index % 2 ? "ot-soft-art" : "ot-accent-art"}>
        <rect x="181" y="12" width="38" height="278" rx="19" transform={`rotate(${angle} 200 280)`} fill="currentColor" />
        <path d="M200 26V268" transform={`rotate(${angle} 200 280)`} stroke="var(--inv-surface)" strokeOpacity=".55" />
      </g>)}
    </svg>
  </div>;
}

export function AnniversarySectionArt({ theme, section }: { theme: string; section: InvitationSectionKey }) {
  if (theme === "silver-reverie" && ["greeting", "closing"].includes(section)) return <SilverLoops section={section} className="sv-section-loops" />;
  if (theme === "golden-keepsake" && ["greeting", "closing"].includes(section)) return <GoldenFan section={section} className="gk-section-fan" />;
  if (theme === "golden-keepsake" && section === "dateTime") return <div aria-hidden="true" className="gk-fold-mark" data-studio-native-object="object:dateTime:fold-mark-art" />;
  return null;
}
