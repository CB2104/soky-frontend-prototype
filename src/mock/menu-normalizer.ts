import type { Catalog, MenuSource, MenuSourceDetails } from "./menu-source.types";

function describeDetails(details?: MenuSourceDetails): string {
  if (!details) return "";
  if (details.composition?.length) {
    return details.composition.map((item) =>
      item.quantity + " piezas " + item.type,
    ).join(" + ") + ".";
  }
  if (details.components?.length) {
    return details.components.map((item) =>
      typeof item === "string" ? item : item.quantity + " " + item.name,
    ).join(", ") + ".";
  }
  if (details.quantity && details.unit) {
    const variants = details.variants?.length ? " · " + details.variants.join(", ") : "";
    return details.quantity + " " + details.unit + variants + ".";
  }
  if (details.pieces) return details.pieces + " piezas.";
  return "";
}

function getMetadata(details?: MenuSourceDetails): string | undefined {
  if (details?.pieces) return details.pieces + " piezas";
  if (details?.quantity && details.unit) return details.quantity + " " + details.unit;
  return undefined;
}

export function normalizeMenuSource(source: MenuSource): Catalog {
  if (source.restaurant.currency !== "EUR") {
    throw new Error("Este catálogo debe conservar la moneda EUR de la fuente.");
  }
  const categoryIds = new Set<string>();
  const productIds = new Set<string>();
  const categories = source.categories.toSorted((a, b) => a.sortOrder - b.sortOrder);

  for (const category of categories) {
    if (categoryIds.has(category.id)) throw new Error("Categoría duplicada: " + category.id);
    categoryIds.add(category.id);
    for (const product of category.products) {
      if (productIds.has(product.id)) throw new Error("Producto duplicado: " + product.id);
      if (!Number.isFinite(product.price) || product.price < 0) {
        throw new Error("Precio inválido: " + product.id);
      }
      productIds.add(product.id);
    }
  }

  return {
    restaurant: { ...source.restaurant },
    categories: categories.map(({ id, name, sortOrder }) => ({ id, name, sortOrder })),
    products: categories.flatMap((category) => category.products.map((product, index) => {
      const supplied = product.description?.trim() ?? "";
      const derived = describeDetails(product.details);
      return {
        sourceId: product.id,
        title: product.name,
        categorySlug: category.id,
        categoryName: category.name,
        sortOrder: index + 1,
        priceCurrency: "EUR" as const,
        priceAmount: product.price.toFixed(2),
        description: supplied || derived,
        descriptionSource: supplied ? "SOURCE" as const : derived ? "DETAILS" as const : "PENDING" as const,
        metadata: getMetadata(product.details),
        labels: [...(product.labels ?? [])],
        beverageGroup: product.group,
        details: product.details ? structuredClone(product.details) : undefined,
        promotionEligible: category.id === "combo-boxs",
      };
    })),
  };
}
