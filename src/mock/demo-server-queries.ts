import "server-only";
import type { CategoryDto, ExchangeRateDto, PublicSettingsDto, PublicSliderItemDto } from "@/contracts/api";
import * as products from "@/features/products/api";
import { serverApiGet } from "@/lib/api/server";

const client = { get: serverApiGet };
export const getCategories = () => serverApiGet<CategoryDto[]>("/categories");
export const getPublicSettings = () => serverApiGet<PublicSettingsDto>("/settings/public");
export const getCurrentExchangeRate = () => serverApiGet<ExchangeRateDto>("/exchange-rates/current");
export const getActivePublicSliders = () => serverApiGet<PublicSliderItemDto[]>("/sliders/active");
export const getProducts = (params: products.GetProductsParams = {}) => products.getProducts(params, client);
export const getAllProducts = (params: Omit<products.GetProductsParams, "page" | "limit"> = {}) => products.getAllProducts(params, client);
export const getPromoProducts = (limit = 6) => products.getPromoProducts(limit, client);
export const getProductBySlug = (slug: string, scenario?: string) => products.getProductBySlug(slug, scenario, client);
