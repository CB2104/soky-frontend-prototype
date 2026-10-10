import type { Currency } from "@/contracts/api";
import { parseMoneyCents } from "./money";

export function formatCartMoney(amount: string, currency: Currency): string {
  const cents = parseMoneyCents(amount);
  if (cents === null) return "Por confirmar";
  const value = new Intl.NumberFormat("es-ES", {minimumFractionDigits:2,maximumFractionDigits:2}).format(cents / 100);
  return `${value} ${currency === "EUR" ? "€" : currency === "VES" ? "Bs." : "USD"}`;
}
