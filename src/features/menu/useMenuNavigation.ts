"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { MenuSection } from "./menu-sections";
import { menuAnchorId } from "./menu-sections";

export function useMenuNavigation(
  sections: readonly MenuSection[],
  initialDestination: string,
) {
  const catalogRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [activeSlug, setActiveSlug] = useState("all");

  useEffect(() => {
    const root = catalogRef.current;
    const nav = navRef.current;
    if (!root || !nav) return;
    const catalog = root;
    const navigation = nav;

    let frame = 0;

    function update() {
      frame = 0;
      const line = (Number.parseFloat(getComputedStyle(navigation).top) || 0)
        + navigation.offsetHeight
        + 16;
      let current = "all";

      for (const section of sections) {
        const node = document.getElementById(menuAnchorId(section.slug));
        if (node && catalog.contains(node) && node.getBoundingClientRect().top <= line) {
          current = section.slug;
        }
      }

      setActiveSlug((previous) => previous === current ? previous : current);
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    const historyState = window.history.state ?? {};

    if (!historyState.sokyMenuVisited) {
      let hash = "";
      try {
        hash = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        // Hash inválido: se usa la categoría solicitada.
      }

      const hashNode = hash ? document.getElementById(hash) : null;
      const destination = hashNode && catalog.contains(hashNode)
        ? hashNode
        : initialDestination !== "menu-start"
          ? document.getElementById(initialDestination)
          : null;

      if (destination && catalog.contains(destination)) {
        destination.scrollIntoView({ behavior: "instant", block: "start" });
      }

      window.history.replaceState(
        { ...historyState, sokyMenuVisited: true },
        "",
      );
    }

    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(navigation);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("popstate", schedule);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("popstate", schedule);
    };
  }, [sections, initialDestination]);

  function navigate(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (
      event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) return;

    const node = document.getElementById(id);
    if (!node || !catalogRef.current?.contains(node)) return;

    event.preventDefault();
    const hash = "#" + encodeURIComponent(id);
    if (window.location.hash !== hash) {
      window.history.pushState(
        { ...window.history.state, sokyMenuVisited: true },
        "",
        hash,
      );
    }

    node.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return { catalogRef, navRef, activeSlug, navigate };
}
