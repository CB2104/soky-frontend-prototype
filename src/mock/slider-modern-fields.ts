import type {
  AdminSliderItemDto,
  HeroResponsiveSources,
  SliderColorLayerDto,
  SliderHeadlinePartDto,
  SliderPatternOverlayDto,
  SliderProductLayerDto,
} from "@/contracts/api";

type ModernSliderFields = Pick<
  AdminSliderItemDto,
  "headlineParts" | "productLayer" | "colorLayer" | "patternOverlay"
>;

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwnProperty(value: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function getTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

const HERO_RESPONSIVE_SOURCE_KEYS = [
  "desktop",
  "desktopWide",
  "tabletLandscape",
  "tabletPortrait",
  "mobile",
] as const satisfies ReadonlyArray<keyof HeroResponsiveSources>;

function hasResponsiveSourceField(value: Record<string, unknown>) {
  return HERO_RESPONSIVE_SOURCE_KEYS.some((key) => hasOwnProperty(value, key));
}

function parseHeroResponsiveSources(
  value: Record<string, unknown>,
): HeroResponsiveSources | undefined {
  const desktop = getTrimmedString(value.desktop);
  const desktopWide = getTrimmedString(value.desktopWide);
  const tabletLandscape = getTrimmedString(value.tabletLandscape);
  const tabletPortrait = getTrimmedString(value.tabletPortrait);
  const mobile = getTrimmedString(value.mobile);

  if (
    !desktop ||
    !desktopWide ||
    !tabletLandscape ||
    !tabletPortrait ||
    !mobile
  ) {
    return undefined;
  }

  return {
    desktop,
    desktopWide,
    tabletLandscape,
    tabletPortrait,
    mobile,
  };
}

function normalizeHeadlineParts(value: unknown): SliderHeadlinePartDto[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const parts: SliderHeadlinePartDto[] = [];

  for (const part of value) {
    if (!isRecord(part) || typeof part.type !== "string") {
      return undefined;
    }

    if (part.type === "text") {
      const text = getTrimmedString(part.text);

      if (!text) {
        return undefined;
      }

      parts.push({ type: "text", text });
      continue;
    }

    if (part.type === "brand-logo") {
      if (part.label !== undefined && typeof part.label !== "string") {
        return undefined;
      }

      const label = getTrimmedString(part.label);
      parts.push(label ? { type: "brand-logo", label } : { type: "brand-logo" });
      continue;
    }

    return undefined;
  }

  return parts;
}

function normalizeProductLayer(value: unknown): SliderProductLayerDto | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const hasResponsiveSources = hasResponsiveSourceField(value);
  const responsiveSources = hasResponsiveSources
    ? parseHeroResponsiveSources(value)
    : undefined;
  const desktopUrl = getTrimmedString(value.desktopUrl);
  const alt = getTrimmedString(value.alt);

  if (
    !alt ||
    (hasResponsiveSources &&
      (!responsiveSources ||
        value.desktopUrl !== undefined ||
        value.mobileUrl !== undefined)) ||
    (!hasResponsiveSources && !desktopUrl)
  ) {
    return undefined;
  }

  if (value.mobileUrl !== undefined && typeof value.mobileUrl !== "string") {
    return undefined;
  }

  if (value.decorative !== undefined && typeof value.decorative !== "boolean") {
    return undefined;
  }

  if (value.fit !== undefined && value.fit !== "cover" && value.fit !== "contain") {
    return undefined;
  }

  if (
    value.position !== undefined &&
    value.position !== "center" &&
    value.position !== "center-left" &&
    value.position !== "center-right"
  ) {
    return undefined;
  }

  const fit: SliderProductLayerDto["fit"] =
    value.fit === "cover" || value.fit === "contain" ? value.fit : undefined;
  const position: SliderProductLayerDto["position"] =
    value.position === "center" ||
    value.position === "center-left" ||
    value.position === "center-right"
      ? value.position
      : undefined;
  const metadata: Pick<
    SliderProductLayerDto,
    "alt" | "decorative" | "fit" | "position"
  > = {
    alt,
    ...(typeof value.decorative === "boolean"
      ? { decorative: value.decorative }
      : {}),
    ...(fit ? { fit } : {}),
    ...(position ? { position } : {}),
  };

  if (responsiveSources) {
    return {
      ...responsiveSources,
      ...metadata,
    };
  }

  if (!desktopUrl) {
    return undefined;
  }

  const mobileUrl = getTrimmedString(value.mobileUrl);

  return {
    desktopUrl,
    ...(mobileUrl ? { mobileUrl } : {}),
    ...metadata,
  };
}

