import type {
  SliderCtaType,
  SliderIntent,
  SliderLayoutHint,
} from "@/contracts/api";

export type HeroPresentationVariant =
  | "product-split"
  | "promo-poster"
  | "image-panel";

export type HeroPattern = "seigaiha" | "asanoha" | "none";

export type HeroBadgeTone = "promo" | "new" | "cold" | "neutral";

export type HeroCtaViewModel = {
  label: string;
  type: SliderCtaType;
  href: string | null;
  target: string | null;
  isExternal: boolean;
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

  image: {
    desktopSrc: string;
    mobileSrc: string;
    alt: string;
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
