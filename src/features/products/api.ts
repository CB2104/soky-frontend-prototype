import type {
  PaginatedResponse,
  ProductDto,
  ProductType,
} from "@/contracts/api";
import { apiClient } from "@/lib/api/client";
import { apiMode } from "@/lib/env";

export type GetProductsParams = {
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

export function getProducts(params: GetProductsParams = {}, client: Pick<typeof apiClient, "get"> = apiClient) {
  return client.get<PaginatedResponse<ProductDto>>(
    `/products${toQuery(params)}`,
  );
}

export async function getPromoProducts(limit = 6, client: Pick<typeof apiClient, "get"> = apiClient) {
  const response = await getProducts({
    type: "PROMO",
    limit,
  }, client);

  return response.data;
}

export function getFeaturedProducts(limit = 6) {
  return apiClient.get<ProductDto[]>(`/products/featured?limit=${limit}`);
}

export function getProductBySlug(slug: string, scenario?: string, client: Pick<typeof apiClient, "get"> = apiClient) {
  const query = apiMode === "mock" && scenario
    ? "?scenario=" + encodeURIComponent(scenario)
    : "";

  return client.get<ProductDto>(
    `/products/${encodeURIComponent(slug)}${query}`,
  );
}

// El menú público consume todas las páginas del contrato, sin límite total fijo.
export async function getAllProducts(
  params: Omit<GetProductsParams, "page" | "limit"> = {},
  client: Pick<typeof apiClient, "get"> = apiClient,
): Promise<ProductDto[]> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const first = await getProducts({ ...params, page: 1, limit: 48 }, client);
    const remaining = await Promise.all(
      Array.from({ length: Math.max(0, first.meta.pageCount - 1) }, (_, index) =>
        getProducts({ ...params, page: index + 2, limit: 48 }, client),
      ),
    );
    // A currency/catalog transaction may happen between paginated requests.
    // Never publish an assembled list containing snapshots from two revisions.
    if (first.meta.revision === undefined || remaining.every(page => page.meta.revision === first.meta.revision)) {
      return first.data.concat(...remaining.map(response => response.data));
    }
  }
  throw new Error("El catálogo está cambiando. Vuelve a cargar los productos.");
}
