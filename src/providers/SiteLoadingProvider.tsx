"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useSelectedLayoutSegments } from "next/navigation";
import type gsap from "gsap";
import { SiteLoadingOverlay } from "@/components/layout/page-loading/SiteLoadingOverlay";
import { nextPageFrame, preparePageMedia } from "@/components/layout/page-loading/preparePageMedia";

type Phase = "waiting" | "revealing" | "visible" | "error";
type Task = { ready: boolean; error: boolean };
type LoadingContext = {
  loading: boolean;
  fontsReady: boolean;
  canAnimate: boolean;
  register: (id: string) => () => void;
  settle: (id: string, error?: boolean) => void;
  markMounted: () => () => void;
  startEntrance: (start: () => void) => () => void;
};
const noop = () => {};
const Context = createContext<LoadingContext>({
  loading: false, fontsReady: true, canAnimate: true,
  register: () => noop, settle: noop, markMounted: () => noop,
  startEntrance: (start) => { start(); return noop; },
});
export const useSiteLoading = () => useContext(Context);
const BRAND_HOLD_MS = 500;
const RECOVERY_MS = 12000;

export function SiteLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segments = useSelectedLayoutSegments();
  // The root layout persists: capture the group and path once per document.
  const [entry] = useState(() => ({ public: segments[0] === "(site)", pathname }));
  const initialPublic = entry.public;
  const [phase, setPhase] = useState<Phase>(initialPublic ? "waiting" : "visible");
  const [failure, setFailure] = useState<string | null>(null);
  const [fontsReady, setFontsReady] = useState(!initialPublic);
  const [mounted, setMounted] = useState(0);
  const [revision, setRevision] = useState(0);
  const [preparedRevision, setPreparedRevision] = useState(-1);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tasks = useRef(new Map<string, Task>());
  const entrances = useRef(new Set<() => void>());
  const released = useRef(!initialPublic);
  const startedAt = useRef<number | null>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const gsapRef = useRef<typeof gsap | null>(null);
  const loading = initialPublic && phase !== "visible";

  const reportFailure = useCallback((stage: string, error: unknown) => {
    if (released.current) return;
    const detail = error instanceof Error ? error.name + ": " + error.message : String(error);
    const message = stage + " — " + detail;
    setFailure((previous) => previous ?? message);
    setPhase("error");
    if (process.env.NODE_ENV !== "production") console.error("[HomeLoading]", message, error);
  }, []);

  const changed = useCallback(() => setRevision((value) => value + 1), []);
  const register = useCallback((id: string) => {
    if (released.current) return noop;
    tasks.current.set(id, { ready: false, error: false });
    changed();
    return () => { tasks.current.delete(id); changed(); };
  }, [changed]);
  const settle = useCallback((id: string, error = false) => {
    const task = tasks.current.get(id);
    if (!task || task.ready) return;
    tasks.current.set(id, { ready: true, error });
    changed();
  }, [changed]);
  const markMounted = useCallback(() => {
    setMounted((count) => count + 1);
    return () => setMounted((count) => Math.max(0, count - 1));
  }, []);
  const startEntrance = useCallback((start: () => void) => {
    if (released.current) { start(); return noop; }
    entrances.current.add(start);
    return () => { entrances.current.delete(start); };
  }, []);
  const finish = useCallback(() => {
    if (released.current) return;
    released.current = true;
    timeline.current?.kill();
    timeline.current = null;
    setFontsReady(true);
    setPhase("visible");
    entrances.current.forEach((start) => start());
    entrances.current.clear();
    if (contentRef.current) contentRef.current.inert = false;
    if (overlayRef.current?.contains(document.activeElement)) {
      const heading = contentRef.current?.querySelector<HTMLElement>("main h1");
      if (heading) {
        if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    }
  }, []);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    content.inert = loading;
    if (loading) content.setAttribute("aria-busy", "true");
    else content.removeAttribute("aria-busy");
    if (!loading) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { content.inert = false; document.documentElement.style.overflow = previous; };
  }, [loading]);

  useEffect(() => {
    if (!initialPublic) return;
    startedAt.current ??= performance.now();
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (!released.current) reportFailure("Presupuesto de espera", new Error("Se alcanzaron 12 segundos de preparación Client."));
    }, RECOVERY_MS);
    // next/font uses generated family names; read its CSS variables.
    const sample = "SOKY Sushi Menú";
    const style = getComputedStyle(document.body);
    const fontRequests = [
      ["--font-outfit", 700], ["--font-lilita-one", 400], ["--font-kalam", 700],
      ["--font-anton", 400], ["--font-montserrat", 800], ["--font-nunito-sans", 700],
    ].map(([variable, weight]) => {
      // next/font also lists a local fallback; only preload the primary web font.
      const family = style.getPropertyValue(String(variable)).split(",")[0].trim();
      return family ? document.fonts.load(String(weight) + " 16px " + family, sample).catch((error: unknown) => {
        throw new Error("Fuente " + variable + ": " + (error instanceof Error ? error.message : String(error)));
      }) : Promise.resolve([]);
    });
    Promise.all([
      import("gsap").catch((error: unknown) => {
        throw new Error("Importación GSAP: " + (error instanceof Error ? error.message : String(error)));
      }), Promise.all(fontRequests), document.fonts.ready,
    ]).then(([module]) => {
      if (!cancelled) { gsapRef.current = module.default; setFontsReady(true); }
    })
      .catch((error: unknown) => { if (!cancelled) reportFailure("Fuentes / GSAP", error); });
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [initialPublic, reportFailure]);

  useEffect(() => {
    if (!loading || pathname === entry.pathname) return;
    finish();
  }, [entry.pathname, finish, loading, pathname]);

  useEffect(() => {
    if (!loading || !mounted || !fontsReady || phase !== "waiting") return;
    const root = contentRef.current?.querySelector<HTMLElement>("[data-site-loading-root]")
      ?? contentRef.current?.querySelector<HTMLElement>("main");
    if (!root) return;
    const controller = new AbortController();
    // A resize can change currentSrc, masks and media queries while covered.
    const resized = () => { changed(); };
    window.addEventListener("resize", resized);
    const observer = new MutationObserver(changed);
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "srcset", "sizes", "href"] });
    const cleanup = () => { controller.abort(); observer.disconnect(); window.removeEventListener("resize", resized); };
    // A page may stream related content after its primary HTML arrives.
    if (root.querySelector("[data-site-loading-pending]")) return cleanup;
    nextPageFrame(controller.signal)
      .then(() => preparePageMedia(root, controller.signal))
      .then(() => nextPageFrame(controller.signal))
      .then(() => nextPageFrame(controller.signal))
      .then(() => { if (!controller.signal.aborted) setPreparedRevision(revision); })
      .catch((error: unknown) => { if (!controller.signal.aborted) reportFailure("Media", error); });
    return cleanup;
  }, [changed, fontsReady, loading, mounted, phase, reportFailure, revision]);

  useEffect(() => {
    if (!loading || !mounted || !fontsReady || preparedRevision !== revision || phase !== "waiting") return;
    const pending = Array.from(tasks.current.values());
    if (pending.some((task) => task.error)) { reportFailure("Efectos", new Error("Una tarea GSAP falló durante la preparación.")); return; }
    if (pending.some((task) => !task.ready)) return;
    const timer = window.setTimeout(() => {
      setPhase("revealing");
    }, Math.max(0, BRAND_HOLD_MS - (performance.now() - (startedAt.current ?? performance.now()))));
    return () => window.clearTimeout(timer);
  }, [fontsReady, loading, mounted, phase, preparedRevision, reportFailure, revision]);

  useEffect(() => {
    if (phase !== "revealing") return;
    const overlay = overlayRef.current;
    const gsapApi = gsapRef.current;
    if (!overlay || !gsapApi) { finish(); return; }
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) { finish(); return; }
    overlay.dataset.revealing = "true";
    const columns = window.matchMedia("(max-width: 767px)").matches ? 8 : 16;
    const reveal = gsapApi.timeline({ onComplete: finish });
    timeline.current = reveal;
    reveal.to(overlay.querySelector("[data-loading-copy]"), { opacity: 0, duration: 0.08 }, 0);
    overlay.querySelectorAll<HTMLElement>("[data-loading-row]").forEach((row, index) => {
      reveal.to(Array.from(row.children).slice(0, columns), {
        scaleX: 0, duration: 0.32, ease: "power3.inOut",
        stagger: { each: 0.01, from: index % 2 === 0 ? "start" : "end" },
      }, 0);
    });
    const resized = () => {
      if (released.current) return;
      reveal.kill();
      gsapApi.set(overlay.querySelectorAll("[data-loading-block]"), { scaleX: 1 });
      gsapApi.set(overlay.querySelector("[data-loading-copy]"), { opacity: 1 });
      overlay.dataset.revealing = "false";
      setPreparedRevision(-1);
      changed();
      setPhase("waiting");
    };
    const root = contentRef.current?.querySelector<HTMLElement>("[data-site-loading-root]")
      ?? contentRef.current?.querySelector<HTMLElement>("main");
    const observer = new MutationObserver(resized);
    if (root) observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "srcset", "sizes", "href"] });
    window.addEventListener("resize", resized);
    const motionChanged = () => { if (motion.matches) finish(); };
    motion.addEventListener("change", motionChanged);
    return () => {
      reveal.kill();
      observer.disconnect();
      window.removeEventListener("resize", resized);
      motion.removeEventListener("change", motionChanged);
    };
  }, [changed, finish, phase]);

  const value = useMemo(() => ({ loading, fontsReady, canAnimate: !loading,
    register, settle, markMounted, startEntrance,
  }), [fontsReady, loading, markMounted, register, settle, startEntrance]);
  return (
    <Context.Provider value={value}>
      <div ref={contentRef}>{children}</div>
      {loading ? <SiteLoadingOverlay overlayRef={overlayRef} error={phase === "error"} errorDetail={failure ?? undefined} onContinue={finish} /> : null}
      <noscript><style>{".soky-site-loading{display:none!important}"}</style></noscript>
    </Context.Provider>
  );
}

export function SiteReadySignal({ ready = true }: { ready?: boolean }) {
  const { markMounted } = useSiteLoading();
  useEffect(() => { if (ready) return markMounted(); }, [markMounted, ready]);
  return null;
}
