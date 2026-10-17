import { getImageProps } from "next/image";
import {
  ArrowRightIcon,
  MapPinIcon,
  MenuBlockIcon,
  SushiSetIcon,
  WhatsAppSVG,
} from "@/components/brand/IconsSVG";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { PatternSurface } from "@/components/ui/pattern-surface";
import { WaveDivider } from "@/components/ui/wave-divider";
import { cn } from "@/lib/cn";
import type {
  HeroBadgeTone,
  HeroCtaViewModel,
  HeroSlideViewModel,
} from "../types";
import { HeroBackgroundLayers } from "./HeroBackgroundLayers";
import styles from "./HeroActions.module.css";

type ConversionCtaHeroProps = {
  className?: string;
  fallbackDescription: string;
  isInitialSlide?: boolean;
  renderBackground?: boolean;
  showWaveDivider?: boolean;
  slide: HeroSlideViewModel;
  whatsappUrl: string;
};

type ConversionCtaType = HeroCtaViewModel["type"];
type HeroBackground = HeroSlideViewModel["background"];

const conversionFallbackBackground = {
  mode: "single",
  layer: {
    colorToken: "brand-primary",
    image: null,
    opacity: null,
  },
} satisfies HeroBackground;

const conversionImageWidth = 1400;
const conversionImageHeight = 980;

const imageFitClass: Record<HeroSlideViewModel["image"]["fit"], string> = {
  cover: "object-cover",
  contain: "object-contain",
};

const imagePositionClass: Record<
  HeroSlideViewModel["image"]["position"],
  string
> = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
  "center-left": "object-left",
  "center-right": "object-right",
};

const badgeToneClass: Record<HeroBadgeTone, string> = {
  promo: "border-soky-orange/70 bg-soky-orange/18 text-soky-orange",
  new: "border-japan-seal/70 bg-japan-seal/14 text-soky-white",
  cold: "border-soky-white/55 bg-soky-white/14 text-soky-white",
  neutral: "border-soky-white/45 bg-soky-white/12 text-soky-white",
};

const lightBadgeToneClass: Record<HeroBadgeTone, string> = {
  promo: "border-soky-orange-deep/60 bg-soky-orange/12 text-soky-orange-deep",
  new: "border-japan-seal/60 bg-japan-seal/10 text-japan-seal",
  cold: "border-soky-blue/40 bg-soky-blue/10 text-soky-blue",
  neutral: "border-soky-ink/20 bg-soky-white/80 text-soky-ink",
};

function getConversionBackground(background: HeroBackground) {
  return background.mode === "none" ? conversionFallbackBackground : background;
}

function getConversionPattern(
  pattern: HeroSlideViewModel["presentation"]["pattern"],
) {
  return pattern === "seigaiha" ? "seigaiha" : "asanoha";
}

function getBaseColorToken(background: HeroBackground) {
  if (background.mode === "single") {
    return background.layer.colorToken;
  }

  if (background.mode === "two-layer") {
    return background.base.colorToken;
  }

  return null;
}

function isLightBackground(background: HeroBackground) {
  const baseColorToken = getBaseColorToken(background);

  return baseColorToken === "paper" || baseColorToken === "white";
}

