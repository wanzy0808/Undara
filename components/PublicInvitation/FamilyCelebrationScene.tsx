"use client";

import type { SceneProps } from "@/components/PublicInvitation/InvitationThemeScenes";
import { PrayerGarden, PaperKite, CloudScroll, CeremonialKnot } from "@/components/PublicInvitation/FamilyCelebrationArtwork";
import { OccasionOpenButton, OccasionScrollHint, useOccasionOpening } from "@/components/PublicInvitation/OccasionSceneParts";
import { useInvitationLanguage } from "@/components/PublicInvitation/InvitationLanguage";
import { invitationText } from "@/lib/invitations/language";
import "./occasion-themes.css";
import "./family-celebrations.css";

export default function FamilyCelebrationScene(props: SceneProps) {
  const { theme, stage, names, date, recipientLine, eventLabel } = props;
  const language = useInvitationLanguage();
  const { opening, open } = useOccasionOpening(props);
  const khitanan = theme === "taman-doa";
  const tr = (text: string) => invitationText(language, text);

  if (stage === "envelope") return <section data-invitation-section="envelope" data-opening={opening ? "true" : undefined}
    className={`ot-envelope ${khitanan ? "td-envelope" : "rt-envelope"}`}>
    <p data-studio-native-object="object:envelope:invitation-title" className="ot-envelope-title">
      {tr(khitanan ? "Syukur untuk langkah kecilnya" : "Sebuah ikatan, dua keluarga")}
    </p>
    <div data-studio-native-object="object:envelope:stationery-group" className={khitanan ? "td-packet" : "ot-stationery rt-folio"}>
      <div aria-hidden="true" data-studio-native-object="object:envelope:paper-back" className="ot-paper-back" />
      <div className="ot-letter-flight">
        <div data-studio-native-object="object:envelope:letter-paper" className="ot-letter-paper">
          {khitanan ? <PrayerGarden section="envelope" /> : <CloudScroll section="envelope" />}
          <h1 data-studio-native-heading="">{names}</h1>
          <p data-studio-native-object="object:envelope:date">{date}</p>
        </div>
      </div>
      {khitanan ? <>
        <div aria-hidden="true" data-studio-native-object="object:envelope:pocket-front" className="td-pocket" />
        <div className="td-flap-flight"><div aria-hidden="true" data-studio-native-object="object:envelope:fold-top" className="td-flap" /></div>
        <div className="ot-seal-flight"><div aria-hidden="true" data-studio-native-object="object:envelope:seal" className="td-seal">
          <svg viewBox="0 0 40 40" fill="none"><path d="M20 4L35 20L20 36L5 20Z" stroke="currentColor" /><path d="M20 10V30M10 20H30" stroke="currentColor" /></svg>
        </div></div>
      </> : <>
        <div className="ot-door-flight ot-door-flight-left"><div aria-hidden="true" data-studio-native-object="object:envelope:fold-left" className="ot-door ot-door-left" /></div>
        <div className="ot-door-flight ot-door-flight-right"><div aria-hidden="true" data-studio-native-object="object:envelope:fold-right" className="ot-door ot-door-right" /></div>
        <div className="rt-tie-flight"><CeremonialKnot section="envelope" /></div>
      </>}
    </div>
    {recipientLine && <p data-personal-envelope-address data-studio-native-object="object:envelope:address" className="ot-address">{recipientLine}</p>}
    <OccasionOpenButton opening={opening} open={open} preview={props.preview} />
  </section>;

  if (khitanan) return <section data-invitation-section="cover" className="ot-cover td-cover">
    <PaperKite />
    <div data-studio-native-object="object:cover:title-group" className="td-cover-copy">
      <p data-studio-native-object="object:cover:event-label" className="ot-event-type">{eventLabel || tr("Syukuran Khitanan")}</p>
      <h1 data-studio-native-heading="" className="ot-cover-name">{names}</h1>
      <p data-studio-native-object="object:cover:date" className="ot-cover-date">{date}</p>
    </div>
    <PrayerGarden />
    <OccasionScrollHint />
  </section>;

  return <section data-invitation-section="cover" className="ot-cover rt-cover">
    <div aria-hidden="true" data-studio-native-object="object:cover:folio-edge" className="rt-folio-edge" />
    <CloudScroll />
    <div data-studio-native-object="object:cover:title-group" className="rt-cover-copy">
      <p data-studio-native-object="object:cover:event-label" className="ot-event-type">{eventLabel || "Sangjit"}</p>
      <h1 data-studio-native-heading="" className="ot-cover-name">{names}</h1>
      <p data-studio-native-object="object:cover:date" className="ot-cover-date">{date}</p>
    </div>
    <CeremonialKnot />
    <OccasionScrollHint />
  </section>;
}
