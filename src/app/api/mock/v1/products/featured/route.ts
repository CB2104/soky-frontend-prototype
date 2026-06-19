import { NextResponse } from "next/server";
import { applyScenarioDelay, errorResponse, getPublicProducts, getScenario } from "@/mock/helpers";

export async function GET(request: Request) {
  const scenario = getScenario(request);
  await applyScenarioDelay(scenario);

  if (scenario === "error") {
    return errorResponse("INTERNAL_ERROR", "No se pudieron cargar las promos.", 500);
  }

  const limit = Number(new URL(request.url).searchParams.get("limit") ?? "6");
  const products =
    scenario === "empty"
      ? []
      : getPublicProducts()
          .filter((product) => product.featured)
          .slice(0, limit);

  return NextResponse.json(products);
}