function getCtaHref(
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

function ConversionCtaIcon({ type }: { type: ConversionCtaType }) {
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

function ConversionCtaMedia({
  image,
  isLightSurface,
}: {
  image: HeroSlideViewModel["image"];
  isLightSurface: boolean;
}) {
  const isCutoutProduct = image.mode === "cutout-product";
  const hasFrame = image.frameEnabled && !isCutoutProduct;
  const resolvedImageFit = isCutoutProduct ? "contain" : image.fit;

  const imageClassName = cn(
    "block h-full w-full",
    imageFitClass[resolvedImageFit],
    imagePositionClass[image.position],
  );
  const imageLoading = image.priority ? "eager" : "lazy";
  const imageFetchPriority = image.priority ? "high" : "auto";

  const { props: desktopImageProps } = getImageProps({
    src: image.desktopSrc,
    alt: image.alt,
    width: conversionImageWidth,
    height: conversionImageHeight,
    sizes: image.sizes,
    preload: image.priority,
  });

  const { props: mobileImageProps } = getImageProps({
    src: image.mobileSrc,
    alt: image.alt,
    width: conversionImageWidth,
    height: conversionImageHeight,
    sizes: image.sizes,
    loading: imageLoading,
    fetchPriority: imageFetchPriority,
    preload: image.priority,
    className: imageClassName,
    style: { height: "100%", width: "100%" },
  });

  return (
    <div className="relative order-2 z-10 mx-auto min-h-0 w-full self-center md:order-none md:col-span-6 md:col-start-7 md:row-span-2 md:row-start-1 md:mx-0 md:self-center">
      <div
        className={cn(
          "relative z-10 mx-auto w-full",
          isCutoutProduct
            ? "h-[15rem] max-h-[28svh] max-w-[17.5rem] sm:h-[16rem] sm:max-h-[30svh] sm:max-w-[19rem] md:h-[30rem] md:max-h-[60vh] md:max-w-[31rem] lg:h-[33rem] lg:max-h-[64vh] lg:max-w-[34rem]"
            : "aspect-[4/3] max-w-[21rem] md:aspect-[16/10] md:max-w-[36rem] lg:max-w-[39rem] xl:max-w-[41rem]",
          hasFrame
            ? cn(
                "overflow-hidden rounded-[1.5rem] border-[4px] md:rounded-[1.8rem]",
                isLightSurface
                  ? "border-soky-white bg-soky-white"
                  : "border-soky-white/28 bg-soky-navy",
              )
            : "overflow-visible",
        )}
      >
        <picture className="block h-full w-full">
          <source
            media="(min-width: 768px)"
            sizes={desktopImageProps.sizes}
            srcSet={desktopImageProps.srcSet}
          />
          <img {...mobileImageProps} alt={image.alt} />
        </picture>
      </div>
    </div>
  );
}

export function ConversionCtaHero({
  className,
  fallbackDescription,
  isInitialSlide = false,
  renderBackground = true,
  showWaveDivider = true,
  slide,
  whatsappUrl,
}: ConversionCtaHeroProps) {
  const background = getConversionBackground(slide.background);
  const isLightSurface = isLightBackground(background);
  const description = slide.description ?? fallbackDescription;
  const headingId = `soky-conversion-cta-${slide.id}-heading`;
  const pattern = getConversionPattern(slide.presentation.pattern);

  const primaryCta = slide.primaryCta;
  const secondaryCta = slide.secondaryCta;
  const primaryHref = primaryCta
    ? getCtaHref(primaryCta, "/menu", whatsappUrl)
    : null;
  const secondaryHref = secondaryCta
    ? getCtaHref(secondaryCta, "/#ubicacion", whatsappUrl)
    : null;
  const primaryIsExternal = primaryCta ? isExternalCta(primaryCta) : false;
  const secondaryIsExternal = secondaryCta ? isExternalCta(secondaryCta) : false;
  const hasCtas = Boolean((primaryCta && primaryHref) || (secondaryCta && secondaryHref));

  return (
    <section
      aria-labelledby={headingId}
      className={cn("h-full scroll-mt-24 md:h-auto", className)}
    >
      <PatternSurface
        className={cn(
          "relative h-full overflow-hidden md:h-auto",
          isLightSurface
            ? cn("text-soky-ink", renderBackground ? "bg-soky-paper" : "bg-transparent")
            : cn("text-soky-white", renderBackground ? "bg-soky-blue" : "bg-transparent"),
        )}
        intensity="subtle"
        pattern={pattern}
        showPattern={renderBackground}
      >
        {renderBackground ? (
          <HeroBackgroundLayers background={background} priority={isInitialSlide} />
        ) : null}
        <Container
          size="wide"
          className="relative z-10 grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2.5 pb-[5.75rem] pt-[calc(var(--navbar-height)_+_1.5rem)] sm:gap-3 sm:pt-[calc(var(--navbar-height)_+_1.75rem)] md:h-auto md:min-h-[100svh] md:grid-cols-12 md:grid-rows-[auto_auto] md:content-center md:items-center md:gap-x-8 md:pb-10 md:pt-[calc(var(--navbar-height)_+_2.5rem)] lg:pb-12 lg:pt-[calc(var(--navbar-height)_+_3rem)]"
        >
          <div className="relative z-20 order-1 md:order-none md:col-span-6 md:col-start-1 md:row-start-1 md:self-end lg:col-span-5">
            <div className="flex flex-wrap items-center gap-2">
              {slide.eyebrow ? (
                <p
                  className={cn(
                    "inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em]",
                    isLightSurface
                      ? "border-soky-blue/25 bg-soky-white/80 text-soky-blue"
                      : "border-soky-white/35 bg-soky-white/12 text-soky-white",
                  )}
                >
                  {slide.eyebrow}
                </p>
              ) : null}
              {slide.badgeLabel ? (
                <span
                  className={cn(
                    "inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.1em]",
                    isLightSurface
                      ? lightBadgeToneClass[slide.presentation.badgeTone]
                      : badgeToneClass[slide.presentation.badgeTone],
                  )}
                >
                  {slide.badgeLabel}
                </span>
              ) : null}
            </div>

            {slide.highlightText ? (
              <p
                className={cn(
                  "soky-heading mt-4 inline-flex rounded-2xl px-3 py-2 text-[clamp(2.3rem,12vw,4rem)] uppercase leading-[0.86] md:text-[clamp(3rem,5vw,4.8rem)]",
                  isLightSurface
                    ? "bg-soky-orange/12 text-soky-orange-deep"
                    : "bg-soky-white/10 text-soky-orange",
                )}
              >
                {slide.highlightText}
              </p>
            ) : null}

            <h2
              id={headingId}
              className={cn(
                "soky-heading max-w-[11ch] uppercase leading-[0.92] drop-shadow-[0_4px_0_rgb(7_5_74_/_0.2)]",
                slide.highlightText ? "mt-3" : "mt-4",
                isLightSurface ? "text-soky-ink" : "text-soky-white",
                "text-[clamp(2.8rem,13vw,4.7rem)] md:text-[clamp(3.7rem,5.6vw,5.9rem)]",
              )}
            >
              {slide.title}
            </h2>

            <div
              aria-hidden="true"
              className={cn(
                "mt-3 h-1.5 w-20 rounded-full",
                isLightSurface
                  ? "bg-soky-orange-deep shadow-[10px_0_0_rgb(23_41_166_/_0.82)]"
                  : "bg-soky-orange shadow-[10px_0_0_rgb(255_255_255_/_0.82)]",
              )}
            />

            {description ? (
              <p
                className={cn(
                  "mt-4 max-w-xl text-base font-semibold leading-7 sm:text-lg md:max-w-md",
                  isLightSurface ? "text-soky-ink/82" : "text-soky-white/92",
                )}
              >
                {description}
              </p>
            ) : null}
          </div>

          <ConversionCtaMedia
            image={slide.image}
            isLightSurface={isLightSurface}
          />

          <div className="relative z-20 order-3 self-end md:order-none md:col-span-6 md:col-start-1 md:row-start-2 md:self-start lg:col-span-5">
            {hasCtas ? (
              <div className="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3 md:mt-6">
                {primaryCta && primaryHref ? (
                  <Button
                    variant="primary"
                    data-hero-cta
                    href={primaryHref}
                    scroll={primaryHref.startsWith("/menu/") ? false : undefined}
                    data-transition-ignore={primaryHref.startsWith("/menu/") || primaryHref.startsWith("#") || primaryHref.startsWith("/#") ? true : undefined}
                    rel={primaryIsExternal ? "noopener noreferrer" : undefined}
                    target={primaryIsExternal ? "_blank" : undefined}
                    className={styles.primaryAction}
                  >
                    <span aria-hidden="true" className={styles.actionIcon}><ConversionCtaIcon type={primaryCta.type} /></span>
                    <span className={styles.actionLabel}>{primaryCta.label}</span>
                  </Button>
                ) : null}

                {secondaryCta && secondaryHref ? (
                  <Button
                    variant="secondary"
                    data-hero-cta
                    href={secondaryHref}
                    scroll={secondaryHref.startsWith("/menu/") ? false : undefined}
                    data-transition-ignore={secondaryHref.startsWith("/menu/") || secondaryHref.startsWith("#") || secondaryHref.startsWith("/#") ? true : undefined}
                    rel={secondaryIsExternal ? "noopener noreferrer" : undefined}
                    target={secondaryIsExternal ? "_blank" : undefined}
                    className={styles.secondaryAction}
                  >
                    <span aria-hidden="true" className={styles.actionIcon}><ConversionCtaIcon type={secondaryCta.type} /></span>
                    <span className={styles.actionLabel}>{secondaryCta.label}</span>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </Container>
        {showWaveDivider ? <WaveDivider tone="paper" /> : null}
      </PatternSurface>
    </section>
  );
}
