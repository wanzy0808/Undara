"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useSyncExternalStore } from "react";

function subscribeToMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const reducedSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const serverSnapshot = () => true;

export default function StationeryNote({ className, rotate = 0 }: { className: string; rotate?: number }) {
  const reduced = useSyncExternalStore(subscribeToMotion, reducedSnapshot, serverSnapshot);
  return (
    <motion.div
      aria-hidden="true"
      className={`undara-stationery-note pointer-events-none absolute z-0 opacity-[0.13] dark:opacity-[0.09] ${className}`}
      initial={{ rotate }}
      animate={reduced ? { y: 0, rotate } : { y: [0, -8, 0], rotate: [rotate, rotate + 1, rotate] }}
      transition={reduced ? { duration: 0 } : { duration: 14, repeat: Infinity, ease: "easeInOut" }}
    >
      <Image src="/assets/marketing/physical-invitation/stationery-note.webp" alt="" fill sizes="(max-width: 767px) 45vw, 32vw" className="object-contain" />
    </motion.div>
  );
}
