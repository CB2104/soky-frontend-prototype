import { WaveDivider } from "@/components/ui/wave-divider";
import { PatternSurface } from "@/components/ui/pattern-surface";
import { Container } from "@/components/ui/container";
import { BrushLabel } from "@/components/ui/brush-label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { HeroSlideViewModel } from "../types";
import { HeroBackgroundLayers } from "./HeroBackgroundLayers";
import { HeroMedia } from "./HeroMedia";
import { WelcomeHeroHeadline } from "./WelcomeHeroHeadline";
import {
  ArrowRightIcon,
  MapPinIcon,
  WhatsAppSVG,
} from "@/components/brand/IconsSVG";

type WelcomeSplitHeroProps = {
  className?: string;
  fallbackDescription: string;
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
  desktopSrc: fallbackImageSrc,
  mobileSrc: fallbackMobileImageSrc,
  alt: fallbackImageAlt,
  mode: "framed-photo",
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
  fallbackDescription,
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

  const heroTitle = slide?.title ?? "Sushi para compartir";
  const heroDescription = slide?.description ?? fallbackDescription;
  const heroPattern = getWelcomePattern(slide?.presentation.pattern);
  const stampTone = getWelcomeStampTone(slide?.presentation.badgeTone);
  const heroBackground = slide?.background ?? fallbackBackground;
  const heroImage = slide?.image ?? fallbackImage;
  const heroBadgeLabel = slide ? slide.badgeLabel : "Popular";
  const heroHeadingId = "soky-welcome-heading";

  return (
    <section
      id="promos"
      aria-labelledby={heroHeadingId}
      className={cn("h-full scroll-mt-24 md:h-auto", className)}
    >
      <PatternSurface
        className="relative h-full overflow-hidden bg-soky-blue text-soky-white md:h-auto"
        pattern={heroPattern}
      >
        <HeroBackgroundLayers background={heroBackground} />

        <Container
          size="wide"
          className="relative z-10 grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2.5 pb-[5.75rem] pt-4 sm:gap-4 sm:pt-6 md:h-auto md:min-h-[calc(100svh-4.5rem)] md:grid-cols-12 md:grid-rows-[auto_auto] md:content-center md:items-center md:gap-x-5 md:gap-y-5 md:py-10 lg:gap-x-7 lg:py-12"
        >
          <div className="contents">
            <div className="relative z-20 order-1 md:col-span-5 md:row-start-1 md:self-end">
              <BrushLabel className="mb-2 md:mb-4" color="orange">
                {slide?.eyebrow ?? "Bienvenido"}
              </BrushLabel>
              <WelcomeHeroHeadline
                description={heroDescription}
                headingId={heroHeadingId}
                showLogo={false}
                title={heroTitle}
              />
            </div>

            <div className="relative z-20 order-3 flex flex-col gap-3 self-end md:col-span-5 md:row-start-2 md:self-start">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Button
                href={primaryHref}
                target={primaryIsExternal ? "_blank" : undefined}
                rel={primaryIsExternal ? "noopener noreferrer" : undefined}
                size="lg"
                className="group min-h-12 w-full touch-manipulation justify-between gap-3 bg-soky-orange-deep bg-[url('/images/endless-clouds-light.svg')] bg-size-[56px_28px] bg-repeat px-4 text-sm font-black uppercase text-soky-white shadow-[0_14px_28px_rgb(7_5_74_/_0.2),0_6px_0_rgb(7_5_74_/_0.16)] ring-1 ring-soky-white/25 hover:-translate-y-0.5 hover:bg-soky-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2 focus-visible:ring-offset-soky-blue sm:w-auto sm:min-w-52 sm:px-6 sm:text-base md:min-h-14"
              >
                <span>{primaryCta?.label ?? "Ver menú"}</span>
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-soky-white/18 transition-transform duration-200 group-hover:translate-x-0.5 group-active:scale-95 [&_svg]:size-5"
                >
                  <HeroCtaIcon type={primaryCtaType} />
                </span>
              </Button>
              <Button
                href={secondaryHref}
                target={secondaryIsExternal ? "_blank" : undefined}
                rel={secondaryIsExternal ? "noopener noreferrer" : undefined}
                variant="ghost"
                size="lg"
                className="group min-h-12 w-full touch-manipulation justify-between gap-3 border-2 border-soky-white/80 bg-soky-white/8 px-4 text-sm font-extrabold text-soky-white shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.12)] hover:border-soky-orange hover:bg-soky-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2 focus-visible:ring-offset-soky-blue sm:w-auto sm:min-w-48 sm:px-6 sm:text-base md:min-h-14"
              >
                <span>{secondaryCta?.label ?? "Ubicación"}</span>
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-full border border-soky-white/45 bg-soky-blue/20 transition-transform duration-200 group-hover:translate-x-0.5 group-active:scale-95 [&_svg]:size-5"
                >
                  <HeroCtaIcon type={secondaryCtaType} />
                </span>
              </Button>
              </div>

            </div>
          </div>

          <HeroMedia
            badgeLabel={heroBadgeLabel}
            image={heroImage}
            stampTone={stampTone}
          />
        </Container>
        {showWaveDivider ? <WaveDivider tone="paper" /> : null}
      </PatternSurface>
    </section>
  );
}
