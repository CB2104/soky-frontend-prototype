import type { PaginatedResponse, ProductDto } from "@/contracts/api";
import { apiClient } from "@/lib/api/client";

type GetProductsParams = {
  categorySlug?: string;
  featured?: boolean;
  limit?: number;
  page?: number;
  scenario?: string;
};

function toQuery(params: GetProductsParams = {}) {
  const query = new URLSearchParams();

  if (params.categorySlug) query.set("categorySlug", params.categorySlug);
  if (params.featured !== undefined) query.set("featured", String(params.featured));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.page) query.set("page", String(params.page));
  if (params.scenario) query.set("scenario", params.scenario);

  const value = query.toString();
  return value ? `?${value}` : "";
}

export function getProducts(params: GetProductsParams = {}) {
  return apiClient.get<PaginatedResponse<ProductDto>>(`/products${toQuery(params)}`);
}

export function getFeaturedProducts(limit = 6) {
  return apiClient.get<ProductDto[]>(`/products/featured?limit=${limit}`);
}

export function getProductBySlug(slug: string) {
  return apiClient.get<ProductDto>(`/products/${slug}`);
}
