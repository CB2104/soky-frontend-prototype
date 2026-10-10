"use client";

import { useGSAP } from "@gsap/react";
import { useHomeLoading } from "@/features/home/loading/HomeLoadingBoundary";
import { useHomeGSAP } from "@/features/home/loading/useHomeGSAP";
import gsap from "gsap";
import Image from "next/image";
import { useReducedMotion } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import type { HeroCtaViewModel, HeroSlideViewModel } from "../types";
import { HeroFullCanvasLayer } from "./HeroFullCanvasLayer";
import {
  ArrowRightIcon,
  CrownIcon,
  MenuBlockIcon,
  SushiSetIcon,
  WhatsAppSVG,
} from "@/components/brand/IconsSVG";
import styles from "./HeroActions.module.css";

gsap.registerPlugin(useGSAP);

type MostOrderedHeroProps = {
  className?: string;
  isActive?: boolean;
  slide: HeroSlideViewModel;
  whatsappUrl: string;
};

const MOST_ORDERED_DECORATIONS = {
  bottle: true,
  chopsticks: true,
  bamboo: true,
} as const;

type MostOrderedCtaType = HeroCtaViewModel["type"];

function getMostOrderedCtaHref(
  cta: HeroCtaViewModel,
  fallbackHref: string,
  whatsappUrl: string,
) {
  if (cta.type === "WHATSAPP") {
    return whatsappUrl;
  }

  return cta.href ?? fallbackHref;
}

function isExternalCta(cta: HeroCtaViewModel) {
  return cta.type === "WHATSAPP" || cta.isExternal;
}

function MostOrderedCtaIcon({ type }: { type: MostOrderedCtaType }) {
  if (type === "MENU") {
    return <MenuBlockIcon className="size-5 shrink-0" />;
  }

  if (type === "PRODUCT" || type === "CATEGORY") {
    return <SushiSetIcon className="size-6 shrink-0" />;
  }

  if (type === "WHATSAPP") {
    return <WhatsAppSVG className="size-5 shrink-0" />;
  }

  return <ArrowRightIcon className="size-5 shrink-0" />;
}