function normalizeColorLayer(value: unknown): SliderColorLayerDto | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const color = getTrimmedString(value.value);

  if (!color || !HEX_COLOR_PATTERN.test(color)) {
    return undefined;
  }

  if (value.label !== undefined && typeof value.label !== "string") {
    return undefined;
  }

  const label = getTrimmedString(value.label);

  return label
    ? { value: color.toUpperCase(), label }
    : { value: color.toUpperCase() };
}

function normalizePatternOverlay(
  value: unknown,
): SliderPatternOverlayDto | undefined {
  if (!isRecord(value) || typeof value.enabled !== "boolean") {
    return undefined;
  }

  if (value.assetKey !== "endless-clouds-light") {
    return undefined;
  }

  if (value.opacity !== undefined && typeof value.opacity !== "number") {
    return undefined;
  }

  if (
    value.blendMode !== undefined &&
    value.blendMode !== "normal" &&
    value.blendMode !== "overlay" &&
    value.blendMode !== "soft-light" &&
    value.blendMode !== "multiply" &&
    value.blendMode !== "screen"
  ) {
    return undefined;
  }

  if (
    value.size !== undefined &&
    value.size !== "auto" &&
    value.size !== "cover" &&
    value.size !== "contain" &&
    value.size !== "repeat"
  ) {
    return undefined;
  }

  if (
    value.position !== undefined &&
    value.position !== "center" &&
    value.position !== "top" &&
    value.position !== "bottom" &&
    value.position !== "left" &&
    value.position !== "right"
  ) {
    return undefined;
  }

  const opacity =
    typeof value.opacity === "number" && Number.isFinite(value.opacity)
      ? Math.min(Math.max(value.opacity, 0), 1)
      : undefined;

  return {
    enabled: value.enabled,
    assetKey: value.assetKey,
    ...(opacity !== undefined ? { opacity } : {}),
    ...(value.blendMode ? { blendMode: value.blendMode } : {}),
    ...(value.size ? { size: value.size } : {}),
    ...(value.position ? { position: value.position } : {}),
  };
}

function getHeadlineParts(
  body: Record<string, unknown>,
): SliderHeadlinePartDto[] | undefined {
  return hasOwnProperty(body, "headlineParts")
    ? normalizeHeadlineParts(body.headlineParts)
    : undefined;
}

function getProductLayer(
  body: Record<string, unknown>,
): SliderProductLayerDto | undefined {
  return hasOwnProperty(body, "productLayer")
    ? normalizeProductLayer(body.productLayer)
    : undefined;
}

function getColorLayer(
  body: Record<string, unknown>,
): SliderColorLayerDto | undefined {
  return hasOwnProperty(body, "colorLayer")
    ? normalizeColorLayer(body.colorLayer)
    : undefined;
}

function getPatternOverlay(
  body: Record<string, unknown>,
): SliderPatternOverlayDto | undefined {
  return hasOwnProperty(body, "patternOverlay")
    ? normalizePatternOverlay(body.patternOverlay)
    : undefined;
}

export function getCreateModernSliderFields(
  body: unknown,
): ModernSliderFields {
  if (!isRecord(body)) {
    return {};
  }

  const fields: ModernSliderFields = {};
  const headlineParts = getHeadlineParts(body);
  const productLayer = getProductLayer(body);
  const colorLayer = getColorLayer(body);
  const patternOverlay = getPatternOverlay(body);

  if (headlineParts !== undefined) {
    fields.headlineParts = headlineParts;
  }

  if (productLayer !== undefined) {
    fields.productLayer = productLayer;
  }

  if (colorLayer !== undefined) {
    fields.colorLayer = colorLayer;
  }

  if (patternOverlay !== undefined) {
    fields.patternOverlay = patternOverlay;
  }

  return fields;
}

export function getPatchedModernSliderFields(
  body: unknown,
  current: AdminSliderItemDto,
): ModernSliderFields {
  if (!isRecord(body)) {
    return {
      headlineParts: current.headlineParts,
      productLayer: current.productLayer,
      colorLayer: current.colorLayer,
      patternOverlay: current.patternOverlay,
    };
  }

  const headlineParts = getHeadlineParts(body);
  const productLayer = getProductLayer(body);
  const colorLayer = getColorLayer(body);
  const patternOverlay = getPatternOverlay(body);

  return {
    headlineParts:
      headlineParts !== undefined ? headlineParts : current.headlineParts,
    productLayer: productLayer !== undefined ? productLayer : current.productLayer,
    colorLayer: colorLayer !== undefined ? colorLayer : current.colorLayer,
    patternOverlay:
      patternOverlay !== undefined ? patternOverlay : current.patternOverlay,
  };
}
