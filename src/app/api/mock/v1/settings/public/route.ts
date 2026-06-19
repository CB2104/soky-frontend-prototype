import { NextResponse } from "next/server";
import { mockSettings } from "@/mock/db";
import { applyScenarioDelay, errorResponse, getScenario } from "@/mock/helpers";

export async function GET(request: Request) {
  const scenario = getScenario(request);
  await applyScenarioDelay(scenario);

  if (scenario === "error") {
    return errorResponse("INTERNAL_ERROR", "No se pudo cargar la configuración pública.", 500);
  }

  return NextResponse.json(mockSettings);
}
