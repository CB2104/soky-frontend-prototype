import type { CategoryDto } from "@/contracts/api";
import { getMenuCategorySlugs } from "@/features/categories/menu-category-selection";

type HomeCategorySlug = "boxes" | "rolls" | "ensaladas" | "entradas";

export type CategoryCardImage = { src: string; alt: string };

export type CategoryCardViewModel = {
  id: string;
  title: string;
  description: string;
  eyebrow: string;
  href: string;
  tone: "blue" | "orange";
  images: readonly [CategoryCardImage, CategoryCardImage];
};

const order: readonly HomeCategorySlug[] = ["boxes", "rolls", "ensaladas", "entradas"];

const visual: Record<HomeCategorySlug, Pick<CategoryCardViewModel, "eyebrow" | "tone" | "images">> = {
  boxes: {
    eyebrow: "Para compartir",
    tone: "orange",
    images: [
      { src: "/images/categories/boxes-01.webp", alt: "Box de sushi SOKY para compartir." },
      { src: "/images/categories/boxes-02.webp", alt: "Segunda vista del box de sushi SOKY." },
    ],
  },
  rolls: {
    eyebrow: "Enrolla el antojo",
    tone: "blue",
    images: [
      { src: "/images/categories/rolls-01.webp", alt: "Selección de rolls SOKY." },
      { src: "/images/categories/rolls-02.webp", alt: "Detalle de los rolls SOKY." },
    ],
  },
  ensaladas: {
    eyebrow: "Fresco y ligero",
    tone: "orange",
    images: [
      { src: "/images/categories/ensaladas-01.webp", alt: "Ensalada de estilo japonés." },
      { src: "/images/categories/ensaladas-02.webp", alt: "Ensalada de tiras vegetales con aguacate y sésamo." },
    ],
  },
  entradas: {
    eyebrow: "Empieza aquí",
    tone: "blue",
    images: [
      { src: "/images/categories/entradas-01.webp", alt: "Entrada de camarones crujientes." },
      { src: "/images/categories/entradas-02.webp", alt: "Piezas ovaladas empanizadas con salsa y sésamo." },
    ],
  },
};

const destinations: Record<HomeCategorySlug, { title: string; selection: string }> = {
  boxes: { title: "Boxes", selection: "combo-boxs" },
  rolls: { title: "Rolls", selection: "rolls" },
  ensaladas: { title: "Ensaladas", selection: "ensaladas" },
  entradas: { title: "Entradas", selection: "entradas" },
};

export function selectHomeCategoryCards(categories: readonly CategoryDto[]): CategoryCardViewModel[] {
  return order.flatMap((slug) => {
    const destination = destinations[slug];
    const categorySlugs = getMenuCategorySlugs(destination.selection);
    const matches = categories.filter((category) =>
      category.isActive && categorySlugs.includes(category.slug),
    );
    if (matches.length === 0) return [];

    return [{
      id: "home-" + slug,
      title: destination.title,
      description: matches.map((category) => category.description ?? category.name).join(" · "),
      href: "/menu?category=" + encodeURIComponent(destination.selection),
      ...visual[slug],
    }];
  });
}
