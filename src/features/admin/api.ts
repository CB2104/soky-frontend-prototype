import type {
  AdminAnalyticsProductDto,
  AdminAnalyticsSliderDto,
  AdminAnalyticsSummaryDto,
  CategoryDto,
  ExchangeRateDto,
  OrderIntentConfirmViewDto,
  PaginatedResponse,
  ProductDto,
  PublicSettingsDto,
  SliderItemDto,
} from "@/contracts/api";
import { apiClient } from "@/lib/api/client";

const adminHeaders = {
  Authorization: "Bearer mock-access-token",
};

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

export function getAdminSliders() {
  return apiClient.get<PaginatedResponse<SliderItemDto>>("/admin/sliders", {
    headers: adminHeaders,
  });
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
