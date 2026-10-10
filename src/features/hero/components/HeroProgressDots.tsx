"use client";

import { cn } from "@/lib/cn";
import { motion, useReducedMotion } from "motion/react";
import type { Transition } from "motion/react";
import { useState } from "react";

type HeroProgressDotsProps = {
  activeIndex: number;
  autoplayDurationMs: number;
  autoplayResetKey: number;
  count: number;
  isAutoplayRunning: boolean;
  onSelect: (index: number) => void;
};

const ADJACENT_STRETCH = 82 / 36;

const DOT_STEP_PX = 46;

const jumpTransition: Transition = {
  duration: 0.42,
  ease: [0.22, 1, 0.36, 1],
};

const reducedTrackTransition: Transition = {
  duration: 0,
};

const caterpillarTransition: Transition = {
  duration: 0.34,
  ease: [0.22, 1, 0.36, 1],
};

export function HeroProgressDots({
  activeIndex,
  autoplayDurationMs,
  autoplayResetKey,
  count,
  isAutoplayRunning,
  onSelect,
}: HeroProgressDotsProps) {
  const shouldReduceMotion = useReducedMotion();
  const [indexHistory, setIndexHistory] = useState(() => ({
    currentIndex: activeIndex,
    previousIndex: activeIndex,
  }));

  if (indexHistory.currentIndex !== activeIndex) {
    setIndexHistory({
      currentIndex: activeIndex,
      previousIndex: indexHistory.currentIndex,
    });
  }

  const previousIndex = indexHistory.previousIndex;
  const indexDelta = activeIndex - previousIndex;

  const movementDirection =
    indexDelta > 0 ? "forward" : indexDelta < 0 ? "backward" : "idle";

  const isAdjacentTransition = Math.abs(indexDelta) === 1;

  const isWrapTransition =
    (previousIndex === count - 1 && activeIndex === 0) ||
    (previousIndex === 0 && activeIndex === count - 1);

  const isLongJump = Math.abs(indexDelta) > 1 && !isWrapTransition;

  const jumpOffsetX = isLongJump ? -indexDelta * DOT_STEP_PX : 0;

  const progressAnimationKey = [
    activeIndex,
    autoplayResetKey,
    isAutoplayRunning ? "running" : "paused",
  ].join("-");

  const progressScale = shouldReduceMotion ? 1 : isAutoplayRunning ? 1 : 0;

  return (
    <nav
      aria-label="Slides del hero"
      className="inline-flex items-center gap-0.5 overflow-visible rounded-full border border-soky-white/15 bg-soky-navy/15 px-1 py-0.5 backdrop-blur-sm md:h-9 md:py-0 xl:h-auto xl:py-0.5"
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
              "group relative grid size-11 place-items-center rounded-full",
              "focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-soky-focus",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-soky-blue",
              isActive && "z-10",
            )}
            onClick={() => onSelect(index)}
          >
            {isActive ? (
              <motion.span
                key={`active-${previousIndex}-${activeIndex}`}
                aria-hidden="true"
                className="relative block h-2.5 w-9 rounded-full will-change-transform"
                initial={{
                  x: !shouldReduceMotion && isLongJump ? jumpOffsetX : 0,
                }}
                animate={{ x: 0 }}
                transition={
                  shouldReduceMotion ? reducedTrackTransition : jumpTransition
                }
              >
                <motion.span
                  key={`${previousIndex}-${activeIndex}`}
                  className={cn(
                    "absolute inset-0 rounded-full",
                    "border border-soky-white/80",
                    "bg-soky-orange/50",
                    movementDirection === "forward"
                      ? "origin-right"
                      : "origin-left",
                  )}
                  initial={{
                    scaleX:
                      !shouldReduceMotion && isAdjacentTransition
                        ? ADJACENT_STRETCH
                        : 1,
                  }}
                  animate={{ scaleX: 1 }}
                  transition={
                    shouldReduceMotion
                      ? reducedTrackTransition
                      : caterpillarTransition
                  }
                />

                <span className="absolute inset-0 overflow-hidden rounded-full border border-soky-white/70">
                  <motion.span
                    key={progressAnimationKey}
                    className="absolute inset-0 origin-left rounded-full bg-soky-orange"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: progressScale }}
                    transition={
                      shouldReduceMotion || !isAutoplayRunning
                        ? reducedTrackTransition
                        : {
                            duration: autoplayDurationMs / 1000,
                            ease: "linear",
                          }
                    }
                  />
                </span>
              </motion.span>
            ) : (
              <span
                aria-hidden="true"
                className="block size-2.5 rounded-full border border-soky-white/75 bg-transparent transition-colors duration-200 group-hover:border-soky-orange group-hover:bg-soky-white/10"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
