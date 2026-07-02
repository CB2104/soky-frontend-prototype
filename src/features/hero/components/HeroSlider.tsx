"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Transition } from "motion/react";
import { WaveDivider } from "@/components/ui/wave-divider";
import type { HeroSlideViewModel } from "../types";
import { HeroSlideRenderer, isRenderableHeroSlide } from "./HeroSlideRenderer";
import { HeroSliderControls } from "./HeroSliderControls";

type HeroSliderProps = {
  fallbackDescription: string;
  slides: HeroSlideViewModel[];
  whatsappUrl: string;
};

const trackTransition: Transition = {
  type: "tween",
  duration: 0.58,
  ease: [0.22, 1, 0.36, 1],
};

const reducedTrackTransition: Transition = {
  duration: 0,
};

function getSafeIndex(index: number, slideCount: number) {
  return ((index % slideCount) + slideCount) % slideCount;
}

function getClampedIndex(index: number, slideCount: number) {
  return Math.min(Math.max(index, 0), slideCount - 1);
}

export function HeroSlider({
  fallbackDescription,
  slides,
  whatsappUrl,
}: HeroSliderProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const renderableSlides = slides.filter(isRenderableHeroSlide);
  const slideCount = renderableSlides.length;

  if (slideCount === 0) {
    return (
      <HeroSlideRenderer
        fallbackDescription={fallbackDescription}
        isInitialSlide
        slide={undefined}
        whatsappUrl={whatsappUrl}
      />
    );
  }

  const boundedActiveIndex = getSafeIndex(activeIndex, slideCount);

  const goToPrevious = () => {
    setActiveIndex((currentIndex) => {
      const safeIndex = getSafeIndex(currentIndex, slideCount);

      return safeIndex === 0 ? slideCount - 1 : safeIndex - 1;
    });
  };

  const goToNext = () => {
    setActiveIndex((currentIndex) => {
      const safeIndex = getSafeIndex(currentIndex, slideCount);

      return safeIndex === slideCount - 1 ? 0 : safeIndex + 1;
    });
  };

  const goToSlide = (index: number) => {
    setActiveIndex(getClampedIndex(index, slideCount));
  };

  return (
    <section
      aria-label="Promociones principales"
      aria-roledescription="carousel"
      className="relative isolate w-full min-w-0 max-w-full overflow-hidden"
      data-contact-speed-dial-hidden-zone
      role="region"
    >
      <div className="relative h-[calc(100svh-5rem)] w-full min-w-0 max-w-full overflow-hidden md:h-auto md:min-h-[calc(100svh-4.5rem)]">
        <motion.div
          animate={{ x: `-${boundedActiveIndex * 100}%` }}
          className="flex h-full w-full min-w-0 max-w-full will-change-transform md:h-auto"
          initial={false}
          transition={
            shouldReduceMotion ? reducedTrackTransition : trackTransition
          }
        >
          {renderableSlides.map((slide, index) => {
            const isActive = index === boundedActiveIndex;
            const isInitialSlide = index === 0;

            return (
              <div
                key={slide.id}
                aria-hidden={isActive ? undefined : true}
                className="relative h-full w-full min-w-0 max-w-full flex-none basis-full shrink-0 overflow-hidden md:h-auto"
                inert={isActive ? undefined : true}
              >
                <HeroSlideRenderer
                  className="h-full md:h-auto"
                  fallbackDescription={fallbackDescription}
                  isInitialSlide={isInitialSlide}
                  showWaveDivider={false}
                  slide={slide}
                  whatsappUrl={whatsappUrl}
                />
              </div>
            );
          })}
        </motion.div>

        {slideCount > 1 ? (
          <HeroSliderControls
            activeIndex={boundedActiveIndex}
            count={slideCount}
            onNext={goToNext}
            onPrevious={goToPrevious}
            onSelect={goToSlide}
          />
        ) : null}
      </div>

      <WaveDivider tone="paper" />
    </section>
  );
}
