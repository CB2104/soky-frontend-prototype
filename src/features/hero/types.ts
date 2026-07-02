import type {
  SliderBackgroundBleed,
  SliderBackgroundColorToken,
  SliderBackgroundOpacity,
  SliderCtaType,
  SliderImageFit,
  SliderImagePosition,
  SliderIntent,
  SliderLayoutHint,
  SliderMediaMode,
} from "@/contracts/api";

export type HeroPresentationVariant =
  | "welcome-split"
  | "promo-poster"
  | "conversion-cta";

export type HeroPattern = "seigaiha" | "asanoha" | "none";

export type HeroBadgeTone = "promo" | "new" | "cold" | "neutral";

export type HeroCtaViewModel = {
  label: string;
  type: SliderCtaType;
  href: string | null;
  target: string | null;
  isExternal: boolean;
};

export type HeroBackgroundImage = {
  desktopSrc: string;
  mobileSrc: string;
  decorative: true;
  fit: SliderImageFit;
  position: SliderImagePosition;
};

export type HeroBackgroundLayer = {
  colorToken: SliderBackgroundColorToken | null;
  image: HeroBackgroundImage | null;
  opacity: SliderBackgroundOpacity | null;
};

export type HeroBackground =
  | {
      mode: "none";
    }
  | {
      mode: "single";
      layer: HeroBackgroundLayer;
    }
  | {
      mode: "two-layer";
      base: HeroBackgroundLayer;
      accent: HeroBackgroundLayer & {
        bleed: SliderBackgroundBleed;
      };
    };

export type HeroSlideViewModel = {
  id: string;
  title: string;
  description: string | null;
  eyebrow: string | null;
  badgeLabel: string | null;
  highlightText: string | null;

  intent: SliderIntent;
  layoutHint: SliderLayoutHint;
  background: HeroBackground;

  image: {
    desktopSrc: string;
    mobileSrc: string;
    alt: string;
    mode: SliderMediaMode;
    fit: SliderImageFit;
    position: SliderImagePosition;
    frameEnabled: boolean;
    priority: boolean;
    sizes: string;
  };

  primaryCta: HeroCtaViewModel | null;
  secondaryCta: HeroCtaViewModel | null;

  presentation: {
    variant: HeroPresentationVariant;
    pattern: HeroPattern;
    badgeTone: HeroBadgeTone;
  };
};
