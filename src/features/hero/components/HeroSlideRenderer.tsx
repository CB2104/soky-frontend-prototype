import type { HeroSlideViewModel } from "../types";
import { BoxesShowcaseHero } from "./BoxesShowcaseHero";
import { ConversionCtaHero } from "./ConversionCtaHero";
import { MostOrderedHero } from "./MostOrderedHero";
import { PromoPosterHero } from "./PromoPosterHero";
import ServiceAnnouncementHero from "./ServiceAnnouncementHero";
import { WelcomeSplitHero } from "./WelcomeSplitHero";

type HeroSlideRendererProps = {
  className?: string;
  fallbackDescription: string;
  isActive?: boolean;
  isInitialSlide?: boolean;
  renderBackground?: boolean;
  renderLegacyMedia?: boolean;
  showWaveDivider?: boolean;
  slide: HeroSlideViewModel | undefined;
  whatsappUrl: string;
};

export function isRenderableHeroSlide(slide: HeroSlideViewModel) {
  return (
    slide.presentation.variant === "welcome-split" ||
    slide.presentation.variant === "boxes-showcase" ||
    slide.presentation.variant === "promo-poster" ||
    slide.presentation.variant === "most-ordered-promo" ||
    slide.presentation.variant === "announcement-poster" ||
    slide.presentation.variant === "conversion-cta"
  );
}

export function HeroSlideRenderer({
  className,
  fallbackDescription,
  isActive = false,
  isInitialSlide = false,
  renderBackground = true,
  renderLegacyMedia = true,
  showWaveDivider = true,
  slide,
  whatsappUrl,
}: HeroSlideRendererProps) {
  if (!slide) {
    return (
      <WelcomeSplitHero
        isActive={isActive}
        className={className}
        fallbackDescription={fallbackDescription}
        isInitialSlide={isInitialSlide}
        renderBackground={renderBackground}
        showWaveDivider={showWaveDivider}
        slide={undefined}
        whatsappUrl={whatsappUrl}
      />
    );
  }

  switch (slide.presentation.variant) {
    case "welcome-split":
      return (
        <WelcomeSplitHero
          className={className}
          isActive={isActive}
          fallbackDescription={fallbackDescription}
          isInitialSlide={isInitialSlide}
          renderBackground={renderBackground}
          renderLegacyMedia={renderLegacyMedia}
          showWaveDivider={showWaveDivider}
          slide={slide}
          whatsappUrl={whatsappUrl}
        />
      );
    case "boxes-showcase":
      return (
        <BoxesShowcaseHero
          className={className}
          isActive={isActive}
          isInitialSlide={isInitialSlide}
          slide={slide}
          whatsappUrl={whatsappUrl}
        />
      );
    case "promo-poster":
      return (
        <PromoPosterHero
          className={className}
          fallbackDescription={fallbackDescription}
          isInitialSlide={isInitialSlide}
          renderBackground={renderBackground}
          renderLegacyMedia={renderLegacyMedia}
          showWaveDivider={showWaveDivider}
          slide={slide}
          whatsappUrl={whatsappUrl}
        />
      );
    case "most-ordered-promo":
      return (
        <MostOrderedHero
          className={className}
          isActive={isActive}
          slide={slide}
          whatsappUrl={whatsappUrl}
        />
      );

    case "announcement-poster":
      return (
        <ServiceAnnouncementHero
          className={className}
          fallbackDescription={fallbackDescription}
          isActive={isActive}
          isInitialSlide={isInitialSlide}
          slide={slide}
          whatsappUrl={whatsappUrl}
        />
      );

    case "conversion-cta":
      return (
        <ConversionCtaHero
          className={className}
          fallbackDescription={fallbackDescription}
          isInitialSlide={isInitialSlide}
          renderBackground={renderBackground}
          showWaveDivider={showWaveDivider}
          slide={slide}
          whatsappUrl={whatsappUrl}
        />
      );
  }
}
