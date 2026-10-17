"use client";

import { SplitText } from "gsap/SplitText";
import gsap from "gsap";
import { cn } from "@/lib/cn";
import { useGSAP } from "@gsap/react";
import { useHomeLoading } from "@/features/home/loading/HomeLoadingBoundary";
import { useHomeGSAP } from "@/features/home/loading/useHomeGSAP";
import { WaveDivider } from "@/components/ui/wave-divider";
import { PatternSurface } from "@/components/ui/pattern-surface";
import { Container } from "@/components/ui/container";
import { BrushLabel } from "@/components/ui/brush-label";
import { Button } from "@/components/ui/button";
import type { HeroSlideViewModel } from "../types";
import { HeroBackgroundLayers } from "./HeroBackgroundLayers";
import { HeroMedia } from "./HeroMedia";
import { WelcomeHeroHeadline } from "./WelcomeHeroHeadline";
import {
  ArrowRightIcon,
  MapPinIcon,
  MenuBlockIcon,
  SushiSetIcon,
  WhatsAppSVG,
} from "@/components/brand/IconsSVG";
import { useRef } from "react";
import { useReducedMotion } from "motion/react";
import welcomeStyles from "./WelcomeSplitHero.module.css";
import styles from "./HeroActions.module.css";

gsap.registerPlugin(useGSAP, SplitText);

type WelcomeSplitHeroProps = {
  className?: string;
  isActive?: boolean;
  fallbackDescription: string;
  isInitialSlide?: boolean;
  renderBackground?: boolean;
  renderLegacyMedia?: boolean;
  showWaveDivider?: boolean;
  slide: HeroSlideViewModel | undefined;
  whatsappUrl: string;
};

type HeroCta = HeroSlideViewModel["primaryCta"];
type HeroCtaType = NonNullable<HeroCta>["type"];

type WelcomePattern = "seigaiha" | "asanoha";
type WelcomeStampTone = "promo" | "cold" | "new";

function getWelcomePattern(
  pattern: HeroSlideViewModel["presentation"]["pattern"] | undefined,
): WelcomePattern {
  return pattern === "asanoha" ? "asanoha" : "seigaiha";
}

function getWelcomeStampTone(
  tone: HeroSlideViewModel["presentation"]["badgeTone"] | undefined,
): WelcomeStampTone {
  if (tone === "new" || tone === "cold") {
    return tone;
  }

  return "promo";
}

function HeroCtaIcon({ type }: { type: HeroCtaType }) {
  if (type === "MENU") {
    return <MenuBlockIcon className="size-5 shrink-0" />;
  }

  if (type === "PRODUCT" || type === "CATEGORY") {
    return <SushiSetIcon className="size-6 shrink-0" />;
  }

  if (type === "LOCATION") {
    return <MapPinIcon className="size-5 shrink-0" />;
  }

  if (type === "WHATSAPP") {
    return <WhatsAppSVG className="size-5 shrink-0" />;
  }

  return <ArrowRightIcon className="size-5 shrink-0" />;
}

const fallbackImageSrc = "/images/soky-hero-party-box.png";
const fallbackMobileImageSrc = "/images/soky-hero-party-box.png";
const fallbackImageAlt = "Box de sushi SOKY con rolls y toppings.";
const fallbackImageSizes = "(min-width: 1024px) 58vw, 100vw";

const fallbackBackground = {
  mode: "two-layer",
  base: {
    colorToken: "brand-primary",
    image: null,
    opacity: null,
  },
  accent: {
    colorToken: "accent",
    image: null,
    opacity: 100,
    bleed: "contained-end",
  },
} satisfies HeroSlideViewModel["background"];

const fallbackImage = {
  sources: {
    desktop: fallbackImageSrc,
    desktopWide: fallbackImageSrc,
    tabletLandscape: fallbackImageSrc,
    tabletPortrait: fallbackMobileImageSrc,
    mobile: fallbackMobileImageSrc,
  },
  desktopSrc: fallbackImageSrc,
  mobileSrc: fallbackMobileImageSrc,
  alt: fallbackImageAlt,
  mode: "promo-image",
  fit: "cover",
  position: "center",
  frameEnabled: true,
  priority: true,
  sizes: fallbackImageSizes,
} satisfies HeroSlideViewModel["image"];

function getCtaHref(cta: HeroCta, fallbackHref: string, whatsappUrl: string) {
  if (!cta) {
    return fallbackHref;
  }
  if (cta.type === "WHATSAPP") {
    return whatsappUrl;
  }

  return cta.href ?? fallbackHref;
}

function isExternalCta(cta: HeroCta, fallbackIsExternal: boolean) {
  if (!cta) {
    return fallbackIsExternal;
  }
  return cta.type === "WHATSAPP" || cta.isExternal;
}

