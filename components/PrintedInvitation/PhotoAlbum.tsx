"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import styles from "./PhotoAlbum.module.css";

export type AlbumPhoto = {
  asset: string;
  title: string;
  detail: string;
  alt: string;
};

/** A compact, manually selected album; every image stays mounted for interruptible fades. */
export default function PhotoAlbum({ photos, label, kind, intro }: {
  intro: ReactNode;
  photos: readonly AlbumPhoto[];
  label: string;
  kind: "sample" | "material";
}) {
  const [selected, setSelected] = useState(0);
  const [keyboard, setKeyboard] = useState(false);
  const controls = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  return (
    <div data-physical-album={kind} className={styles.album}>
      <div className={styles.intro}>{intro}</div>
      <div id={id} className={`${styles.stage} relative aspect-[3/2] overflow-hidden rounded-[20px] bg-primary/[0.04]`} data-album-stage>
        {photos.map((item, index) => (
          <div
            key={item.asset}
            className={styles.photo}
            data-active={index === selected}
            data-keyboard={keyboard}
            aria-hidden={index !== selected}
          >
            <Image
              src={`/assets/marketing/physical-invitation/${item.asset}.webp`}
              alt={item.alt}
              fill
              loading="eager"
              sizes="(max-width: 1023px) 90vw, 55vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div className={styles.details}>
        <div className="grid" aria-live="polite" aria-atomic="true" data-album-caption>
          {photos.map((item, index) => (
            <div key={item.asset} className={`col-start-1 row-start-1 ${index !== selected ? "invisible" : ""}`} aria-hidden={index !== selected}>
              <h3 className="undara-marketing-subheading text-primary">{item.title}</h3>
              <p className="mt-2 text-base leading-7 text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
        <fieldset className="mt-3 min-w-0">
          <legend className="sr-only">{label}</legend>
          <div className={styles.choices}>
            {photos.map((item, index) => (
              <button
                key={item.asset}
                ref={element => { controls.current[index] = element; }}
                type="button"
                aria-pressed={index === selected}
                aria-controls={id}
                className={styles.choice}
                onClick={event => { setKeyboard(event.detail === 0); setSelected(index); }}
                onKeyDown={event => {
                  const last = photos.length - 1;
                  const next = (event.key === "ArrowRight" || event.key === "ArrowDown") ? (index + 1) % photos.length
                    : (event.key === "ArrowLeft" || event.key === "ArrowUp") ? (index + last) % photos.length
                    : event.key === "Home" ? 0 : event.key === "End" ? last : null;
                  if (next === null) return;
                  event.preventDefault();
                  setKeyboard(true);
                  setSelected(next);
                  controls.current[next]?.focus();
                }}
              >
                <span className="relative block aspect-[3/2] w-16 shrink-0 overflow-hidden rounded-lg sm:w-20" aria-hidden="true">
                  <Image src={`/assets/marketing/physical-invitation/${item.asset}.webp`} alt="" fill sizes="80px" className="object-cover" />
                </span>
                <span className="text-left text-[13px] leading-5 sm:text-sm">{item.title}</span>
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}
