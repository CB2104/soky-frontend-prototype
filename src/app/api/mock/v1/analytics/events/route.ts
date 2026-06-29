import { NextResponse } from "next/server";
import type {
  AnalyticsEventRequestDto,
  AnalyticsEventResponseDto,
} from "@/contracts/api";
import { applyScenarioDelay, errorResponse, getScenario } from "@/mock/helpers";

const acceptedEvents = new Set([
  "page_view",
  "section_view",
  "category_view",
  "product_view",
  "promo_view",
  "product_add_to_cart",
  "product_remove_from_cart",
  "cart_open",
  "checkout_started",
  "whatsapp_clicked",
  "slider_view",
  "slider_click",
  "contact_speed_dial_open",
  "contact_whatsapp_click",
  "contact_instagram_click",
  "contact_tiktok_click",
]);

export async function POST(request: Request) {
  const scenario = getScenario(request);
  await applyScenarioDelay(scenario);

  if (scenario === "error") {
    const response: AnalyticsEventResponseDto = { accepted: true };
    return NextResponse.json(response);
  }

  const body = (await request
    .json()
    .catch(() => null)) as AnalyticsEventRequestDto | null;

  if (!body?.sessionId || !acceptedEvents.has(body.eventType)) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Evento de analytics inválido.",
      422,
    );
  }

  const response: AnalyticsEventResponseDto = { accepted: true };
  return NextResponse.json(response, { status: 202 });
}
