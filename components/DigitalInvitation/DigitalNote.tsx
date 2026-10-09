"use client";

import Image from "next/image";

const artwork = [
  "/templates/noir-poeme/14_paper_note.webp",
  "/templates/botanical-ivory/ivory_botanical_wax_seal_with_gold_accents.webp",
  "/templates/botanical-ivory/ivory_chiffon_draped_ribbon_overlay.webp",
];

/** Invitation artwork fills the opposite margin without becoming another card. */
export default function DigitalNote({ index, className }: { index: number; className: string }) {
  return (
    <div aria-hidden="true" className={`digital-note pointer-events-none absolute top-8 aspect-square w-[20%] opacity-[0.12] dark:opacity-[0.09] lg:top-1/2 lg:w-[24%] lg:-translate-y-1/2 lg:opacity-[0.16] lg:dark:opacity-[0.11] ${className}`}>
      <Image src={artwork[index]} alt="" fill sizes="24vw" className="object-contain" />
      <style jsx>{`
        .digital-note { animation: note-drift 14s ease-in-out infinite; }
        @keyframes note-drift {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .digital-note { animation: none; }
        }
      `}</style>
    </div>
  );
}
