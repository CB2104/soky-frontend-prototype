import type {
  HeroResponsiveSources,
  SliderBackgroundDto,
  SliderBackgroundImageDto,
  SliderBackgroundLayerDto,
  SliderColorLayerDto,
  SliderHeadlinePartDto,
  PublicSliderItemDto,
  SliderCtaDto,
  SliderImageFit,
  SliderImageSourcesDto,
  SliderImagePosition,
  SliderIntent,
  SliderLayoutHint,
  SliderMediaMode,
  SliderPatternBlendMode,
  SliderPatternOverlayDto,
  SliderPatternPosition,
  SliderPatternSize,
  SliderProductLayerDto,
  SliderRotatorImageSourcesDto,
} from "@/contracts/api";
import type {
  HeroBackground,
  HeroBackgroundImage,
  HeroBackgroundLayer,
  HeroBadgeTone,
  HeroColorLayer,
  HeroCtaViewModel,
  HeroHeadlinePart,
  HeroPattern,
  HeroPatternOverlay,
  HeroProductLayer,
  HeroPresentationVariant,
  HeroSlideViewModel,
} from "./types";

const HERO_IMAGE_SIZES = "(min-width: 1024px) 58vw, 100vw";
const HERO_CUTOUT_IMAGE_SIZES = "(min-width: 1024px) 48vw, 92vw";
const DEFAULT_MEDIA_MODE: SliderMediaMode = "promo-image";
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function normalizeHeroResponsiveSources(
  sources: SliderImageSourcesDto | SliderRotatorImageSourcesDto,
): HeroResponsiveSources | null {
  if ("desktop" in sources) {
    const normalizedSources = {
      desktop: sources.desktop.trim(),
      desktopWide: sources.desktopWide.trim(),
      tabletLandscape: sources.tabletLandscape.trim(),
      tabletPortrait: sources.tabletPortrait.trim(),
      mobile: sources.mobile.trim(),
    } satisfies HeroResponsiveSources;

    return Object.values(normalizedSources).every(Boolean)
      ? normalizedSources
      : null;
  }

  if ("src" in sources) {
    const source = sources.src.trim();

    return source
      ? {
          desktop: source,
          desktopWide: source,
          tabletLandscape: source,
          tabletPortrait: source,
          mobile: source,
        }
      : null;
  }

  const desktopSource = sources.desktopUrl.trim();
  const mobileSource = sources.mobileUrl?.trim() || desktopSource;

  return desktopSource
    ? {
        desktop: desktopSource,
        desktopWide: desktopSource,
        tabletLandscape: desktopSource,
        tabletPortrait: mobileSource,
        mobile: mobileSource,
      }
    : null;
}

function mapColorLayer(
  colorLayer?: SliderColorLayerDto,
): HeroColorLayer | undefined {
  const value = colorLayer?.value?.trim();

  if (!value || !HEX_COLOR_PATTERN.test(value)) {
    return undefined;
  }

  const label = colorLayer?.label?.trim();

  return label
    ? { value: value.toUpperCase(), label }
    : { value: value.toUpperCase() };
}

function mapPatternBlendMode(
  blendMode?: SliderPatternBlendMode,
): SliderPatternBlendMode | undefined {
  if (
    blendMode === "normal" ||
    blendMode === "overlay" ||
    blendMode === "soft-light" ||
    blendMode === "multiply" ||
    blendMode === "screen"
  ) {
    return blendMode;
  }

  return undefined;
}

function mapPatternSize(
  size?: SliderPatternSize,
): SliderPatternSize | undefined {
  if (
    size === "auto" ||
    size === "cover" ||
    size === "contain" ||
    size === "repeat"
  ) {
    return size;
  }

  return undefined;
}

function mapPatternPosition(
  position?: SliderPatternPosition,
): SliderPatternPosition | undefined {
  if (
    position === "center" ||
    position === "top" ||
    position === "bottom" ||
    position === "left" ||
    position === "right"
  ) {
    return position;
  }

  return undefined;
}

