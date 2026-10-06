"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { ArrowUpRight, Heart, Leaf, Moon, Sparkles, Sun, Star } from "lucide-react";
import type { PhotoCrop } from "@/lib/templates/photo-slots";
import StudioPhotoCropOverlay from "@/components/InvitationStudio/StudioPhotoCropOverlay";
import { useInvitationLanguage } from "@/components/PublicInvitation/InvitationLanguage";
import { invitationText } from "@/lib/invitations/language";

/** Visual-only compositions. Data, action, and section rendering stay in shared invitation engine. */
export type SceneProps = {
  theme: string;
  names: string;
  date: string;
  time?: string;
  eventLabel?: string;
  cover?: string;
  focus: "top" | "center" | "bottom";
  crop?: PhotoCrop | null;
  cropEditing?: boolean;
  onCropChange?: (crop: PhotoCrop) => void;
  onFinishCrop?: () => void;
  locale?: string;
  stage: "envelope" | "cover";
  onOpen: (immediate?: boolean) => void;
  onEditPhoto?: () => void;
  preview?: boolean;
  allowEnvelopeOpen?: boolean;
  isWedding?: boolean;
  couple?: boolean;
  hashtag?: string | null;
  recipientLine?: string;
  motionEnabled?: boolean;
};
const heading = { color: "inherit", fontFamily: "var(--inv-heading, var(--font-undara-heading)), Georgia, serif" };
const caption = "text-[10px] uppercase tracking-[.3em]";
const center = "relative flex min-h-[760px] flex-col items-center justify-center overflow-hidden px-6 py-12 text-center";
const photoClass = "h-full w-full object-cover";
function Portrait({ src, alt, focus, crop, className = "" }: { src?: string; alt: string; focus: SceneProps["focus"]; crop?: PhotoCrop | null; className?: string }) {
  const style = crop
    ? { objectPosition: `${crop.x}% ${crop.y}%`, transform: crop.zoom === 1 ? undefined : `scale(${crop.zoom})`, transformOrigin: `${crop.x}% ${crop.y}%` }
    : { objectPosition: `center ${focus}` };
  return src
    ? <img src={src} alt={alt} loading="lazy" className={`${photoClass} ${className}`} style={style} />
    : <div className={`flex h-full w-full items-center justify-center bg-black/10 ${className}`} role="img" aria-label="Foto belum ditambahkan"><Heart className="h-8 w-8 opacity-40" strokeWidth={1} /></div>;
}
function Open({ onClick, dark = false, children, preview = false, allowEnvelopeOpen = false, studioObject }: { onClick: () => void; dark?: boolean; children?: ReactNode; preview?: boolean; allowEnvelopeOpen?: boolean; studioObject?: string }) {
  const language = useInvitationLanguage();
  return <button
    type="button"
    data-studio-native-object={studioObject}
    onClick={(event) => {
      if (preview && !allowEnvelopeOpen) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClick();
    }}
    data-studio-system-action={preview ? "open-invitation" : undefined}
    aria-label={preview && !allowEnvelopeOpen ? "Tombol Buka Undangan — mode desain" : undefined}
    className={`relative z-20 mt-7 min-h-12 rounded-[var(--undara-control-radius)] border px-8 py-3 text-xs font-semibold tracking-[.15em] shadow-md transition duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 ${dark ? "border-white/55 bg-white text-[color:var(--inv-scene-text,#271f25)] hover:bg-[var(--inv-scene-soft,#f1dfd4)]" : "border-current/30 bg-[var(--inv-accent)] text-white hover:brightness-110"}`}
  >{children || invitationText(language, "Buka Undangan")}</button>;
}
function Edit({ onClick }: { onClick?: () => void }) {
  return onClick ? <button type="button" onClick={onClick} aria-label="Atur foto cover" className="absolute inset-0 z-10 flex items-end justify-center bg-transparent pb-3 text-xs font-medium text-transparent transition hover:bg-black/30 hover:text-white focus-visible:bg-black/30 focus-visible:text-white">Atur foto</button> : null;
}
function Names({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h1 data-studio-native-heading="" className={`relative break-words leading-[1.28] ${className}`} style={heading}>{children}</h1>;
}
function Lines({ children, className = "", studioObject }: { children?: ReactNode; className?: string; studioObject?: string }) {
  return <div aria-hidden data-studio-native-object={studioObject} className={`flex items-center justify-center gap-3 ${className}`}><span className="h-px w-12 bg-current opacity-40" />{children || <span className="text-lg">✧</span>}<span className="h-px w-12 bg-current opacity-40" /></div>;
}
function BotanicalSprig({ mirrored = false, studioObject }: { mirrored?: boolean; studioObject?: string }) {
  return <div aria-hidden data-studio-native-object={studioObject} className={`absolute top-0 h-[290px] w-28 text-[color:var(--inv-scene-text,#71826a)] ${mirrored ? "-right-5 -scale-x-100 rotate-[-10deg]" : "-left-5 rotate-[-10deg]"}`}>
    <span className="absolute left-1/2 top-0 h-full w-px rotate-[16deg] bg-current opacity-50" />
    {[0,1,2,3,4].map(n=><Leaf key={n} className={`absolute h-16 w-16 opacity-55 ${n%2 ? "left-9 rotate-[65deg]" : "left-0 -rotate-[30deg]"}`} style={{top:`${n*52}px`}} strokeWidth={0.75}/>)}
  </div>;
}
type EnvelopeVisual = {
  backdrop: string;
  surface: string;
  flap: string;
  border: string;
  ink: string;
  symbol: string;
  effect: string;
  photoPosition?: string;
};
const envelopeVisuals: Record<string, EnvelopeVisual> = {
  "modern-maroon": { backdrop: "#380b19", surface: "#721d30", flap: "#a54c56", border: "#d9a29a", ink: "#ffe5df", symbol: "M.", effect: "rounded-none", photoPosition: "rotate-[5deg]" },
  "botanical-ivory": { backdrop: "#f0efde", surface: "#fffdf2", flap: "#cbd6ba", border: "#849878", ink: "#50634d", symbol: "❧", effect: "rounded-[9px]" },
  "celestial-ink": { backdrop: "#0d1830", surface: "#1d304a", flap: "#365071", border: "#9bbfdf", ink: "#d5e5f0", symbol: "☾", effect: "rounded-t-[130px] rounded-b-[10px]" },
};
function ThemeEnvelope({theme,names,date,cover,focus,crop,onOpen,preview,allowEnvelopeOpen,recipientLine}: SceneProps) {
  const language = useInvitationLanguage();
  const tr = (text: string) => invitationText(language, text);
  const original = envelopeVisuals[theme] || envelopeVisuals["botanical-ivory"];
  const style = { ...original,
    backdrop: `var(--inv-scene-bg, ${original.backdrop})`,
    surface: `var(--inv-scene-surface, ${original.surface})`,
    flap: `var(--inv-scene-soft, ${original.flap})`,
    border: `var(--inv-scene-accent, ${original.border})`,
    ink: `var(--inv-scene-ink, ${original.ink})`,
  };
  const usesPhoto = ["modern-maroon"].includes(theme);
  return (
    <section data-invitation-section="envelope" className={`${center} relative`} style={{backgroundColor:style.backdrop,color:style.ink}}>
      <div aria-hidden data-studio-native-object="object:envelope:frame-border" className="pointer-events-none absolute inset-5 border opacity-30" style={{borderColor:style.border}}/>
      {theme === "botanical-ivory" ? <>
        <BotanicalSprig studioObject="object:envelope:sprig-left"/><BotanicalSprig mirrored studioObject="object:envelope:sprig-right"/>
      </> : theme === "celestial-ink" ? <>
        <div aria-hidden data-studio-native-object="object:envelope:starfield" className="pointer-events-none absolute inset-0 opacity-55" style={{backgroundImage:"radial-gradient(circle,currentColor 1px,transparent 2px)",backgroundSize:"39px 56px"}}/>
        <Moon aria-hidden data-studio-native-object="object:envelope:moon" className="absolute right-9 top-10 h-11 w-11 opacity-50"/>
      </> : null}
      <p data-studio-native-object="object:envelope:kicker" className={`${caption} relative mb-9 opacity-80`}>{tr("A personal invitation")}</p>
      <div data-studio-native-object="object:envelope:card-stage" className="relative w-[min(74vw,310px)] pt-11">
        {usesPhoto && <div data-studio-native-object="object:envelope:photo-frame" className={`absolute left-1/2 top-[-26px] h-52 w-[67%] -translate-x-1/2 overflow-hidden border-[6px] shadow-lg ${style.photoPosition || ""}`} style={{borderColor:style.border,backgroundColor:style.surface}}>
          <span data-invitation-photo-slot="cover" className="relative block h-full w-full"><Portrait src={cover} focus={focus} crop={crop} alt="Foto utama pada kartu undangan" /></span>
        </div>}
        <div data-studio-native-object="object:envelope:card" className={`relative mt-12 flex min-h-[275px] flex-col items-center justify-end overflow-hidden border px-6 pb-10 pt-20 shadow-[0_22px_44px_#0002] ${style.effect}`} style={{backgroundColor:style.surface,borderColor:style.border,color:`var(--inv-scene-surface-ink, ${original.ink})`}}>
          <div aria-hidden data-studio-native-object="object:envelope:flap" className="absolute inset-x-0 top-0 z-10 h-44 origin-top opacity-95 [clip-path:polygon(0_0,100%_0,50%_100%)]" style={{backgroundColor:style.flap}}/>
          <div aria-hidden data-studio-native-object="object:envelope:seal" className="absolute left-1/2 top-[105px] z-20 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-4 text-3xl shadow-md" style={{borderColor:style.surface,backgroundColor:style.border,color:style.surface}}>{style.symbol}</div>
          <div data-studio-native-object="object:envelope:copy-panel" className="relative z-20 mt-8 w-full border-t pt-6 text-center" style={{borderColor:style.border}}>
            <p data-studio-native-object="object:envelope:letter-kicker" className="text-[9px] uppercase tracking-[.25em] opacity-70">Untuk momen istimewa</p>
            {recipientLine && <p data-personal-envelope-address data-studio-native-object="object:envelope:address" className="mt-3 break-words text-[11px] font-semibold leading-5">{recipientLine}</p>}
            <Names className="mt-3 text-xl">{names}</Names>
            <p data-studio-native-object="object:envelope:date" className="mt-3 text-xs opacity-75">{date}</p>
          </div>
        </div>
      </div>
      <Open studioObject="object:envelope:open-button" onClick={onOpen} preview={preview} allowEnvelopeOpen={allowEnvelopeOpen} dark={theme === "modern-maroon" || theme === "celestial-ink"}>{tr("Buka Undangan")}</Open>
    </section>
  );
}
const PencilReverieScene = dynamic(() => import("@/components/PublicInvitation/PencilReverieScene"));
const ZenAtelierScene = dynamic(() => import("@/components/PublicInvitation/ZenAtelierScene"));
const SereinScene = dynamic(() => import("@/components/PublicInvitation/SereinScene"));
const CelebrationScene = dynamic(() => import("@/components/PublicInvitation/CelebrationScene"));
const AnniversaryScene = dynamic(() => import("@/components/PublicInvitation/AnniversaryScene"));
const ConfettiClubScene = dynamic(() => import("@/components/PublicInvitation/ConfettiClubScene"));
const EternalBlossomScene = dynamic(() => import("@/components/PublicInvitation/EternalBlossomScene"));
const BotanicalIvoryScene = dynamic(() => import("@/components/PublicInvitation/BotanicalIvoryScene"));
const GardenLightScene = dynamic(() => import("@/components/PublicInvitation/GardenLightScene"));
const MidnightRomanceScene = dynamic(() => import("@/components/PublicInvitation/MidnightRomanceScene"));
const CelestialInkScene = dynamic(() => import("@/components/PublicInvitation/CelestialInkScene"));
const ClassicPearlScene = dynamic(() => import("@/components/PublicInvitation/ClassicPearlScene"));
const GoldenArtDecoScene = dynamic(() => import("@/components/PublicInvitation/GoldenArtDecoScene"));
const PaperCutBotanicalScene = dynamic(() => import("@/components/PublicInvitation/PaperCutBotanicalScene"));
const VelvetHorizonScene = dynamic(() => import("@/components/PublicInvitation/VelvetHorizonScene"));

export default function InvitationThemeScenes({theme,names,date,time,eventLabel,cover,focus,crop,cropEditing,onCropChange,onFinishCrop,locale,stage,onOpen,onEditPhoto,preview,allowEnvelopeOpen,isWedding,couple,hashtag,recipientLine,motionEnabled}: SceneProps) {
  const language = useInvitationLanguage();
  const tr = (text: string) => invitationText(language, text);
  if (theme === "blank-canvas") {
    return (
      <section
        data-invitation-section={stage}
        data-studio-blank-canvas={preview ? "true" : undefined}
        className="relative min-h-[760px] overflow-hidden bg-[var(--inv-bg,#ffffff)]"
      />
    );
  }
  if (theme === "pencil-reverie") return <PencilReverieScene stage={stage} names={names} date={date} onOpen={onOpen} preview={preview} allowEnvelopeOpen={allowEnvelopeOpen} isWedding={isWedding} hashtag={hashtag} recipientLine={recipientLine} motionEnabled={motionEnabled} />;
  if (theme === "zen-atelier") return <ZenAtelierScene names={names} date={date} cover={cover} focus={focus} crop={crop} cropEditing={cropEditing} onCropChange={onCropChange} onFinishCrop={onFinishCrop} locale={locale} stage={stage} onOpen={onOpen} onEditPhoto={onEditPhoto} preview={preview} allowEnvelopeOpen={allowEnvelopeOpen} isWedding={isWedding} hashtag={hashtag} recipientLine={recipientLine} motionEnabled={motionEnabled} />;
  if (theme === "little-cloud" || theme === "gathering") return <CelebrationScene {...{theme,names,date,time,eventLabel,cover,focus,crop,cropEditing,onCropChange,onFinishCrop,locale,stage,onOpen,onEditPhoto,preview,allowEnvelopeOpen,recipientLine,motionEnabled}} />;
  if (theme === "silver-reverie" || theme === "golden-keepsake") return <AnniversaryScene {...{theme,names,date,time,eventLabel,cover,focus,crop,cropEditing,onCropChange,onFinishCrop,locale,stage,onOpen,onEditPhoto,preview,allowEnvelopeOpen,recipientLine,motionEnabled}} />;
  if (theme === "confetti-club") return <ConfettiClubScene names={names} date={date} time={time} eventLabel={eventLabel} stage={stage} onOpen={onOpen} preview={preview} allowEnvelopeOpen={allowEnvelopeOpen} recipientLine={recipientLine} motionEnabled={motionEnabled} />;
  if (theme === "serein") return <SereinScene names={names} date={date} cover={cover} focus={focus} crop={crop} cropEditing={cropEditing} onCropChange={onCropChange} onFinishCrop={onFinishCrop} locale={locale} stage={stage} onOpen={onOpen} onEditPhoto={onEditPhoto} preview={preview} allowEnvelopeOpen={allowEnvelopeOpen} isWedding={isWedding} couple={couple} recipientLine={recipientLine} />;
  if (theme === "eternal-blossom") return <EternalBlossomScene names={names} date={date} couple={couple} cover={cover} focus={focus} crop={crop} cropEditing={cropEditing} onCropChange={onCropChange} onFinishCrop={onFinishCrop} locale={locale} onEditPhoto={onEditPhoto} stage={stage} onOpen={onOpen} preview={preview} allowEnvelopeOpen={allowEnvelopeOpen} recipientLine={recipientLine} motionEnabled={motionEnabled} />;
  if (theme === "botanical-ivory") return <BotanicalIvoryScene names={names} date={date} stage={stage} onOpen={onOpen} preview={preview} couple={couple} recipientLine={recipientLine} motionEnabled={motionEnabled} />;
  if (theme === "garden-light") return <GardenLightScene names={names} date={date} couple={couple} cover={cover} focus={focus} crop={crop} cropEditing={cropEditing} onCropChange={onCropChange} onFinishCrop={onFinishCrop} locale={locale} onEditPhoto={onEditPhoto} stage={stage} onOpen={onOpen} preview={preview} allowEnvelopeOpen={allowEnvelopeOpen} recipientLine={recipientLine} motionEnabled={motionEnabled} />;
  if (theme === "midnight-romance") return <MidnightRomanceScene names={names} date={date} couple={couple} cover={cover} focus={focus} crop={crop} cropEditing={cropEditing} onCropChange={onCropChange} onFinishCrop={onFinishCrop} locale={locale} onEditPhoto={onEditPhoto} stage={stage} onOpen={onOpen} preview={preview} allowEnvelopeOpen={allowEnvelopeOpen} recipientLine={recipientLine} motionEnabled={motionEnabled} />;
  if (theme === "celestial-ink") return <CelestialInkScene names={names} date={date} couple={couple} stage={stage} onOpen={onOpen} preview={preview} allowEnvelopeOpen={allowEnvelopeOpen} recipientLine={recipientLine} motionEnabled={motionEnabled} />;
  if (theme === "classic-pearl") return <ClassicPearlScene names={names} date={date} couple={couple} stage={stage} onOpen={onOpen} preview={preview} allowEnvelopeOpen={allowEnvelopeOpen} recipientLine={recipientLine} motionEnabled={motionEnabled} />;
  if (theme === "golden-art-deco") return <GoldenArtDecoScene names={names} date={date} couple={couple} stage={stage} onOpen={onOpen} preview={preview} allowEnvelopeOpen={allowEnvelopeOpen} recipientLine={recipientLine} motionEnabled={motionEnabled} />;
  if (theme === "paper-cut-botanical") return <PaperCutBotanicalScene names={names} date={date} couple={couple} stage={stage} onOpen={onOpen} preview={preview} allowEnvelopeOpen={allowEnvelopeOpen} recipientLine={recipientLine} motionEnabled={motionEnabled} />;
  if (theme === "velvet-horizon") return <VelvetHorizonScene names={names} date={date} couple={couple} cover={cover} focus={focus} crop={crop} cropEditing={cropEditing} onCropChange={onCropChange} onFinishCrop={onFinishCrop} locale={locale} onEditPhoto={onEditPhoto} stage={stage} onOpen={onOpen} preview={preview} allowEnvelopeOpen={allowEnvelopeOpen} recipientLine={recipientLine} motionEnabled={motionEnabled} />;
  if (theme === "modern-maroon") {
    if (stage === "envelope") return (
      <section data-invitation-section="envelope" className="relative flex min-h-[760px] flex-col overflow-hidden bg-[#2d0710] px-6 py-12 text-[#fff5ee]">
        <img src="/templates/modern-maroon/09_watercolor_bg.webp" alt="" aria-hidden="true" data-studio-native-object="object:envelope:background-art" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-14 mix-blend-screen" />
        <img src="/templates/modern-maroon/04_fabric_wave.webp" alt="" aria-hidden="true" data-studio-native-object="object:envelope:fabric-art" className="pointer-events-none absolute -right-24 bottom-5 w-[70%] object-contain opacity-16" />
        <div aria-hidden data-studio-native-object="object:envelope:block-left" className="absolute inset-y-0 left-0 w-[7%] bg-[#d8b98d]" />
        <div aria-hidden data-studio-native-object="object:envelope:block-right" className="absolute bottom-0 right-0 h-[33%] w-[45%] bg-[#7b1f2b]" />
        <span aria-hidden data-studio-native-object="object:envelope:monogram" className="absolute -right-4 top-5 text-[9rem] font-black leading-none text-[#fff5ee]/[.055]">M</span>

        <p data-studio-native-object="object:envelope:kicker" className="relative ml-[10%] mt-5 text-[9px] font-semibold uppercase tracking-[.34em] text-[#d8b98d]">{tr("A personal invitation")}</p>

        <div data-studio-native-object="object:envelope:card-stage" className="relative z-10 mx-auto mt-14 w-[min(82vw,340px)]">
          <div data-studio-native-object="object:envelope:card" className="relative min-h-[425px] overflow-visible bg-[#fff5ee] px-7 pb-8 pt-9 text-[#371017] shadow-[20px_24px_0_rgba(123,31,43,.42)]">
            <div aria-hidden data-studio-native-object="object:envelope:flap" className="absolute -left-4 top-12 h-[1px] w-[46%] bg-[#b96069]" />
            <div aria-hidden data-studio-native-object="object:envelope:seal" className="absolute -left-5 top-[58px] grid h-10 w-10 place-items-center rounded-full border border-[#7b1f2b]/30 bg-[#7b1f2b] text-xs font-semibold text-[#fff5ee]">M</div>

            <div data-studio-native-object="object:envelope:copy-panel" className="relative z-10 w-[58%] pt-10">
              <p data-studio-native-object="object:envelope:letter-kicker" className="text-[8px] uppercase tracking-[.28em] text-[#7b1f2b]/70">{tr("Untuk momen istimewa")}</p>
              {recipientLine && <p data-personal-envelope-address data-studio-native-object="object:envelope:address" className="mt-5 break-words text-[11px] font-semibold leading-5">{recipientLine}</p>}
              <Names className="mt-8 text-[1.75rem] leading-[1.02]">{names}</Names>
              <p data-studio-native-object="object:envelope:date" className="mt-6 text-[10px] uppercase tracking-[.2em] text-[#7b1f2b]/75">{date}</p>
            </div>

            <div data-studio-native-object="object:envelope:photo-frame" className="absolute -right-5 bottom-8 h-[285px] w-[48%] overflow-hidden border border-[#d8b98d] bg-[#ead5cc] shadow-[-10px_12px_0_rgba(216,185,141,.28)]">
              <span data-invitation-photo-slot="cover" className="relative block h-full w-full"><Portrait src={cover} focus={focus} crop={crop} alt="Foto utama pada amplop undangan" /></span>
            </div>
          </div>
        </div>

        <div className="relative z-20 mt-auto flex flex-col items-center pt-12">
          <span aria-hidden data-studio-native-object="object:envelope:ornament" className="mm-flourish mb-2 text-[#d8b98d]" />
          <Open studioObject="object:envelope:open-button" onClick={onOpen} preview={preview} allowEnvelopeOpen={allowEnvelopeOpen} dark>{tr("Buka Undangan")}</Open>
        </div>
      </section>
    );

    const cropEditor = cropEditing && crop && onCropChange && onFinishCrop
      ? <StudioPhotoCropOverlay crop={crop} onChange={onCropChange} onDone={onFinishCrop} locale={locale} />
      : null;
    return (
      <section className="relative min-h-[760px] overflow-hidden bg-[var(--inv-scene-bg,#4a111b)] text-[color:var(--inv-scene-ink,#fff5ee)]" data-invitation-section={stage}>
        <img src="/templates/modern-maroon/09_watercolor_bg.webp" alt="" aria-hidden="true" data-studio-native-object="object:cover:background-art" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-12 mix-blend-screen" />
        <img src="/templates/modern-maroon/06_gold_curve_lines.webp" alt="" aria-hidden="true" data-studio-native-object="object:cover:gold-art" className="pointer-events-none absolute -left-20 top-[14%] w-[62%] object-contain opacity-24" />
        <img src="/templates/modern-maroon/01_flower_cascade.webp" alt="" aria-hidden="true" data-studio-native-object="object:cover:flower-art" className="pointer-events-none absolute -left-20 bottom-[-7%] z-[1] w-[48%] object-contain opacity-24" />
        <div aria-hidden data-studio-native-object="object:cover:block-left" className="absolute inset-y-0 left-0 w-[7%] bg-[var(--inv-scene-soft,#d8b98d)]" />
        <div aria-hidden data-studio-native-object="object:cover:block-right" className="absolute bottom-0 right-0 h-[30%] w-[48%] bg-[var(--inv-scene-accent,#7b1f2b)]" />
        <span aria-hidden data-studio-native-object="object:cover:monogram" className="absolute -left-3 top-6 text-[9.5rem] font-black leading-none text-[color:var(--inv-scene-text,#fff5ee)]/[.055]">M</span>

        <div data-studio-native-object="object:cover:media-group" className="absolute right-[-8%] top-[11%] h-[500px] w-[70%]">
          <div data-studio-native-object="object:cover:photo-frame" className="relative h-full w-full overflow-hidden border border-[var(--inv-scene-soft,#d8b98d)] shadow-[-18px_22px_0_rgba(216,185,141,.14)]">
            <span data-invitation-photo-slot="cover" className="relative block h-full w-full">
              <Portrait src={cover} focus={focus} crop={crop} alt="Foto utama undangan" className="saturate-[.82] contrast-[1.03]" />
              <Edit onClick={cropEditing ? undefined : onEditPhoto} />
              {cropEditor}
            </span>
          </div>
          <p data-studio-native-object="object:cover:side-label" className="absolute -left-8 top-8 [writing-mode:vertical-rl] rotate-180 text-[8px] uppercase tracking-[.4em] text-[#d8b98d]">{tr("Selected events")}</p>
        </div>

        <div data-studio-native-object="object:cover:copy-panel" className="absolute bottom-[8%] left-[12%] z-20 w-[57%] max-w-[310px] bg-[#2d0710]/88 px-5 py-6 backdrop-blur-[2px]">
          <p data-studio-native-object="object:cover:kicker" className="text-[8px] font-semibold uppercase tracking-[.34em] text-[#d8b98d]">{tr("The Celebration")}</p>
          <Names className="mt-5 text-[clamp(2.1rem,9vw,3.65rem)] leading-[.94] tracking-[-.035em]">{names}</Names>
          <div className="mt-6 flex items-center gap-4 border-t border-[#fff5ee]/20 pt-4">
            <p data-studio-native-object="object:cover:date" className="text-[10px] uppercase tracking-[.18em] text-[#fff5ee]/75">{date}</p>
            <span aria-hidden data-studio-native-object="object:cover:ornament" className="h-px flex-1 bg-[#d8b98d]/55" />
          </div>
        </div>
      </section>
    );
  }
  if (stage === "envelope") return <ThemeEnvelope theme={theme} names={names} date={date} cover={cover} focus={focus} crop={crop} stage={stage} onOpen={onOpen} preview={preview} allowEnvelopeOpen={allowEnvelopeOpen} recipientLine={recipientLine} />;
  const cropEditor = cropEditing && crop && onCropChange && onFinishCrop
    ? <StudioPhotoCropOverlay crop={crop} onChange={onCropChange} onDone={onFinishCrop} locale={locale} />
    : null;
  const content = tr("The Celebration");
  if (theme === "paper-cut-botanical") return <section className={`${center} bg-[var(--inv-scene-bg,#e9ead7)] text-[color:var(--inv-scene-ink,#435e45)]`} data-invitation-section={stage}>
    <div aria-hidden data-studio-native-object="object:cover:paper-left" className="absolute -left-20 -top-10 h-[400px] w-64 rotate-[-32deg] rounded-full border-[55px] border-[var(--inv-scene-accent,#aebf96)] bg-[var(--inv-scene-soft,#dce1c2)] shadow-[15px_15px_0_#d1dcad]" />
    <div aria-hidden data-studio-native-object="object:cover:paper-right" className="absolute -right-20 bottom-[-95px] h-[440px] w-72 rotate-[23deg] rounded-full border-[50px] border-[var(--inv-scene-accent,#9aaf88)] bg-[var(--inv-scene-soft,#c6d0aa)] shadow-[-15px_-15px_0_#d4dab4]" />
    <Leaf aria-hidden data-studio-native-object="object:cover:leaf-left" className="absolute -left-3 top-12 h-40 w-40 rotate-[-30deg] fill-[var(--inv-scene-soft,#b2c2a0)] text-[color:var(--inv-scene-text,#819975)]" strokeWidth={0.7}/>
    <Leaf aria-hidden data-studio-native-object="object:cover:leaf-right" className="absolute -right-4 bottom-20 h-44 w-44 rotate-[170deg] fill-[var(--inv-scene-soft,#a4b998)] text-[color:var(--inv-scene-text,#76926e)]" strokeWidth={0.7}/>
    <div data-studio-native-object="object:cover:content-group" className="relative flex flex-col items-center">
      <p data-studio-native-object="object:cover:kicker" className={`${caption} relative mb-10 text-[color:var(--inv-scene-text,#687b57)]`}>{tr("Handcrafted in paper")}</p>
      <div data-studio-native-object="object:cover:card" className="relative flex min-h-[350px] w-[min(77vw,300px)] flex-col items-center justify-center rounded-t-[155px] border-[9px] border-[var(--inv-scene-accent,#fdfcf1)] bg-[var(--inv-scene-surface,#f7f6e9)] text-[color:var(--inv-scene-surface-ink)] px-7 py-9 shadow-[12px_16px_0_#aabf92]">
        <Sun aria-hidden data-studio-native-object="object:cover:sun" className="mb-7 h-10 w-10 text-[color:var(--inv-scene-text,#93a97c)]" strokeWidth={0.8}/>
        <p data-studio-native-object="object:cover:subtitle" className={caption}>{content}</p>
        <Names className="mt-6 text-3xl italic">{names}</Names>
        <p data-studio-native-object="object:cover:date" className="mt-7 text-xs">{date}</p>
      </div>
      <Lines studioObject="object:cover:ornament" className="mt-12"><Leaf className="h-5 w-5"/></Lines>
    </div>
  </section>;

  if (theme === "celestial-ink") return <section className={`${center} bg-[var(--inv-scene-bg,#101b32)] text-[color:var(--inv-scene-ink,#c9e2f0)]`} data-invitation-section={stage}>
    <div aria-hidden data-studio-native-object="object:cover:starfield" className="pointer-events-none absolute inset-0" style={{backgroundImage:"radial-gradient(circle,#c9e2f0aa 1px,transparent 1.5px)",backgroundSize:"31px 41px",opacity:0.6}}/>
    <div aria-hidden data-studio-native-object="object:cover:orbit-outer" className="absolute left-1/2 top-[18%] h-[420px] w-[420px] -translate-x-1/2 rounded-full border border-[var(--inv-scene-accent,#a4c0e1)]/40"/>
    <div aria-hidden data-studio-native-object="object:cover:orbit-middle" className="absolute left-1/2 top-[23%] h-[340px] w-[340px] -translate-x-1/2 rounded-full border border-[var(--inv-scene-accent,#a4c0e1)]/55"/>
    <div aria-hidden data-studio-native-object="object:cover:orbit-inner" className="absolute left-1/2 top-[29%] h-[260px] w-[260px] -translate-x-1/2 rounded-full border border-[var(--inv-scene-accent,#a4c0e1)]/50"/>
    <div data-studio-native-object="object:cover:content-group" className="relative flex flex-col items-center">
      <Moon aria-hidden data-studio-native-object="object:cover:moon" className="relative mt-14 h-16 w-16 text-[color:var(--inv-scene-text,#b8cfea)]" strokeWidth={0.65}/>
      <p data-studio-native-object="object:cover:kicker" className={`${caption} relative mt-8 text-[color:var(--inv-scene-text,#a3c8e5)]`}>{tr("Written in the stars")}</p>
      <Names className="relative mt-12 max-w-xs text-3xl">{names}</Names>
      <div aria-hidden data-studio-native-object="object:cover:star-cluster" className="relative mt-12 flex items-center gap-4"><Star className="h-4 w-4"/><Sparkles className="h-6 w-6"/><Star className="h-4 w-4"/></div>
      <p data-studio-native-object="object:cover:date" className="relative mt-9 text-xs uppercase tracking-[.23em]">{date}</p>
      <Lines studioObject="object:cover:ornament" className="mt-9"><Moon className="h-4 w-4"/></Lines>
    </div>
  </section>;

  return <section className={center} data-invitation-section={stage}>
    <Names className="text-3xl">{names}</Names><p data-studio-native-object="object:cover:date" className="mt-4">{date}</p>
    <ArrowUpRight data-studio-native-object="object:cover:arrow" className="mt-7 h-5 w-5" />
  </section>;
}
