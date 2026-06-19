import { NextResponse } from "next/server";
import type { CreateOrderIntentRequestDto, CreateOrderIntentResponseDto } from "@/contracts/api";
import { siteUrl } from "@/lib/env";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { mockOrderIntents, mockSettings } from "@/mock/db";
import { applyScenarioDelay, buildCartQuote, errorResponse, getScenario } from "@/mock/helpers";

export async function POST(request: Request) {
  const scenario = getScenario(request);
  await applyScenarioDelay(scenario);

  if (scenario === "error") {
    return errorResponse("INTERNAL_ERROR", "No se pudo crear la intención de pedido.", 500);
  }

  const body = (await request.json().catch(() => null)) as CreateOrderIntentRequestDto | null;

  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return errorResponse("VALIDATION_ERROR", "El pedido debe incluir productos.", 422);
  }

  if (body.fulfillmentType === "DELIVERY" && !body.deliveryAddress) {
    return errorResponse("VALIDATION_ERROR", "Agrega una dirección para delivery.", 422);
  }

  const quote = buildCartQuote(
    {
      items: body.items,
      fulfillmentType: body.fulfillmentType,
    },
    scenario,
  );

  if (quote.invalidItems.length > 0) {
    return errorResponse("INVALID_CART_ITEM", "Hay productos que no se pueden comprar.", 422, {
      invalidItems: quote.invalidItems,
    });
  }

  const id = `ord-${Date.now()}`;
  const publicCode = `SOKY-${String(mockOrderIntents.length + 1).padStart(3, "0")}`;
  const token = `demo-${id}`;
  const confirmationUrl = `${siteUrl}/order-intents/confirm/${token}`;
  const whatsappMessage = [
    `Hola SOKY, quiero confirmar el pedido ${publicCode}.`,
    `Total referencial: ${quote.totals.totalVes} VES.`,
    `Link operador: ${confirmationUrl}`,
  ].join("\n");
  const whatsappUrl = buildWhatsAppUrl(mockSettings.whatsappPhone, whatsappMessage);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  mockOrderIntents.push({
    id,
    publicCode,
    status: "PENDING_WHATSAPP",
    fulfillmentType: body.fulfillmentType,
    deliveryAddress: body.deliveryAddress,
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    notes: body.notes,
    items: quote.items,
    totals: quote.totals,
    rateSnapshot: quote.rateSnapshot,
    expiresAt,
  });

  const response: CreateOrderIntentResponseDto = {
    id,
    publicCode,
    status: "PENDING_WHATSAPP",
    whatsappUrl,
    whatsappMessage,
    confirmationUrl,
    expiresAt,
    warnings: quote.warnings,
  };

  return NextResponse.json(response, { status: 201 });
}
