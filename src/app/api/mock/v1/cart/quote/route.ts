import { NextResponse } from "next/server";
import type { CartQuoteRequestDto } from "@/contracts/api";
import { applyScenarioDelay, buildCartQuote, errorResponse, getQuoteRateError, getScenario } from "@/mock/helpers";

export async function POST(request: Request) {
  const scenario = getScenario(request);
  await applyScenarioDelay(scenario);

  if (scenario === "error") {
    return errorResponse("EXCHANGE_RATE_UNAVAILABLE", "No se pudo calcular el pedido.", 503);
  }

  const body = (await request.json().catch(() => null)) as CartQuoteRequestDto | null;

  if (!body || !Array.isArray(body.items) || body.items.length === 0
    || body.items.some((item) => !item || typeof item.productId !== "string" || typeof item.quantity !== "number")) {
    return errorResponse("VALIDATION_ERROR", "El carrito no puede estar vacío.", 422);
  }

  const rateError = getQuoteRateError(body, scenario);
  if (rateError) {
    return errorResponse("EXCHANGE_RATE_UNAVAILABLE", rateError, 503);
  }

  return NextResponse.json(buildCartQuote(body, scenario));
}
