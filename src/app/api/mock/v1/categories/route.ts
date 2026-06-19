import { NextResponse } from "next/server";
import { mockCategories } from "@/mock/db";
import { applyScenarioDelay, errorResponse, getScenario } from "@/mock/helpers";

export async function GET(request: Request) {
  const scenario = getScenario(request);
  await applyScenarioDelay(scenario);

  if (scenario === "error") {
    return errorResponse("INTERNAL_ERROR", "No se pudieron cargar las categorías.", 500);
  }

  const categories =
    scenario === "empty"
      ? []
      : mockCategories
          .filter((category) => category.isActive)
          .toSorted((a, b) => a.sortOrder - b.sortOrder);

  return NextResponse.json(categories);
}
