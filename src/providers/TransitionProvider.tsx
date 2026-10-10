"use client";

import gsap from "gsap";
import { TransitionRouter } from "next-transition-router";
import { useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { PageTransitionOverlay } from "@/components/layout/page-transition/PageTransitionOverlay";

const MOBILE_QUERY = "(max-width: 767px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const BLOCK_DURATION = 0.32;
const BLOCK_STAGGER = 0.01;
const BRAND_HOLD_MS = 500;

type Direction = "leave" | "enter";
type ActiveTransition = {
  timeline: gsap.core.Timeline;
  finish: () => void;
};

function getBlocks(overlay: HTMLDivElement | null) {
  return overlay
    ? Array.from(overlay.querySelectorAll<HTMLDivElement>("[data-transition-block]"))
    : [];
}

function focusDestination(content: HTMLDivElement | null) {
  const target =
    content?.querySelector<HTMLElement>("main h1") ??
    content?.querySelector<HTMLElement>("main") ??
    content?.querySelector<HTMLElement>("h1");
  if (!target) return;

  const previousTabIndex = target.getAttribute("tabindex");
  if (previousTabIndex === null) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

export default function TransitionProvider({ children }: { children: ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<ActiveTransition | null>(null);
  const coveredAtRef = useRef<number | null>(null);

  const setLocked = useCallback((locked: boolean) => {
    const content = contentRef.current;
    if (!content) return;

    content.inert = locked;
    if (locked) content.setAttribute("aria-busy", "true");
    else content.removeAttribute("aria-busy");
  }, []);

  const resetVisual = useCallback(() => {
    coveredAtRef.current = null;
    const overlay = overlayRef.current;
    if (overlay) {
      overlay.dataset.active = "false";
      gsap.set(getBlocks(overlay), { scaleX: 0 });
    }
    if (logoRef.current) {
      gsap.set(logoRef.current, { opacity: 0, y: 6, scale: 0.96 });
    }
  }, []);

  const runTransition = useCallback(
    (direction: Direction, next: () => void) => {
      const overlay = overlayRef.current;
      const logo = logoRef.current;
      const shouldReduce = window.matchMedia(REDUCED_MOTION_QUERY).matches;

      activeRef.current?.timeline.kill();
      activeRef.current = null;
      if (direction === "leave") coveredAtRef.current = null;

      if (!overlay || !logo || shouldReduce) {
        resetVisual();
        setLocked(false);
        if (direction === "enter") focusDestination(contentRef.current);
        next();
        return;
      }

      const columns = window.matchMedia(MOBILE_QUERY).matches ? 8 : 16;
      const rows = Array.from(
        overlay.querySelectorAll<HTMLDivElement>("[data-transition-row]"),
        (row) => Array.from(row.children).slice(0, columns),
      );

      if (rows.length !== 4 || rows.some((row) => row.length !== columns)) {
        resetVisual();
        setLocked(false);
        next();
        return;
      }

      const phaseDuration = BLOCK_DURATION + (columns - 1) * BLOCK_STAGGER;
      // La navegación transcurre dentro de la pausa, nunca antes de ella.
      const revealDelay =
        direction === "enter" && coveredAtRef.current !== null
          ? Math.max(0, BRAND_HOLD_MS - (performance.now() - coveredAtRef.current)) / 1000
          : 0;
      const timeline = gsap.timeline({ paused: true });
      let completed = false;

      const active: ActiveTransition = {
        timeline,
        finish: () => {
          if (completed || activeRef.current !== active) return;
          completed = true;
          timeline.kill();
          activeRef.current = null;

          if (
            direction === "leave" &&
            !window.matchMedia(REDUCED_MOTION_QUERY).matches
          ) {
            // Cubrir también columnas ocultas protege cambios de breakpoint.
            gsap.set(getBlocks(overlay), { scaleX: 1 });
            gsap.set(logo, { opacity: 1, y: 0, scale: 1 });
            coveredAtRef.current = performance.now();
          } else {
            resetVisual();
            setLocked(false);
            if (direction === "enter") focusDestination(contentRef.current);
          }

          next();
        },
      };

      activeRef.current = active;
      overlay.dataset.active = "true";
      setLocked(true);

      gsap.set(getBlocks(overlay), { scaleX: direction === "leave" ? 0 : 1 });
      gsap.set(logo, {
        opacity: direction === "leave" ? 0 : 1,
        y: direction === "leave" ? 6 : 0,
        scale: direction === "leave" ? 0.96 : 1,
      });

      rows.forEach((blocks, row) => {
        timeline.to(
          blocks,
          {
            scaleX: direction === "leave" ? 1 : 0,
            duration: BLOCK_DURATION,
            ease: "power3.inOut",
            stagger: { each: BLOCK_STAGGER, from: row % 2 === 0 ? "start" : "end" },
          },
          revealDelay,
        );
      });

      timeline.to(
        logo,
        {
          opacity: direction === "leave" ? 1 : 0,
          y: direction === "leave" ? 0 : 6,
          scale: direction === "leave" ? 1 : 0.96,
          duration: direction === "leave" ? 0.1 : 0.08,
          ease: "power3.inOut",
        },
        direction === "leave" ? phaseDuration - 0.13 : revealDelay,
      );

      timeline.eventCallback("onComplete", active.finish);
      timeline.play();

      return () => {
        timeline.kill();
        if (activeRef.current === active) {
          completed = true;
          activeRef.current = null;
          resetVisual();
          setLocked(false);
        }
      };
    },
    [resetVisual, setLocked],
  );

  const leave = useCallback((next: () => void) => runTransition("leave", next), [runTransition]);
  const enter = useCallback(
    (next: () => void) => {
      // El destino ya está montado y la cobertura sigue completa.
      if (!window.location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
      return runTransition("enter", next);
    },
    [runTransition],
  );

  useEffect(() => {
    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleResize = () => activeRef.current?.finish();
    const handleMotionChange = () => {
      if (!motionQuery.matches) return;
      if (activeRef.current) activeRef.current.finish();
      else {
        resetVisual();
        setLocked(false);
      }
    };

    window.addEventListener("resize", handleResize);
    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      motionQuery.removeEventListener("change", handleMotionChange);
      activeRef.current?.timeline.kill();
      activeRef.current = null;
      resetVisual();
      setLocked(false);
    };
  }, [resetVisual, setLocked]);

  return (
    <TransitionRouter auto leave={leave} enter={enter}>
      <div ref={contentRef}>{children}</div>
      <PageTransitionOverlay overlayRef={overlayRef} logoRef={logoRef} />
    </TransitionRouter>
  );
}
