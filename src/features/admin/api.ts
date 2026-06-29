import type {
  AdminAnalyticsProductDto,
  AdminAnalyticsSliderDto,
  AdminAnalyticsSummaryDto,
  AdminSliderItemDto,
  CategoryDto,
  ExchangeRateDto,
  OrderIntentConfirmViewDto,
  PaginatedResponse,
  ProductDto,
  PublicSettingsDto,
  SliderCtaDto,
  SliderItemDto,
} from "@/contracts/api";
import { apiClient } from "@/lib/api/client";

const adminHeaders = {
  Authorization: "Bearer mock-access-token",
};

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

/** @deprecated Temporary adapter until admin UI consumes AdminSliderItemDto directly. */
export function mapAdminSliderToLegacySlider(slider: AdminSliderItemDto): SliderItemDto {
  return {
    id: slider.id,
    title: slider.title,
    description: slider.description,
    imageUrl: slider.desktopImageUrl,
    imageAlt: slider.imageAlt,
    ctaLabel: slider.primaryCta?.label,
    ctaType: getLegacyCtaType(slider.primaryCta),
    ctaTarget: getLegacyCtaTarget(slider.primaryCta),
    isActive: slider.status === "ACTIVE",
    sortOrder: slider.sortOrder,
    createdAt: slider.createdAt,
    updatedAt: slider.updatedAt,
  };
}

export function getAdminProducts() {
  return apiClient.get<PaginatedResponse<ProductDto>>("/admin/products", {
    headers: adminHeaders,
  });
}

export function getAdminCategories() {
  return apiClient.get<PaginatedResponse<CategoryDto>>("/admin/categories", {
    headers: adminHeaders,
  });
}

export async function getAdminSliders() {
  const response = await apiClient.get<PaginatedResponse<AdminSliderItemDto>>("/admin/sliders", {
    headers: adminHeaders,
  });

  return {
    ...response,
    data: response.data.map(mapAdminSliderToLegacySlider),
  };
}

export function getAdminSettings() {
  return apiClient.get<PublicSettingsDto>("/admin/settings", {
    headers: adminHeaders,
  });
}

export function getAdminExchangeRate() {
  return apiClient.get<ExchangeRateDto>("/admin/exchange-rates/current", {
    headers: adminHeaders,
  });
}

export function getAdminExchangeRateHistory() {
  return apiClient.get<ExchangeRateDto[]>("/admin/exchange-rates/history", {
    headers: adminHeaders,
  });
}

export function getAdminAnalyticsSummary() {
  return apiClient.get<AdminAnalyticsSummaryDto>("/admin/analytics/summary", {
    headers: adminHeaders,
  });
}

export function getAdminAnalyticsProducts() {
  return apiClient.get<AdminAnalyticsProductDto[]>("/admin/analytics/products", {
    headers: adminHeaders,
  });
}

export function getAdminAnalyticsSliders() {
  return apiClient.get<AdminAnalyticsSliderDto[]>("/admin/analytics/sliders", {
    headers: adminHeaders,
  });
}

export function getAdminOrderIntents() {
  return apiClient.get<PaginatedResponse<OrderIntentConfirmViewDto>>("/admin/order-intents", {
    headers: adminHeaders,
  });
}
