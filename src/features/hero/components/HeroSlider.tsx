"use client";

import { useHomeLoading } from "@/features/home/loading/HomeLoadingBoundary";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  FocusEvent,
  KeyboardEvent,
  PointerEvent,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Transition } from "motion/react";
import type { HeroSlideViewModel } from "../types";
import { HeroBackgroundLayers } from "./HeroBackgroundLayers";
import { HeroFullCanvasLayer } from "./HeroFullCanvasLayer";
import { HeroMediaRotator } from "./HeroMediaRotator";
import { HeroSlideRenderer, isRenderableHeroSlide } from "./HeroSlideRenderer";
import { HeroSliderControls } from "./HeroSliderControls";
import MainHeroBackground from "./MainHeroBackground";
import { cn } from "@/lib/cn";
import { MostOrderedHeroBackgroundAccents } from "./MostOrderedHeroBackgroundAccents";
import welcomeStyles from "./WelcomeSplitHero.module.css";

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

const HERO_SLIDER_AUTOPLAY_DELAY_MS = 7000;

const HERO_PATTERN_ASSETS = {
  "endless-clouds-light": "/images/patterns/endless-clouds-light.svg",
} as const;

const HERO_SWIPE_DISTANCE_PX = 48;
const HERO_SWIPE_FAST_DISTANCE_PX = 24;
const HERO_SWIPE_VELOCITY_PX_PER_MS = 0.35;
const HERO_SWIPE_AXIS_RATIO = 1.2;

const patternBackgroundSize: Record<
  NonNullable<NonNullable<HeroSlideViewModel["patternOverlay"]>["size"]>,
  string
> = {
  auto: "auto",
  cover: "cover",
  contain: "contain",
  repeat: "clamp(96px, 7vw, 144px) auto",
};

function getPatternOverlayStyle(
  patternOverlay: NonNullable<HeroSlideViewModel["patternOverlay"]>,
): CSSProperties {
  const size = patternOverlay.size ?? "auto";

  return {
    backgroundImage: `url(${HERO_PATTERN_ASSETS[patternOverlay.assetKey]})`,
    backgroundSize: patternBackgroundSize[size],
    backgroundPosition: patternOverlay.position ?? "center",
    backgroundRepeat: size === "repeat" ? "repeat" : "no-repeat",
    mixBlendMode: patternOverlay.blendMode ?? "normal",
    opacity: patternOverlay.opacity ?? 1,
  };
}

type HeroProductLayer = NonNullable<HeroSlideViewModel["productLayer"]>;

function HeroProductLayerImage({
  className,
  isActive,
  priority = false,
  productLayer,
}: {
  className?: string;
  isActive: boolean;
  priority?: boolean;
  productLayer: HeroProductLayer;
}) {
  const isHiddenFromAccessibility = productLayer.decorative || !isActive;

  return (
    <div
      aria-hidden={isHiddenFromAccessibility ? "true" : undefined}
      className={cn(
        "pointer-events-none absolute inset-0 z-2 select-none",
        className,
      )}
      data-hero-product-layer="full-canvas"
    >
      <HeroFullCanvasLayer
        alt={productLayer.alt}
        decorative={isHiddenFromAccessibility}
        fit="cover"
        position="center"
        priority={priority}
        sources={productLayer.sources}
      />
    </div>
  );
}

const MIN_ROTATOR_IMAGES = 3;

