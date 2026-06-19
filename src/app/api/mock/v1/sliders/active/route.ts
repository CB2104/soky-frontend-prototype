import { NextResponse } from "next/server";
import { mockSliders } from "@/mock/db";
import { applyScenarioDelay, errorResponse, getScenario } from "@/mock/helpers";

export async function GET(request: Request) {
  const scenario = getScenario(request);
  await applyScenarioDelay(scenario);

  if (scenario === "error") {
    return errorResponse("INTERNAL_ERROR", "No se pudieron cargar los sliders.", 500);
  }

  const sliders =
    scenario === "empty"
      ? []
      : mockSliders
          .filter((slider) => slider.isActive)
          .toSorted((a, b) => a.sortOrder - b.sortOrder);

  return NextResponse.json(sliders);
}