export function MostOrderedHero({
  className,
  slide,
  isActive = false,
  whatsappUrl,
}: MostOrderedHeroProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const productLayer = slide.productLayer;

  const primaryCta = slide.primaryCta;
  const secondaryCta = slide.secondaryCta;

  const primaryHref = primaryCta
    ? getMostOrderedCtaHref(primaryCta, "/menu", whatsappUrl)
    : null;

  const secondaryHref = secondaryCta
    ? getMostOrderedCtaHref(secondaryCta, "/menu", whatsappUrl)
    : null;

  const primaryIsExternal = primaryCta ? isExternalCta(primaryCta) : false;

  const secondaryIsExternal = secondaryCta
    ? isExternalCta(secondaryCta)
    : false;

  const { startEntrance } = useHomeLoading();

  useHomeGSAP(
    () => {
      const root = rootRef.current;

      if (!root) return;

      const panel = root.querySelector<HTMLElement>(
        "[data-most-ordered-panel]",
      );
      const copyElements = Array.from(
        root.querySelectorAll<HTMLElement>("[data-most-ordered-copy]"),
      );
      const product = root.querySelector<HTMLElement>(
        "[data-most-ordered-product]",
      );
      const bottle = root.querySelector<HTMLElement>(
        "[data-most-ordered-bottle]",
      );
      const chopsticks = root.querySelector<HTMLElement>(
        "[data-most-ordered-chopsticks]",
      );
      const bamboo = root.querySelector<HTMLElement>(
        "[data-most-ordered-bamboo]",
      );
      const actions = root.querySelector<HTMLElement>(
        "[data-most-ordered-actions]",
      );
      const animatedElements = [
        panel,
        ...copyElements,
        product,
        bottle,
        chopsticks,
        bamboo,
        actions,
      ].filter((element): element is HTMLElement => Boolean(element));

      if (shouldReduceMotion) {
        gsap.set(animatedElements, {
          clearProps: "opacity,transform,visibility",
        });

        return;
      }

      const timeline = gsap.timeline({
        paused: true,
        defaults: {
          ease: "power3.out",
        },
      });

      if (panel) {
        timeline.fromTo(
          panel,
          {
            autoAlpha: 0,
            scale: 0.985,
            y: 14,
          },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: 0.42,
          },
        );
      }

      if (copyElements.length > 0) {
        timeline.fromTo(
          copyElements,
          {
            autoAlpha: 0,
            y: 16,
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.42,
            stagger: 0.055,
          },
          panel ? "-=0.18" : 0,
        );
      }

      if (product) {
        timeline.fromTo(
          product,
          {
            autoAlpha: 0,
            rotate: -1.5,
            scale: 0.96,
            xPercent: -7,
            yPercent: 5,
          },
          {
            autoAlpha: 1,
            rotate: 0,
            scale: 1,
            xPercent: 0,
            yPercent: 0,
            duration: 0.62,
            ease: "back.out(1.25)",
          },
          "-=0.1",
        );
      }

      if (bottle) {
        timeline.fromTo(
          bottle,
          {
            autoAlpha: 0,
            rotate: 2,
            scale: 0.94,
            xPercent: 20,
            yPercent: 5,
          },
          {
            autoAlpha: 1,
            rotate: 0,
            scale: 1,
            xPercent: 0,
            yPercent: 0,
            duration: 0.48,
            ease: "back.out(1.3)",
          },
          "-=0.42",
        );
      }

      if (chopsticks) {
        timeline.fromTo(
          chopsticks,
          {
            autoAlpha: 0,
            rotate: -3,
            xPercent: -18,
            yPercent: -8,
          },
          {
            autoAlpha: 1,
            rotate: 0,
            xPercent: 0,
            yPercent: 0,
            duration: 0.5,
            ease: "back.out(1.35)",
          },
          "-=0.4",
        );
      }

      if (bamboo) {
        timeline.fromTo(
          bamboo,
          {
            autoAlpha: 0,
            xPercent: -10,
            yPercent: 6,
          },
          {
            autoAlpha: 1,
            xPercent: 0,
            yPercent: 0,
            duration: 0.46,
          },
          "-=0.42",
        );
      }

      if (actions) {
        timeline.fromTo(
          actions,
          {
            autoAlpha: 0,
            scale: 0.98,
            y: 14,
          },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: 0.4,
          },
          "-=0.08",
        );
      }

      let cancelEntrance = () => {};
      if (isActive) {
        cancelEntrance = startEntrance(() => { timeline.restart(); });
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

  return (
    <section
      ref={rootRef}
      className={cn(
        "relative isolate h-full overflow-hidden text-soky-white",
        className,
      )}
    >
      <div
        aria-hidden="true"
        data-most-ordered-panel
        className={[
          "most-ordered-panel-shape pointer-events-none absolute z-0 overflow-hidden bg-soky-orange",

          "max-md:portrait:left-[5%]",
          "max-md:portrait:top-[12%]",
          "max-md:portrait:h-[50%]",
          "max-md:portrait:w-[90%]",

          "md:portrait:left-[7%]",
          "md:portrait:top-[11%]",
          "md:portrait:h-[55%]",
          "md:portrait:w-[86%]",

          "landscape:right-[-3%]",
          "landscape:top-[16%]",
          "landscape:h-[70%]",
          "landscape:w-[47%]",

          "[@media(max-height:500px)_and_(orientation:landscape)]:top-[10%]",
          "[@media(max-height:500px)_and_(orientation:landscape)]:h-[72%]",
          "[@media(max-height:500px)_and_(orientation:landscape)]:w-[49%]",
        ].join(" ")}
      >
        <div
          className={[
            "absolute inset-0",
            "bg-[radial-gradient(ellipse_at_50%_38%,rgb(255_184_102_/_0.30)_0%,rgb(255_145_48_/_0.12)_42%,transparent_72%)]",
          ].join(" ")}
        ></div>
        <div
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-0 hidden lg:block",
            "bg-[rgb(255_253_247/0.045)]",

            "[-webkit-mask-image:url('/images/patterns/soky-cloud-wave-pattern.svg')]",
            "mask-[url('/images/patterns/soky-cloud-wave-pattern.svg')]",

            "[-webkit-mask-size:clamp(18rem,30vw,26rem)_auto]",
            "mask-size-[clamp(18rem,30vw,26rem)_auto]",

            "[-webkit-mask-position:center]",
            "mask-center",

            "[-webkit-mask-repeat:repeat]",
            "mask-repeat",

            "[@media(max-height:500px)_and_(orientation:landscape)]:hidden",
          ].join(" ")}
        />
      </div>
      {productLayer ? (
        <div className="pointer-events-none absolute inset-0 z-10 select-none">
          {MOST_ORDERED_DECORATIONS.bamboo ? (
            <div
              aria-hidden="true"
              data-most-ordered-bamboo
              className="absolute bottom-[-4%] left-[-3%] z-0 hidden h-[38%] w-[38%] md:block"
            >
              <Image
                src="/images/hero/soky-hero-bambu-transparente.webp"
                alt=""
                fill
                sizes="38vw"
                className="object-contain object-bottom-left"
                draggable={false}
              />
            </div>
          ) : null}
          {MOST_ORDERED_DECORATIONS.bottle ? (
            <div
              aria-hidden="true"
              data-most-ordered-bottle
              className={[
                "absolute z-10",
                "drop-shadow-[0_12px_9px_rgba(7,5,74,0.24)]",
                "max-md:portrait:drop-shadow-[0_8px_6px_rgba(7,5,74,0.22)]",
                "[@media(max-height:500px)_and_(orientation:landscape)]:drop-shadow-[0_7px_5px_rgba(7,5,74,0.20)]",

                "max-md:portrait:right-[0%]",
                "max-md:portrait:top-[44%]",
                "max-md:portrait:h-[27%]",
                "max-md:portrait:w-[20%]",

                "md:portrait:right-[5%]",
                "md:portrait:top-[36%]",
                "md:portrait:h-[35%]",
                "md:portrait:w-[19%]",

                "landscape:left-[46%]",
                "landscape:top-[14%]",
                "landscape:h-[56%]",
                "landscape:w-[17%]",

                "[@media(max-height:500px)_and_(orientation:landscape)]:left-[42%]",
                "[@media(max-height:500px)_and_(orientation:landscape)]:top-[18%]",
                "[@media(max-height:500px)_and_(orientation:landscape)]:h-[50%]",
                "[@media(max-height:500px)_and_(orientation:landscape)]:w-[15%]",
              ].join(" ")}
            >
              <Image
                src="/images/hero/soky-hero-botella-transparente.webp"
                alt=""
                fill
                sizes="17vw"
                className="object-contain"
                draggable={false}
              />
            </div>
          ) : null}

          <div
            data-most-ordered-product
            className={[
              "absolute z-20",
              "drop-shadow-[0_18px_14px_rgba(7,5,74,0.30)]",

              "max-md:portrait:drop-shadow-[0_12px_10px_rgba(7,5,74,0.28)]",
              "max-md:portrait:left-[-4%]",
              "max-md:portrait:top-[52%]",
              "max-md:portrait:h-[33%]",
              "max-md:portrait:w-[108%]",

              "md:portrait:left-[0%]",
              "md:portrait:top-[46%]",
              "md:portrait:h-[37%]",
              "md:portrait:w-full",

              "landscape:bottom-[2%]",
              "landscape:left-0",
              "landscape:h-[72%]",
              "landscape:w-[66%]",

              "[@media(max-height:500px)_and_(orientation:landscape)]:left-[-4%]",
              "[@media(max-height:500px)_and_(orientation:landscape)]:bottom-[1%]",
              "[@media(max-height:500px)_and_(orientation:landscape)]:h-[72%]",
              "[@media(max-height:500px)_and_(orientation:landscape)]:w-[65%]",
              "[@media(max-height:500px)_and_(orientation:landscape)]:drop-shadow-[0_9px_7px_rgba(7,5,74,0.26)]",
            ].join(" ")}
          >
            <HeroFullCanvasLayer
              alt={productLayer.alt}
              decorative={productLayer.decorative || !isActive}
              fit={productLayer.fit}
              position={productLayer.position}
              sources={productLayer.sources}
            />
          </div>
        </div>
      ) : null}

      {MOST_ORDERED_DECORATIONS.chopsticks ? (
        <div
          aria-hidden="true"
          data-most-ordered-chopsticks
          className={[
            "absolute",
            "drop-shadow-[0_6px_4px_rgba(7,5,74,0.18)]",
            "max-md:portrait:drop-shadow-[0_4px_3px_rgba(7,5,74,0.16)]",
            "[@media(max-height:500px)_and_(orientation:landscape)]:drop-shadow-[0_4px_3px_rgba(7,5,74,0.14)]",

            "max-md:portrait:z-15",
            "max-md:portrait:left-[-24%]",
            "max-md:portrait:top-[46%]",
            "max-md:portrait:h-[22%]",
            "max-md:portrait:w-[62%]",

            "md:portrait:left-[-17%]",
            "md:portrait:top-[42%]",
            "md:portrait:z-15",
            "md:portrait:h-[25%]",
            "md:portrait:w-[60%]",

            "landscape:left-[-6%]",
            "landscape:top-[7%]",
            "landscape:z-30",
            "landscape:h-[45%]",
            "landscape:w-[42%]",

            "[@media(max-height:500px)_and_(orientation:landscape)]:left-[-9%]",
            "[@media(max-height:500px)_and_(orientation:landscape)]:top-[9%]",
            "[@media(max-height:500px)_and_(orientation:landscape)]:h-[41%]",
            "[@media(max-height:500px)_and_(orientation:landscape)]:w-[41%]",
          ].join(" ")}
        >
          <Image
            src="/images/hero/soky-hero-palillos-transparente.webp"
            alt=""
            fill
            sizes="42vw"
            className="object-contain object-top-left"
            draggable={false}
          />
        </div>
      ) : null}

      <div
        data-most-ordered-content
        className={[
          "absolute z-20 text-center",

          "max-md:portrait:left-[9%]",
          "max-md:portrait:top-[14%]",
          "max-md:portrait:w-[82%]",

          "md:portrait:left-[12%]",
          "md:portrait:top-[15%]",
          "md:portrait:w-[76%]",

          "landscape:right-[1%]",
          "landscape:top-[22%]",
          "landscape:w-[43%]",

          "[@media(max-height:500px)_and_(orientation:landscape)]:right-[2%]",
          "[@media(max-height:500px)_and_(orientation:landscape)]:top-[14%]",
        ].join(" ")}
      >
        {slide.badgeLabel ? (
          <p
            data-most-ordered-copy
            className={[
              "inline-flex items-center gap-2 rounded-full bg-[#f9d53a]",
              "px-5 py-2",
              "text-xs font-black uppercase tracking-[0.08em] text-soky-blue",
              "shadow-[0_5px_0_rgb(216_79_0/0.2)]",
              "font-soky-support",

              "[@media(max-height:500px)_and_(orientation:landscape)]:px-3",
              "[@media(max-height:500px)_and_(orientation:landscape)]:py-1",
              "[@media(max-height:500px)_and_(orientation:landscape)]:text-[0.6rem]",
            ].join(" ")}
          >
            <CrownIcon className="size-4 shrink-0 stroke-[2.25]" />
            {slide.badgeLabel}
          </p>
        ) : null}

        <h2
          data-most-ordered-copy
          className={[
            "mt-4 flex items-end justify-center gap-[clamp(0.35rem,1vw,1rem)]",
            "[@media(max-height:500px)_and_(orientation:landscape)]:mt-2",
          ].join(" ")}
        >
          {" "}
          {slide.highlightText ? (
            <span
              className={[
                "font-soky-impact",
                "text-[clamp(6rem,11vw,13rem)]",
                "font-normal leading-[0.78] tracking-[-0.025em] tabular-nums",
                "text-soky-white",
                "drop-shadow-[0_8px_0_rgb(216_79_0_/0.22)]",

                "[@media(max-height:500px)_and_(orientation:landscape)]:text-[4.5rem]",
                "max-md:portrait:text-[clamp(6.5rem,25vw,8.5rem)]",
                "md:portrait:text-[clamp(7.5rem,17vw,10rem)]",
              ].join(" ")}
            >
              {slide.highlightText}
            </span>
          ) : null}
          <span
            className={[
              "font-soky-impact",
              "pb-[0.12em] font-normal uppercase leading-[0.82] tracking-[0.01em]",
              "text-[clamp(2.4rem,4.2vw,5rem)]",
              "text-soky-white",
              "drop-shadow-[0_5px_0_rgb(216_79_0_/0.2)]",

              "[@media(max-height:500px)_and_(orientation:landscape)]:text-[1.75rem]",
              "max-md:portrait:text-[clamp(2rem,9vw,3rem)]",
              "md:portrait:text-[clamp(2.75rem,7vw,4rem)]",
            ].join(" ")}
          >
            {slide.title}
          </span>
        </h2>
        {slide.eyebrow ? (
          <p
            data-most-ordered-copy
            className={[
              "-mt-2 font-black uppercase tracking-[0.18em]",
              "text-[clamp(0.72rem,1vw,1rem)] text-soky-white/95",
              "font-soky-support",

              "[@media(max-height:500px)_and_(orientation:landscape)]:-mt-1",
              "[@media(max-height:500px)_and_(orientation:landscape)]:text-[0.55rem]",
            ].join(" ")}
          >
            {slide.eyebrow}
          </p>
        ) : null}
        {slide.productName ? (
          <div
            className="mt-2 flex flex-col items-center"
            data-most-ordered-copy
          >
            <p
              className={[
                "font-soky-support",
                "text-[clamp(2.6rem,5vw,5.8rem)]",
                "font-bold leading-[0.9] text-soky-white",
                "drop-shadow-[0_5px_0_rgb(216_79_0_/_0.22)]",
                "tracking-[-0.035em]",

                "[@media(max-height:500px)_and_(orientation:landscape)]:text-[1.8rem]",
                "max-md:portrait:text-[clamp(3rem,13vw,4.2rem)]",
                "md:portrait:text-[clamp(4rem,9vw,5.5rem)]",
              ].join(" ")}
            >
              {slide.productName}
            </p>

            {slide.promoNote ? (
              <span
                className={[
                  "-mt-1 rotate-[-2deg] rounded-md bg-soky-blue",
                  "px-4 py-1",
                  "font-soky-support",
                  "text-sm font-bold text-soky-white",
                  "shadow-[0_4px_0_rgb(7_5_74_/_0.18)]",

                  "[@media(max-height:500px)_and_(orientation:landscape)]:px-2",
                  "[@media(max-height:500px)_and_(orientation:landscape)]:py-0.5",
                  "[@media(max-height:500px)_and_(orientation:landscape)]:text-[0.6rem]",
                ].join(" ")}
              >
                {slide.promoNote}
              </span>
            ) : null}
          </div>
        ) : null}

        {slide.description ? (
          <p
            data-most-ordered-copy
            className={[
              "mx-auto mt-4 max-w-136",
              "text-[clamp(0.85rem,1.15vw,1.1rem)]",
              "font-medium leading-relaxed tracking-[0.005em] text-soky-white/95",
              "font-soky-support",

              "max-md:portrait:mx-auto",
              "max-md:portrait:mt-2",
              "max-md:portrait:max-w-[30ch]",
              "max-md:portrait:text-sm",
              "max-md:portrait:leading-snug",
              "max-md:portrait:relative",
              "max-md:portrait:top-[1svh]",

              "md:portrait:mt-5",
              "md:portrait:max-w-160",
              "md:portrait:text-base",

              "md:max-xl:landscape:ml-auto",
              "md:max-xl:landscape:max-w-[34ch]",
              "md:max-xl:landscape:text-sm",
              "md:max-xl:landscape:leading-snug",

              "[@media(max-height:500px)_and_(orientation:landscape)]:hidden",
              "[@media(max-height:500px)_and_(orientation:landscape)]:mt-2",
              "[@media(max-height:500px)_and_(orientation:landscape)]:text-[0.62rem]",
              "[@media(max-height:500px)_and_(orientation:landscape)]:leading-tight",
            ].join(" ")}
          >
            {slide.description}
          </p>
        ) : null}
      </div>
      {(primaryCta && primaryHref) || (secondaryCta && secondaryHref) ? (
        <div
          data-most-ordered-actions
          className={[
            "absolute z-20",

            "max-md:portrait:inset-x-[7%]",
            "max-md:portrait:bottom-[calc(5.5rem-2.5svh)]",
            "max-md:portrait:grid",
            "max-md:portrait:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]",
            "max-md:portrait:gap-2",

            "md:portrait:inset-x-[14%]",
            "md:portrait:bottom-23",
            "md:portrait:flex",
            "md:portrait:justify-center",
            "md:portrait:gap-3",

            "landscape:right-[4%]",
            "landscape:top-[72%]",
            "landscape:flex",
            "landscape:w-[40%]",
            "landscape:justify-center",
            "landscape:gap-3",

            "xl:landscape:top-[74%]",

            "[@media(max-height:500px)_and_(orientation:landscape)]:right-[3%]",
            "[@media(max-height:500px)_and_(orientation:landscape)]:top-[68%]",
            "[@media(max-height:500px)_and_(orientation:landscape)]:bottom-auto",
            "[@media(max-height:500px)_and_(orientation:landscape)]:w-[42%]",
            "[@media(max-height:500px)_and_(orientation:landscape)]:gap-2",
          ].join(" ")}
        >
          {primaryCta && primaryHref ? (
            <Button
              variant="ghost"
              data-hero-cta
              href={primaryHref}
              scroll={primaryHref.startsWith("/menu/") ? false : undefined}
              data-transition-ignore={primaryHref.startsWith("/menu/") || primaryHref.startsWith("#") || primaryHref.startsWith("/#") ? true : undefined}
              target={primaryIsExternal ? "_blank" : undefined}
              rel={primaryIsExternal ? "noopener noreferrer" : undefined}
              className={styles.primaryAction}
            >
              <span aria-hidden="true" className={styles.actionIcon}><MostOrderedCtaIcon type={primaryCta.type} /></span>
              <span className={styles.actionLabel}>{primaryCta.label}</span>
            </Button>
          ) : null}

          {secondaryCta && secondaryHref ? (
            <Button
              variant="ghost"
              data-hero-cta
              href={secondaryHref}
              scroll={secondaryHref.startsWith("/menu/") ? false : undefined}
              data-transition-ignore={secondaryHref.startsWith("/menu/") || secondaryHref.startsWith("#") || secondaryHref.startsWith("/#") ? true : undefined}
              target={secondaryIsExternal ? "_blank" : undefined}
              rel={secondaryIsExternal ? "noopener noreferrer" : undefined}
              className={styles.secondaryAction}
            >
              <span aria-hidden="true" className={styles.actionIcon}><MostOrderedCtaIcon type={secondaryCta.type} /></span>
              <span className={styles.actionLabel}>{secondaryCta.label}</span>
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