function hasProductLayerRotator(slide: HeroSlideViewModel) {
  return Boolean(
    slide.productLayer?.desktopSrc &&
    (slide.rotatorImages?.length ?? 0) >= MIN_ROTATOR_IMAGES,
  );
}

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
  const [autoplayResetKey, setAutoplayResetKey] = useState(0);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [isFocusWithinHero, setIsFocusWithinHero] = useState(false);
  const [isHoveringHero, setIsHoveringHero] = useState(false);
  const autoplayTimeoutRef = useRef<number | null>(null);
  const swipeStartRef = useRef<{
    x: number;
    y: number;
    time: number;
  } | null>(null);
  const renderableSlides = slides.filter(isRenderableHeroSlide);
  const slideCount = renderableSlides.length;
  const { canAnimate } = useHomeLoading();
  const canAutoplay =
    canAnimate &&
    slideCount > 1 &&
    shouldReduceMotion === false &&
    isDocumentVisible &&
    !isFocusWithinHero &&
    !isHoveringHero;

  const clearAutoplayTimer = useCallback(() => {
    if (autoplayTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(autoplayTimeoutRef.current);
    autoplayTimeoutRef.current = null;
  }, []);

  const resetAutoplayTimer = useCallback(() => {
    setAutoplayResetKey((currentKey) => currentKey + 1);
  }, []);

  useEffect(() => {
    const updateDocumentVisibility = () => {
      setIsDocumentVisible(document.visibilityState === "visible");
    };

    const frameId = window.requestAnimationFrame(updateDocumentVisibility);

    document.addEventListener("visibilitychange", updateDocumentVisibility);

    return () => {
      window.cancelAnimationFrame(frameId);
      document.removeEventListener(
        "visibilitychange",
        updateDocumentVisibility,
      );
    };
  }, []);

  useEffect(() => {
    clearAutoplayTimer();

    if (!canAutoplay || document.visibilityState !== "visible") {
      return clearAutoplayTimer;
    }

    autoplayTimeoutRef.current = window.setTimeout(() => {
      autoplayTimeoutRef.current = null;

      if (document.visibilityState !== "visible") {
        return;
      }

      setActiveIndex((currentIndex) => {
        const safeIndex = getSafeIndex(currentIndex, slideCount);

        return safeIndex === slideCount - 1 ? 0 : safeIndex + 1;
      });
    }, HERO_SLIDER_AUTOPLAY_DELAY_MS);

    return clearAutoplayTimer;
  }, [
    activeIndex,
    autoplayResetKey,
    canAutoplay,
    clearAutoplayTimer,
    slideCount,
  ]);

  const goToPrevious = useCallback(() => {
    resetAutoplayTimer();
    setActiveIndex((currentIndex) => {
      const safeIndex = getSafeIndex(currentIndex, slideCount);

      return safeIndex === 0 ? slideCount - 1 : safeIndex - 1;
    });
  }, [resetAutoplayTimer, slideCount]);

  const goToNext = useCallback(() => {
    resetAutoplayTimer();
    setActiveIndex((currentIndex) => {
      const safeIndex = getSafeIndex(currentIndex, slideCount);

      return safeIndex === slideCount - 1 ? 0 : safeIndex + 1;
    });
  }, [resetAutoplayTimer, slideCount]);

  const handleHeroKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (slideCount <= 1) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevious();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
      }
    },
    [goToNext, goToPrevious, slideCount],
  );

  const handleHeroPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType !== "touch" || slideCount <= 1) return;

      const target = event.target;

      if (target instanceof Element && target.closest("a, button")) {
        return;
      }

      swipeStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        time: event.timeStamp,
      };

      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [slideCount],
  );

  const handleHeroPointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const start = swipeStartRef.current;
      swipeStartRef.current = null;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (!start) return;

      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;
      const duration = Math.max(event.timeStamp - start.time, 1);

      const horizontalDistance = Math.abs(deltaX);
      const verticalDistance = Math.abs(deltaY);
      const velocity = horizontalDistance / duration;

      const isHorizontal =
        horizontalDistance > verticalDistance * HERO_SWIPE_AXIS_RATIO;

      const travelledEnough = horizontalDistance >= HERO_SWIPE_DISTANCE_PX;

      const wasFastEnough =
        horizontalDistance >= HERO_SWIPE_FAST_DISTANCE_PX &&
        velocity >= HERO_SWIPE_VELOCITY_PX_PER_MS;

      if (!isHorizontal || (!travelledEnough && !wasFastEnough)) {
        return;
      }

      if (deltaX < 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    },
    [goToNext, goToPrevious],
  );

  const handleHeroPointerCancel = useCallback(() => {
    swipeStartRef.current = null;
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      resetAutoplayTimer();
      setActiveIndex(getClampedIndex(index, slideCount));
    },
    [resetAutoplayTimer, slideCount],
  );

  const handleHeroFocus = useCallback(() => {
    setIsFocusWithinHero(true);
  }, []);

  const handleHeroBlur = useCallback((event: FocusEvent<HTMLElement>) => {
    const nextFocusedElement = event.relatedTarget;

    if (
      nextFocusedElement instanceof Node &&
      event.currentTarget.contains(nextFocusedElement)
    ) {
      return;
    }

    setIsFocusWithinHero(false);
  }, []);

  if (slideCount === 0) {
    return (
      <HeroSlideRenderer
        isActive
        fallbackDescription={fallbackDescription}
        isInitialSlide
        slide={undefined}
        whatsappUrl={whatsappUrl}
      />
    );
  }

  const boundedActiveIndex = getSafeIndex(activeIndex, slideCount);

  const trackX = `-${boundedActiveIndex * 100}%`;
  const activeTrackTransition = shouldReduceMotion
    ? reducedTrackTransition
    : trackTransition;

  return (
    <section
      id="promos"
      aria-label="Promociones principales"
      aria-roledescription="carousel"
      className="relative isolate w-full min-w-0 max-w-full touch-pan-y overflow-hidden"
      data-contact-speed-dial-hidden-zone
      onBlurCapture={handleHeroBlur}
      onFocusCapture={handleHeroFocus}
      onMouseEnter={() => setIsHoveringHero(true)}
      onMouseLeave={() => setIsHoveringHero(false)}
      onKeyDown={handleHeroKeyDown}
      tabIndex={slideCount > 1 ? 0 : undefined}
      role="region"
      onPointerDown={handleHeroPointerDown}
      onPointerUp={handleHeroPointerUp}
      onPointerCancel={handleHeroPointerCancel}
    >
      <div
        className="relative h-svh w-full min-w-0 max-w-full overflow-hidden [@media(max-height:500px)_and_(orientation:portrait)]:h-[30rem]"
        data-hero-stage
      >
        <motion.div
          animate={{ x: trackX }}
          className="pointer-events-none absolute inset-0 z-0 flex h-full w-full min-w-0 max-w-full will-change-transform"
          data-hero-background-track
          initial={false}
          transition={activeTrackTransition}
        >
          {renderableSlides.map((slide, index) => {
            const backgroundVariant = slide.presentation.backgroundVariant;
            const isWelcomeSlide = slide.presentation.variant === "welcome-split";

            const rendersProductInsideSlide =
              slide.presentation.variant === "boxes-showcase" ||
              slide.presentation.variant === "most-ordered-promo" ||
              slide.presentation.variant === "announcement-poster";

            const usesSignatureBackground =
              backgroundVariant === "signature" ||
              backgroundVariant === "signature-mirrored";

            const usesMostOrderedBackground =
              backgroundVariant === "most-ordered";

            const isBackgroundMirrored =
              backgroundVariant === "signature-mirrored";

            const productLayerPositionClassName =
              backgroundVariant === "signature"
                ? [
                    "max-md:portrait:-translate-y-[8svh]",
                    "md:portrait:-translate-y-[10svh]",
                    "[@media(max-height:500px)_and_(orientation:landscape)]:origin-center",
                    "[@media(max-height:500px)_and_(orientation:landscape)]:scale-[0.80]",
                    "[@media(max-height:500px)_and_(orientation:landscape)]:translate-y-[10svh]",
                    "[@media(max-height:500px)_and_(orientation:landscape)]:translate-x-[30svh]",
                  ].join(" ")
                : backgroundVariant === "signature-mirrored"
                  ? "max-md:portrait:translate-y-[5svh]"
                  : undefined;
            const productLayerClassName = cn(
              !isWelcomeSlide && productLayerPositionClassName,
              isWelcomeSlide && welcomeStyles.product,
            );

            return (
              <div
                key={`${slide.id}-background`}
                className="relative h-full w-full min-w-0 max-w-full basis-full shrink-0 grow-0 overflow-hidden"
              >
                {usesSignatureBackground ? (
                  <MainHeroBackground
                    mirrored={isBackgroundMirrored}
                    polished={isWelcomeSlide}
                    patternIdPrefix={slide.id}
                  />
                ) : (
                  <>
                    {slide.colorLayer ? (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 z-0"
                        data-hero-color-layer
                        style={{ backgroundColor: slide.colorLayer.value }}
                      />
                    ) : null}

                    <HeroBackgroundLayers
                      background={slide.background}
                      priority={index === 0}
                    />

                    {slide.patternOverlay?.enabled ? (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 z-1"
                        data-hero-pattern-overlay={
                          slide.patternOverlay.assetKey
                        }
                        style={getPatternOverlayStyle(slide.patternOverlay)}
                      />
                    ) : null}

                    {usesMostOrderedBackground ? (
                      <MostOrderedHeroBackgroundAccents />
                    ) : null}
                  </>
                )}
                {!rendersProductInsideSlide &&
                  (hasProductLayerRotator(slide) && slide.productLayer ? (
                    <HeroMediaRotator
                      className={productLayerClassName}
                      decorative={slide.productLayer.decorative}
                      images={slide.rotatorImages ?? []}
                      isSlideActive={index === boundedActiveIndex}
                      mode="product-layer"
                      universalProduct={isWelcomeSlide}
                      priority={index === 0}
                    />
                  ) : slide.productLayer ? (
                    <HeroProductLayerImage
                      className={productLayerClassName}
                      isActive={index === boundedActiveIndex}
                      priority={index === 0}
                      productLayer={slide.productLayer}
                    />
                  ) : null)}
              </div>
            );
          })}
        </motion.div>

        <motion.div
          animate={{ x: trackX }}
          className="relative z-10 flex h-full w-full min-w-0 max-w-full will-change-transform"
          data-hero-track
          initial={false}
          transition={activeTrackTransition}
        >
          {renderableSlides.map((slide, index) => {
            const isActive = index === boundedActiveIndex;
            const isInitialSlide = index === 0;

            return (
              <div
                key={slide.id}
                aria-hidden={isActive ? undefined : true}
                className="relative h-full w-full min-w-0 max-w-full flex-none basis-full shrink-0 overflow-hidden"
                data-hero-slide
                inert={isActive ? undefined : true}
              >
                <HeroSlideRenderer
                  isActive={isActive}
                  className="h-full"
                  fallbackDescription={fallbackDescription}
                  isInitialSlide={isInitialSlide}
                  renderBackground={false}
                  renderLegacyMedia={!slide.productLayer}
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
            autoplayDurationMs={HERO_SLIDER_AUTOPLAY_DELAY_MS}
            autoplayResetKey={autoplayResetKey}
            count={slideCount}
            isAutoplayRunning={canAutoplay}
            onNext={goToNext}
            onPrevious={goToPrevious}
            onSelect={goToSlide}
          />
        ) : null}
      </div>

    </section>
  );
}
