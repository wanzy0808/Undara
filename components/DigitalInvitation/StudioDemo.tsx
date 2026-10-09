"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useInView } from "motion/react";
import Image from "next/image";
import { Check, ImagePlus, Layers3, LayoutTemplate, MousePointer2, Music2, Pause, Play, Redo2, RotateCcw, Save, SlidersHorizontal, Type, Undo2 } from "lucide-react";
import BrandWordmark from "@/components/Brand/BrandWordmark";
import styles from "./StudioDemo.module.css";

function subscribeToMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const motionSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const staticServerSnapshot = () => true;

const tools = [LayoutTemplate, SlidersHorizontal, Type, ImagePlus, Layers3, Music2];
const cursorPositions = ["translate(6%, 24%)", "translate(6%, 39%)", "translate(24%, 27%)", "translate(73%, 25%)", "translate(93%, 7%)"];

export default function StudioDemo({ en }: { en: boolean }) {
  const root = useRef<HTMLElement>(null);
  const visible = useInView(root, { amount: 0.25 });
  const reduced = useSyncExternalStore(subscribeToMotion, motionSnapshot, staticServerSnapshot);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const labels = en ? ["Catalog", "Content", "Text", "Photos", "Assets", "Music"] : ["Katalog", "Isi", "Teks", "Foto", "Asset", "Musik"];
  const edited = step >= 3;
  const activeTool = step === 0 ? 1 : 2;
  const title = edited ? (en ? "Our Happy Day" : "Hari Bahagia Kami") : (en ? "You Are Invited" : "Kabar Bahagia");
  const stages = en ? ["Choose the content", "Select a text", "Edit the title", "See the change", "Save the design"] : ["Pilih isi undangan", "Pilih teks", "Ubah judul", "Lihat perubahan", "Simpan desain"];

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!visible || paused || hidden || reduced) return;
    const timer = window.setInterval(() => setStep(previous => (previous + 1) % 5), 2000);
    return () => window.clearInterval(timer);
  }, [visible, paused, hidden, reduced]);

  return (
    <figure ref={root} data-studio-demo data-step={step} data-paused={paused || Boolean(reduced)} className="min-w-0">
      <div className={styles.frame} aria-hidden="true">
        <header className={styles.header}>
          <BrandWordmark size="mobile" />
          <span>Una &amp; Dara</span>
          <span className={styles.draft}>{en ? "Draft" : "Draf"}</span>
        </header>
        <div className={styles.workspace}>
          <div className={styles.rail}>
            {tools.map((Icon, index) => <div key={labels[index]} data-active={index === activeTool} className={styles.tool}><Icon size={16} /><span>{labels[index]}</span></div>)}
          </div>
          <div className={styles.inspector}>
            <p className={styles.panelTitle}>{step === 0 ? labels[1] : labels[2]}</p>
            {step === 0 ? <div className={styles.sections}>{[en ? "Envelope" : "Amplop", "Cover", en ? "Greeting" : "Salam", en ? "Identity" : "Identitas", "RSVP"].map(label => <div key={label}><span>{label}</span><Check size={12} /></div>)}</div> : <>
              <p className={styles.fieldLabel}>{en ? "Title" : "Judul"}</p>
              <div className={styles.field} data-editing={step === 2}>{step >= 2 ? (en ? "Our Happy Day" : "Hari Bahagia Kami") : title}<span className={styles.caret} data-active={step === 2} /></div>
              <p className={styles.fieldLabel}>{en ? "Typeface" : "Font"}</p><div className={styles.field}>DM Serif Display</div>
              <p className={styles.fieldLabel}>{en ? "Alignment" : "Posisi Teks"}</p><div className={styles.field}>{en ? "Center" : "Tengah"}</div>
            </>}
          </div>
          <div className={styles.canvas}>
            <div className={styles.toolbar}>
              <span>Botanical Ivory</span>
              <RotateCcw size={13} /><Undo2 size={13} /><Redo2 size={13} />
              <span className={styles.save} data-active={step === 4}>{step === 4 ? <Check size={14} /> : <Save size={14} />}</span>
            </div>
            <div className={styles.paper}>
              <p className={styles.invitationTitle} data-selected={step > 0 && step < 4}>{title}</p>
              <h3>Una <span>&amp;</span> Dara</h3>
              <div className={styles.art}>
                <Image src="/templates/botanical-ivory/06_botanical_ivory_handdrawn_tender_embrace.webp" alt="" fill sizes="180px" className="object-contain" />
              </div>
              <p className={styles.greeting}>{en ? "A new chapter, together." : "Bab baru, bersama."}</p>
            </div>
            <div className={styles.status}>{step === 4 ? <><Check size={12} />{en ? "Design saved" : "Desain tersimpan"}</> : <><span />{en ? "Invitation preview" : "Preview undangan"}</>}</div>
          </div>
          <div className={styles.cursor} style={{ transform: cursorPositions[step] }} data-motion={!reduced}><MousePointer2 size={21} fill="var(--primary)" /></div>
        </div>
      </div>
      <figcaption className="mt-4 flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
        <span>{en ? "Studio demo" : "Demo Studio"}<span aria-hidden="true"> · {reduced ? (en ? "Personalize & save" : "Personalisasi & simpan") : stages[step]}</span></span>
        {!reduced && <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? (en ? "Play Studio demo" : "Putar demo Studio") : (en ? "Pause Studio demo" : "Jeda demo Studio")} aria-pressed={paused} className="flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{paused ? <Play size={14} /> : <Pause size={14} />}{paused ? (en ? "Play" : "Putar") : (en ? "Pause" : "Jeda")}</button>}
      </figcaption>
    </figure>
  );
}
