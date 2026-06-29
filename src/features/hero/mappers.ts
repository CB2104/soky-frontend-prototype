import type {
  PublicSliderItemDto,
  SliderCtaDto,
  SliderIntent,
  SliderLayoutHint,
} from "@/contracts/api";
import type {
  HeroBadgeTone,
  HeroCtaViewModel,
  HeroPattern,
  HeroPresentationVariant,
  HeroSlideViewModel,
} from "./types";

const HERO_IMAGE_SIZES = "(min-width: 1024px) 58vw, 100vw";

function toNullableText(value?: string) {
  return value ?? null;
}

function isSafeInternalPath(target: string) {
  const path = target.trim();
  const lowerPath = path.toLowerCase();

  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("://") &&
    !lowerPath.startsWith("/admin")
  );
}

function getSafeInternalPath(target?: string) {
  if (!target || !isSafeInternalPath(target)) {
    return null;
  }

  return target.trim();
}

function getCtaHref(cta: SliderCtaDto) {
  if (cta.type === "NONE") {
    return null;
  }

  if (cta.type === "MENU") {
    return "/menu";
  }

  if (cta.type === "LOCATION") {
    return "/#ubicacion";
  }

  if (cta.type === "CART") {
    return "/cart";
  }

  if (cta.type === "WHATSAPP") {
    return null;
  }

  if (cta.type === "PRODUCT") {
    return cta.target ? `/menu/${encodeURIComponent(cta.target)}` : null;
  }

  if (cta.type === "CATEGORY") {
    return cta.target ? `/menu?category=${encodeURIComponent(cta.target)}` : null;
  }

  return getSafeInternalPath(cta.target);
}

function mapCta(cta?: SliderCtaDto): HeroCtaViewModel | null {
  if (!cta || cta.type === "NONE") {
    return null;
  }

  const href = getCtaHref(cta);

  if (cta.type !== "WHATSAPP" && !href) {
    return null;
  }

  return {
    label: cta.label,
    type: cta.type,
    href,
    target: cta.target ?? null,
    isExternal: false,
  };
}

function getPresentationVariant(
  intent: SliderIntent,
  layoutHint: SliderLayoutHint,
): HeroPresentationVariant {
  if (intent === "promotion" && layoutHint === "poster") {
    return "promo-poster";
  }

  if (intent === "promotion" && layoutHint === "split") {
    return "product-split";
  }

  return "image-panel";
}

function getPresentationPattern(intent: SliderIntent): HeroPattern {
  if (intent === "conversion") {
    return "asanoha";
  }

  if (intent === "announcement") {
    return "none";
  }

  return "seigaiha";
}

function getPresentationBadgeTone(
  intent: SliderIntent,
  layoutHint: SliderLayoutHint,
): HeroBadgeTone {
  if (intent === "promotion") {
    return "promo";
  }

  if (intent === "announcement") {
    return "new";
  }

  if (intent === "conversion") {
    return "neutral";
  }

  if (layoutHint === "image-led") {
    return "cold";
  }

  return "neutral";
}

export function mapPublicSliderToHeroSlide(
  dto: PublicSliderItemDto,
  index: number,
): HeroSlideViewModel {
  return {
    id: dto.id,
    title: dto.title,
    description: toNullableText(dto.description),
    eyebrow: toNullableText(dto.eyebrow),
    badgeLabel: toNullableText(dto.badgeLabel),
    highlightText: toNullableText(dto.highlightText),
    intent: dto.intent,
    layoutHint: dto.layoutHint,
    image: {
      desktopSrc: dto.desktopImageUrl,
      mobileSrc: dto.mobileImageUrl ?? dto.desktopImageUrl,
      alt: dto.imageAlt,
      priority: index === 0,
      sizes: HERO_IMAGE_SIZES,
    },
    primaryCta: mapCta(dto.primaryCta),
    secondaryCta: mapCta(dto.secondaryCta),
    presentation: {
      variant: getPresentationVariant(dto.intent, dto.layoutHint),
      pattern: getPresentationPattern(dto.intent),
      badgeTone: getPresentationBadgeTone(dto.intent, dto.layoutHint),
    },
  };
}

export function mapPublicSlidersToHeroSlides(
  dtos: PublicSliderItemDto[],
): HeroSlideViewModel[] {
  return dtos.map(mapPublicSliderToHeroSlide);
}
