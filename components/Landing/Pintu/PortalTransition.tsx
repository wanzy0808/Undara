"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { isMarketingPath } from "@/lib/marketing-paths";
import { useMarketingTransitionAudio } from "@/components/Layout/MarketingAudio";

const COVER_MS = 1120;
const DOOR_COVER_MS = 1360;
const REVEAL_MS = 1180;
const STALLED_ROUTE_MS = 8000;
type Phase = "idle" | "cover" | "hold" | "reveal";
type PendingRoute = { path: string; href: string };

type BranchSwarmLayer = {
  top: string;
  width: string;
  height: string;
  y: string;
  rotate: number;
  scale: number;
  delay: number;
  z: number;
};

const BRANCH_SWARM: BranchSwarmLayer[] = [
  { top: "-24vh", width: "78vw", height: "124vh", y: "-8vh", rotate: -19, scale: 1.18, delay: 0, z: 6 },
  { top: "-14vh", width: "74vw", height: "116vh", y: "-5vh", rotate: -13, scale: 1.14, delay: 35, z: 7 },
  { top: "-5vh", width: "82vw", height: "112vh", y: "-3vh", rotate: -8, scale: 1.20, delay: 70, z: 8 },
  { top: "5vh", width: "76vw", height: "104vh", y: "-1vh", rotate: -4, scale: 1.15, delay: 105, z: 9 },
  { top: "15vh", width: "84vw", height: "98vh", y: "0vh", rotate: 2, scale: 1.22, delay: 140, z: 10 },
  { top: "24vh", width: "80vw", height: "92vh", y: "1vh", rotate: 7, scale: 1.18, delay: 175, z: 11 },
  { top: "33vh", width: "76vw", height: "86vh", y: "2vh", rotate: 12, scale: 1.15, delay: 210, z: 12 },
  { top: "42vh", width: "82vw", height: "82vh", y: "4vh", rotate: 17, scale: 1.20, delay: 245, z: 13 },
  { top: "51vh", width: "78vw", height: "76vh", y: "6vh", rotate: 22, scale: 1.17, delay: 280, z: 14 },
  { top: "59vh", width: "86vw", height: "72vh", y: "8vh", rotate: 27, scale: 1.24, delay: 315, z: 15 },
];

/**
 * One persistent woodland passage for both a door entry and ordinary marketing links.
 * Foliage closes toward the viewer, the route commits behind it, then the plants
 * part again so the destination reads like a new clearing.
 * Dashboard/auth/checkout/external links are not intercepted.
 */
