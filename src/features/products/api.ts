import type {
  PaginatedResponse,
  ProductDto,
  ProductType,
} from "@/contracts/api";
import { apiClient } from "@/lib/api/client";
import { apiMode } from "@/lib/env";

type GetProductsParams = {
  categorySlug?: string;
  featured?: boolean;
  type?: ProductType;
  limit?: number;
  page?: number;
  scenario?: string;
};

function toQuery(params: GetProductsParams = {}) {
  const query = new URLSearchParams();

  if (params.categorySlug) {
    query.set("categorySlug", params.categorySlug);
  }

  if (params.featured !== undefined) {
    query.set("featured", String(params.featured));
  }

  if (params.type) {
    query.set("type", params.type);
  }

  if (params.limit) {
    query.set("limit", String(params.limit));
  }

  if (params.page) {
    query.set("page", String(params.page));
  }

  if (params.scenario) {
    query.set("scenario", params.scenario);
  }

  const value = query.toString();

  return value ? `?${value}` : "";
}

export function getProducts(params: GetProductsParams = {}) {
  return apiClient.get<PaginatedResponse<ProductDto>>(
    `/products${toQuery(params)}`,
  );
}

export async function getPromoProducts(limit = 6) {
  const response = await getProducts({
    type: "PROMO",
    limit,
  });

  return response.data;
}

export function getFeaturedProducts(limit = 6) {
  return apiClient.get<ProductDto[]>(`/products/featured?limit=${limit}`);
}

export function getProductBySlug(slug: string, scenario?: string) {
  const query = apiMode === "mock" && scenario
    ? "?scenario=" + encodeURIComponent(scenario)
    : "";

  return apiClient.get<ProductDto>(
    `/products/${encodeURIComponent(slug)}${query}`,
  );
}

// El menú público consume todas las páginas del contrato, sin límite total fijo.
export async function getAllProducts(
  params: Omit<GetProductsParams, "page" | "limit"> = {},
): Promise<ProductDto[]> {
  const first = await getProducts({ ...params, page: 1, limit: 48 });
  const remaining = await Promise.all(
    Array.from({ length: Math.max(0, first.meta.pageCount - 1) }, (_, index) =>
      getProducts({ ...params, page: index + 2, limit: 48 }),
    ),
  );

  return first.data.concat(...remaining.map((response) => response.data));
}
