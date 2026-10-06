"use client";

import type { SceneProps } from "@/components/PublicInvitation/InvitationThemeScenes";
import { GoldenFan, SilverLoops } from "@/components/PublicInvitation/AnniversaryArtwork";
import { OccasionOpenButton, OccasionPortrait, OccasionScrollHint, useOccasionOpening } from "@/components/PublicInvitation/OccasionSceneParts";
import { useInvitationLanguage } from "@/components/PublicInvitation/InvitationLanguage";
import "./occasion-themes.css";

export default function AnniversaryScene(props: SceneProps) {
  const { theme, stage, names, date, eventLabel, recipientLine, cover } = props;
  const { opening, open } = useOccasionOpening(props);
  const language = useInvitationLanguage();
  const silver = theme === "silver-reverie";
  if (stage === "envelope") return <section className={`ot-envelope ${silver ? "sv-envelope" : "gk-envelope"}`}
    data-invitation-section="envelope" data-opening={opening ? "true" : undefined}>
    <p data-studio-native-object="object:envelope:invitation-title" className="ot-envelope-title">
      {language === "EN" ? (silver ? "A love worth celebrating" : "Together, through the years") : (silver ? "Kasih yang layak dirayakan" : "Bersama, sepanjang waktu")}
    </p>
    <div data-studio-native-object="object:envelope:stationery-group" className="ot-stationery">
      <div data-studio-native-object="object:envelope:paper-back" className="ot-paper-back" aria-hidden="true" />
      <div className="ot-letter-flight">
        <div data-studio-native-object="object:envelope:letter-paper" className="ot-letter-paper">
          {silver ? <SilverLoops section="envelope" /> : <GoldenFan section="envelope" />}
          <h1 data-studio-native-heading="">{names}</h1>
          <p data-studio-native-object="object:envelope:date">{date}</p>
        </div>
      </div>
      <div className="ot-door-flight ot-door-flight-left"><div aria-hidden="true" data-studio-native-object="object:envelope:fold-left" className="ot-door ot-door-left" /></div>
      <div className="ot-door-flight ot-door-flight-right"><div aria-hidden="true" data-studio-native-object="object:envelope:fold-right" className="ot-door ot-door-right" /></div>
      <div className="ot-seal-flight"><div aria-hidden="true" data-studio-native-object="object:envelope:seal" className="ot-seal">
        {silver ? <svg viewBox="0 0 40 52" className="ot-seal-loops" fill="none" stroke="currentColor" strokeWidth="1.3"><ellipse cx="15" cy="19" rx="11" ry="16" /><ellipse cx="25" cy="33" rx="11" ry="16" /></svg> : <span className="gk-seal-mark" />}
      </div></div>
    </div>
    {recipientLine && <p data-personal-envelope-address data-studio-native-object="object:envelope:address" className="ot-address">{recipientLine}</p>}
    <OccasionOpenButton opening={opening} open={open} preview={props.preview} />
  </section>;

  if (silver) return <section data-invitation-section="cover" className={`ot-cover sv-cover ${cover ? "" : "sv-cover-without-photo"}`}>
    <div aria-hidden="true" data-studio-native-object="object:cover:paper-curve" className="sv-paper-curve" />
    <SilverLoops />
    <OccasionPortrait {...props} />
    <div data-studio-native-object="object:cover:title-group" className="sv-cover-copy">
      <p data-studio-native-object="object:cover:event-label" className="ot-event-type">{eventLabel || "Silver Wedding"}</p>
      <h1 data-studio-native-heading="" className="ot-cover-name">{names}</h1>
      <p data-studio-native-object="object:cover:date" className="ot-cover-date">{date}</p>
    </div>
    <OccasionScrollHint />
  </section>;

  return <section data-invitation-section="cover" className="ot-cover gk-cover">
    <div aria-hidden="true" data-studio-native-object="object:cover:folio-edge" className="gk-folio-edge" />
    <div data-studio-native-object="object:cover:title-group" className="gk-cover-copy">
      <h1 data-studio-native-heading="" className="ot-cover-name">{names}</h1>
      <p data-studio-native-object="object:cover:event-label" className="ot-event-type">{eventLabel || "Golden Wedding"}</p>
      <p data-studio-native-object="object:cover:date" className="ot-cover-date">{date}</p>
    </div>
    <OccasionPortrait {...props} />
    <GoldenFan />
    <OccasionScrollHint />
  </section>;
}
