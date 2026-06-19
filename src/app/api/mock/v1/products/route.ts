import { NextResponse } from "next/server";
import { getPublicProducts, getScenario, paginate, applyScenarioDelay, errorResponse } from "@/mock/helpers";

export async function GET(request: Request) {
  const scenario = getScenario(request);
  await applyScenarioDelay(scenario);

  if (scenario === "error") {
    return errorResponse("INTERNAL_ERROR", "No se pudo cargar el menú.", 500);
  }

  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("categorySlug");
  const featured = searchParams.get("featured");
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "24");
  const products =
    scenario === "empty"
      ? []
      : getPublicProducts().filter((product) => {
          const matchesCategory = categorySlug ? product.categorySlug === categorySlug : true;
          const matchesFeatured = featured ? product.featured === (featured === "true") : true;
          return matchesCategory && matchesFeatured;
        });

  return NextResponse.json(paginate(products, page, limit));
}
