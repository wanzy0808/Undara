"use client";

import type { SceneProps } from "@/components/PublicInvitation/InvitationThemeScenes";
import { CloudBank, GatheringRosette, MoonMobile } from "@/components/PublicInvitation/CelebrationArtwork";
import { OccasionOpenButton, OccasionPortrait, OccasionScrollHint, useOccasionOpening } from "@/components/PublicInvitation/OccasionSceneParts";
import { useInvitationLanguage } from "@/components/PublicInvitation/InvitationLanguage";
import "./occasion-themes.css";

export default function CelebrationScene(props: SceneProps) {
  const { theme, stage, names, date, eventLabel, recipientLine } = props;
  const { opening, open } = useOccasionOpening(props);
  const language = useInvitationLanguage();
  const baby = theme === "little-cloud";

  if (stage === "envelope") return <section data-invitation-section="envelope" data-opening={opening ? "true" : undefined}
    className={`ot-envelope ${baby ? "lc-envelope" : "gt-envelope"}`}>
    <p data-studio-native-object="object:envelope:invitation-title" className="ot-envelope-title">
      {language === "EN" ? (baby ? "A little joy is on its way" : "Let's make time to gather") : (baby ? "Ada bahagia kecil yang dinanti" : "Mari luangkan waktu bersama")}
    </p>
    <div data-studio-native-object="object:envelope:stationery-group" className={baby ? "lc-packet" : "gt-poster-packet"}>
      <div aria-hidden="true" data-studio-native-object="object:envelope:paper-back" className="ot-paper-back" />
      <div className="ot-letter-flight">
        <div data-studio-native-object="object:envelope:letter-paper" className="ot-letter-paper">
          {baby ? <MoonMobile section="envelope" /> : <GatheringRosette section="envelope" />}
          <h1 data-studio-native-heading="">{names}</h1>
          <p data-studio-native-object="object:envelope:date">{date}</p>
        </div>
      </div>
      {baby ? <>
        <div aria-hidden="true" data-studio-native-object="object:envelope:pocket-front" className="lc-pocket-front" />
        <div className="lc-flap-flight"><div aria-hidden="true" data-studio-native-object="object:envelope:fold-top" className="lc-packet-flap" /></div>
        <div className="ot-seal-flight"><div aria-hidden="true" data-studio-native-object="object:envelope:seal" className="lc-packet-seal">
          <svg viewBox="0 0 48 48" fill="none"><path d="M30 5A20 20 0 1 0 40 34A19 19 0 0 1 30 5Z" fill="currentColor" /></svg>
        </div></div>
      </> : <>
        <div className="gt-band-flight"><div aria-hidden="true" data-studio-native-object="object:envelope:paper-band" className="gt-paper-band" /></div>
        <div className="gt-fold-flight"><div aria-hidden="true" data-studio-native-object="object:envelope:fold-front" className="gt-fold-front" /></div>
      </>}
    </div>
    {recipientLine && <p data-personal-envelope-address data-studio-native-object="object:envelope:address" className="ot-address">{recipientLine}</p>}
    <OccasionOpenButton opening={opening} open={open} preview={props.preview} />
  </section>;

  if (baby) return <section data-invitation-section="cover" className="ot-cover lc-cover">
    <MoonMobile />
    <div data-studio-native-object="object:cover:title-group" className="lc-cover-copy">
      <p data-studio-native-object="object:cover:invitation-title" className="lc-cover-title">
        {language === "EN" ? "Waiting for a little wonder" : "Menyambut si kecil"}
      </p>
      <p data-studio-native-object="object:cover:event-label" className="ot-event-type">{eventLabel || "Baby Shower"}</p>
      <h1 data-studio-native-heading="" className="ot-cover-name">{names}</h1>
      <p data-studio-native-object="object:cover:date" className="ot-cover-date">{date}</p>
    </div>
    <CloudBank />
    <OccasionScrollHint />
  </section>;

  return <section data-invitation-section="cover" className="ot-cover gt-cover">
    <div aria-hidden="true" data-studio-native-object="object:cover:folded-ribbon-art" className="gt-cover-ribbon" />
    <div data-studio-native-object="object:cover:title-group" className="gt-cover-copy">
      <h1 data-studio-native-heading="" className="ot-cover-name">{names}</h1>
      <p data-studio-native-object="object:cover:event-label" className="ot-event-type">{eventLabel || (language === "EN" ? "Event" : "Acara")}</p>
      <p data-studio-native-object="object:cover:date" className="ot-cover-date">{date}</p>
    </div>
    <div className="gt-cover-art-stage"><GatheringRosette /><OccasionPortrait {...props} /></div>
    <OccasionScrollHint />
  </section>;
}