export default function PortalTransition() {
  const pathname = usePathname();
  const router = useRouter();
  const reducedMotion = Boolean(useReducedMotion());
  const { primeTransitionSound, playTransitionSound } = useMarketingTransitionAudio();
  const primeRef = useRef(primeTransitionSound);
  const playRef = useRef(playTransitionSound);
  useEffect(() => {
    primeRef.current = primeTransitionSound;
    playRef.current = playTransitionSound;
  }, [primeTransitionSound, playTransitionSound]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [coverDuration, setCoverDuration] = useState(COVER_MS);
  const pending = useRef<PendingRoute | null>(null);
  const timers = useRef<number[]>([]);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  const reset = useCallback(() => {
    clearTimers();
    pending.current = null;
    delete document.documentElement.dataset.undaraMarketingTransition;
    setPhase("idle");
  }, [clearTimers]);

  useEffect(() => {
    const begin = (href: string, viaDoor: boolean) => {
      if (pending.current) return;
      const url = new URL(href, window.location.origin);
      pending.current = { path: url.pathname, href: url.pathname + url.search + url.hash };
      if (reducedMotion) {
        if (!viaDoor) router.push(pending.current.href);
        pending.current = null;
        return;
      }
      document.documentElement.dataset.undaraMarketingTransition = "1";
      playRef.current();
      const cover = viaDoor ? DOOR_COVER_MS : COVER_MS;
      setCoverDuration(cover);
      setPhase("cover");
      timers.current.push(window.setTimeout(() => setPhase("hold"), cover));
      // The 3D door owns its camera zoom and router.push; ordinary links navigate after cover.
      if (!viaDoor) {
        timers.current.push(window.setTimeout(() => {
          if (pending.current) router.push(pending.current.href);
        }, cover + 35));
      }
      // Never leave an opaque veil blocking navigation if a route fails to commit.
      timers.current.push(window.setTimeout(() => {
        if (pending.current) reset();
      }, STALLED_ROUTE_MS));
    };

    const onMarketingLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!isMarketingPath(window.location.pathname)) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || !isMarketingPath(url.pathname)) return;
      // Opening an invitation example is a direct preview, not a woodland passage.
      if (url.pathname === "/template-design" && url.searchParams.has("template")) return;
      if (url.pathname === window.location.pathname) return; // Keep in-page links and same-page actions native.
      event.preventDefault();
      primeRef.current();
      begin(url.pathname + url.search + url.hash, false);
    };

    const onDoorPrime = () => primeRef.current();
    const onDoorStart = (event: Event) => {
      const href = (event as CustomEvent<{ href: string }>).detail?.href;
      if (href) begin(href, true);
    };

    document.addEventListener("click", onMarketingLink, true);
    window.addEventListener("undara-portal-prime", onDoorPrime);
    window.addEventListener("undara-portal-start", onDoorStart);
    return () => {
      document.removeEventListener("click", onMarketingLink, true);
      window.removeEventListener("undara-portal-prime", onDoorPrime);
      window.removeEventListener("undara-portal-start", onDoorStart);
      clearTimers();
      delete document.documentElement.dataset.undaraMarketingTransition;
    };
  }, [router, reducedMotion, reset, clearTimers]);

  useEffect(() => {
    if (!pending.current || pending.current.path !== pathname || phase !== "hold") return;
    const timer = window.setTimeout(() => {
      document.documentElement.dataset.undaraMarketingTransition = "reveal";
      setPhase("reveal");
      // Destination sections begin assembling in sync with the opening veil.
      window.dispatchEvent(new Event("undara-marketing-reveal"));
      timers.current.push(window.setTimeout(reset, REVEAL_MS + 80));
    }, 90);
    return () => clearTimeout(timer);
  }, [pathname, phase, reset]);

  if (phase === "idle" || reducedMotion) return null;
  return (
    <div
      aria-hidden="true"
      className="undara-portal-transition"
      data-phase={phase}
      style={{
        "--undara-portal-cover-ms": `${coverDuration}ms`,
        "--undara-portal-reveal-ms": `${REVEAL_MS}ms`,
      } as CSSProperties}
    >
      <div className="undara-portal-transition__landscape" />
      <div className="undara-portal-transition__mist undara-portal-transition__mist--back" />

      {BRANCH_SWARM.map((branch, index) => {
        const style = {
          "--branch-top": branch.top,
          "--branch-width": branch.width,
          "--branch-height": branch.height,
          "--branch-y": branch.y,
          "--branch-rotate": `${branch.rotate}deg`,
          "--branch-rotate-right": `${-branch.rotate}deg`,
          "--branch-scale": branch.scale,
          "--branch-delay": `${branch.delay}ms`,
          "--branch-reveal-delay": `${Math.round(branch.delay * 0.28)}ms`,
          "--branch-z": branch.z,
        } as CSSProperties;

        return (
          <div
            key={`left-${index}`}
            className="undara-branch-swarm undara-branch-swarm--left"
            style={style}
          />
        );
      })}
      {BRANCH_SWARM.map((branch, index) => {
        const style = {
          "--branch-top": branch.top,
          "--branch-width": branch.width,
          "--branch-height": branch.height,
          "--branch-y": branch.y,
          "--branch-rotate": `${branch.rotate}deg`,
          "--branch-rotate-right": `${-branch.rotate}deg`,
          "--branch-scale": branch.scale,
          "--branch-delay": `${branch.delay + 18}ms`,
          "--branch-reveal-delay": `${Math.round((branch.delay + 18) * 0.28)}ms`,
          "--branch-z": branch.z,
        } as CSSProperties;

        return (
          <div
            key={`right-${index}`}
            className="undara-branch-swarm undara-branch-swarm--right"
            style={style}
          />
        );
      })}

      <div className="undara-portal-transition__mist undara-portal-transition__mist--front" />
      <div className="undara-portal-transition__vignette" />
    </div>
  );
}
