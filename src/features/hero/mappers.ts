import type {
  SliderBackgroundDto,
  SliderBackgroundImageDto,
  SliderBackgroundLayerDto,
  PublicSliderItemDto,
  SliderCtaDto,
  SliderImageFit,
  SliderImagePosition,
  SliderIntent,
  SliderLayoutHint,
  SliderMediaMode,
} from "@/contracts/api";
import type {
  HeroBackground,
  HeroBackgroundImage,
  HeroBackgroundLayer,
  HeroBadgeTone,
  HeroCtaViewModel,
  HeroPattern,
  HeroPresentationVariant,
  HeroSlideViewModel,
} from "./types";

const HERO_IMAGE_SIZES = "(min-width: 1024px) 58vw, 100vw";
const HERO_CUTOUT_IMAGE_SIZES = "(min-width: 1024px) 48vw, 92vw";

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
    return cta.target
      ? `/menu?category=${encodeURIComponent(cta.target)}`
      : null;
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

function getMediaFit(
  mediaMode: SliderMediaMode,
  mediaFit: SliderImageFit | undefined,
): SliderImageFit {
  if (mediaFit) {
    return mediaFit;
  }

  return mediaMode === "cutout-product" ? "contain" : "cover";
}

function getMediaPosition(
  mediaPosition: SliderImagePosition | undefined,
): SliderImagePosition {
  return mediaPosition ?? "center";
}

function getFrameEnabled(
  mediaMode: SliderMediaMode,
  frameEnabled: boolean | undefined,
) {
  return frameEnabled ?? mediaMode !== "cutout-product";
}

function getImageSizes(mediaMode: SliderMediaMode) {
  return mediaMode === "cutout-product"
    ? HERO_CUTOUT_IMAGE_SIZES
    : HERO_IMAGE_SIZES;
}

function mapBackgroundImage(
  image: SliderBackgroundImageDto | undefined,
): HeroBackgroundImage | null {
  if (!image) {
    return null;
  }

  return {
    desktopSrc: image.desktopUrl,
    mobileSrc: image.mobileUrl ?? image.desktopUrl,
    decorative: true,
    fit: image.fit ?? "cover",
    position: image.position ?? "center",
  };
}

function mapBackgroundLayer(
  layer: SliderBackgroundLayerDto,
): HeroBackgroundLayer {
  return {
    colorToken: layer.colorToken ?? null,
    image: mapBackgroundImage(layer.image),
    opacity: layer.opacity ?? null,
  };
}

function mapBackground(background?: SliderBackgroundDto): HeroBackground {
  if (!background || background.mode === "none") {
    return { mode: "none" };
  }

  if (background.mode === "single") {
    return {
      mode: "single",
      layer: mapBackgroundLayer(background.layer),
    };
  }

  return {
    mode: "two-layer",
    base: mapBackgroundLayer(background.base),
    accent: {
      ...mapBackgroundLayer(background.accent),
      bleed: background.accent.bleed ?? "none",
    },
  };
}

function getPresentationVariant(
  intent: SliderIntent,
  layoutHint: SliderLayoutHint,
): HeroPresentationVariant {
  if (intent === "welcome" && layoutHint === "split") {
    return "welcome-split";
  }

  if (intent === "promotion") {
    return "promo-poster";
  }

  return "conversion-cta";
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
  const mediaMode = dto.mediaMode ?? "framed-photo";

  return {
    id: dto.id,
    title: dto.title,
    description: toNullableText(dto.description),
    eyebrow: toNullableText(dto.eyebrow),
    badgeLabel: toNullableText(dto.badgeLabel),
    highlightText: toNullableText(dto.highlightText),
    intent: dto.intent,
    layoutHint: dto.layoutHint,
    background: mapBackground(dto.background),
    image: {
      desktopSrc: dto.desktopImageUrl,
      mobileSrc: dto.mobileImageUrl ?? dto.desktopImageUrl,
      alt: dto.imageAlt,
      mode: mediaMode,
      fit: getMediaFit(mediaMode, dto.mediaFit),
      position: getMediaPosition(dto.mediaPosition),
      frameEnabled: getFrameEnabled(mediaMode, dto.frameEnabled),
      priority: index === 0,
      sizes: getImageSizes(mediaMode),
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
