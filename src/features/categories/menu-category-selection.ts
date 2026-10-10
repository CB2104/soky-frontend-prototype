// Selecciones de navegación; las categorías reales conservan sus propios slugs.
export const ROLL_CATEGORY_SLUGS: readonly string[] = [
  "piezas-tempura",
  "piezas-frias",
];

export function resolveMenuCategorySelection(slug?: string | null): string | undefined {
  const value = slug?.trim();
  if (!value) return undefined;

  switch (value) {
    case "boxes": return "combo-boxs";
    case "tempura": return "piezas-tempura";
    case "frios": return "piezas-frias";
    default: return value;
  }
}

export function getMenuCategorySlugs(slug?: string | null): readonly string[] {
  const selection = resolveMenuCategorySelection(slug);
  if (selection === "rolls") return ROLL_CATEGORY_SLUGS;
  return selection ? [selection] : [];
}
