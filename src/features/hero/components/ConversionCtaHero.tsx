import { getImageProps } from "next/image";
import {
  ArrowRightIcon,
  MapPinIcon,
  WhatsAppSVG,
} from "@/components/brand/IconsSVG";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PatternSurface } from "@/components/ui/pattern-surface";
import { WaveDivider } from "@/components/ui/wave-divider";
import { cn } from "@/lib/cn";
import type {
  HeroBadgeTone,
  HeroCtaViewModel,
  HeroSlideViewModel,
} from "../types";
import { HeroBackgroundLayers } from "./HeroBackgroundLayers";

type ConversionCtaHeroProps = {
  className?: string;
  fallbackDescription: string;
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
    "h-full w-full",
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
  });

  return (
    <div className="relative order-2 z-10 mx-auto min-h-0 w-full self-center md:order-none md:col-span-6 md:col-start-7 md:row-span-2 md:row-start-1 md:mx-0 md:self-center">
      <div
        aria-hidden="true"
        className={cn(
          "absolute bottom-0 left-1/2 h-14 w-3/4 -translate-x-1/2 rounded-full blur-2xl",
          isLightSurface ? "bg-soky-blue/18" : "bg-soky-navy/35",
        )}
      />
      <div
        className={cn(
          "relative z-10 mx-auto w-full",
          isCutoutProduct
            ? "aspect-[4/3] max-w-[18rem] md:max-w-[29rem]"
            : "aspect-[4/3] max-w-[19rem] md:aspect-[16/11] md:max-w-[31rem]",
          hasFrame
            ? cn(
                "overflow-hidden rounded-[1.5rem] border-[4px] shadow-[0_20px_52px_rgb(7_5_74_/_0.26)] md:rounded-[1.8rem]",
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
            ? "bg-soky-paper text-soky-ink"
            : "bg-soky-blue text-soky-white",
        )}
        intensity="subtle"
        pattern={pattern}
      >
        <HeroBackgroundLayers background={background} />
        <Container
          size="wide"
          className="relative z-10 grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2.5 pb-[5.75rem] pt-4 sm:gap-3 sm:pt-6 md:h-auto md:min-h-[calc(100svh-4.5rem)] md:grid-cols-12 md:grid-rows-[auto_auto] md:content-center md:items-center md:gap-x-8 md:py-10 lg:py-12"
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
                    href={primaryHref}
                    rel={primaryIsExternal ? "noopener noreferrer" : undefined}
                    size="lg"
                    target={primaryIsExternal ? "_blank" : undefined}
                    className={cn(
                      "group min-h-12 w-full touch-manipulation justify-between gap-3 bg-soky-orange-deep bg-[url('/images/endless-clouds-light.svg')] bg-size-[56px_28px] bg-repeat px-5 text-base font-black uppercase text-soky-white shadow-[0_14px_28px_rgb(7_5_74_/_0.2),0_6px_0_rgb(7_5_74_/_0.16)] ring-1 ring-soky-white/25 hover:-translate-y-0.5 hover:bg-soky-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2 sm:w-auto sm:min-w-52 sm:px-6 md:min-h-14",
                      isLightSurface
                        ? "focus-visible:ring-offset-soky-paper"
                        : "focus-visible:ring-offset-soky-blue",
                    )}
                  >
                    <span>{primaryCta.label}</span>
                    <span
                      aria-hidden="true"
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-soky-white/18 transition-transform duration-200 group-hover:translate-x-0.5 group-active:scale-95 [&_svg]:size-5"
                    >
                      <ConversionCtaIcon type={primaryCta.type} />
                    </span>
                  </Button>
                ) : null}

                {secondaryCta && secondaryHref ? (
                  <Button
                    href={secondaryHref}
                    rel={secondaryIsExternal ? "noopener noreferrer" : undefined}
                    size="lg"
                    target={secondaryIsExternal ? "_blank" : undefined}
                    variant="ghost"
                    className={cn(
                      "group min-h-12 w-full touch-manipulation justify-between gap-3 border-2 px-5 text-base font-extrabold shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2 sm:w-auto sm:min-w-48 sm:px-6 md:min-h-14",
                      isLightSurface
                        ? "border-soky-blue/45 bg-soky-white/75 text-soky-blue hover:border-soky-orange hover:bg-soky-white focus-visible:ring-offset-soky-paper"
                        : "border-soky-white/80 bg-soky-white/8 text-soky-white hover:border-soky-orange hover:bg-soky-white/16 focus-visible:ring-offset-soky-blue",
                    )}
                  >
                    <span>{secondaryCta.label}</span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full border transition-transform duration-200 group-hover:translate-x-0.5 group-active:scale-95 [&_svg]:size-5",
                        isLightSurface
                          ? "border-soky-blue/25 bg-soky-blue/8"
                          : "border-soky-white/45 bg-soky-blue/20",
                      )}
                    >
                      <ConversionCtaIcon type={secondaryCta.type} />
                    </span>
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
