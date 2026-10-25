import { cache } from "react";
import type { ProductDto } from "@/contracts/api";
import { isApiError } from "@/lib/api/errors";
import { getProductBySlug } from "@/mock/demo-server-queries";

export type ProductDetailResult =
  | { status: "ready"; product: ProductDto }
  | { status: "not-found" }
  | { status: "unavailable" };

// Deduplica la carga durante el render entre la página y sus metadatos.
export const loadProductDetail = cache(async (
  slug: string,
  scenario?: string,
): Promise<ProductDetailResult> => {
  try {
    const product = await getProductBySlug(slug, scenario);
    if (product.status !== "ACTIVE") return { status: "not-found" };

    return { status: "ready", product };
  } catch (error) {
    if (
      isApiError(error)
      && error.status === 404
      && error.code === "PRODUCT_NOT_FOUND"
    ) {
      return { status: "not-found" };
    }

    return { status: "unavailable" };
  }
});
