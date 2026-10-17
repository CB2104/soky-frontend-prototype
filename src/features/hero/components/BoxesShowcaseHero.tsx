"use client";

import { useGSAP } from "@gsap/react";
import { useHomeLoading } from "@/features/home/loading/HomeLoadingBoundary";
import { useHomeGSAP } from "@/features/home/loading/useHomeGSAP";
import gsap from "gsap";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRightIcon } from "@/components/brand/IconsSVG";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { HeroResponsiveRotatorImage, HeroSlideViewModel } from "../types";
import { HeroFullCanvasLayer } from "./HeroFullCanvasLayer";
import styles from "./HeroActions.module.css";
import {
  HeroProductMotion,
  HERO_PRODUCT_HOLD_MS,
  prepareHeroProduct,
} from "@/features/home/sections/hero/components/HeroProductMotion";

gsap.registerPlugin(useGSAP);

type BoxesShowcaseHeroProps = {
  className?: string;
  isActive?: boolean;
  isInitialSlide?: boolean;
  slide: HeroSlideViewModel;
  whatsappUrl: string;
};

const BOX_ROTATION_INTERVAL_MS = HERO_PRODUCT_HOLD_MS;

const BOXES_BACKGROUND_MASK = {
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
} as const;

function getCtaHref(slide: HeroSlideViewModel, whatsappUrl: string) {
  const cta = slide.primaryCta;

  if (!cta) return null;
  if (cta.type === "WHATSAPP") return whatsappUrl;

  return cta.href ?? "/menu?category=boxes";
}

function getShowcaseItems(slide: HeroSlideViewModel) {
  if (slide.rotatorImages?.length) {
    return slide.rotatorImages;
  }

  return [
    {
      alt: slide.image.alt,
      name: slide.productName ?? slide.title,
      priceLabel: null,
      sources: slide.image.sources,
      src: slide.image.desktopSrc,
    },
  ] satisfies HeroResponsiveRotatorImage[];
}