export function WelcomeSplitHero({
  className,
  isActive = false,
  fallbackDescription,
  isInitialSlide = false,
  renderBackground = true,
  renderLegacyMedia = true,
  showWaveDivider = true,
  slide,
  whatsappUrl,
}: WelcomeSplitHeroProps) {
  const primaryCta = slide?.primaryCta ?? null;
  const secondaryCta = slide?.secondaryCta ?? null;

  const primaryHref = getCtaHref(primaryCta, "/menu", whatsappUrl);
  const secondaryHref = getCtaHref(secondaryCta, "/#ubicacion", whatsappUrl);
  const primaryIsExternal = isExternalCta(primaryCta, false);
  const secondaryIsExternal = isExternalCta(secondaryCta, false);
  const primaryCtaType = primaryCta?.type ?? "MENU";
  const secondaryCtaType = secondaryCta?.type ?? "LOCATION";

  const heroTitle = slide?.title ?? "TU ANTOJO SOKY EMPIEZA AQUÍ";
  const heroDescription = slide?.description ?? fallbackDescription;
  const heroEyebrow = slide?.eyebrow?.trim() || null;
  const heroPattern = getWelcomePattern(slide?.presentation.pattern);
  const stampTone = getWelcomeStampTone(slide?.presentation.badgeTone);
  const heroBackground = slide?.background ?? fallbackBackground;
  const heroImage = slide?.image ?? fallbackImage;
  const heroBadgeLabel = slide?.badgeLabel ?? null;
  const heroHeadingId = `soky-welcome-heading-${slide?.id ?? "fallback"}`;

  const rootRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const { startEntrance } = useHomeLoading();

  useHomeGSAP(
    () => {
      const root = rootRef.current;

      if (!root) return;

      const titleElements = Array.from(
        root.querySelectorAll<HTMLElement>("[data-hero-title-text]"),
      );

      const description = root.querySelector<HTMLElement>(
        "[data-hero-description]",
      );

      const underline = root.querySelector<HTMLElement>(
        "[data-hero-underline]",
      );

      const ctas = Array.from(
        root.querySelectorAll<HTMLElement>("[data-hero-cta]"),
      );

      if (!description || !underline) return;

      if (shouldReduceMotion) {
        gsap.set([...titleElements, description, underline, ...ctas], {
          clearProps: "all",
        });

        return;
      }

      const descriptionSplit = new SplitText(description, {
        type: "words",
      });

      const titleWords = Array.from(root.querySelectorAll<HTMLElement>(
        "[data-hero-title-word], [data-hero-brand-logo]",
      ));

      const timeline = gsap.timeline({
        paused: true,
        defaults: {
          ease: "power3.out",
        },
      });

      timeline
        .fromTo(
          titleWords.length ? titleWords : titleElements,
          {
            autoAlpha: 0,
            yPercent: 100,
          },
          {
            autoAlpha: 1,
            yPercent: 0,
            duration: 0.65,
            stagger: 0.065,
          },
        )
        .fromTo(
          underline,
          {
            scaleX: 0,
            transformOrigin: "left center",
          },
          {
            scaleX: 1,
            duration: 0.35,
          },
          "-=0.4",
        )
        .fromTo(
          descriptionSplit.words,
          {
            autoAlpha: 0,
            yPercent: 70,
          },
          {
            autoAlpha: 1,
            yPercent: 0,
            duration: 0.45,
            stagger: 0.025,
          },
          "-=0.18",
        )
        .fromTo(
          ctas,
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
            stagger: 0.08,
            clearProps: "transform",
          },
          "-=0.12",
        );

      let cancelEntrance = () => {};
      if (isActive) {
        cancelEntrance = startEntrance(() => { timeline.restart(); });
      } else {
        timeline.progress(1).pause();
      }

      return () => {
        cancelEntrance();
        timeline.kill();
        descriptionSplit.revert();
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
      aria-labelledby={heroHeadingId}
      className={cn("h-full scroll-mt-24", welcomeStyles.root, className)}
    >
      <PatternSurface
        className={cn(
          "relative h-full overflow-hidden text-soky-white",
          renderBackground ? "bg-soky-blue" : "bg-transparent",
        )}
        pattern={heroPattern}
        showPattern={renderBackground}
      >
        {renderBackground ? (
          <HeroBackgroundLayers
            background={heroBackground}
            priority={isInitialSlide}
          />
        ) : null}

        <Container
          size="wide"
          className="relative z-10 grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-2.5 pb-28 pt-[calc(var(--navbar-height)_+_1.5rem)] sm:gap-4 sm:pt-[calc(var(--navbar-height)_+_1.75rem)] md:grid-cols-12 md:grid-rows-[auto_auto] md:content-center md:items-center md:gap-x-5 md:gap-y-5 md:pb-28 md:pt-[calc(var(--navbar-height)_+_2rem)] lg:gap-x-7 lg:pb-28 [@media(max-height:640px)]:gap-y-2 [@media(max-height:640px)]:pb-20 [@media(max-height:640px)]:pt-[calc(var(--navbar-height)_+_0.75rem)] [@media(max-height:560px)]:gap-y-1.5 [@media(max-height:560px)]:pb-20 [@media(max-height:560px)]:pt-[calc(var(--navbar-height)_+_0.25rem)] xl:pb-12 [@media(max-height:500px)_and_(orientation:landscape)]:content-center [@media(max-height:500px)_and_(orientation:landscape)]:gap-x-4 [@media(max-height:500px)_and_(orientation:landscape)]:gap-y-1 [@media(max-height:500px)_and_(orientation:landscape)]:pb-10 [@media(max-height:500px)_and_(orientation:landscape)]:pt-16"
        >
          <div className="contents">
            <div data-welcome-copy className="relative z-20 order-1 md:col-span-5 md:row-start-1 md:self-end [@media(max-height:500px)_and_(orientation:landscape)]:col-span-6 [@media(max-height:500px)_and_(orientation:landscape)]:col-start-1">
              {heroEyebrow ? (
              <BrushLabel
                  className="mb-3 md:mb-4 [@media(max-height:640px)]:mb-2 [@media(max-height:640px)]:px-3 [@media(max-height:640px)]:py-1.5 [@media(max-height:640px)]:text-base [@media(max-height:560px)]:mb-1.5 [@media(max-height:560px)]:py-1 [@media(max-height:500px)_and_(orientation:landscape)]:hidden"
                  color="orange"
                >
                  {heroEyebrow}
                </BrushLabel>
              ) : null}
              <WelcomeHeroHeadline
                as={isInitialSlide ? "h1" : "h2"}
                description={heroDescription}
                headingId={heroHeadingId}
                headlineParts={slide?.headlineParts}
                title={heroTitle}
              />
            </div>

            <div data-welcome-actions className="relative z-20 order-2 mt-1 flex flex-col gap-3 self-start md:col-span-5 md:row-start-2 md:self-start [@media(max-height:500px)_and_(orientation:landscape)]:col-span-6 [@media(max-height:500px)_and_(orientation:landscape)]:col-start-1">
              <div className="grid grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] items-center gap-2 sm:flex sm:flex-row sm:items-center sm:gap-3 [@media(max-height:500px)_and_(orientation:landscape)]:grid [@media(max-height:500px)_and_(orientation:landscape)]:gap-2 [@media(max-height:500px)_and_(orientation:landscape)]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <Button
                  variant="primary"
                  data-hero-cta
                  href={primaryHref}
                  scroll={primaryHref.startsWith("/menu/") ? false : undefined}
                  data-transition-ignore={primaryHref.startsWith("/menu/") || primaryHref.startsWith("#") || primaryHref.startsWith("/#") ? true : undefined}
                  target={primaryIsExternal ? "_blank" : undefined}
                  rel={primaryIsExternal ? "noopener noreferrer" : undefined}
                  className={styles.primaryAction}
                >
                  <span aria-hidden="true" className={styles.actionIcon}><HeroCtaIcon type={primaryCtaType} /></span>
                  <span className={styles.actionLabel}>{primaryCta?.label ?? "Ver Menú"}</span>
                </Button>
                <Button
                  variant="secondary"
                  data-hero-cta
                  href={secondaryHref}
                  scroll={secondaryHref.startsWith("/menu/") ? false : undefined}
                  data-transition-ignore={secondaryHref.startsWith("/menu/") || secondaryHref.startsWith("#") || secondaryHref.startsWith("/#") ? true : undefined}
                  target={secondaryIsExternal ? "_blank" : undefined}
                  rel={secondaryIsExternal ? "noopener noreferrer" : undefined}
                  className={styles.secondaryAction}
                >
                  <span aria-hidden="true" className={styles.actionIcon}><HeroCtaIcon type={secondaryCtaType} /></span>
                  <span className={styles.actionLabel}>{secondaryCta?.label ?? "Ubicación"}</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="contents">
            <HeroMedia
              badgeLabel={heroBadgeLabel}
              image={heroImage}
              renderImage={renderLegacyMedia}
              rotatorImages={slide?.rotatorImages}
              stampTone={stampTone}
            />
          </div>
        </Container>
        {showWaveDivider ? <WaveDivider tone="paper" /> : null}
      </PatternSurface>
    </section>
  );
}
