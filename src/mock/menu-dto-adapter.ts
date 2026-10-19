import type { CategoryDto, CategoryGroup, ProductDto } from "@/contracts/api";
import type { Catalog } from "./menu-source.types";
import { menuCatalog } from "./menu-catalog";
import productPhotoIds from "./menu-product-photo-ids.json";
import {
  defaultProductAvailability,
  pendingProductPhoto,
  productEditorial,
  type ProductEditorial,
} from "./menu-editorial";
import { existingProductIdentity } from "./menu-product-identity";

const productPhotoIdSet = new Set<string>(productPhotoIds);

function getCategoryGroup(slug: string): CategoryGroup {
  if (slug === "combo-boxs") return "COMBO";
  if (slug === "bebidas" || slug === "cocteles") return "DRINK";
  if (slug === "postres") return "DESSERT";
  return "FOOD";
}

export function buildMenuDtoData(
  catalog: Catalog,
  editorial: Record<string, ProductEditorial> = productEditorial,
): { categories: CategoryDto[]; products: ProductDto[] } {
  const categories: CategoryDto[] = catalog.categories.map((category) => ({
    id: "cat-" + category.id,
    key: category.id,
    name: category.name,
    slug: category.id,
    group: getCategoryGroup(category.id),
    sortOrder: category.sortOrder,
    isActive: true,
  }));
  const categoryOrders = new Map(categories.map((category) => [category.slug, category.sortOrder]));

  const products: ProductDto[] = catalog.products.map((product) => {
    const presentation = editorial[product.sourceId] ?? {};
    const identity = existingProductIdentity[product.sourceId];
    const imageUrl = presentation.imageUrl ?? (
      productPhotoIdSet.has(product.sourceId)
        ? `/images/products/${product.sourceId}.webp`
        : undefined
    );
    const hasPhoto = Boolean(imageUrl);
    const imageStatus = hasPhoto ? presentation.imageStatus ?? "PROVISIONAL" : "PENDING";

    return {
      id: identity?.id ?? product.sourceId,
      sourceId: product.sourceId,
      slug: identity?.slug ?? product.sourceId,
      title: product.title,
      description: product.description,
      shortDescription: presentation.shortDescription,
      descriptionSource: product.descriptionSource,
      metadata: product.metadata,
      details: product.details ? structuredClone(product.details) : undefined,
      categoryId: "cat-" + product.categorySlug,
      categorySlug: product.categorySlug,
      type: product.promotionEligible ? "PROMO" : "SIMPLE",
      status: "ACTIVE",
      isAvailable: presentation.isAvailable ?? defaultProductAvailability,
      // Orden por categoría, seguido del orden de la fuente dentro de ella.
      sortOrder: (categoryOrders.get(product.categorySlug) ?? 0) * 1000 + product.sortOrder,
      priceCurrency: product.priceCurrency,
      priceAmount: product.priceAmount,
      imageUrl: imageUrl ?? pendingProductPhoto,
      imageAlt: presentation.imageAlt ?? (
        hasPhoto
          ? "Imagen referencial de " + product.title + "."
          : "Fotografía pendiente de " + product.title + "."
      ),
      imageStatus,
      featured: presentation.featured ?? false,
      tags: [...product.labels],
      labels: [...product.labels],
      beverageGroup: product.beverageGroup,
      // Sin datos de alérgenos: no interpretarlos como verificados o ausentes.
      allergens: [],
    };
  });

  if (new Set(products.map((product) => product.id)).size !== products.length) {
    throw new Error("Hay IDs internos duplicados en el adaptador del menú.");
  }

  return { categories, products };
}

// Listos para conectar desde db.ts en el siguiente lote.
const prepared = buildMenuDtoData(menuCatalog);
export const preparedMenuCategories = prepared.categories;
export const preparedMenuProducts = prepared.products;
