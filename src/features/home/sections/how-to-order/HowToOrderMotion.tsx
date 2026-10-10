"use client";

import {
  useAnimate,
  useInView,
  useReducedMotion,
  type AnimationSequence,
} from "motion/react";
import { useEffect, type ReactNode } from "react";

export function HowToOrderMotion({ children }: { children: ReactNode }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const isInView = useInView(scope, { amount: "some" });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const root = scope.current;
    if (!root || !isInView || prefersReducedMotion !== false) return;

    let playback: ReturnType<typeof animate> | undefined;
    const tablet = window.matchMedia("(min-width: 640px)");
    const desktop = window.matchMedia("(min-width: 1024px)");

    const reset = () => {
      playback?.cancel();
      playback = undefined;
      root
        .querySelectorAll<HTMLElement>("[data-order-image], [data-order-arrow]")
        .forEach((element) => {
          element.style.removeProperty("transform");
          element.style.removeProperty("opacity");
        });
    };

    const start = () => {
      reset();
      if (document.hidden) return;

      const sequence: AnimationSequence = [];
      let cursor = 0;

      root.querySelectorAll<HTMLElement>("[data-order-step]").forEach((step) => {
        const image = step.querySelector<HTMLElement>("[data-order-image]");
        const arrow = step.querySelector<HTMLElement>("[data-order-arrow]");

        if (image) {
          sequence.push([
            image,
            { scale: [1, 1.035, 1, 1.02, 1] },
            {
              at: cursor,
              duration: 0.65,
              times: [0, 0.25, 0.5, 0.75, 1],
              ease: "easeInOut",
            },
          ]);
          cursor += 0.65;
        }

        if (arrow && arrow.getClientRects().length > 0) {
          sequence.push([
            arrow,
            { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] },
            { at: cursor, duration: 0.25, ease: "easeInOut" },
          ]);
          cursor += 0.25;
        }
      });

      if (sequence.length > 0) {
        playback = animate(sequence, { repeat: Infinity, repeatDelay: 1.2 });
      }
    };

    start();
    tablet.addEventListener("change", start);
    desktop.addEventListener("change", start);
    document.addEventListener("visibilitychange", start);

    return () => {
      tablet.removeEventListener("change", start);
      desktop.removeEventListener("change", start);
      document.removeEventListener("visibilitychange", start);
      reset();
    };
  }, [animate, isInView, prefersReducedMotion, scope]);

  return <div ref={scope}>{children}</div>;
}