function mapPatternOverlay(
  patternOverlay?: SliderPatternOverlayDto,
): HeroPatternOverlay | undefined {
  if (
    !patternOverlay ||
    typeof patternOverlay.enabled !== "boolean" ||
    patternOverlay.assetKey !== "endless-clouds-light"
  ) {
    return undefined;
  }

  const opacity =
    typeof patternOverlay.opacity === "number" &&
    Number.isFinite(patternOverlay.opacity)
      ? Math.min(Math.max(patternOverlay.opacity, 0), 1)
      : undefined;
  const blendMode = mapPatternBlendMode(patternOverlay.blendMode);
  const size = mapPatternSize(patternOverlay.size);
  const position = mapPatternPosition(patternOverlay.position);

  return {
    enabled: patternOverlay.enabled,
    assetKey: patternOverlay.assetKey,
    ...(opacity !== undefined ? { opacity } : {}),
    ...(blendMode ? { blendMode } : {}),
    ...(size ? { size } : {}),
    ...(position ? { position } : {}),
  };
}

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

function getMediaMode(mediaMode: SliderMediaMode | undefined) {
  return mediaMode ?? DEFAULT_MEDIA_MODE;
}

function getMediaFit(mediaMode: SliderMediaMode, mediaFit?: SliderImageFit) {
  if (mediaMode === "cutout-product") {
    return "contain";
  }

  return mediaFit ?? "cover";
}

function getMediaPosition(
  mediaPosition: SliderImagePosition | undefined,
): SliderImagePosition {
  return mediaPosition ?? "center";
}

function getFrameEnabled(frameEnabled: boolean | undefined) {
  return frameEnabled ?? true;
}

function getImageSizes(mediaMode: SliderMediaMode) {
  return mediaMode === "cutout-product"
    ? HERO_CUTOUT_IMAGE_SIZES
    : HERO_IMAGE_SIZES;
}

function mapHeroImage(
  dto: PublicSliderItemDto,
  index: number,
): HeroSlideViewModel["image"] {
  const mediaMode = getMediaMode(dto.mediaMode);
  const legacySources = normalizeHeroResponsiveSources({
    desktopUrl: dto.desktopImageUrl,
    ...(dto.mobileImageUrl ? { mobileUrl: dto.mobileImageUrl } : {}),
  });

  if (!legacySources) {
    throw new Error(`Slider ${dto.id} has no valid hero image source.`);
  }

  const sources = dto.imageSources
    ? (normalizeHeroResponsiveSources(dto.imageSources) ?? legacySources)
    : legacySources;

  const imageBase = {
    sources,
    desktopSrc: legacySources.desktop,
    mobileSrc: legacySources.mobile,
    alt: dto.imageAlt,
    fit: getMediaFit(mediaMode, dto.mediaFit),
    position: getMediaPosition(dto.mediaPosition),
    priority: index === 0,
    sizes: getImageSizes(mediaMode),
  };

  if (mediaMode === "cutout-product") {
    return {
      ...imageBase,
      mode: mediaMode,
      frameEnabled: false,
    };
  }

  return {
    ...imageBase,
    mode: mediaMode,
    frameEnabled: getFrameEnabled(dto.frameEnabled),
  };
}

function mapRotatorImages(
  dto: PublicSliderItemDto,
): HeroSlideViewModel["rotatorImages"] {
  const rotatorImages = dto.rotatorImages?.flatMap((image) => {
    const sources = normalizeHeroResponsiveSources(image);
    const alt = image.alt.trim();

    if (!sources || !alt) {
      return [];
    }

    return [
      {
        sources,
        src: sources.desktop,
        alt,
        name: image.name?.trim() || null,
        priceLabel: image.priceLabel?.trim() || null,
        priceAmount: image.priceAmount,
        priceCurrency: image.priceCurrency,
      },
    ];
  });

  return rotatorImages && rotatorImages.length > 0 ? rotatorImages : undefined;
}

function mapHeadlinePart(part: SliderHeadlinePartDto): HeroHeadlinePart[] {
  if (part.type === "text") {
    const text = part.text.trim();

    return text ? [{ type: "text", text }] : [];
  }

  const label = part.label?.trim();

  return [
    {
      type: "brand-logo",
      label: label || null,
    },
  ];
}

