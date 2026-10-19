import "server-only";

import { unstable_cache } from "next/cache";
import { getCategories } from "@/features/categories/api";
import { getAllProducts } from "@/features/products/api";
import { getPublicSettings } from "@/features/settings/api";
import { getCurrentExchangeRate } from "@/features/exchange-rates/api";
import { apiMode, getApiBaseUrl } from "@/lib/env";

// Public data only. The API origin/mode are part of each persistent cache key.
const source = [apiMode, getApiBaseUrl()];
const readCategories = unstable_cache(getCategories,
  ["soky-menu-categories-v1", ...source],
  { revalidate: 900, tags: ["soky-menu-categories"] });
// Cache the assembled list so its pages refresh together.
const readProducts = unstable_cache(() => getAllProducts(),
  ["soky-menu-products-v1", ...source],
  { revalidate: 60, tags: ["soky-menu-products"] });
const readSettings = unstable_cache(getPublicSettings,
  ["soky-menu-settings-v1", ...source],
  { revalidate: 300, tags: ["soky-menu-settings"] });

export async function getMenuPageData(scenario?: string) {
  // All explicit test scenarios bypass public caches, including settings/categories.
  const bypass = Boolean(scenario);
  const [categories, products, rate, settings] = await Promise.all([
    bypass ? getCategories() : readCategories(),
    bypass ? getAllProducts({ scenario }) : readProducts(),
    getCurrentExchangeRate().catch(() => null),
    bypass ? getPublicSettings() : readSettings(),
  ]);
  return { categories, products, rate, settings };
}
