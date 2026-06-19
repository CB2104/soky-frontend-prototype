import { NextResponse } from "next/server";
import { applyScenarioDelay, errorResponse, getScenario, getScenarioRate } from "@/mock/helpers";

export async function GET(request: Request) {
  const scenario = getScenario(request);
  await applyScenarioDelay(scenario);

  if (scenario === "error") {
    return errorResponse(
      "EXCHANGE_RATE_UNAVAILABLE",
      "La tasa no está disponible en este momento.",
      503,
    );
  }

  return NextResponse.json(getScenarioRate(scenario));
}
