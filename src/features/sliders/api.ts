import type { PublicSliderItemDto, SliderCtaDto, SliderItemDto } from "@/contracts/api";
import { apiClient } from "@/lib/api/client";

function getSafeInternalPath(target?: string) {
  return target?.startsWith("/") ? target : undefined;
}

function getLegacyCtaType(cta?: SliderCtaDto): SliderItemDto["ctaType"] {
  if (!cta || cta.type === "NONE" || cta.type === "WHATSAPP") {
    return "NONE";
  }

  if (cta.type === "PRODUCT" || cta.type === "CATEGORY") {
    return cta.type;
  }

  return "CUSTOM_URL";
}

function getLegacyCtaTarget(cta?: SliderCtaDto) {
  if (!cta || cta.type === "NONE" || cta.type === "WHATSAPP") {
    return undefined;
  }

  if (cta.type === "PRODUCT" || cta.type === "CATEGORY") {
    return cta.target;
  }

  if (cta.type === "MENU") {
    return "/menu";
  }

  if (cta.type === "CART") {
    return "/cart";
  }

  if (cta.type === "LOCATION") {
    return getSafeInternalPath(cta.target) ?? "/#ubicacion";
  }

  return getSafeInternalPath(cta.target);
}

/** @deprecated Temporary adapter until home consumes PublicSliderItemDto directly. */
export function mapPublicSliderToLegacySlider(
  slider: PublicSliderItemDto,
  index = 0,
): SliderItemDto {
  return {
    id: slider.id,
    title: slider.title,
    description: slider.description,
    imageUrl: slider.desktopImageUrl,
    imageAlt: slider.imageAlt,
    ctaLabel: slider.primaryCta?.label,
    ctaType: getLegacyCtaType(slider.primaryCta),
    ctaTarget: getLegacyCtaTarget(slider.primaryCta),
    isActive: true,
    sortOrder: index + 1,
  };
}

export async function getActiveSliders() {
  const sliders = await apiClient.get<PublicSliderItemDto[]>("/sliders/active");

  return sliders.map(mapPublicSliderToLegacySlider);
}
