import type { ProductDto } from "@/contracts/api";
import { parseMoneyCents } from "@/lib/money";

const editorial: Readonly<Record<string, readonly string[]>> = {
  "box-kurama": ["box-kiyomi", "box-osaka", "box-soky"],
  "menu-kids": ["tequenos-6", "brownie", "yukery-250ml"],
  "fuji-soky": ["tnt-fish", "ninja-roll", "chicken-roll"],
  "tobo-cerveza-light-zulia-negra": [
    "malta-botella",
    "gatorade",
    "tobo-cerveza-solera",
  ],
  "tobo-cerveza-solera": [
    "malta-botella",
    "gatorade",
    "tobo-cerveza-light-zulia-negra",
  ],
};

export function selectDetailRecommendations(
  current: ProductDto,
  catalog: readonly ProductDto[],
): ProductDto[] {
  const valid = catalog.filter((item) =>
    item.id !== current.id
    && item.status === "ACTIVE"
    && item.isAvailable
    && item.priceCurrency === current.priceCurrency
    && parseMoneyCents(item.priceAmount) !== null,
  );
  const bySlug = new Map(valid.map((item) => [item.slug, item]));
  const curated = (editorial[current.slug] ?? [])
    .map((slug) => bySlug.get(slug))
    .filter((item): item is ProductDto => item !== undefined);
  const ordered = [
    ...curated,
    ...valid.filter((item) => item.categoryId === current.categoryId),
    ...valid.filter((item) => item.featured),
  ];

  return [...new Map(ordered.map((item) => [item.id, item])).values()]
    .slice(0, 3);
}
