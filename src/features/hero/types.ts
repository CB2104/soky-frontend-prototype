import type {
  HeroResponsiveSources,
  SliderBackgroundBleed,
  SliderBackgroundColorToken,
  SliderBackgroundOpacity,
  SliderBackgroundVariant,
  SliderCtaType,
  SliderImageFit,
  SliderImagePosition,
  SliderIntent,
  SliderLayoutHint,
  SliderMediaMode,
  SliderProductLayerPosition,
} from "@/contracts/api";

export type HeroPresentationVariant =
  | "welcome-split"
  | "boxes-showcase"
  | "promo-poster"
  | "most-ordered-promo"
  | "conversion-cta"
  | "announcement-poster";

export type HeroPattern = "seigaiha" | "asanoha" | "none";

export type HeroBadgeTone = "promo" | "new" | "cold" | "neutral";

export type HeroMediaMode = SliderMediaMode;

export type HeroRotatorImage = {
  src: string;
  alt: string;
  name: string | null;
  priceLabel: string | null;
};

export type HeroResponsiveRotatorImage = HeroRotatorImage & {
  sources: HeroResponsiveSources;
};

export type HeroHeadlinePart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "brand-logo";
      label: string | null;
    };

export type HeroCtaViewModel = {
  label: string;
  type: SliderCtaType;
  href: string | null;
  target: string | null;
  isExternal: boolean;
};

export type HeroBackgroundImage = {
  sources: HeroResponsiveSources;
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

export type HeroProductLayer = {
  sources: HeroResponsiveSources;
  desktopSrc: string;
  mobileSrc: string | null;
  alt: string;
  decorative: boolean;
  fit: SliderImageFit;
  position: SliderProductLayerPosition;
};

export type HeroColorLayer = {
  value: string;
  label?: string;
};

export type HeroPatternAssetKey = "endless-clouds-light";

export type HeroPatternOverlay = {
  enabled: boolean;
  assetKey: HeroPatternAssetKey;
  opacity?: number;
  blendMode?: "normal" | "overlay" | "soft-light" | "multiply" | "screen";
  size?: "auto" | "cover" | "contain" | "repeat";
  position?: "center" | "top" | "bottom" | "left" | "right";
};

type HeroSlideImageBase = {
  sources: HeroResponsiveSources;
  desktopSrc: string;
  mobileSrc: string;
  alt: string;
  fit: SliderImageFit;
  position: SliderImagePosition;
  priority: boolean;
  sizes: string;
};

export type HeroSlideImage =
  | (HeroSlideImageBase & {
      mode: "cutout-product";
      frameEnabled: false;
    })
  | (HeroSlideImageBase & {
      mode: Exclude<HeroMediaMode, "cutout-product">;
      frameEnabled: boolean;
    });

export type HeroSlideViewModel = {
  id: string;
  title: string;
  description: string | null;
  eyebrow: string | null;
  badgeLabel: string | null;
  productName: string | null;
  promoNote: string | null;
  headlineParts?: HeroHeadlinePart[];
  highlightText: string | null;

  intent: SliderIntent;
  layoutHint: SliderLayoutHint;
  background: HeroBackground;
  productLayer: HeroProductLayer | null;
  colorLayer?: HeroColorLayer;
  patternOverlay?: HeroPatternOverlay;

  image: HeroSlideImage;
  rotatorImages?: HeroResponsiveRotatorImage[];

  primaryCta: HeroCtaViewModel | null;
  secondaryCta: HeroCtaViewModel | null;

  presentation: {
    variant: HeroPresentationVariant;
    pattern: HeroPattern;
    badgeTone: HeroBadgeTone;
    backgroundVariant: SliderBackgroundVariant;
  };
};
