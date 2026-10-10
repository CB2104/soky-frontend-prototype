import { NextResponse } from "next/server";
import type {
  ApiErrorCode,
  ApiErrorResponse,
  CartQuoteRequestDto,
  CartQuoteResponseDto,
  ExchangeRateDto,
  PaginatedResponse,
  ProductDto,
} from "@/contracts/api";
import { isUsableExchangeRate } from "@/features/exchange-rates/rate-validation";
import { convertMoneyCents, formatMoneyCents, parseMoneyCents } from "@/lib/money";
import { mockExchangeRate, mockProducts, mockSettings } from "./db";

export type MockScenario =
  | "default"
  | "empty"
  | "error"
  | "slow"
  | "stale-rate"
  | "invalid-items"
  | "unavailable-product";

export function getScenario(request: Request): MockScenario {
  const scenario = new URL(request.url).searchParams.get("scenario");
  const allowed: MockScenario[] = [
    "default",
    "empty",
    "error",
    "slow",
    "stale-rate",
    "invalid-items",
    "unavailable-product",
  ];

  return allowed.includes(scenario as MockScenario)
    ? (scenario as MockScenario)
    : "default";
}

export async function applyScenarioDelay(scenario: MockScenario) {
  if (scenario !== "slow") {
    return;
  }

  await new Promise((resolve) => {
    setTimeout(resolve, 450);
  });
}

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  status = 400,
  details?: unknown,
) {
  const body: ApiErrorResponse = { code, message, details };
  return NextResponse.json(body, { status });
}

export function paginate<T>(items: T[], page: number, limit: number): PaginatedResponse<T> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const start = (safePage - 1) * safeLimit;
  const data = items.slice(start, start + safeLimit);

  return {
    data,
    meta: {
      page: safePage,
      limit: safeLimit,
      total: items.length,
      pageCount: Math.max(1, Math.ceil(items.length / safeLimit)),
    },
  };
}

export function getPublicProducts() {
  return mockProducts
    .filter((product) => product.status === "ACTIVE")
    .toSorted((a, b) => a.sortOrder - b.sortOrder);
}

export function getScenarioRate(scenario: MockScenario): ExchangeRateDto {
  if (scenario === "stale-rate") {
    return {
      ...mockExchangeRate,
      stale: true,
      warning: "La tasa debe validarse antes de confirmar el pedido.",
    };
  }

  return mockExchangeRate;
}

export function getQuoteRateError(
  request: CartQuoteRequestDto,
  scenario: MockScenario = "default",
): string | null {
  const rate = getScenarioRate(scenario);
  if (!isUsableExchangeRate(rate, mockSettings.defaultCurrency)) {
    return "La tasa no está disponible o requiere validación.";
  }
  const mismatch = request.items.some((item) => {
    const product = mockProducts.find((candidate) => candidate.id === item.productId);
    return product?.status === "ACTIVE" && product.isAvailable
      && product.priceCurrency !== rate.baseCurrency;
  });
  return mismatch ? "La tasa no corresponde a la moneda de los productos." : null;
}

export function buildCartQuote(
  request: CartQuoteRequestDto,
  scenario: MockScenario = "default",
): CartQuoteResponseDto {
  const rateError = getQuoteRateError(request, scenario);
  if (rateError) throw new Error(rateError);
  const rate = getScenarioRate(scenario);
  const invalidItems: CartQuoteResponseDto["invalidItems"] = [];
  const validItems: CartQuoteResponseDto["items"] = [];

  for (const item of request.items) {
    const product = mockProducts.find((candidate) => candidate.id === item.productId);

    if (!product) {
      invalidItems.push({ productId: item.productId, reason: "NOT_FOUND" });
      continue;
    }

    if (item.quantity < 1 || item.quantity > 99 || !Number.isInteger(item.quantity)) {
      invalidItems.push({ productId: item.productId, reason: "INVALID_QUANTITY" });
      continue;
    }

    if (product.status !== "ACTIVE") {
      invalidItems.push({ productId: item.productId, reason: "INACTIVE" });
      continue;
    }

    if (!product.isAvailable || scenario === "unavailable-product"
      || (scenario === "invalid-items" && item === request.items[0])) {
      invalidItems.push({ productId: item.productId, reason: "UNAVAILABLE" });
      continue;
    }

    const unitCents = parseMoneyCents(product.priceAmount);
    if (unitCents === null) throw new Error("Precio de catálogo inválido.");
    const lineTotal = unitCents * item.quantity;
    if (!Number.isSafeInteger(lineTotal)) throw new Error("Precio de catálogo inválido.");
    const lineTotalVes = convertMoneyCents(lineTotal, rate.rate);
    if (lineTotalVes === null) throw new Error("No se pudo convertir el importe.");

    validItems.push({
      productId: product.id,
      title: product.title,
      slug: product.slug,
      quantity: item.quantity,
      unitPriceAmount: product.priceAmount,
      unitPriceCurrency: product.priceCurrency,
      lineTotalAmount: formatMoneyCents(lineTotal),
      lineTotalCurrency: product.priceCurrency,
      lineTotalVes: formatMoneyCents(lineTotalVes),
    });
  }

  const subtotalUsd = validItems
    .filter((item) => item.lineTotalCurrency === "USD")
    .reduce((sum, item) => sum + (parseMoneyCents(item.lineTotalAmount) ?? 0), 0);
  const subtotalEur = validItems
    .filter((item) => item.lineTotalCurrency === "EUR")
    .reduce((sum, item) => sum + (parseMoneyCents(item.lineTotalAmount) ?? 0), 0);
  const totalVes = validItems.reduce((sum, item) => sum + (parseMoneyCents(item.lineTotalVes) ?? 0), 0);

  return {
    items: validItems,
    totals: {
      ...(subtotalUsd > 0 ? { subtotalUsd: formatMoneyCents(subtotalUsd) } : {}),
      ...(subtotalEur > 0 ? { subtotalEur: formatMoneyCents(subtotalEur) } : {}),
      totalVes: formatMoneyCents(totalVes),
    },
    rateSnapshot: rate,
    warnings: rate.warning ? [rate.warning] : [],
    invalidItems,
  };
}

export function getProductBySlug(slug: string): ProductDto | undefined {
  return getPublicProducts().find((product) => product.slug === slug);
}
