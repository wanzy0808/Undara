import type { InvitationSectionKey } from "@/lib/templates/sections";

export function CloudBank({ section = "cover", className = "" }: { section?: InvitationSectionKey; className?: string }) {
  return <div aria-hidden="true" data-studio-native-object={`object:${section}:cloud-bank-art`} className={`lc-clouds ${className}`}>
    <svg viewBox="0 0 400 180" fill="none">
      <g data-studio-native-object={`object:${section}:cloud-back-art`} className="ot-accent-art">
        <path d="M0 82C0 30 70 15 96 61C130 38 171 54 177 88C217 34 284 43 299 87C344 44 397 60 400 93V180H0Z" fill="currentColor" opacity=".25" />
      </g>
      <g data-studio-native-object={`object:${section}:cloud-middle-art`} className="ot-soft-art">
        <path d="M0 133C15 73 77 77 104 123C148 82 202 99 206 141C242 95 289 104 309 129C336 79 390 82 400 139V180H0Z" fill="currentColor" />
      </g>
      <g data-studio-native-object={`object:${section}:cloud-front-art`} className="ot-paper-art">
        <path d="M0 150C29 105 86 120 105 162C146 137 183 147 202 176C225 140 266 132 299 160C330 123 378 124 400 155V180H0Z" fill="currentColor" />
      </g>
    </svg>
  </div>;
}

/** A paper moon mobile: geometry only, without a baby's name, face or gender. */
export function MoonMobile({ section = "cover", className = "" }: { section?: InvitationSectionKey; className?: string }) {
  return <div aria-hidden="true" data-studio-native-object={`object:${section}:moon-mobile-art`} className={`lc-mobile ${className}`}>
    <svg viewBox="0 0 300 280" fill="none">
      <g data-studio-native-object={`object:${section}:mobile-cord-art`} className="ot-accent-art" stroke="currentColor" strokeWidth="1.4">
        <path d="M20 72C91 20 148 12 258 10M99 29V90M200 13V98M252 10V174" />
      </g>
      <g data-studio-native-object={`object:${section}:moon-art`} className="ot-soft-art">
        <path d="M136 85A87 87 0 1 0 163 236A78 78 0 0 1 136 85Z" fill="currentColor" />
      </g>
      <g data-studio-native-object={`object:${section}:star-one-art`} className="ot-accent-art">
        <path d="M200 86L208 108L230 116L208 124L200 146L192 124L170 116L192 108Z" fill="currentColor" />
      </g>
      <g data-studio-native-object={`object:${section}:star-two-art`} className="ot-soft-art">
        <path d="M252 163L259 183L279 190L259 197L252 217L245 197L225 190L245 183Z" fill="currentColor" />
      </g>
    </svg>
  </div>;
}

/** Folded paper rosette, not the rounded fan of Golden Keepsake. */
export function GatheringRosette({ section = "cover", className = "" }: { section?: InvitationSectionKey; className?: string }) {
  return <div aria-hidden="true" data-studio-native-object={`object:${section}:rosette-art`} className={`gt-rosette ${className}`}>
    <svg viewBox="0 0 320 320" fill="none">
      {Array.from({ length: 16 }, (_, index) => <g key={index}
        data-studio-native-object={`object:${section}:rosette-pleat-${index + 1}-art`} className={index % 4 < 2 ? "ot-accent-art" : "ot-soft-art"}>
        <path d="M160 160L131 14L160 6L189 14Z" transform={`rotate(${index * 22.5} 160 160)`} fill="currentColor" />
        <path d="M160 160L160 6" transform={`rotate(${index * 22.5} 160 160)`} stroke="var(--inv-surface)" strokeOpacity=".4" />
      </g>)}
    </svg>
  </div>;
}

export function CelebrationSectionArt({ theme, section }: { theme: string; section: InvitationSectionKey }) {
  if (theme === "little-cloud" && section === "greeting") return <MoonMobile section={section} className="lc-section-mobile" />;
  if (theme === "little-cloud" && ["dateTime", "closing"].includes(section)) return <CloudBank section={section} className="lc-section-clouds" />;
  if (theme === "gathering" && ["greeting", "closing"].includes(section)) return <GatheringRosette section={section} className="gt-section-rosette" />;
  if (theme === "gathering" && section === "event") return <div aria-hidden="true" data-studio-native-object="object:event:paper-fold-art" className="gt-section-fold" />;
  return null;
}
