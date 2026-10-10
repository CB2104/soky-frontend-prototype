import type { ExchangeRateDto, PriceCurrency } from "@/contracts/api";
import { convertMoneyCents } from "@/lib/money";

export function isUsableExchangeRate(
  rate: ExchangeRateDto | null | undefined,
  currency: PriceCurrency,
): rate is ExchangeRateDto {
  return !!rate && !rate.stale && rate.baseCurrency === currency
    && rate.targetCurrency === "VES" && convertMoneyCents(100, rate.rate) !== null;
}
