import { ROLL_CATEGORY_SLUGS } from "@/features/categories/menu-category-selection";

export type ProductCardTheme = "default" | "ivory" | "orange";
export type ProductBadgeKind = "promo" | "favorite" | "selection" | "specialty";

type CardSelection = {
  slug: string;
  theme: ProductCardTheme;
  badgeKind: Exclude<ProductBadgeKind, "promo">;
  badge: string;
};

// Selección editorial explícita y revisable; no representa ventas ni ranking.
// Tempura y Fríos comparten la sección Rolls.
export const PRODUCT_CARD_SELECTIONS: Readonly<Record<string, CardSelection>> = {
  entradas: { slug: "tequenos-6", theme: "ivory", badgeKind: "favorite", badge: "Favorito" },
  rolls: { slug: "fuji-soky", theme: "ivory", badgeKind: "favorite", badge: "Favorito" },
  ensaladas: { slug: "dinamita", theme: "ivory", badgeKind: "selection", badge: "Selección" },
  tartar: { slug: "tartar-atun", theme: "ivory", badgeKind: "selection", badge: "Selección" },
  ceviches: { slug: "ceviche-especial", theme: "ivory", badgeKind: "selection", badge: "Selección" },
  "combo-boxs": { slug: "box-kiyomi", theme: "ivory", badgeKind: "favorite", badge: "Favorito" },
  especiales: { slug: "soky-burger", theme: "orange", badgeKind: "specialty", badge: "Especial" },
  "menu-kids": { slug: "menu-kids", theme: "ivory", badgeKind: "selection", badge: "Selección" },
  postres: { slug: "brownie", theme: "ivory", badgeKind: "favorite", badge: "Favorito" },
  bebidas: { slug: "limonada-hierbabuena", theme: "default", badgeKind: "selection", badge: "Selección" },
  cocteles: { slug: "mojito", theme: "default", badgeKind: "selection", badge: "Selección" },
};

export function getProductCardSelection(product: {
  slug: string;
  categorySlug?: string;
  status: string;
  isAvailable: boolean;
}): CardSelection | undefined {
  const category = product.categorySlug ?? "";
  const section = ROLL_CATEGORY_SLUGS.includes(category) ? "rolls" : category;
  const selection = PRODUCT_CARD_SELECTIONS[section];
  return selection?.slug === product.slug
    && product.status === "ACTIVE"
    && product.isAvailable
    ? selection
    : undefined;
}
