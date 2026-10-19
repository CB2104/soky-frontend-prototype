"use client";

import type { CSSProperties } from "react";
import type { HeroSlideViewModel } from "../types";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useHomeLoading } from "@/features/home/loading/HomeLoadingBoundary";
import { useHomeGSAP } from "@/features/home/loading/useHomeGSAP";
import { useRef } from "react";
import { HeroFullCanvasLayer } from "./HeroFullCanvasLayer";
import { MapPinIcon, WhatsAppSVG } from "@/components/brand/IconsSVG";
import AnimatedSokyLogo from "@/components/brand/AnimatedSokyLogo";
import { useReducedMotion } from "motion/react";
import { SplitText } from "gsap/SplitText";
import serviceStyles from "./ServiceAnnouncementHero.module.css";
import styles from "./HeroActions.module.css";

gsap.registerPlugin(useGSAP, SplitText);

type ServiceAnnouncementHeroProps = {
  className?: string;
  fallbackDescription: string;
  isActive: boolean;
  isInitialSlide?: boolean;
  slide: HeroSlideViewModel;
  whatsappUrl: string;
};

const serviceAnnouncementBackgroundStyle: CSSProperties = {
  backgroundImage: [
    "radial-gradient(ellipse 85% 75% at 72% 48%, rgb(255 120 0 / 0.22) 0%, rgb(244 91 0 / 0.10) 48%, transparent 100%)",
    "linear-gradient(145deg, #ff7800 0%, #fe6402 52%, #f45b00 100%)",
  ].join(", "),
};

const serviceAnnouncementDesktopBackgroundStyle: CSSProperties = {
  backgroundImage: [
    "radial-gradient(ellipse 85% 75% at 72% 48%, rgb(255 179 0 / 24%) 0%, rgb(255 179 0 / 0%) 75%)",
    "linear-gradient(145deg, #ff7800 0%, #fe6402 52%, #f45b00 100%)",
  ].join(", "),
};

const serviceAnnouncementDesktopGlowStyle: CSSProperties = {
  backgroundImage:
    "radial-gradient(ellipse 36% 32% at 72% 42%, rgb(255 193 74 / 32%) 0%, rgb(255 193 74 / 0%) 76%)",
};

const serviceAnnouncementDesktopShadowStyle: CSSProperties = {
  backgroundImage:
    "radial-gradient(ellipse 38% 28% at 95% 90%, rgb(233 75 0 / 18%) 0%, rgb(233 75 0 / 0%) 82%)",
};

const serviceAnnouncementDesktopNavyLightStyle: CSSProperties = {
  backgroundImage:
    "radial-gradient(ellipse 72% 58% at 54% 34%, rgb(41 91 122 / 20%) 0%, rgb(41 91 122 / 8%) 42%, rgb(41 91 122 / 0%) 76%)",
};

const serviceAnnouncementDesktopNavyShadowStyle: CSSProperties = {
  backgroundImage:
    "radial-gradient(ellipse 70% 64% at 0% 100%, rgb(0 7 16 / 40%) 0%, rgb(0 7 16 / 14%) 48%, rgb(0 7 16 / 0%) 86%)",
};

const serviceAnnouncementMaskStyle: CSSProperties = {
  maskImage: 'url("/images/hero/soky-slide4-organic-stage.svg")',
  maskPosition: "center",
  maskRepeat: "no-repeat",
  maskSize: "100% 100%",
  WebkitMaskImage: 'url("/images/hero/soky-slide4-organic-stage.svg")',
  WebkitMaskPosition: "center",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskSize: "100% 100%",
};

const serviceAnnouncementDesktopMaskStyle: CSSProperties = {
  maskImage: 'url("/images/hero/soky-slide4-organic-stage-desktop.svg")',
  maskPosition: "center",
  maskRepeat: "no-repeat",
  maskSize: "100% 100%",
  WebkitMaskImage: 'url("/images/hero/soky-slide4-organic-stage-desktop.svg")',
  WebkitMaskPosition: "center",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskSize: "100% 100%",
};

const serviceAnnouncementBrushMaskStyle: CSSProperties = {
  maskImage: 'url("/images/hero/soky-slide4-brush-stroke.svg")',
  maskPosition: "center",
  maskRepeat: "no-repeat",
  maskSize: "100% 100%",
  WebkitMaskImage: 'url("/images/hero/soky-slide4-brush-stroke.svg")',
  WebkitMaskPosition: "center",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskSize: "100% 100%",
};

