import { NextResponse } from "next/server";
import { applyScenarioDelay, errorResponse, getProductBySlug, getScenario } from "@/mock/helpers";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const scenario = getScenario(request);
  await applyScenarioDelay(scenario);

  if (scenario === "error") {
    return errorResponse("INTERNAL_ERROR", "No se pudo cargar el producto.", 500);
  }

  const { slug } = await context.params;
  const product = getProductBySlug(slug);

  if (!product || scenario === "empty") {
    return errorResponse("PRODUCT_NOT_FOUND", "Producto no encontrado.", 404);
  }

  return NextResponse.json(product);
}