export function BoxesShowcaseHero({
  className,
  isActive = false,
  isInitialSlide = false,
  slide,
  whatsappUrl,
}: BoxesShowcaseHeroProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const items = useMemo(() => getShowcaseItems(slide), [slide]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const activeItem = items[activeIndex] ?? items[0];
  const primaryHref = getCtaHref(slide, whatsappUrl);

  useEffect(() => {
    const updateVisibility = () => {
      setIsDocumentVisible(document.visibilityState === "visible");
    };

    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (
      !isActive ||
      !isDocumentVisible ||
      shouldReduceMotion ||
      items.length < 2
    ) {
      return;
    }

    let cancelled = false;
    const ready = prepareHeroProduct(
      items[(activeIndex + 1) % items.length].src,
      "100vw",
    );
    const timeoutId = window.setTimeout(async () => {
      if (!(await ready) || cancelled) return;
      setActiveIndex((currentIndex) => (currentIndex + 1) % items.length);
    }, BOX_ROTATION_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    activeIndex,
    isActive,
    isDocumentVisible,
    items.length,
    items,
    shouldReduceMotion,
  ]);

  const { startEntrance } = useHomeLoading();

  useHomeGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const title = root.querySelector<HTMLElement>(
        "h2[data-boxes-showcase-copy]",
      );
      const description = root.querySelector<HTMLElement>(
        "p[data-boxes-showcase-copy]",
      );
      const cluster = root.querySelector<HTMLElement>(
        "[data-boxes-showcase-cluster]",
      );
      const action = root.querySelector<HTMLElement>(
        "[data-boxes-showcase-action]",
      );
      const bamboo = root.querySelector<HTMLElement>(
        "[data-boxes-showcase-bamboo]",
      );
      const cornerParticles = root.querySelector<HTMLElement>(
        "[data-boxes-showcase-corner-particles]",
      );

      const animatedElements = [
        title,
        description,
        cluster,
        action,
        bamboo,
        cornerParticles,
      ].filter((element): element is HTMLElement => Boolean(element));

      if (shouldReduceMotion) {
        gsap.set(animatedElements, {
          clearProps: "opacity,transform,visibility",
        });
        return;
      }

      const timeline = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out" },
      });

      if (title) {
        timeline.fromTo(
          title,
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.65 },
          0.2,
        );
      }

      if (description) {
        timeline.fromTo(
          description,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.5 },
          0.42,
        );
      }

      if (cluster) {
        timeline.fromTo(
          cluster,
          {
            autoAlpha: 0,
            xPercent: 7,
            yPercent: 5,
            rotation: 1.5,
            scale: 0.96,
          },
          {
            autoAlpha: 1,
            xPercent: 0,
            yPercent: 0,
            rotation: 0,
            scale: 1,
            duration: 0.62,
            ease: "back.out(1.25)",
            clearProps: "transform",
          },
          0.6,
        );
      }

      if (action) {
        timeline.fromTo(
          action,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.42 },
          0.95,
        );
      }

      if (bamboo) {
        timeline.fromTo(
          bamboo,
          { autoAlpha: 0, x: 12, y: 10 },
          { autoAlpha: 1, x: 0, y: 0, duration: 0.6 },
          0.72,
        );
      }

      if (cornerParticles) {
        timeline.fromTo(
          cornerParticles,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.55 },
          0.84,
        );
      }

      let cancelEntrance = () => {};
      if (isActive) {
        cancelEntrance = startEntrance(() => {
          timeline.restart();
        });
      } else {
        timeline.progress(1).pause();
      }

      return () => {
        cancelEntrance();
        timeline.kill();
      };
    },
    {
      scope: rootRef,
      dependencies: [isActive, shouldReduceMotion],
      revertOnUpdate: true,
    },
  );

  if (!activeItem) return null;

  const priceAmount = activeItem.priceLabel?.replace("€", "").trim();
  const titleLines = slide.title.split(/\s+(?=para\b|cada\b)/i);

  let badgeWordIndex = 0;

  const badgeLines = (activeItem.name ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/).filter(Boolean))
    .filter((words) => words.length > 0)
    .map((words) =>
      words.map((text) => ({
        text,
        bold: badgeWordIndex++ % 2 === 1,
      })),
    );

  const hasMultilineBadge = badgeLines.length > 1;
  return (
    <section
      ref={rootRef}
      aria-labelledby={`boxes-showcase-${slide.id}-heading`}
      className={cn(
        "relative isolate h-full overflow-hidden text-soky-white",
        "max-md:portrait:grid max-md:portrait:min-h-0",
        "max-md:portrait:grid-rows-[auto_minmax(0,1fr)]",
        "max-md:portrait:gap-y-4",
        "max-md:portrait:pt-[calc(var(--navbar-height)_+_1.35rem)]",
        "max-md:portrait:pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]",
        className,
      )}
      data-boxes-showcase
    >
      <div
        aria-hidden="true"
        data-boxes-showcase-background
        className={[
          "pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#149ef2]",
          "[--boxes-wave:url('/images/hero/wave-white-bottom.svg')]",
          "[--boxes-wave-size:100%_100%]",
          "max-md:portrait:[--boxes-wave:url('/images/hero/wave-white-bottom-mobile.svg')]",
          "max-md:portrait:[--boxes-wave-size:100%_112%]",
          "[@media(max-width:767px)_and_(max-height:700px)_and_(orientation:portrait)]:[--boxes-wave-size:100%_100%]",
          "[--boxes-pattern-size:112px_56px]",
          "max-md:portrait:[--boxes-pattern-size:84px_42px]",
        ].join(" ")}
      >
        <div
          className="absolute inset-0 z-[1] bg-bottom bg-no-repeat"
          style={{
            backgroundImage: "var(--boxes-wave)",
            backgroundSize: "var(--boxes-wave-size)",
          }}
        />

        <div
          className="absolute inset-0 z-[1] opacity-[0.32] max-md:portrait:opacity-[0.38]"
          style={{
            ...BOXES_BACKGROUND_MASK,
            WebkitMaskImage: "var(--boxes-wave)",
            maskImage: "var(--boxes-wave)",
            WebkitMaskPosition: "center bottom",
            maskPosition: "center bottom",
            WebkitMaskSize: "var(--boxes-wave-size)",
            maskSize: "var(--boxes-wave-size)",
          }}
        >
          <div
            className="absolute inset-0 bg-[#145cc8]"
            style={{
              WebkitMaskImage:
                "url('/images/patterns/endless-clouds-light.svg')",
              maskImage: "url('/images/patterns/endless-clouds-light.svg')",
              WebkitMaskPosition: "center bottom",
              maskPosition: "center bottom",
              WebkitMaskRepeat: "repeat",
              maskRepeat: "repeat",
              WebkitMaskSize: "var(--boxes-pattern-size)",
              maskSize: "var(--boxes-pattern-size)",
            }}
          />
        </div>

        <div
          className={[
            "absolute right-[-1%] top-[-9%] z-[0] h-[118%] w-auto",
            "aspect-[566/1168] bg-[#145cc8]",
            "max-md:portrait:right-[-40%]",
            "max-md:portrait:top-0",
            "max-md:portrait:h-[95%]",
          ].join(" ")}
          style={{
            ...BOXES_BACKGROUND_MASK,
            transform: "scaleX(-1)",
            WebkitMaskImage: "url('/images/soky-purple-unified-arc.svg')",
            maskImage: "url('/images/soky-purple-unified-arc.svg')",
          }}
        >
          <div
            className="absolute inset-0 bg-center bg-repeat opacity-55"
            style={{
              backgroundImage:
                "url('/images/patterns/endless-clouds-light.svg')",
              backgroundSize: "var(--boxes-pattern-size)",
            }}
          />
        </div>
      </div>
      <div
        className={[
          "relative z-20 mx-auto grid h-full w-[min(100%-2rem,80rem)] min-w-0",
          "grid-rows-[auto_minmax(0,1fr)_auto] pb-[5.5rem] pt-[calc(var(--navbar-height)_+_1.35rem)]",
          "md:grid-cols-12 md:grid-rows-1 md:items-center md:pb-12 md:pt-[calc(var(--navbar-height)_+_2rem)]",
          "[@media(max-height:500px)_and_(orientation:landscape)]:pb-10",
          "[@media(max-height:500px)_and_(orientation:landscape)]:pt-[calc(var(--navbar-height)_+_.4rem)]",
          "max-md:portrait:h-auto",
          "max-md:portrait:row-start-1",
          "max-md:portrait:grid-rows-1",
          "max-md:portrait:pt-0",
          "max-md:portrait:pb-0",
        ].join(" ")}
      >
        <div
          className={[
            "relative z-30 md:col-span-5 md:col-start-1",
            "max-md:portrait:[transform:translateZ(0)]",
            "[@media(max-height:500px)_and_(orientation:landscape)]:[transform:translateZ(0)]",
            "max-md:portrait:flex max-md:portrait:flex-col",
            "max-md:portrait:[&>h2]:shrink-0",
            "max-md:portrait:[&>p]:shrink-0",
            "[@media(max-height:500px)_and_(orientation:landscape)]:self-start",
          ].join(" ")}
        >
          <h2
            id={`boxes-showcase-${slide.id}-heading`}
            data-boxes-showcase-copy
            className={[
              "max-w-[8.5ch] font-soky-display font-normal uppercase",
              "text-[clamp(2.75rem,13vw,4rem)] leading-[0.94]",
              "tracking-[-0.015em] text-soky-white",
              "max-md:portrait:max-w-none",
              "md:text-[clamp(4.5rem,6.2vw,7rem)]",
              "lg:landscape:max-w-[10ch]",
              "lg:landscape:text-[clamp(4.5rem,6vw,7rem)]",
              "lg:landscape:leading-[0.9]",
              "[@media(max-height:500px)_and_(orientation:landscape)]:max-w-[15ch]",
              "[@media(max-height:500px)_and_(orientation:landscape)]:text-[clamp(2rem,5vw,2.75rem)]",
              "[@media(max-height:500px)_and_(orientation:landscape)]:leading-[0.9]",
              "[@media(max-width:767px)_and_(max-height:700px)_and_(orientation:portrait)]:text-[clamp(2rem,9vw,2.5rem)]",
            ].join(" ")}
          >
            {titleLines.map((line, index) => (
              <span
                key={`${index}-${line}`}
                className={[
                  "max-md:portrait:block max-md:portrait:whitespace-nowrap",
                  index > 0
                    ? "[@media(max-width:767px)_and_(max-height:700px)_and_(orientation:portrait)]:!inline"
                    : "",
                ].join(" ")}
              >
                {line}{" "}
              </span>
            ))}
          </h2>

          {slide.description ? (
            <p
              data-boxes-showcase-copy
              className={[
                "mt-4 max-w-[30ch]",
                "font-soky-body font-medium",
                "text-[clamp(0.9375rem,4vw,1.0625rem)]",
                "leading-[1.4] text-soky-white/95",
                "md:mt-5 md:max-w-[36ch]",
                "md:text-[clamp(1rem,1.3vw,1.25rem)]",
                "md:leading-[1.45]",
                "[@media(max-height:500px)_and_(orientation:landscape)]:mt-3",
                "[@media(max-height:500px)_and_(orientation:landscape)]:max-w-[25rem]",
                "[@media(max-height:500px)_and_(orientation:landscape)]:text-sm",
                "[@media(max-height:500px)_and_(orientation:landscape)]:leading-5",
                "[@media(max-width:767px)_and_(max-height:700px)_and_(orientation:portrait)]:mt-3",
                "[@media(max-width:767px)_and_(max-height:700px)_and_(orientation:portrait)]:max-w-none",
                "[@media(max-width:767px)_and_(max-height:700px)_and_(orientation:portrait)]:text-[0.9375rem]",
              ].join(" ")}
            >
              {slide.description}
            </p>
          ) : null}

          {slide.primaryCta && primaryHref ? (
            <div
              data-boxes-showcase-action
              className={[
                "mt-5 w-full max-w-[18rem]",
                "sm:landscape:w-auto md:mt-7 md:w-auto",
                "max-md:portrait:w-fit",
                "max-md:portrait:max-w-full",
                "max-md:portrait:shrink-0",
                "max-md:portrait:mt-4",
                "max-md:portrait:self-start",
                "max-md:portrait:pt-0",
                "[@media(max-height:500px)_and_(orientation:landscape)]:!mt-2",
                "[@media(max-width:767px)_and_(max-height:700px)_and_(orientation:portrait)]:!mt-4",
              ].join(" ")}
            >
              <Button
                variant="primary"
                data-hero-cta
                href={primaryHref}
                scroll={primaryHref.startsWith("/menu/") ? false : undefined}
                data-transition-ignore={
                  primaryHref.startsWith("/menu/") ||
                  primaryHref.startsWith("#") ||
                  primaryHref.startsWith("/#")
                    ? true
                    : undefined
                }
                className={styles.primaryAction}
              >
                <span aria-hidden="true" className={styles.actionIcon}>
                  <ArrowRightIcon />
                </span>
                <span className={styles.actionLabel}>
                  {slide.primaryCta.label}
                </span>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute -bottom-3 -right-3 z-[5]",
          "aspect-[626/470] w-[clamp(10rem,18vw,21rem)] select-none",
          "[@media(max-height:500px)_and_(orientation:landscape)]:w-[clamp(8rem,20vw,12rem)]",
        ].join(" ")}
      >
        <div data-boxes-showcase-bamboo className="absolute inset-0">
          <Image
            src="/images/hero/soky-hero-bambu-transparente.webp"
            alt=""
            fill
            sizes="(max-height: 500px) and (orientation: landscape) 20vw, (max-width: 767px) 160px, (min-width: 1867px) 336px, 18vw"
            className="object-contain"
            style={{ transform: "scaleX(-1)" }}
            draggable={false}
          />
        </div>

        <div
          data-boxes-showcase-corner-particles
          className="absolute bottom-[0%] right-[0%] z-10 aspect-square w-[110%]"
        >
          <Image
            src="/images/hero/soky-sesame-tempura-particles.webp"
            alt=""
            fill
            sizes="(max-height: 500px) and (orientation: landscape) 22vw, (max-width: 767px) 176px, (min-width: 1867px) 370px, 20vw"
            className="object-contain"
            draggable={false}
          />
        </div>
      </div>

      <div
        data-boxes-showcase-visual
        className={[
          "pointer-events-none absolute right-0 bottom-[10%] z-10",
          "h-[44%] w-full select-none",
          "md:right-[2%] md:bottom-[8%] md:h-[78%] md:w-[56%]",
          "max-md:portrait:relative",
          "max-md:portrait:row-start-2",
          "max-md:portrait:right-auto",
          "max-md:portrait:bottom-auto",
          "max-md:portrait:h-full",
          "max-md:portrait:min-h-0",
          "[@media(max-height:500px)_and_(orientation:landscape)]:origin-center",
          "[@media(max-height:500px)_and_(orientation:landscape)]:scale-[0.96]",
          "[@media(max-height:500px)_and_(orientation:landscape)]:translate-x-0",
          "[@media(max-height:500px)_and_(orientation:landscape)]:translate-y-[7svh]",
          "lg:landscape:aspect-[4/3]",
          "lg:landscape:h-auto lg:landscape:w-[62%]",
          "lg:landscape:right-[1%] lg:landscape:bottom-[8%]",
        ].join(" ")}
      >
        <div
          data-boxes-showcase-cluster
          className="absolute inset-0 origin-bottom"
        >
          <span
            aria-atomic="true"
            aria-live={isActive ? "polite" : "off"}
            className="sr-only"
          >
            {activeItem.name} {activeItem.priceLabel}
          </span>

          <HeroProductMotion
            active={isActive}
            frameKey={activeItem.src}
            reducedMotion={shouldReduceMotion === true}
            motionPreset="boxes"
            className="absolute inset-0"
          >
            <div
              aria-hidden={!isActive ? "true" : undefined}
              data-boxes-showcase-product
              className="absolute inset-0 z-10 drop-shadow-[0_7px_6px_rgb(7_5_74_/_0.13)]"
            >
              <HeroFullCanvasLayer
                alt={activeItem.alt}
                decorative
                eager={isActive}
                fit="contain"
                className={[
                  "max-md:portrait:origin-bottom max-md:portrait:scale-[1.20]",
                  "[@media(max-height:500px)_and_(orientation:landscape)]:origin-bottom",
                  "[@media(max-height:500px)_and_(orientation:landscape)]:scale-[1.35]",
                ].join(" ")}
                position="center"
                priority={isInitialSlide && activeIndex === 0}
                sources={activeItem.sources}
              />
            </div>

            <div
              aria-hidden="true"
              data-boxes-showcase-badges
              className={[
                "absolute right-[3%] bottom-[2%] z-30",
                "grid justify-items-end",
                "md:right-[6%] md:bottom-[8%]",
                "lg:landscape:right-[14%] lg:landscape:bottom-[7%]",
                "max-md:portrait:bottom-[3%]",
                "[@media(max-height:500px)_and_(orientation:landscape)]:bottom-[13%]",
              ].join(" ")}
            >
              <div
                className={[
                  "col-start-1 row-start-1 flex w-[var(--box-price-size)] flex-col items-center",
                  "[--box-price-size:7.75rem] md:[--box-price-size:11.25rem]",
                  "[@media(max-height:500px)_and_(orientation:landscape)]:[--box-price-size:6rem]",
                ].join(" ")}
              >
                {activeItem.name ? (
                  <p
                    className={[
                      "relative z-10 grid w-[94%] shrink-0 place-items-center",
                      "-rotate-3 bg-center bg-no-repeat",
                      "px-1 pb-0.5 text-center",
                      "font-soky-support font-normal uppercase",
                      "leading-[1.05] tracking-[-0.025em] text-soky-white",
                      "drop-shadow-[0_3px_4px_rgb(7_5_74_/_0.12)]",

                      hasMultilineBadge
                        ? "h-[calc(var(--box-price-size)*0.36)] text-[0.8125rem] md:text-[1.125rem]"
                        : "h-[calc(var(--box-price-size)*0.28)] text-[0.71875rem] md:text-base",

                      "[@media(max-height:500px)_and_(orientation:landscape)]:!h-[calc(var(--box-price-size)*0.38)]",
                      "[@media(max-height:500px)_and_(orientation:landscape)]:!text-[0.6875rem]",
                    ].join(" ")}
                    style={{
                      backgroundImage:
                        "url('/images/hero/box-name-ribbon.svg')",
                      backgroundSize: "100% 100%",
                    }}
                  >
                    <span className="block w-full">
                      {badgeLines.map((words, lineIndex) => (
                        <span
                          key={lineIndex}
                          className={[
                            "block whitespace-nowrap",
                            "[@media(max-height:500px)_and_(orientation:landscape)]:whitespace-normal",
                          ].join(" ")}
                        >
                          {words.map((word, wordIndex) => (
                            <span
                              key={`${wordIndex}-${word.text}`}
                              className={
                                word.bold ? "font-extrabold" : "font-light"
                              }
                            >
                              {wordIndex > 0 ? " " : ""}
                              {word.text}
                            </span>
                          ))}
                        </span>
                      ))}
                    </span>
                  </p>
                ) : null}

                {activeItem.priceLabel ? (
                  <p
                    className={[
                      "relative mt-[calc(var(--box-price-size)*-0.22)] grid size-[var(--box-price-size)] shrink-0 place-items-center",
                      "bg-contain bg-center bg-no-repeat",
                      "text-soky-white",
                      "drop-shadow-[0_4px_6px_rgb(7_5_74_/_0.12)]",
                    ].join(" ")}
                    style={{
                      backgroundImage: "url('/images/hero/box-price-blob.svg')",
                    }}
                  >
                    <span className="flex translate-y-1.5 items-baseline justify-center gap-0.5 font-soky-display font-normal leading-none md:translate-y-2 [@media(max-height:500px)_and_(orientation:landscape)]:!translate-y-1">
                      <span className="text-[4.5rem] md:text-[6.1rem] [@media(max-height:500px)_and_(orientation:landscape)]:!text-[3.05rem]">
                        {priceAmount}
                      </span>

                      <span className="text-[2rem] md:text-[2.75rem] [@media(max-height:500px)_and_(orientation:landscape)]:!text-[1.4rem]">
                        €
                      </span>
                    </span>
                  </p>
                ) : null}
              </div>
            </div>
          </HeroProductMotion>
        </div>
      </div>
    </section>
  );
}
