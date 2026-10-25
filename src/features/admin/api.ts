import type { DemoSnapshot } from "@/contracts/demo";
import type { AdminAnalyticsProduct, AdminAnalyticsPromotion, AdminAnalyticsSummary, AdminDashboardSummary, AdminOrderIntent } from "@/contracts/admin-reporting";
import { apiClient } from "@/lib/api/client";
import { serverApiGet } from "@/lib/api/server";
import type { AdminSliderItemDto, CategoryDto, ExchangeRateDto, PaginatedResponse, ProductDto, PublicSettingsDto, SliderItemDto } from "@/contracts/api";
import { requirePageSession } from "@/mock/demo-auth";

async function adminGet<T>(path: string) {
  await requirePageSession();
  return serverApiGet<T>(path);
}
export function getAdminProducts(query = "") { return adminGet<PaginatedResponse<ProductDto>>(`/admin/products${query}`); }
export function getAdminCategories(query = "") { return adminGet<PaginatedResponse<CategoryDto>>(`/admin/categories${query}`); }
export function getAdminHero() { return adminGet<PaginatedResponse<AdminSliderItemDto>>("/admin/sliders"); }
// Compatibility for the existing read-only screen. New editors must use getAdminHero.
export async function getAdminSliders(): Promise<PaginatedResponse<SliderItemDto>> {
  const source = await getAdminHero();
  return { ...source, data: source.data.map(slide => ({ id: slide.id, title: slide.title, description: slide.description, imageUrl: slide.desktopImageUrl, imageAlt: slide.imageAlt, ctaLabel: slide.primaryCta?.label, ctaType: slide.primaryCta?.type === "PRODUCT" ? "PRODUCT" : slide.primaryCta?.type === "CATEGORY" ? "CATEGORY" : "NONE", ctaTarget: slide.primaryCta?.target, isActive: slide.status === "ACTIVE", sortOrder: slide.sortOrder })) };
}
export function getAdminSettings() { return adminGet<PublicSettingsDto>("/admin/settings"); }
export function getAdminExchangeRate() { return adminGet<ExchangeRateDto>("/admin/exchange-rates/current"); }
export function getAdminExchangeRateHistory() { return adminGet<ExchangeRateDto[]>("/admin/exchange-rates/history"); }
export function getAdminDashboardSummary() { return adminGet<AdminDashboardSummary>("/admin/dashboard/summary"); }
export function getAdminAnalyticsSummary() { return adminGet<AdminAnalyticsSummary>("/admin/analytics/summary"); }
export function getAdminAnalyticsProducts() { return adminGet<AdminAnalyticsProduct[]>("/admin/analytics/products"); }
export function getAdminAnalyticsSliders() { return adminGet<AdminAnalyticsPromotion[]>("/admin/analytics/sliders"); }
export function getAdminOrderIntents(query = "") { return adminGet<PaginatedResponse<AdminOrderIntent>>(`/admin/order-intents${query}`); }
export function getAdminOrderIntent(id: string) { return adminGet<AdminOrderIntent>(`/admin/order-intents/${encodeURIComponent(id)}`); }

export function getAdminWorkspace() { return adminGet<DemoSnapshot>("/admin/demo/workspace"); }
export async function saveAdmin(path: string, body: Record<string, unknown>, revision: number, method: "POST" | "PATCH" | "DELETE" = "PATCH") {
  const headers = { "If-Match": String(revision) };
  if (method === "DELETE") return apiClient.delete(path, { headers });
  const payload = { ...body, expectedRevision: revision };
  if (method === "POST") return apiClient.post(path, payload);
  return apiClient.patch(path, payload);
}
