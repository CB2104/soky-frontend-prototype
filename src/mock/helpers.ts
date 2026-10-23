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
import type { DemoState } from "@/contracts/demo";
import { currentRate } from "./demo-validation";

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
  const safePage = Number.isSafeInteger(page) ? Math.max(1, page) : 1;
  const safeLimit = Number.isSafeInteger(limit) ? Math.max(1, Math.min(100, limit)) : 20;
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

export function getPublicProducts(state?: DemoState) {
  return (state?.products ?? mockProducts)
    .filter((product) => product.status === "ACTIVE" && (!state || state.categories.some(category => category.id === product.categoryId && category.isActive)))
    .toSorted((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

export function getScenarioRate(scenario: MockScenario, state?: DemoState): ExchangeRateDto {
  const baseRate = state ? currentRate(state) : mockExchangeRate;
  if (scenario === "stale-rate") {
    return {
      ...baseRate,
      stale: true,
      warning: "La tasa debe validarse antes de confirmar el pedido.",
    };
  }

  return baseRate;
}

export function getQuoteRateError(
  request: CartQuoteRequestDto,
  scenario: MockScenario = "default",
  state?: DemoState,
): string | null {
  const rate = getScenarioRate(scenario, state);
  if (!isUsableExchangeRate(rate, (state?.settings ?? mockSettings).defaultCurrency)) {
    return "La tasa no está disponible o requiere validación.";
  }
  const mismatch = request.items.some((item) => {
    const product = (state?.products ?? mockProducts).find((candidate) => candidate.id === item.productId);
    return product?.status === "ACTIVE" && product.isAvailable
      && product.priceCurrency !== rate.baseCurrency;
  });
  return mismatch ? "La tasa no corresponde a la moneda de los productos." : null;
}

export function buildCartQuote(
  request: CartQuoteRequestDto,
  scenario: MockScenario = "default",
  state?: DemoState,
): CartQuoteResponseDto {
  const rateError = getQuoteRateError(request, scenario, state);
  if (rateError) throw new Error(rateError);
  const rate = getScenarioRate(scenario, state);
  const invalidItems: CartQuoteResponseDto["invalidItems"] = [];
  const validItems: CartQuoteResponseDto["items"] = [];

  for (const item of request.items) {
    const product = (state?.products ?? mockProducts).find((candidate) => candidate.id === item.productId);

    if (!product) {
      invalidItems.push({ productId: item.productId, reason: "NOT_FOUND" });
      continue;
    }

    if (item.quantity < 1 || item.quantity > 99 || !Number.isInteger(item.quantity)) {
      invalidItems.push({ productId: item.productId, reason: "INVALID_QUANTITY" });
      continue;
    }

    if (product.status !== "ACTIVE" || (state && !state.categories.some(category => category.id === product.categoryId && category.isActive))) {
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
  if (![subtotalUsd, subtotalEur, totalVes].every(Number.isSafeInteger)) throw new Error("El total supera el rango seguro.");

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
