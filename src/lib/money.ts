import type { Currency } from "@/contracts/api";

export function formatMoney(amount: string, currency: Currency) {
  const prefix = currency === "VES" ? "Bs. " : `${currency} `;
  return `${prefix}${amount}`;
}

export function formatPriceLabel(amount: string, currency: Currency) {
  return currency === "VES" ? `${amount} VES` : `${amount} ${currency}`;
}

export function parseMoneyCents(amount: string): number | null {
  const normalized = amount.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function formatMoneyCents(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error("Importe inválido.");
  }
  return Math.floor(cents / 100) + "." + String(cents % 100).padStart(2, "0");
}

// Redondeo por línea a céntimos de VES; rate admite hasta seis decimales.
export function convertMoneyCents(cents: number, rate: string): number | null {
  if (!Number.isSafeInteger(cents) || cents < 0) return null;
  const normalizedRate = rate.trim();
  if (!/^\d+(?:\.\d{1,6})?$/.test(normalizedRate)) return null;
  const [whole, fraction = ""] = normalizedRate.split(".");
  const scale = 10 ** fraction.length;
  const units = Number(whole) * scale + Number(fraction || "0");
  const numerator = cents * units;
  const rounded = numerator + Math.floor(scale / 2);
  if (units <= 0 || !Number.isSafeInteger(rounded)) return null;
  return Math.floor(rounded / scale);
}