const serviceAnnouncementStyle = {
  ...serviceAnnouncementBackgroundStyle,
  "--slide4-mobile-lift": "7svh",
} as CSSProperties;

function getWhatsAppHref(baseUrl: string, message: string | null) {
  if (!message?.trim()) {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set("text", message.trim());
    return url.toString();
  } catch {
    return baseUrl;
  }
}

export default function ServiceAnnouncementHero({
  className,
  fallbackDescription,
  isActive,
  isInitialSlide = false,
  slide,
  whatsappUrl,
}: ServiceAnnouncementHeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLElement | null>(null);
  const description = slide.description ?? fallbackDescription;
  const productLayer = slide.productLayer;
  const headingId = `service-announcement-${slide.id}-heading`;
  const descriptionId = `service-announcement-${slide.id}-description`;
  const primaryCta = slide.primaryCta;
  const secondaryCta = slide.secondaryCta;
  const primaryHref =
    primaryCta?.type === "WHATSAPP"
      ? getWhatsAppHref(whatsappUrl, primaryCta.target)
      : primaryCta?.href;
  const secondaryHref = secondaryCta?.href;
  const productIsHidden = productLayer?.decorative || !isActive;

  const { startEntrance } = useHomeLoading();

  useHomeGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const eyebrow = root.querySelector<HTMLElement>("[data-slide4-eyebrow]");
      const underline = root.querySelector<HTMLElement>(
        "[data-slide4-underline]",
      );
      const titleLines = Array.from(
        root.querySelectorAll<HTMLElement>("[data-slide4-title-line]"),
      );
      const description = root.querySelector<HTMLElement>(
        "[data-slide4-description]",
      );
      const actions = root.querySelector<HTMLElement>("[data-slide4-actions]");
      const ctas = Array.from(
        root.querySelectorAll<HTMLElement>("[data-hero-cta]"),
      );
      const product = root.querySelector<HTMLElement>("[data-slide4-product]");
      const particles = root.querySelector<HTMLElement>(
        "[data-slide4-accent-particles]",
      );

      if (
        !eyebrow ||
        !underline ||
        !titleLines.length ||
        !description ||
        !actions
      ) {
        return;
      }

      const elements = [
        eyebrow,
        underline,
        ...titleLines,
        description,
        actions,
        ...ctas,
        product,
        particles,
      ].filter((element): element is HTMLElement => Boolean(element));

      if (shouldReduceMotion) {
        gsap.set(elements, { clearProps: "opacity,visibility,transform" });
        return;
      }

      const titleSplits = titleLines.map(
        (line) => new SplitText(line, { type: "words" }),
      );
      const titleWords = titleSplits.flatMap((split) => split.words);

      const timeline = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out" },
      });

      timeline
        .fromTo(
          eyebrow,
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.42 },
          0,
        )
        .fromTo(
          underline,
          { scaleX: 0, transformOrigin: "left center" },
          { scaleX: 1, duration: 0.38 },
          0.24,
        )
        .fromTo(
          titleWords,
          { autoAlpha: 0, yPercent: 28, rotation: -1 },
          {
            autoAlpha: 1,
            yPercent: 0,
            rotation: 0,
            duration: 0.65,
            stagger: 0.055,
            ease: "power3.out",
          },
          0.3,
        );

      if (product) {
        timeline.fromTo(
          product,
          {
            autoAlpha: 1,
            xPercent: 12,
            yPercent: 5,
            scale: 0.94,
            rotation: -22.5,
          },
          {
            autoAlpha: 1,
            xPercent: 0,
            yPercent: 0,
            scale: 1,
            rotation: 0,
            duration: 0.75,
            ease: "back.out(1.18)",
          },
          0.68,
        );
      }

      if (particles) {
        timeline
          .fromTo(
            particles,
            { autoAlpha: 0, scale: 0.92 },
            {
              autoAlpha: 0.95,
              scale: 1.05,
              duration: 0.2,
              ease: "power2.out",
            },
            0.97,
          )
          .to(particles, {
            autoAlpha: 0.55,
            scale: 1.01,
            duration: 0.12,
            ease: "power1.in",
          })
          .to(particles, {
            autoAlpha: 1,
            scale: 1,
            duration: 0.28,
            ease: "power2.out",
          });
      }

      timeline
        .fromTo(
          description,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.4 },
          0.96,
        )
        .fromTo(actions, { y: 10 }, { y: 0, duration: 0.42 }, 1.22);

      if (ctas.length) {
        timeline.fromTo(
          ctas,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.4, stagger: 0.08 },
          1.22,
        );
      }

      let cancelEntrance = () => {};
      if (isActive) cancelEntrance = startEntrance(() => { timeline.restart(); });
      else timeline.progress(1).pause();

      return () => {
        cancelEntrance();
        timeline.kill();
        titleSplits.forEach((split) => split.revert());
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
      aria-describedby={descriptionId}
      aria-labelledby={headingId}
      className={cn(
        "relative isolate h-full min-h-0 overflow-hidden text-soky-white",
        className,
      )}
      data-hero-service-announcement
      style={serviceAnnouncementStyle}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 hidden md:block"
        style={serviceAnnouncementDesktopBackgroundStyle}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 hidden md:block"
        style={serviceAnnouncementDesktopGlowStyle}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 hidden md:block"
        style={serviceAnnouncementDesktopShadowStyle}
      />

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute z-10 overflow-hidden bg-[#001525] md:hidden",
          "left-[-8%] top-[-9%] h-[112%] w-[82%]",
          "max-md:portrait:left-[-14%] max-md:portrait:top-[7%] max-md:portrait:h-[78%] max-md:portrait:w-[118%]",
          "[@media(max-height:500px)_and_(orientation:landscape)]:left-[-8%]",
          "[@media(max-height:500px)_and_(orientation:landscape)]:top-[-12%]",
          "[@media(max-height:500px)_and_(orientation:landscape)]:h-[124%]",
          "[@media(max-height:500px)_and_(orientation:landscape)]:w-[80%]",
        ].join(" ")}
        style={serviceAnnouncementMaskStyle}
      >
        <div className="absolute inset-0 bg-[url('/images/patterns/endless-clouds-light.svg')] bg-repeat bg-[length:112px_auto] opacity-[0.1]" />
      </div>

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute z-10 hidden overflow-hidden bg-[#001525] md:block",
          "left-[-8%] top-[-7%] h-[108%] w-[78%]",
          "[@media(max-height:500px)_and_(orientation:landscape)]:left-[-8%]",
          "[@media(max-height:500px)_and_(orientation:landscape)]:top-[-12%]",
          "[@media(max-height:500px)_and_(orientation:landscape)]:h-[124%]",
          "[@media(max-height:500px)_and_(orientation:landscape)]:w-[80%]",
        ].join(" ")}
        style={serviceAnnouncementDesktopMaskStyle}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={serviceAnnouncementDesktopNavyLightStyle}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={serviceAnnouncementDesktopNavyShadowStyle}
        />
        <div className="absolute inset-0 bg-[url('/images/patterns/endless-clouds-light.svg')] bg-repeat bg-[length:clamp(96px,7vw,144px)_auto] opacity-[0.1]" />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-20%] top-[-4%] z-0 aspect-[1600/300] w-[58%] max-w-none origin-center rotate-[-16deg] scale-y-[1.45] bg-[#FFC04A] opacity-[0.42] max-md:portrait:left-[-55%] max-md:portrait:top-[-2%] max-md:portrait:w-[150%] max-md:portrait:rotate-[-28deg] max-md:portrait:scale-y-100 max-md:portrait:bg-[#FFB13B] max-md:portrait:opacity-[0.36] [@media(max-height:500px)_and_(orientation:landscape)]:!left-[-12%] [@media(max-height:500px)_and_(orientation:landscape)]:!top-[-7%] [@media(max-height:500px)_and_(orientation:landscape)]:!w-[52%] [@media(max-height:500px)_and_(orientation:landscape)]:!rotate-[-12deg] [@media(max-height:500px)_and_(orientation:landscape)]:!scale-y-[1.2]"
        style={serviceAnnouncementBrushMaskStyle}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-14%] top-[7%] z-0 aspect-[1600/300] w-[44%] max-w-none origin-center rotate-[22deg] scale-y-[1.5] bg-[#E94B00] opacity-[0.24] md:top-[15%] md:opacity-[0.3] max-md:portrait:right-[-50%] max-md:portrait:top-[48%] max-md:portrait:w-[110%] max-md:portrait:rotate-[22deg] max-md:portrait:scale-y-100 max-md:portrait:bg-[#FFB13B] max-md:portrait:opacity-[0.34] [@media(max-height:500px)_and_(orientation:landscape)]:!right-[-8%] [@media(max-height:500px)_and_(orientation:landscape)]:!top-[8%] [@media(max-height:500px)_and_(orientation:landscape)]:!w-[50%] [@media(max-height:500px)_and_(orientation:landscape)]:!rotate-[15deg] [@media(max-height:500px)_and_(orientation:landscape)]:!scale-y-[1.25] [@media(max-height:500px)_and_(orientation:landscape)]:!opacity-[0.28]"
        style={serviceAnnouncementBrushMaskStyle}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-5%] left-[-18%] z-0 aspect-[1600/300] w-[58%] max-w-none origin-center rotate-[10deg] scale-y-[1.4] bg-[#FFC04A] opacity-[0.38] md:bottom-auto md:left-[29%] md:top-[28%] md:w-[54%] md:rotate-[18deg] md:scale-y-[1.5] md:bg-[#FFC04A] md:opacity-[0.36] max-md:portrait:bottom-[10%] max-md:portrait:left-[-55%] max-md:portrait:w-[145%] max-md:portrait:rotate-[10deg] max-md:portrait:scale-y-[1.25] max-md:portrait:bg-[#FFB13B] max-md:portrait:opacity-[0.58] [@media(max-height:500px)_and_(orientation:landscape)]:!bottom-[1%] [@media(max-height:500px)_and_(orientation:landscape)]:!left-auto [@media(max-height:500px)_and_(orientation:landscape)]:!right-[-10%] [@media(max-height:500px)_and_(orientation:landscape)]:!top-auto [@media(max-height:500px)_and_(orientation:landscape)]:!w-[58%] [@media(max-height:500px)_and_(orientation:landscape)]:!rotate-[-7deg] [@media(max-height:500px)_and_(orientation:landscape)]:!scale-y-[1.2] [@media(max-height:500px)_and_(orientation:landscape)]:!opacity-[0.42]"
        style={serviceAnnouncementBrushMaskStyle}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-36%] bottom-[13%] z-0 aspect-[1600/300] w-[46%] max-w-none origin-center rotate-180 scale-y-[1.55] bg-[#E94B00] opacity-[0.24] md:right-[14%] md:bottom-[14%] md:w-[40%] md:scale-y-[1.45] md:bg-[#E94B00] md:opacity-[0.24] max-md:portrait:hidden [@media(max-height:500px)_and_(orientation:landscape)]:!right-[-5%] [@media(max-height:500px)_and_(orientation:landscape)]:!bottom-[10%] [@media(max-height:500px)_and_(orientation:landscape)]:!w-[44%] [@media(max-height:500px)_and_(orientation:landscape)]:!scale-y-[1.2] [@media(max-height:500px)_and_(orientation:landscape)]:!opacity-[0.2]"
        style={serviceAnnouncementBrushMaskStyle}
      />

      {productLayer ? (
        <div
          data-slide4-scene
          aria-hidden={productIsHidden ? "true" : undefined}
          className={[
            "pointer-events-none absolute z-20 select-none",
            "right-[-5%] top-[17%] h-[50%] w-[35%] md:right-[-6%] md:top-[15%] md:h-[56%] md:w-[40%] md:drop-shadow-[0_18px_18px_rgb(255_116_0_/_0.24)]",
            "max-md:portrait:right-[-5%] max-md:portrait:top-[calc(62%_-_var(--slide4-mobile-lift))] max-md:portrait:h-[27%] max-md:portrait:w-[48%]",
            "[@media(max-height:500px)_and_(orientation:landscape)]:right-[-9%]",
            "[@media(max-height:500px)_and_(orientation:landscape)]:top-[20%]",
            "[@media(max-height:500px)_and_(orientation:landscape)]:h-[52%]",
            "[@media(max-height:500px)_and_(orientation:landscape)]:w-[38%]",
            "[@media(max-width:767px)_and_(max-height:500px)_and_(orientation:landscape)]:!right-[8%]",
            "[@media(max-width:767px)_and_(max-height:500px)_and_(orientation:landscape)]:!top-[14%]",
            "[@media(max-width:767px)_and_(max-height:500px)_and_(orientation:landscape)]:!h-[48%]",
            "[@media(max-width:767px)_and_(max-height:500px)_and_(orientation:landscape)]:!w-[38%]",
          ].join(" ")}
        >
          <div data-slide4-product className="absolute inset-0 z-0">
            <HeroFullCanvasLayer
              alt={productLayer.alt}
              decorative={productLayer.decorative || !isActive}
              fit={productLayer.fit}
              position={productLayer.position}
              priority={isInitialSlide}
              sizes="(max-width: 767px) and (orientation: landscape) 38vw, (max-width: 767px) 48vw, 40vw"
              sources={productLayer.sources}
            />
          </div>

          <div
            aria-hidden="true"
            className={[
              "pointer-events-none absolute z-10 select-none",
              "left-[-75%] top-[-30%] h-[144%] w-[123%]",
              "md:left-[-55%] md:top-[-14%] md:h-[129%] md:w-[128%]",
              "max-md:portrait:left-[-55%] max-md:portrait:top-0 max-md:portrait:h-[99%] max-md:portrait:w-[107%]",
              "max-[350px]:portrait:!top-[22%] max-[350px]:portrait:!h-[74%] max-[350px]:portrait:[clip-path:inset(24%_0_0_0)]",
              "[@media(max-height:500px)_and_(orientation:landscape)]:!left-[-45%]",
            ].join(" ")}
            data-slide4-accent-layer
            data-slide4-accent-particles
          >
            <Image
              alt=""
              className="object-contain"
              draggable={false}
              fill
              sizes="(orientation: portrait) 62vw, 43vw"
              src="/images/hero/soky-slide4-accent-particles.webp"
            />
          </div>
        </div>
      ) : null}

      <div className="relative z-10 flex h-full min-h-0 flex-col px-[9vw] pb-24 pt-[calc(var(--navbar-height)_+_1.25rem)] sm:pb-28 sm:pt-[calc(var(--navbar-height)_+_1.5rem)] md:px-0 md:pt-[calc(var(--navbar-height)_+_0.25rem)] [@media(max-height:500px)_and_(orientation:landscape)]:!pb-2 [@media(max-height:500px)_and_(orientation:landscape)]:!pt-[calc(3.5rem_+_0.5rem)] [@media(min-height:400px)_and_(max-height:500px)_and_(orientation:landscape)]:!pt-24">
        <div className="flex min-h-0 flex-1 items-start">
          <div className="w-full max-w-[34rem] pt-[5%] md:ml-[5%] md:max-w-[min(45vw,44rem)] md:portrait:ml-[12%] md:portrait:max-w-[50vw] md:pt-0 max-md:portrait:pt-[10%] [@media(max-height:500px)_and_(orientation:landscape)]:!ml-[7%] [@media(max-width:767px)_and_(max-height:500px)_and_(orientation:landscape)]:!ml-0 [@media(max-height:500px)_and_(orientation:landscape)]:!max-w-[min(50vw,23rem)] [@media(max-height:500px)_and_(orientation:landscape)]:!pt-0 [@media(min-width:768px)_and_(min-height:501px)]:my-auto">
            <p
              data-slide4-eyebrow
              className="font-soky-support text-sm font-black uppercase tracking-[0.16em] text-soky-orange md:text-base [@media(max-height:500px)_and_(orientation:landscape)]:!text-[clamp(0.75rem,3svh,1rem)]"
            >
              {slide.eyebrow ?? "DELIVERY + PICKUP"}
            </p>
            <div
              data-slide4-underline
              className="mt-[10px] h-[2px] w-16 bg-soky-orange md:mt-3 md:h-[3px] md:w-[88px] [@media(max-height:500px)_and_(orientation:landscape)]:!mt-1 [@media(max-height:500px)_and_(orientation:landscape)]:!h-[2px] [@media(max-height:500px)_and_(orientation:landscape)]:!w-14"
            />

            <h1
              className="mt-7 space-y-1 max-w-none font-soky-display text-[clamp(3.4rem,7.3vw,8.25rem)] uppercase leading-[0.84] tracking-[-0.025em] text-soky-white drop-shadow-[0_4px_0_rgb(0_21_37_/_0.14)] md:origin-left md:scale-x-[1.08] md:portrait:text-[clamp(4rem,8.2vw,6rem)] max-md:portrait:mt-6 max-md:portrait:text-[clamp(3.25rem,13vw,6.4rem)] [@media(max-height:500px)_and_(orientation:landscape)]:!mt-2 [@media(max-height:500px)_and_(orientation:landscape)]:!space-y-0 [@media(max-height:500px)_and_(orientation:landscape)]:!text-[clamp(2.25rem,12svh,3.75rem)] [@media(max-height:500px)_and_(orientation:landscape)]:!leading-[0.88]"
              id={headingId}
            >
              <span className="block" data-slide4-title-line>
                NO TE QUEDES
              </span>
              <span className="block" data-slide4-title-line>
                CON LAS
              </span>
              <span className="block" data-slide4-title-line>
                GANAS
              </span>
            </h1>

            <p
              data-slide4-description
              className="mt-7 max-w-[34ch] text-pretty font-soky-body text-base font-medium leading-[1.2] text-soky-white/95 sm:text-lg md:mt-8 md:portrait:text-[clamp(1.125rem,1.9vw,1.375rem)] md:text-[clamp(1.05rem,1.65vw,1.55rem)] [@media(max-height:500px)_and_(orientation:landscape)]:!mt-1 [@media(max-height:500px)_and_(orientation:landscape)]:!text-[clamp(0.8rem,3svh,1rem)] [@media(max-height:500px)_and_(orientation:landscape)]:!leading-[1.1]"
              id={descriptionId}
            >
              {description}
            </p>

            <div
              aria-label="Acciones para pedir/visitar SOKY"
              data-slide4-actions
              className={serviceStyles.actions}
              role="group"
            >
              {primaryCta && primaryHref ? (
                <Button
                  variant="primary"
                  data-hero-cta
                  aria-label={
                    primaryCta.type === "WHATSAPP"
                      ? "Pedir por WhatsApp"
                      : primaryCta.label
                  }
                  className={styles.primaryAction}
                  href={primaryHref}
                  data-transition-ignore={primaryHref.startsWith("#") || primaryHref.startsWith("/#") ? true : undefined}
                  rel={
                    primaryCta.type === "WHATSAPP"
                      ? "noopener noreferrer"
                      : undefined
                  }
                  target={primaryCta.type === "WHATSAPP" ? "_blank" : undefined}
                >
                  <span aria-hidden="true" className={styles.actionIcon}><WhatsAppSVG /></span>
                  <span className={cn(styles.actionLabel, "max-[350px]:hidden")}>{primaryCta.label}</span>
                  <span className={cn(styles.actionLabel, "hidden max-[350px]:inline")}>
                    {primaryCta.type === "WHATSAPP"
                      ? "PEDIR"
                      : primaryCta.label}
                  </span>
                </Button>
              ) : null}
              {secondaryCta && secondaryHref ? (
                <Button
                  variant="secondary"
                  data-hero-cta
                  aria-label={
                    secondaryCta.type === "LOCATION"
                      ? "Ver ubicación"
                      : secondaryCta.label
                  }
                  className={styles.secondaryAction}
                  href={secondaryHref}
                  data-transition-ignore={secondaryHref.startsWith("#") || secondaryHref.startsWith("/#") ? true : undefined}
                >
                  <span aria-hidden="true" className={styles.actionIcon}><MapPinIcon /></span>
                  <span className={cn(styles.actionLabel, "max-[350px]:hidden")}>
                    {secondaryCta.label}
                  </span>
                  <span className={cn(styles.actionLabel, "hidden max-[350px]:inline")}>
                    {secondaryCta.type === "LOCATION"
                      ? "UBICACIÓN"
                      : secondaryCta.label}
                  </span>
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute bottom-[7%] right-[7%] z-30 flex flex-col items-center max-md:portrait:bottom-[calc(5%_+_var(--slide4-mobile-lift))] max-md:portrait:right-[7%] max-[350px]:portrait:!right-[1%] [@media(max-height:500px)_and_(orientation:landscape)]:!bottom-[6%] [@media(max-height:500px)_and_(orientation:landscape)]:!right-[5%]"
          data-slide4-brand-lockup
        >
          <AnimatedSokyLogo
            key={`${slide.id}-${isActive ? "active" : "inactive"}`}
            className="h-16 w-auto max-md:portrait:h-14 max-[350px]:portrait:!h-10 md:h-[5.5rem] [@media(max-height:500px)_and_(orientation:landscape)]:!h-10"
            orange="#FE6402"
            title=""
            white="#FFFDF7"
          />
          <span className="mt-1 font-soky-support text-[0.48rem] font-black uppercase tracking-[0.32em] text-soky-white sm:text-[0.58rem] md:text-[0.64rem] max-[350px]:portrait:!text-[0.35rem] max-[350px]:portrait:!tracking-[0.16em] [@media(max-height:500px)_and_(orientation:landscape)]:!mt-0.5 [@media(max-height:500px)_and_(orientation:landscape)]:!text-[0.42rem]">
            Sushi que te acompaña
          </span>
        </div>
      </div>
    </section>
  );
}
