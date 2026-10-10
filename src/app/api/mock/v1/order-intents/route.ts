import { buildCheckoutMessage } from "@/features/checkout/whatsapp-message";
import { parseMoneyCents } from "@/lib/money";
import { NextResponse } from "next/server";
import type { CreateOrderIntentRequestDto, CreateOrderIntentResponseDto } from "@/contracts/api";
import { siteUrl } from "@/lib/env";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { mockOrderIntents, mockSettings } from "@/mock/db";
import { applyScenarioDelay, buildCartQuote, errorResponse, getQuoteRateError, getScenario } from "@/mock/helpers";

export async function POST(request: Request) {
  const scenario = getScenario(request);
  await applyScenarioDelay(scenario);

  if (scenario === "error") {
    return errorResponse("INTERNAL_ERROR", "No se pudo crear la intención de pedido.", 500);
  }

  const body = (await request.json().catch(() => null)) as CreateOrderIntentRequestDto | null;

  if (!body || !Array.isArray(body.items) || body.items.length === 0
    || body.items.some((item) => !item || typeof item.productId !== "string" || typeof item.quantity !== "number")) {
    return errorResponse("VALIDATION_ERROR", "El pedido debe incluir productos.", 422);
  }

  const stringFields = [[body.customerName,100],[body.customerPhone,50],[body.deliveryAddress,500],[body.notes,500]] as const;
  if (stringFields.some(([value,max])=>value !== undefined && (typeof value !== "string" || value.length > max))
    || body.items.some(item=>item.notes !== undefined && (typeof item.notes !== "string" || item.notes.length > 200))
    || new Set(body.items.map(item=>item.productId)).size !== body.items.length) {
    return errorResponse("VALIDATION_ERROR", "Revisa los datos y las notas del pedido.", 422);
  }
  if ((body.fulfillmentType !== "PICKUP" && body.fulfillmentType !== "DELIVERY")
    || (body.fulfillmentType === "PICKUP" && !mockSettings.pickupEnabled)
    || (body.fulfillmentType === "DELIVERY" && !mockSettings.deliveryEnabled)) {
    return errorResponse("VALIDATION_ERROR", "La modalidad seleccionada no está disponible.", 422);
  }
  if (body.fulfillmentType === "DELIVERY" && !body.deliveryAddress?.trim()) {
    return errorResponse("VALIDATION_ERROR", "Agrega una dirección para delivery.", 422);
  }

  const rateError = getQuoteRateError(
    { items: body.items, fulfillmentType: body.fulfillmentType },
    scenario,
  );
  if (rateError) {
    return errorResponse("EXCHANGE_RATE_UNAVAILABLE", rateError, 503);
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

  const subtotal = parseMoneyCents((mockSettings.defaultCurrency === "EUR" ? quote.totals.subtotalEur : quote.totals.subtotalUsd) ?? "");
  const minimum = parseMoneyCents(mockSettings.minimumOrderAmount ?? "0");
  if (subtotal === null || minimum === null || subtotal < minimum) {
    return errorResponse("VALIDATION_ERROR", "El pedido no alcanza el importe mínimo.", 422);
  }

  const id = `ord-${Date.now()}`;
  const publicCode = `SOKY-${String(mockOrderIntents.length + 1).padStart(3, "0")}`;
  const token = `demo-${id}`;
  const confirmationUrl = `${siteUrl}/order-intents/confirm/${token}`;
  const whatsappMessage = buildCheckoutMessage(quote, body);
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
