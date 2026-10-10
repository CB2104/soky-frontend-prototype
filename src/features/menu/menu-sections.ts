import type { CategoryDto, ProductDto } from "@/contracts/api";
import { resolveMenuCategorySelection, ROLL_CATEGORY_SLUGS } from "@/features/categories/menu-category-selection";
import { mapProductToCard, type ProductCardViewModel } from "@/features/products/mappers";

export type MenuSubsection = {
  slug: string;
  title: string;
  products: ProductCardViewModel[];
};

export type MenuSection = {
  slug: string;
  title: string;
  count: number;
  subsections: MenuSubsection[];
};

export function menuAnchorId(slug: string) {
  return "menu-" + slug;
}

export function buildMenuSections(
  categories: readonly CategoryDto[],
  products: readonly ProductDto[],
): MenuSection[] {
  const ordered = categories
    .filter((category) => category.isActive)
    .toSorted((a, b) => a.sortOrder - b.sortOrder);
  const byCategory = new Map<string, ProductDto[]>();

  for (const product of products) {
    if (product.status !== "ACTIVE") continue;
    const slug = product.categorySlug ?? "";
    const list = byCategory.get(slug) ?? [];
    list.push(product);
    byCategory.set(slug, list);
  }

  let rollsAdded = false;

  return ordered.flatMap((category) => {
    const isRoll = ROLL_CATEGORY_SLUGS.includes(category.slug);
    if (isRoll && rollsAdded) return [];
    if (isRoll) rollsAdded = true;

    const members = isRoll
      ? ordered.filter((item) => ROLL_CATEGORY_SLUGS.includes(item.slug))
      : [category];
    const subsections = members.map((member) => ({
      slug: member.slug,
      title: member.name,
      products: (byCategory.get(member.slug) ?? [])
        .toSorted((a, b) => a.sortOrder - b.sortOrder)
        .map(mapProductToCard),
    }));

    return [{
      slug: isRoll ? "rolls" : category.slug,
      title: isRoll ? "Rolls" : category.slug === "combo-boxs" ? "Boxes" : category.name,
      count: subsections.reduce(
        (total, subsection) => total + subsection.products.length,
        0,
      ),
      subsections,
    }];
  });
}

export function getMenuDestination(
  sections: readonly MenuSection[],
  requested?: string,
): string | undefined {
  const selection = resolveMenuCategorySelection(requested);
  if (!selection) return "menu-start";

  const exists = sections.some((section) =>
    section.slug === selection
    || section.subsections.some((subsection) => subsection.slug === selection),
  );

  return exists ? menuAnchorId(selection) : undefined;
}
