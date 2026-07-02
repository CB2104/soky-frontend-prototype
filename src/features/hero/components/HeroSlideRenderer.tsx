import type { HeroSlideViewModel } from "../types";
import { ConversionCtaHero } from "./ConversionCtaHero";
import { PromoPosterHero } from "./PromoPosterHero";
import { WelcomeSplitHero } from "./WelcomeSplitHero";

type HeroSlideRendererProps = {
  className?: string;
  fallbackDescription: string;
  isInitialSlide?: boolean;
  showWaveDivider?: boolean;
  slide: HeroSlideViewModel | undefined;
  whatsappUrl: string;
};

export function isRenderableHeroSlide(slide: HeroSlideViewModel) {
  return (
    slide.presentation.variant === "welcome-split" ||
    slide.presentation.variant === "promo-poster" ||
    slide.presentation.variant === "conversion-cta"
  );
}

export function HeroSlideRenderer({
  className,
  fallbackDescription,
  isInitialSlide = false,
  showWaveDivider = true,
  slide,
  whatsappUrl,
}: HeroSlideRendererProps) {
  if (!slide) {
    return (
      <WelcomeSplitHero
        className={className}
        fallbackDescription={fallbackDescription}
        isInitialSlide={isInitialSlide}
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
          fallbackDescription={fallbackDescription}
          isInitialSlide={isInitialSlide}
          showWaveDivider={showWaveDivider}
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
          showWaveDivider={showWaveDivider}
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
          showWaveDivider={showWaveDivider}
          slide={slide}
          whatsappUrl={whatsappUrl}
        />
      );
  }
}
