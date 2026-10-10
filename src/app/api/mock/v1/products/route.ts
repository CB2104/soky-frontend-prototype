import { NextResponse } from "next/server";
import { getMenuCategorySlugs } from "@/features/categories/menu-category-selection";
import {
  applyScenarioDelay,
  errorResponse,
  getPublicProducts,
  getScenario,
  paginate,
} from "@/mock/helpers";

export async function GET(request: Request) {
  const scenario = getScenario(request);

  await applyScenarioDelay(scenario);

  if (scenario === "error") {
    return errorResponse("INTERNAL_ERROR", "No se pudo cargar el menú.", 500);
  }

  const { searchParams } = new URL(request.url);

  const categorySlugs = getMenuCategorySlugs(searchParams.get("categorySlug"));
  const featured = searchParams.get("featured");
  const productType = searchParams.get("type");
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "24");

  const products =
    scenario === "empty"
      ? []
      : getPublicProducts().filter((product) => {
          const matchesCategory = categorySlugs.length === 0
            || categorySlugs.includes(product.categorySlug ?? "");

          const matchesFeatured = featured
            ? product.featured === (featured === "true")
            : true;

          const matchesType = productType ? product.type === productType : true;

          return matchesCategory && matchesFeatured && matchesType;
        });

  return NextResponse.json(paginate(products, page, limit));
}
