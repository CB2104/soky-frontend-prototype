import { getImageProps } from "next/image";
import {
  ArrowRightIcon,
  MapPinIcon,
  WhatsAppSVG,
} from "@/components/brand/IconsSVG";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PatternSurface } from "@/components/ui/pattern-surface";
import { StampBadge } from "@/components/ui/stamp-badge";
import { WaveDivider } from "@/components/ui/wave-divider";
import { cn } from "@/lib/cn";
import type {
  HeroBadgeTone,
  HeroCtaViewModel,
  HeroSlideViewModel,
} from "../types";
import { HeroBackgroundLayers } from "./HeroBackgroundLayers";

type PromoPosterHeroProps = {
  className?: string;
  fallbackDescription: string;
  isInitialSlide?: boolean;
  renderBackground?: boolean;
  showWaveDivider?: boolean;
  slide: HeroSlideViewModel;
  whatsappUrl: string;
};

type PromoCtaType = HeroCtaViewModel["type"];

const promoFallbackBackground = {
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

const promoImageWidth = 1680;
const promoImageHeight = 945;

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

function getPromoBackground(background: HeroSlideViewModel["background"]) {
  return background.mode === "none" ? promoFallbackBackground : background;
}

function getPromoPattern(pattern: HeroSlideViewModel["presentation"]["pattern"]) {
  return pattern === "asanoha" ? "asanoha" : "seigaiha";
}

function getPromoStampTone(tone: HeroBadgeTone): "promo" | "cold" | "new" {
  if (tone === "cold" || tone === "new") {
    return tone;
  }

  return "promo";
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

function getExternalRel(target: string | undefined) {
  return target === "_blank" ? "noopener noreferrer" : undefined;
}

function PromoCtaIcon({ type }: { type: PromoCtaType }) {
  if (type === "LOCATION") {
    return <MapPinIcon className="size-5 shrink-0" />;
  }

  if (type === "WHATSAPP") {
    return <WhatsAppSVG className="size-5 shrink-0" />;
  }

  return <ArrowRightIcon className="size-5 shrink-0" />;
}

function PromoPosterMedia({
  badgeLabel,
  image,
  stampTone,
}: {
  badgeLabel: string | null;
  image: HeroSlideViewModel["image"];
  stampTone: "promo" | "cold" | "new";
}) {
  const isCutoutProduct = image.mode === "cutout-product";
  const hasFrame = image.frameEnabled && !isCutoutProduct;
  const resolvedImageFit = isCutoutProduct ? "contain" : image.fit;

  const imageClassName = cn(
    "h-full w-full",
    imageFitClass[resolvedImageFit],
    imagePositionClass[image.position],
    isCutoutProduct
      ? "drop-shadow-[0_18px_28px_rgb(7_5_74_/_0.24)] md:drop-shadow-[0_30px_42px_rgb(7_5_74_/_0.28)]"
      : null,
  );
  const imageLoading = image.priority ? "eager" : "lazy";
  const imageFetchPriority = image.priority ? "high" : "auto";

  const { props: desktopImageProps } = getImageProps({
    src: image.desktopSrc,
    alt: image.alt,
    width: promoImageWidth,
    height: promoImageHeight,
    sizes: image.sizes,
    preload: image.priority,
  });

  const { props: mobileImageProps } = getImageProps({
    src: image.mobileSrc,
    alt: image.alt,
    width: promoImageWidth,
    height: promoImageHeight,
    sizes: image.sizes,
    loading: imageLoading,
    fetchPriority: imageFetchPriority,
    preload: image.priority,
    className: imageClassName,
  });

  return (
    <div
      className={cn(
        "relative order-2 z-10 mx-auto w-full md:order-none md:col-span-7 md:col-start-6 md:row-span-2 md:row-start-1 md:mx-0 md:self-center",
        isCutoutProduct
          ? "min-h-0 self-center py-1 md:min-h-[30rem] lg:min-h-[33rem]"
          : "min-h-0 self-center md:min-h-[27rem] lg:min-h-[30rem]",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute pointer-events-none rounded-full bg-soky-navy/35",
          isCutoutProduct
            ? "bottom-1 left-1/2 h-8 w-[58%] -translate-x-1/2 bg-soky-navy/25 blur-xl md:bottom-8 md:h-12 md:w-[62%]"
            : "-bottom-4 left-8 h-20 w-2/3 blur-2xl",
        )}
      />
      {badgeLabel ? (
        <div
          className={cn(
            "absolute z-20",
            isCutoutProduct
              ? "left-3 top-0 md:left-9 md:top-8"
              : "-left-2 top-2 md:left-2 md:top-7",
          )}
        >
          <StampBadge tone={stampTone}>{badgeLabel}</StampBadge>
        </div>
      ) : null}
      <div
        className={cn(
          "relative z-10 mx-auto w-full",
          isCutoutProduct
            ? "aspect-[5/4] max-w-[22rem] sm:max-w-[23.5rem] md:mr-0 md:aspect-[6/5] md:max-w-none md:w-[112%] lg:w-[118%] xl:w-[122%]"
            : "aspect-[4/3] max-w-[21rem] sm:aspect-[16/10] sm:max-w-[23rem] md:ml-auto md:mr-0 md:aspect-[16/9] md:max-w-none md:w-[102%] lg:w-[106%]",
          hasFrame
            ? "overflow-hidden rounded-[1.6rem] border-[5px] border-soky-white/35 bg-soky-navy shadow-[0_22px_54px_rgb(7_5_74_/_0.32),inset_0_1px_0_rgb(255_255_255_/_0.2)] ring-1 ring-soky-white/18 md:-rotate-2 md:rounded-[2rem]"
            : isCutoutProduct
              ? "overflow-visible"
              : "overflow-hidden rounded-[1.35rem] md:rounded-[1.65rem]",
        )}
      >
        <picture className="block h-full w-full">
          <source
            media="(min-width: 768px)"
            srcSet={desktopImageProps.srcSet}
            sizes={desktopImageProps.sizes}
          />
          <img {...mobileImageProps} alt={image.alt} />
        </picture>
      </div>
    </div>
  );
}

export function PromoPosterHero({
  className,
  fallbackDescription,
  isInitialSlide = false,
  renderBackground = true,
  showWaveDivider = true,
  slide,
  whatsappUrl,
}: PromoPosterHeroProps) {
  const description = slide.description ?? fallbackDescription;
  const background = getPromoBackground(slide.background);
  const pattern = getPromoPattern(slide.presentation.pattern);
  const stampTone = getPromoStampTone(slide.presentation.badgeTone);
  const headingId = `soky-promo-poster-${slide.id}-heading`;

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
  const primaryTarget = primaryIsExternal ? "_blank" : undefined;
  const secondaryTarget = secondaryIsExternal ? "_blank" : undefined;
  const hasCtas = Boolean((primaryCta && primaryHref) || (secondaryCta && secondaryHref));

  return (
    <section
      aria-labelledby={headingId}
      className={cn("h-full scroll-mt-24 md:h-auto", className)}
    >
      <PatternSurface
        className={cn(
          "relative h-full overflow-hidden text-soky-white md:h-auto",
          renderBackground ? "bg-soky-blue" : "bg-transparent",
        )}
        intensity="medium"
        pattern={pattern}
        showPattern={renderBackground}
      >
        {renderBackground ? (
          <HeroBackgroundLayers background={background} priority={isInitialSlide} />
        ) : null}
        <Container
          size="wide"
          className="relative z-10 grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2.5 pb-[5.75rem] pt-[calc(var(--navbar-height)_+_1.5rem)] sm:gap-3 sm:pt-[calc(var(--navbar-height)_+_1.75rem)] md:h-auto md:min-h-[100svh] md:grid-cols-12 md:grid-rows-[auto_auto] md:content-center md:items-center md:gap-x-7 md:pb-10 md:pt-[calc(var(--navbar-height)_+_2.5rem)] lg:pb-12 lg:pt-[calc(var(--navbar-height)_+_3rem)]"
        >
          <div className="relative z-20 order-1 md:order-none md:col-span-5 md:col-start-1 md:row-start-1 md:self-end">
            {slide.eyebrow ? (
              <p className="mb-2 inline-flex rounded-full border border-soky-white/35 bg-soky-white/12 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-soky-white shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.08)]">
                {slide.eyebrow}
              </p>
            ) : null}
            {slide.highlightText ? (
              <p className="soky-heading max-w-[8ch] text-[clamp(3.9rem,20vw,6.8rem)] uppercase leading-[0.82] text-soky-orange drop-shadow-[0_6px_0_rgb(7_5_74_/_0.24)] md:text-[clamp(5.4rem,8vw,8.2rem)]">
                {slide.highlightText}
              </p>
            ) : null}
            <h2
              id={headingId}
              className={cn(
                "soky-heading max-w-[10ch] uppercase leading-[0.9] text-soky-white drop-shadow-[0_5px_0_rgb(7_5_74_/_0.24)]",
                slide.highlightText
                  ? "mt-2 text-[clamp(2.35rem,11vw,4rem)] md:text-[clamp(3.15rem,4.8vw,5.1rem)]"
                  : "text-[clamp(3.2rem,15vw,5.4rem)] md:text-[clamp(4.4rem,6.6vw,7rem)]",
              )}
            >
              {slide.title}
            </h2>
            <div
              aria-hidden="true"
              className="mt-3 h-1.5 w-24 rounded-full bg-soky-orange shadow-[12px_0_0_rgb(255_255_255_/_0.82)]"
            />
            {description ? (
              <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-soky-white/92 drop-shadow-[0_2px_0_rgb(7_5_74_/_0.14)] sm:text-lg md:max-w-md">
                {description}
              </p>
            ) : null}
          </div>

          <PromoPosterMedia
            badgeLabel={slide.badgeLabel}
            image={slide.image}
            stampTone={stampTone}
          />

          <div className="relative z-20 order-3 self-end md:order-none md:col-span-5 md:col-start-1 md:row-start-2 md:self-start">
            {hasCtas ? (
              <div className="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3 md:mt-6">
                {primaryCta && primaryHref ? (
                  <Button
                    href={primaryHref}
                    target={primaryTarget}
                    rel={getExternalRel(primaryTarget)}
                    size="lg"
                    className="group min-h-12 w-full touch-manipulation justify-between gap-3 bg-soky-orange-deep bg-[url('/images/endless-clouds-light.svg')] bg-size-[56px_28px] bg-repeat px-5 text-base font-black uppercase text-soky-white shadow-[0_14px_28px_rgb(7_5_74_/_0.2),0_6px_0_rgb(7_5_74_/_0.16)] ring-1 ring-soky-white/25 hover:-translate-y-0.5 hover:bg-soky-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2 focus-visible:ring-offset-soky-blue sm:w-auto sm:min-w-52 sm:px-6 md:min-h-14"
                  >
                    <span>{primaryCta.label}</span>
                    <span
                      aria-hidden="true"
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-soky-white/18 transition-transform duration-200 group-hover:translate-x-0.5 group-active:scale-95 [&_svg]:size-5"
                    >
                      <PromoCtaIcon type={primaryCta.type} />
                    </span>
                  </Button>
                ) : null}
                {secondaryCta && secondaryHref ? (
                  <Button
                    href={secondaryHref}
                    target={secondaryTarget}
                    rel={getExternalRel(secondaryTarget)}
                    variant="ghost"
                    size="lg"
                    className="group min-h-12 w-full touch-manipulation justify-between gap-3 border-2 border-soky-white/80 bg-soky-white/8 px-5 text-base font-extrabold text-soky-white shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.12)] hover:border-soky-orange hover:bg-soky-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2 focus-visible:ring-offset-soky-blue sm:w-auto sm:min-w-48 sm:px-6 md:min-h-14"
                  >
                    <span>{secondaryCta.label}</span>
                    <span
                      aria-hidden="true"
                      className="grid size-8 shrink-0 place-items-center rounded-full border border-soky-white/45 bg-soky-blue/20 transition-transform duration-200 group-hover:translate-x-0.5 group-active:scale-95 [&_svg]:size-5"
                    >
                      <PromoCtaIcon type={secondaryCta.type} />
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