function mapHeadlineParts(
  dto: PublicSliderItemDto,
): HeroSlideViewModel["headlineParts"] {
  const headlineParts = dto.headlineParts?.flatMap(mapHeadlinePart);

  return headlineParts && headlineParts.length > 0 ? headlineParts : undefined;
}

function mapBackgroundImage(
  image: SliderBackgroundImageDto | undefined,
): HeroBackgroundImage | null {
  if (!image) {
    return null;
  }

  const sources = normalizeHeroResponsiveSources(image);

  if (!sources) {
    return null;
  }

  return {
    sources,
    desktopSrc: sources.desktop,
    mobileSrc: sources.mobile,
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

function mapExplicitProductLayer(
  productLayer?: SliderProductLayerDto,
): HeroProductLayer | null {
  if (!productLayer) {
    return null;
  }

  const sources = normalizeHeroResponsiveSources(productLayer);
  const alt = productLayer.alt.trim();
  const decorative = productLayer.decorative ?? false;

  if (!sources || (!decorative && !alt)) {
    return null;
  }

  return {
    sources,
    desktopSrc: sources.desktop,
    mobileSrc:
      "desktopUrl" in productLayer
        ? productLayer.mobileUrl?.trim() || null
        : null,
    alt,
    decorative,
    fit: productLayer.fit ?? "cover",
    position: productLayer.position ?? "center",
  };
}

function mapProductLayer(dto: PublicSliderItemDto): HeroProductLayer | null {
  const explicitProductLayer = mapExplicitProductLayer(dto.productLayer);

  if (explicitProductLayer) {
    return explicitProductLayer;
  }

  if (getMediaMode(dto.mediaMode) !== "cutout-product" || !dto.imageSources) {
    return null;
  }

  const sources = normalizeHeroResponsiveSources(dto.imageSources);
  const alt = dto.imageAlt.trim();

  if (!sources || !alt) {
    return null;
  }

  return {
    sources,
    desktopSrc: sources.desktop,
    mobileSrc: sources.mobile,
    alt,
    decorative: false,
    fit: "cover",
    position: "center",
  };
}

function getPresentationVariant(
  intent: SliderIntent,
  layoutHint: SliderLayoutHint,
): HeroPresentationVariant {
  if (intent === "promotion" && layoutHint === "split") {
    return "boxes-showcase";
  }

  if (layoutHint === "split" && intent !== "conversion") {
    return "welcome-split";
  }

  if (intent === "promotion" && layoutHint === "image-led") {
    return "most-ordered-promo";
  }

  if (layoutHint === "poster") {
    return "announcement-poster";
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
  return {
    id: dto.id,
    title: dto.title,
    description: toNullableText(dto.description),
    eyebrow: toNullableText(dto.eyebrow),
    badgeLabel: toNullableText(dto.badgeLabel),
    productName: toNullableText(dto.productName),
    promoNote: toNullableText(dto.promoNote),
    headlineParts: mapHeadlineParts(dto),
    highlightText: toNullableText(dto.highlightText),
    intent: dto.intent,
    layoutHint: dto.layoutHint,
    background: mapBackground(dto.background),
    productLayer: mapProductLayer(dto),
    colorLayer: mapColorLayer(dto.colorLayer),
    patternOverlay: mapPatternOverlay(dto.patternOverlay),
    image: mapHeroImage(dto, index),
    rotatorImages: mapRotatorImages(dto),
    primaryCta: mapCta(dto.primaryCta),
    secondaryCta: mapCta(dto.secondaryCta),
    presentation: {
      variant: getPresentationVariant(dto.intent, dto.layoutHint),
      pattern: getPresentationPattern(dto.intent),
      badgeTone: getPresentationBadgeTone(dto.intent, dto.layoutHint),
      backgroundVariant: dto.backgroundVariant ?? "default",
    },
  };
}

export function mapPublicSlidersToHeroSlides(
  dtos: PublicSliderItemDto[],
): HeroSlideViewModel[] {
  return dtos.map(mapPublicSliderToHeroSlide);
}
