"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useInView } from "motion/react";
import Image from "next/image";
import { Check, ImagePlus, Layers3, LayoutTemplate, MousePointer2, Music2, Redo2, RotateCcw, Save, SlidersHorizontal, Type, Undo2 } from "lucide-react";
import BrandWordmark from "@/components/Brand/BrandWordmark";
import styles from "./StudioDemo.module.css";

function subscribeToMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const motionSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const staticServerSnapshot = () => true;

const artworks = [
  "/templates/botanical-ivory/06_botanical_ivory_handdrawn_tender_embrace.webp",
  "/templates/botanical-ivory/09_botanical_ivory_handdrawn_flowing_veil.webp",
];
const tools = [LayoutTemplate, SlidersHorizontal, Type, ImagePlus, Layers3, Music2];
const cursorPositions = ["translate(6%, 24%)", "translate(6%, 39%)", "translate(24%, 27%)", "translate(24%, 54%)", "translate(93%, 7%)"];

export default function StudioDemo({ en }: { en: boolean }) {
  const root = useRef<HTMLElement>(null);
  const visible = useInView(root, { amount: 0.25 });
  const reduced = useSyncExternalStore(subscribeToMotion, motionSnapshot, staticServerSnapshot);
  const [step, setStep] = useState(0);
  const [hidden, setHidden] = useState(false);
  const labels = en ? ["Catalog", "Content", "Text", "Photos", "Assets", "Music"] : ["Katalog", "Isi", "Teks", "Foto", "Asset", "Musik"];
  const edited = step >= 2;
  const photoChanged = step >= 3;
  const activeTool = step === 0 ? 1 : photoChanged ? 3 : 2;
  const title = edited ? (en ? "Our Happy Day" : "Hari Bahagia Kami") : (en ? "You Are Invited" : "Kabar Bahagia");

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!visible || hidden || reduced) return;
    const timer = window.setInterval(() => setStep(previous => (previous + 1) % 5), 1600);
    return () => window.clearInterval(timer);
  }, [visible, hidden, reduced]);

  return (
    <figure ref={root} data-studio-demo data-step={step} data-static={reduced} className="min-w-0">
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
            <p className={styles.panelTitle}>{labels[activeTool]}</p>
            {step === 0 ? <div className={styles.sections}>{[en ? "Envelope" : "Amplop", "Cover", en ? "Greeting" : "Salam", en ? "Identity" : "Identitas", "RSVP"].map(label => <div key={label}><span>{label}</span><Check size={12} /></div>)}</div> : photoChanged ? <>
              <p className={styles.fieldLabel}>{en ? "Choose an image" : "Pilih gambar"}</p>
              <div className={styles.photoOptions}>
                {artworks.map((src, index) => <div key={src} data-active={index === 1}>
                  <Image src={src} alt="" fill sizes="100px" className="object-contain" />
                  {index === 1 && <Check size={13} />}
                </div>)}
              </div>
            </> : <>
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
              <p className={styles.invitationTitle} data-demo-title data-edited={edited} data-selected={step > 0 && step < 3}>{title}</p>
              <h3>Una <span>&amp;</span> Dara</h3>
              <div className={styles.art} data-demo-art data-selected={step === 3}>
                {artworks.map((src, index) => <div key={src} className={styles.artImage} data-active={index === (photoChanged ? 1 : 0)}>
                  <Image src={src} alt="" fill loading="eager" sizes="180px" className="object-contain" />
                </div>)}
              </div>
              <p className={styles.greeting}>{en ? "A new chapter, together." : "Bab baru, bersama."}</p>
            </div>
            <div className={styles.status}>{step === 4 ? <><Check size={12} />{en ? "Design saved" : "Desain tersimpan"}</> : null}</div>
          </div>
          <div className={styles.cursor} style={{ transform: cursorPositions[step] }} data-motion={!reduced}><MousePointer2 size={21} fill="var(--primary)" /></div>
        </div>
      </div>
      <figcaption className="sr-only">{en ? "Illustrative invitation editor using Una & Dara sample content" : "Ilustrasi editor undangan dengan contoh Una & Dara"}</figcaption>


    </figure>
  );
}
