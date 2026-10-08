"use client";

import type { SceneProps } from "@/components/PublicInvitation/InvitationThemeScenes";
import { FamilyStationeryArtwork } from "@/components/PublicInvitation/FamilyStationeryArtwork";
import { OccasionOpenButton, OccasionScrollHint, useOccasionOpening } from "@/components/PublicInvitation/OccasionSceneParts";
import { familyArtDirection } from "@/lib/templates/family-art-directions";
import "./occasion-themes.css";
import "./family-stationery.css";

function CoverLetter({ names, date, eventLabel, className = "" }: Pick<SceneProps, "names" | "date" | "eventLabel"> & { className?: string }) {
  return <div data-studio-native-object="object:cover:title-group" className={`rf-cover-letter ${className}`}>
    {eventLabel && <p data-studio-native-object="object:cover:event-label" className="rf-event-label">{eventLabel}</p>}
    <h1 data-studio-native-heading="" className="rf-cover-name">{names}</h1>
    <p data-studio-native-object="object:cover:date" className="rf-cover-date">{date}</p>
  </div>;
}

export default function FamilyStationeryScene(props: SceneProps) {
  const { theme, stage, names, date, eventLabel, recipientLine } = props;
  const direction = familyArtDirection(theme);
  const { opening, open } = useOccasionOpening(props);
  if (!direction) return null;

  if (stage === "envelope") return <section data-invitation-section="envelope"
    data-opening={opening ? "true" : undefined} className={`ot-envelope rf-envelope rf-envelope--${direction.envelope}`}>
    <FamilyStationeryArtwork theme={theme} section="envelope" className="rf-envelope-atmosphere" />
    <div data-studio-native-object="object:envelope:title-group" className="rf-envelope-intro">
      {eventLabel && <p data-studio-native-object="object:envelope:event-label" className="rf-event-label">{eventLabel}</p>}
      <h1 data-studio-native-heading="" className="rf-envelope-heading">{names}</h1>
      <p data-studio-native-object="object:envelope:date" className="rf-envelope-date">{date}</p>
    </div>
    <div data-studio-native-object="object:envelope:stationery-group" className="rf-stationery">
      <div aria-hidden="true" data-studio-native-object="object:envelope:paper-back" className="rf-paper-back rf-paper" />
      <div className="rf-letter-flight">
        <div data-studio-native-object="object:envelope:letter-paper" className="rf-letter rf-paper">
          <p data-studio-native-object="object:envelope:letter-names" className="rf-letter-name">{names}</p>
        </div>
      </div>
      {direction.envelope === "gatefold" ? <>
        <div className="rf-fold-flight rf-fold-flight--left"><div aria-hidden="true" data-studio-native-object="object:envelope:fold-left" className="rf-fold rf-paper" /></div>
        <div className="rf-fold-flight rf-fold-flight--right"><div aria-hidden="true" data-studio-native-object="object:envelope:fold-right" className="rf-fold rf-paper" /></div>
      </> : <div className="rf-front-flight"><div aria-hidden="true" data-studio-native-object="object:envelope:pocket-front" className="rf-front rf-paper" /></div>}
      {direction.envelope === "pocket" && <div className="rf-flap-flight"><div aria-hidden="true" data-studio-native-object="object:envelope:fold-top" className="rf-flap rf-paper" /></div>}
      {direction.envelope !== "pocket" && <div className="rf-band-flight"><div aria-hidden="true" data-studio-native-object="object:envelope:paper-band" className="rf-band" /></div>}
      <div className="rf-seal-flight"><div aria-hidden="true" data-studio-native-object="object:envelope:seal" className="rf-seal" /></div>
    </div>
    {recipientLine && <p data-personal-envelope-address data-studio-native-object="object:envelope:address" className="rf-address rf-paper">{recipientLine}</p>}
    <OccasionOpenButton opening={opening} open={open} preview={props.preview} />
  </section>;

  const letter = <CoverLetter {...{ names, date, eventLabel }} />;
  const art = <FamilyStationeryArtwork theme={theme} section="cover" />;
  return <section data-invitation-section="cover" className={`rf-cover rf-cover--${direction.cover}`}>
    {direction.cover === "arched" ? <><div className="rf-cover-intro">{letter}</div>{art}</>
      : direction.cover === "editorial" ? <>{art}<div className="rf-editorial-letter">{letter}</div></>
      : direction.cover === "playful" ? <><div className="rf-playful-letter">{letter}</div>{art}</>
      : direction.cover === "porcelain" ? <>{art}<div className="rf-porcelain-letter">{letter}</div></>
      : <>{art}<div className={`rf-overprint rf-overprint--${direction.cover}`}>{letter}</div></>}
    <OccasionScrollHint />
  </section>;
}
