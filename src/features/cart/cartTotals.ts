import type { ExchangeRateDto } from "@/contracts/api";
import { isUsableExchangeRate } from "@/features/exchange-rates/rate-validation";
import { convertMoneyCents, formatMoneyCents } from "@/lib/money";
import type { CartItem } from "./store";

export function getEstimatedCartTotals(
  items: CartItem[],
  rate?: ExchangeRateDto | null,
  catalogReady = true,
) {
  let subtotalUsd = 0;
  let subtotalEur = 0;
  let totalVes = 0;
  let missingSnapshots = !catalogReady;
  let conversionPending = !catalogReady || !rate || rate.stale;

  for (const item of items) {
    const cents = item.unitPriceCentsSnapshot;
    const currency = item.unitPriceCurrencySnapshot;
    if (item.catalogIssue || cents === undefined || !Number.isSafeInteger(cents) || cents < 0
      || !currency || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      missingSnapshots = true;
      conversionPending = true;
      continue;
    }

    const lineTotal = cents * item.quantity;
    if (!Number.isSafeInteger(lineTotal)) {
      missingSnapshots = true;
      conversionPending = true;
      continue;
    }

    if (currency === "USD") subtotalUsd += lineTotal;
    if (currency === "EUR") subtotalEur += lineTotal;

    const converted = isUsableExchangeRate(rate, currency)
      ? convertMoneyCents(lineTotal, rate.rate) : null;
    if (converted === null) conversionPending = true;
    else totalVes += converted;
  }

  return {
    subtotalUsd: !missingSnapshots && subtotalUsd > 0 ? formatMoneyCents(subtotalUsd) : undefined,
    subtotalEur: !missingSnapshots && subtotalEur > 0 ? formatMoneyCents(subtotalEur) : undefined,
    totalVes: !conversionPending && !missingSnapshots && totalVes > 0
      ? formatMoneyCents(totalVes) : undefined,
    missingSnapshots,
    conversionPending,
  };
}
