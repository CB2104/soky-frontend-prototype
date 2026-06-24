import type { CartItem } from "./store";

const ESTIMATED_VES_RATE = {
  USD: 617.64,
  EUR: 706.91,
} as const;

function fromCents(cents: number) {
  const roundedCents = Math.round(cents);

  return `${Math.floor(roundedCents / 100)}.${String(
    roundedCents % 100,
  ).padStart(2, "0")}`;
}

export function getEstimatedCartTotals(items: CartItem[]) {
  let subtotalUsd = 0;
  let subtotalEur = 0;
  let totalVes = 0;
  let missingSnapshots = false;

  for (const item of items) {
    const cents = item.unitPriceCentsSnapshot;
    const currency = item.unitPriceCurrencySnapshot;

    if (!cents || !currency) {
      missingSnapshots = true;
      continue;
    }

    const lineTotal = cents * item.quantity;

    if (currency === "USD") subtotalUsd += lineTotal;
    if (currency === "EUR") subtotalEur += lineTotal;

    totalVes += lineTotal * ESTIMATED_VES_RATE[currency];
  }

  return {
    subtotalUsd: subtotalUsd > 0 ? fromCents(subtotalUsd) : undefined,
    subtotalEur: subtotalEur > 0 ? fromCents(subtotalEur) : undefined,
    totalVes: totalVes > 0 ? fromCents(totalVes) : undefined,
    missingSnapshots,
  };
}
