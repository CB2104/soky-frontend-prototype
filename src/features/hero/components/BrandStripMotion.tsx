"use client";

import { useGSAP } from "@gsap/react";
import { useHomeGSAP } from "@/features/home/loading/useHomeGSAP";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { gsap } from "gsap";
import type { ReactNode } from "react";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, MotionPathPlugin);

type BrandStripProfile = "mobilePortrait" | "mobileLandscape" | "tablet" | "desktop";
type RibbonId = "blue" | "orange";

type ProfileSettings = {
  blueDuration: number;
  orangeDuration: number;
  minimumGap: number;
};

const profileSettings: Record<BrandStripProfile, ProfileSettings> = {
  mobilePortrait: { blueDuration: 22, orangeDuration: 24, minimumGap: 12 },
  mobileLandscape: { blueDuration: 24, orangeDuration: 26, minimumGap: 16 },
  tablet: { blueDuration: 26, orangeDuration: 28, minimumGap: 22 },
  desktop: { blueDuration: 30, orangeDuration: 32, minimumGap: 28 },
};

const profileQueries: Record<BrandStripProfile, string> = {
  mobilePortrait: "(max-width: 639px) and (orientation: portrait)",
  mobileLandscape: "(max-width: 1023px) and (orientation: landscape)",
  tablet: "(min-width: 640px) and (max-width: 1023px) and (orientation: portrait)",
  desktop: "(min-width: 1024px)",
};

const svgViewBoxWidths: Record<BrandStripProfile, number> = {
  mobilePortrait: 480,
  mobileLandscape: 1600,
  tablet: 1600,
  desktop: 1600,
};

const crossingRegions: Record<BrandStripProfile, { left: number; right: number }> = {
  mobilePortrait: { left: 0.92, right: 0.03 },
  mobileLandscape: { left: 0.56, right: 0.24 },
  tablet: { left: 0.56, right: 0.24 },
  desktop: { left: 0.56, right: 0.24 },
};

type StaticItemPlacement = { x: number; y: number; rotation: number };

const reducedMotionPlacements: Record<
  BrandStripProfile,
  Record<RibbonId, readonly [StaticItemPlacement, StaticItemPlacement]>
> = {
  mobilePortrait: {
    blue: [
      { x: 0.26, y: 0.86, rotation: 4 },
      { x: 0.74, y: 0.79, rotation: -15 },
    ],
    orange: [
      { x: 0.27, y: 0.2, rotation: 3 },
      { x: 0.72, y: 0.34, rotation: 18 },
    ],
  },
  mobileLandscape: {
    blue: [
      { x: 0.18, y: 0.8, rotation: 6 },
      { x: 0.8, y: 0.37, rotation: -20 },
    ],
    orange: [
      { x: 0.46, y: 0.51, rotation: 19 },
      { x: 0.7, y: 0.74, rotation: 18 },
    ],
  },
  tablet: {
    blue: [
      { x: 0.2, y: 0.79, rotation: 5 },
      { x: 0.8, y: 0.4, rotation: -20 },
    ],
    orange: [
      { x: 0.44, y: 0.53, rotation: 19 },
      { x: 0.7, y: 0.74, rotation: 18 },
    ],
  },
  desktop: {
    blue: [
      { x: 0.75, y: 0.62, rotation: 5 },
      { x: 0.86, y: 0.36, rotation: -20 },
    ],
    orange: [
      { x: 0.25, y: 0.26, rotation: 10 },
      { x: 0.65, y: 0.74, rotation: 18 },
    ],
  },
};

const minimumVisibleMargin = 12;

function BrandStripMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useHomeGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const debugEnabled =
        process.env.NODE_ENV !== "production" &&
        new URLSearchParams(window.location.search).get("brandStripDebug") ===
          "1";

      root.dataset.brandStripDebug = debugEnabled ? "true" : "false";

      const media = gsap.matchMedia();
      media.add(
        {
          ...profileQueries,
          reducedMotion: "(prefers-reduced-motion: reduce)",
        },
        (mediaContext) => {
          const conditions = mediaContext.conditions as
            | (Record<BrandStripProfile, boolean> & { reducedMotion?: boolean })
            | undefined;
          const profile = (Object.keys(profileQueries) as BrandStripProfile[]).find(
            (key) => conditions?.[key],
          );
          const stage = root.querySelector<HTMLElement>(".brand-strip-stage");
          const viewport = root.querySelector<HTMLElement>(
            ".brand-strip-section__inner",
          );
          const coordinateSystem =
            profile === "mobilePortrait" ? "mobile" : "desktop";
          const debugSvg = root.querySelector<SVGSVGElement>(
            `.brand-strip-motion-debug[data-brand-strip-motion-coordinate-system="${coordinateSystem}"]`,
          );

          if (!profile || !stage || !viewport || !debugSvg) return;

          const settings = profileSettings[profile];
          const reducedMotion = Boolean(conditions?.reducedMotion);
          root.dataset.brandStripActiveProfile = profile;
          root.dataset.brandStripReducedMotion = String(reducedMotion);

          let buildContext: gsap.Context | null = null;
          let visibilityObserver: IntersectionObserver | null = null;
          let crossingObserver: IntersectionObserver | null = null;
          let resizeFrame = 0;
          let resizeObserver: ResizeObserver | null = null;

          const pointerStates = new Map<
            HTMLOListElement,
            {
              pointer: boolean;
              focus: boolean;
              sync: () => void;
              syncLinks: () => void;
              syncCrossing: () => void;
            }
          >();

          const build = () => {
            visibilityObserver?.disconnect();
            crossingObserver?.disconnect();
            root
              .querySelectorAll<HTMLElement>(".brand-strip-conveyor-item--crossing")
              .forEach((item) => item.classList.remove("brand-strip-conveyor-item--crossing"));
            buildContext?.revert();
            buildContext = gsap.context(() => {
              const stageRect = stage.getBoundingClientRect();
              const viewportRect = viewport.getBoundingClientRect();
              if (!stageRect.width || !stageRect.height) return;

              const scaleX = stageRect.width / svgViewBoxWidths[profile];
              const minGapUnits = settings.minimumGap / scaleX;
              const tracks = Array.from(
                root.querySelectorAll<HTMLOListElement>(
                  "[data-brand-strip-conveyor]",
                ),
              );
              const linkVisibility = new Map<HTMLAnchorElement, boolean>();
              const crossingItems = new Map<HTMLElement, boolean>();
              const refreshLink = (link: HTMLAnchorElement) => {
                const focusable =
                  (linkVisibility.get(link) === true &&
                    !link.closest(".brand-strip-conveyor-item--crossing")) ||
                  document.activeElement === link;
                const nextIndex = focusable ? 0 : -1;
                if (link.tabIndex !== nextIndex) link.tabIndex = nextIndex;
              };
              visibilityObserver = new IntersectionObserver(
                (entries) => {
                  entries.forEach((entry) => {
                    const link = entry.target as HTMLAnchorElement;
                    const fullyVisible = entry.intersectionRatio >= 0.999;
                    linkVisibility.set(link, fullyVisible);
                    refreshLink(link);
                  });
                },
                {
                  root: viewport,
                  rootMargin:
                    profile === "mobilePortrait"
                      ? "0px"
                      : `-${minimumVisibleMargin}px`,
                  threshold: [0, 1],
                },
              );
              if (profile !== "mobilePortrait") {
                crossingObserver = new IntersectionObserver(
                  (entries) => {
                    entries.forEach((entry) => {
                      const link = entry.target as HTMLAnchorElement;
                      const item = link.closest<HTMLElement>(
                        "[data-brand-strip-conveyor-item]",
                      );
                      if (!item) return;
                      crossingItems.set(item, entry.isIntersecting);
                      item.classList.toggle(
                        "brand-strip-conveyor-item--crossing",
                        entry.isIntersecting && !item.contains(document.activeElement),
                      );
                      refreshLink(link);
                    });
                  },
                  {
                    root: stage,
                    rootMargin: `0px -${stageRect.width * crossingRegions[profile].right}px 0px -${stageRect.width * crossingRegions[profile].left}px`,
                    threshold: 0,
                  },
                );
              }

              tracks.forEach((track) => {
                const ribbon = track.dataset.brandStripConveyor as RibbonId;
                const path = debugSvg.querySelector<SVGPathElement>(
                  `[data-brand-strip-motion-path="${ribbon}"][data-brand-strip-motion-profile="${profile}"]`,
                );
                const allItems = Array.from(
                  track.querySelectorAll<HTMLElement>(
                    "[data-brand-strip-conveyor-item]",
                  ),
                );

                if (!path || !allItems.length) return;

                gsap.set(track, { display: "block" });
                gsap.set(allItems, {
                  display: "flex",
                  position: "absolute",
                  left: 0,
                  top: 0,
                  visibility: "hidden",
                });

                const pathLength = path.getTotalLength();
                const widths = allItems.map(
                  (item) => item.getBoundingClientRect().width / scaleX,
                );
                const maxItems = Math.min(allItems.length, 12);
                let activeCount = reducedMotion
                  ? 2
                  : maxItems - (maxItems % 2);

                while (activeCount > 2) {
                  const totalWidth = widths
                    .slice(0, activeCount)
                    .reduce((sum, width) => sum + width, 0);
                  if (totalWidth + activeCount * minGapUnits <= pathLength) {
                    break;
                  }
                  activeCount -= 2;
                }

                const totalWidth = widths
                  .slice(0, activeCount)
                  .reduce((sum, width) => sum + width, 0);
                const gap = Math.max(
                  minGapUnits,
                  (pathLength - totalWidth) / activeCount,
                );
                // Keep the two keyboard-reachable originals on opposite parts of
                // the loop; exchange only with a clone of the same category.
                const secondCanonicalSlot = Math.min(
                  activeCount - 1,
                  2 * Math.floor(activeCount / 4) + 1,
                );

                let nextCenter = widths[0] / 2 + gap / 2;
                const itemPositions: number[] = [];

                for (let index = 0; index < activeCount; index += 1) {
                  const width = widths[index];
                  itemPositions.push(nextCenter);
                  nextCenter += width / 2 + gap + widths[index + 1] / 2;
                }

                const links = allItems
                  .slice(0, 2)
                  .map((item) => item.querySelector<HTMLAnchorElement>("[data-brand-strip-cta]"))
                  .filter((link): link is HTMLAnchorElement => Boolean(link));

                const itemTweens: gsap.core.Tween[] = [];
                allItems.forEach((item, index) => {
                  const isActive = index < activeCount;
                  gsap.set(item, {
                    display: isActive ? "flex" : "none",
                    visibility: isActive ? "visible" : "hidden",
                  });

                  if (!isActive) return;

                  const slot =
                    index === 1
                      ? secondCanonicalSlot
                      : index === secondCanonicalSlot
                        ? 1
                        : index;
                  const itemOffset = itemPositions[slot] / pathLength;

                  if (reducedMotion) {
                    const placement = reducedMotionPlacements[profile][ribbon][index];
                    const itemRect = item.getBoundingClientRect();
                    const centerX = viewportRect.left + viewportRect.width * placement.x;
                    const stageOffsetY =
                      stageRect.top +
                      stageRect.height / 2 -
                      (viewportRect.top + viewportRect.height / 2);
                    const centerY =
                      viewportRect.top +
                      viewportRect.height * placement.y +
                      stageOffsetY;

                    gsap.set(item, {
                      x: centerX - stageRect.left - itemRect.width / 2,
                      y: centerY - stageRect.top - itemRect.height / 2,
                      rotation: placement.rotation,
                    });
                    return;
                  }

                  const itemTween = gsap.to(item, {
                    duration:
                      ribbon === "blue"
                        ? settings.blueDuration
                        : settings.orangeDuration,
                    ease: "none",
                    repeat: -1,
                    paused: true,
                    motionPath: {
                      path,
                      align: path,
                      alignOrigin: [0.5, 0.5],
                      autoRotate: true,
                      start: itemOffset,
                      end: itemOffset + 1,
                    },
                  });
                  itemTween.progress(0).pause();
                  itemTweens.push(itemTween);
                });

                links.forEach((link) => visibilityObserver?.observe(link));
                if (ribbon === "blue") {
                  allItems.slice(0, activeCount).forEach((item) => {
                    const link = item.querySelector<HTMLAnchorElement>(
                      ".brand-strip-category-cta",
                    );
                    if (link) crossingObserver?.observe(link);
                  });
                }

                const state = pointerStates.get(track);
                if (state) {
                  state.sync = () => {
                    if (state.pointer || state.focus || reducedMotion) {
                      itemTweens.forEach((tween) => tween.pause());
                    } else {
                      itemTweens.forEach((tween) => tween.play());
                    }
                  };
                  state.syncLinks = () => {
                    links.forEach(refreshLink);
                  };
                  state.syncCrossing = () => {
                    if (ribbon !== "blue") return;
                    allItems.slice(0, activeCount).forEach((item) => {
                      item.classList.toggle(
                        "brand-strip-conveyor-item--crossing",
                        crossingItems.get(item) === true &&
                          !item.contains(document.activeElement),
                      );
                    });
                    links.forEach(refreshLink);
                  };
                  state.sync();
                }
              });

              if (debugEnabled) {
                debugSvg
                  .querySelectorAll<SVGGElement>(
                    `[data-brand-strip-motion-profile="${profile}"][data-progress]`,
                  )
                  .forEach((marker) => {
                    const ribbon = marker.dataset.brandStripMotionMarker as RibbonId;
                    const path = debugSvg.querySelector<SVGPathElement>(
                      `[data-brand-strip-motion-path="${ribbon}"][data-brand-strip-motion-profile="${profile}"]`,
                    );
                    if (!path) return;

                    const markerTween = gsap.to(marker, {
                      duration: 1,
                      paused: true,
                      motionPath: {
                        path,
                        align: path,
                        alignOrigin: [0.5, 0.5],
                        autoRotate: true,
                      },
                    });
                    markerTween.progress(Number(marker.dataset.progress));
                  });
              }
            }, root);
          };

          const onPointerEnter = (event: Event) => {
            const track = event.currentTarget as HTMLOListElement;
            const state = pointerStates.get(track);
            if (state) {
              state.pointer = true;
              state.sync();
            }
          };
          const onPointerLeave = (event: Event) => {
            const track = event.currentTarget as HTMLOListElement;
            const state = pointerStates.get(track);
            if (state) {
              state.pointer = false;
              state.sync();
            }
          };
          const onFocusIn = (event: Event) => {
            const track = event.currentTarget as HTMLOListElement;
            const state = pointerStates.get(track);
            if (state) {
              state.focus = true;
              state.sync();
              state.syncCrossing();
            }
          };
          const onFocusOut = (event: FocusEvent) => {
            const track = event.currentTarget as HTMLOListElement;
            requestAnimationFrame(() => {
              const state = pointerStates.get(track);
              if (state) {
                state.focus = track.contains(document.activeElement);
                state.sync();
                state.syncCrossing();
                state.syncLinks();
              }
            });
          };

          root
            .querySelectorAll<HTMLOListElement>("[data-brand-strip-conveyor]")
            .forEach((track) => {
              const state = {
                pointer: false,
                focus: false,
                sync: () => undefined,
                syncLinks: () => undefined,
                syncCrossing: () => undefined,
              };
              pointerStates.set(track, state);
              track.addEventListener("pointerenter", onPointerEnter);
              track.addEventListener("pointerleave", onPointerLeave);
              track.addEventListener("focusin", onFocusIn);
              track.addEventListener("focusout", onFocusOut);
            });

          const scheduleBuild = () => {
            cancelAnimationFrame(resizeFrame);
            resizeFrame = requestAnimationFrame(build);
          };

          build();
          resizeObserver = new ResizeObserver(scheduleBuild);
          resizeObserver.observe(stage);

          return () => {
            cancelAnimationFrame(resizeFrame);
            resizeObserver?.disconnect();
            visibilityObserver?.disconnect();
            crossingObserver?.disconnect();
            buildContext?.revert();
            root.removeAttribute("data-brand-strip-active-profile");
            root.removeAttribute("data-brand-strip-reduced-motion");
            root
              .querySelectorAll<HTMLOListElement>("[data-brand-strip-conveyor]")
              .forEach((track) => {
                track
                  .querySelectorAll<HTMLElement>(".brand-strip-conveyor-item--crossing")
                  .forEach((item) => item.classList.remove("brand-strip-conveyor-item--crossing"));
                track.removeEventListener("pointerenter", onPointerEnter);
                track.removeEventListener("pointerleave", onPointerLeave);
                track.removeEventListener("focusin", onFocusIn);
                track.removeEventListener("focusout", onFocusOut);
                track
                  .querySelectorAll<HTMLAnchorElement>("[data-brand-strip-cta]")
                  .forEach((link) => {
                    link.tabIndex = -1;
                  });
              });
          };
        },
      );

      return () => {
        media.revert();
        root.removeAttribute("data-brand-strip-debug");
        root.removeAttribute("data-brand-strip-active-profile");
      };
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="brand-strip-motion-root">
      {children}
    </div>
  );
}

export { BrandStripMotion };
