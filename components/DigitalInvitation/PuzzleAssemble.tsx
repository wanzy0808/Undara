"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode, RefObject } from "react";

type Direction = "left" | "right" | "top" | "bottom";
type Props = {
  children: ReactNode;
  ready: boolean;
  direction?: Direction;
  delay?: number;
  className?: string;
  scrollRoot?: RefObject<HTMLElement | null>;
};

/** Restrained, repeatable block entrances inside the real marketing scroll panel. */
export default function PuzzleAssemble({
  children,
  ready,
  direction = "bottom",
  delay = 0,
  className,
  scrollRoot,
}: Props) {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return <div className={className}>{children}</div>;

  const transform = {
    left: "translateX(-20px)",
    right: "translateX(20px)",
    top: "translateY(-16px)",
    bottom: "translateY(20px)",
  }[direction];
  const assembled = { opacity: 1, transform: "translate(0px, 0px)" };
  return (
    <motion.div
      className={className}
      data-undara-digital-reveal
      initial={{ opacity: 0, transform }}
      animate={!scrollRoot && ready ? assembled : undefined}
      whileInView={scrollRoot && ready ? assembled : undefined}
      viewport={scrollRoot ? { root: scrollRoot, once: false, amount: "some", margin: "0px 0px -8% 0px" } : undefined}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
