"use client";

import { useGSAP } from "@gsap/react";
import { useHomeGSAP } from "@/features/home/loading/useHomeGSAP";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP);

type Entrance = {
  timeline: gsap.core.Timeline;
  trigger?: ScrollTrigger;
  groups: string[];
  targets: HTMLElement[];
};

export function LocationMotion() {
  useHomeGSAP(() => {
    const section = document.getElementById("ubicacion");
    if (!section) return;

    gsap.registerPlugin(ScrollTrigger);
    const seen = new Set<string>();
    const media = gsap.matchMedia(section);
    let entrances: Entrance[] = [];

    const clear = (targets: HTMLElement[]) => {
      gsap.set(targets, { clearProps: "opacity,visibility,transform" });
    };
    const complete = (entrance: Entrance) => {
      entrance.groups.forEach((group) => seen.add(group));
      entrance.trigger?.kill();
      entrance.timeline.progress(1).pause();
      clear(entrance.targets);
    };
    const finishAll = () => {
      seen.add("information");
      seen.add("visit");
      entrances.forEach(complete);
      clear(Array.from(section.querySelectorAll<HTMLElement>("[data-location-motion]")));
    };
    const atLocationHash = () => window.location.hash === "#ubicacion";
    const onHashChange = () => {
      if (atLocationHash()) finishAll();
    };
    const onAnchorClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin === window.location.origin &&
          destination.pathname === window.location.pathname &&
          destination.hash === "#ubicacion") finishAll();
    };
    const onPointerOver = (event: PointerEvent) => {
      if (event.target instanceof Element &&
          event.target.closest('[data-location-motion="action"]')) finishAll();
    };
    const onResize = () => {
      entrances.filter((entrance) => entrance.timeline.isActive()).forEach(complete);
    };

    section.addEventListener("focusin", finishAll);
    section.addEventListener("pointerover", onPointerOver);
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("resize", onResize);
    document.addEventListener("click", onAnchorClick, true);

    media.add({
      all: "all",
      portrait: "(max-width: 1100px) and (orientation: portrait)",
      compact: "(max-height: 550px) and (orientation: landscape), (max-width: 1100px) and (max-height: 600px) and (orientation: landscape)",
      reduced: "(prefers-reduced-motion: reduce)",
    }, (context) => {
      const { portrait, compact, reduced } = context.conditions!;
      entrances = [];
      const allTargets = Array.from(
        section.querySelectorAll<HTMLElement>("[data-location-motion]"),
      );

      if (reduced || atLocationHash() || section.contains(document.activeElement)) {
        finishAll();
        return;
      }

      const createEntrance = (root: HTMLElement, groups: string[]) => {
        if (groups.every((group) => seen.has(group))) return;
        const targets = Array.from(
          root.querySelectorAll<HTMLElement>("[data-location-motion]"),
        ).filter((element) => {
          const panel = element.closest<HTMLElement>("[data-location-panel]");
          return element.getBoundingClientRect().height > 0 &&
            !seen.has(panel?.dataset.locationPanel ?? "");
        });
        const select = (role: string) =>
          targets.filter((element) => element.dataset.locationMotion === role);
        const actions = select("action");
        const content = targets.filter((element) => !actions.includes(element));
        const pace = compact ? 0.8 : 1;
        const timeline = gsap.timeline({
          paused: true,
          defaults: { ease: "power3.out", immediateRender: false },
          onComplete: () => clear(targets),
        });

        // Prepare only when the entrance plays; server HTML stays visible beforehand.
        timeline.set(content, { opacity: 0, immediateRender: false }, 0);
        const rise = (role: string, distance: number, duration: number, start: number, stagger = 0) => {
          const elements = select(role);
          if (!elements.length) return;
          timeline.fromTo(elements,
            { opacity: 0, y: compact ? distance / 2 : distance },
            { opacity: 1, y: 0, duration: duration * pace, stagger: stagger * pace },
            start * pace,
          );
        };
        rise("eyebrow", 10, 0.3, 0);
        rise("title-line", 20, 0.6, 0.08, 0.07);
        rise("description", 12, 0.45, 0.22);
        rise("information", 12, 0.45, 0.24);
        rise("map", 12, 0.55, 0.35);
        if (actions.length) {
          timeline.fromTo(actions,
            { y: compact ? 2 : 4 },
            { y: 0, duration: 0.25 * pace },
            0.55 * pace,
          );
        }

        const entrance: Entrance = { timeline, groups, targets };
        entrances.push(entrance);
        entrance.trigger = ScrollTrigger.create({
          trigger: root,
          start: "top 85%",
          end: "bottom top",
          once: true,
          onEnter: () => {
            if (atLocationHash() || section.contains(document.activeElement)) {
              finishAll();
            } else if (!groups.every((group) => seen.has(group))) {
              groups.forEach((group) => seen.add(group));
              timeline.play(0);
            }
          },
          onLeave: () => {
            if (groups.some((group) => seen.has(group))) complete(entrance);
          },
        });
      };

      if (portrait) {
        section.querySelectorAll<HTMLElement>("[data-location-panel]").forEach((panel) => {
          createEntrance(panel, [panel.dataset.locationPanel!]);
        });
      } else {
        createEntrance(section, ["information", "visit"]);
      }

      return () => {
        entrances.forEach((entrance) => entrance.trigger?.kill());
        clear(allTargets);
        entrances = [];
      };
    });

    return () => {
      media.revert();
      section.removeEventListener("focusin", finishAll);
      section.removeEventListener("pointerover", onPointerOver);
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("click", onAnchorClick, true);
    };
  });

  return null;
}
