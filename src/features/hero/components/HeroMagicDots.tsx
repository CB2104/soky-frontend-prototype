"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

type HeroMagicDotsProps = {
  activeIndex: number;
  count: number;
  onSelect: (index: number) => void;
};

const activeDotTransition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
} as const;

const reducedActiveDotTransition = {
  duration: 0,
} as const;

export function HeroMagicDots({
  activeIndex,
  count,
  onSelect,
}: HeroMagicDotsProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <nav
      aria-label="Slides del hero"
      className="inline-flex min-h-10 items-center gap-0 rounded-full border border-soky-white/35 bg-soky-navy/50 px-1 py-0.5 shadow-[0_8px_18px_rgb(7_5_74_/_0.18)] md:min-h-12 md:gap-0.5 md:px-1.5 md:py-1 md:shadow-[0_10px_24px_rgb(7_5_74_/_0.2)]"
    >
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === activeIndex;

        return (
          <button
            key={index}
            type="button"
            aria-current={isActive ? "page" : undefined}
            aria-label={
              isActive
                ? `Slide ${index + 1} de ${count} activo`
                : `Ver slide ${index + 1} de ${count}`
            }
            className={cn(
              "relative grid size-10 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2 focus-visible:ring-offset-soky-blue md:size-11",
              isActive ? "cursor-default" : "hover:bg-soky-white/12",
            )}
            onClick={() => onSelect(index)}
          >
            {isActive ? (
              <motion.span
                aria-hidden="true"
                layoutId="hero-slider-active-dot"
                className="absolute inset-x-2 top-1/2 h-5 -translate-y-1/2 rounded-full bg-soky-orange shadow-[0_4px_12px_rgb(239_91_36_/_0.35)] md:h-6"
                transition={
                  shouldReduceMotion
                    ? reducedActiveDotTransition
                    : activeDotTransition
                }
              />
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 block rounded-full border transition-[background-color,border-color,transform] duration-200",
                isActive
                  ? "size-2 border-soky-white bg-soky-white md:size-2.5"
                  : "size-2 border-soky-white/75 bg-soky-white/30 md:size-2.5",
              )}
            />
          </button>
        );
      })}
    </nav>
  );
}
