import type { Currency } from "@/contracts/api";

export function formatMoney(amount: string, currency: Currency) {
  const prefix = currency === "VES" ? "Bs. " : `${currency} `;
  return `${prefix}${amount}`;
}

export function formatPriceLabel(amount: string, currency: Currency) {
  return currency === "VES" ? `${amount} VES` : `${amount} ${currency}`;
}
