import type { ExchangeRateDto, PriceCurrency } from "@/contracts/api";
import { convertMoneyCents } from "@/lib/money";
import { rateNeedsReview } from "./manual-rate";

export function isUsableExchangeRate(
  rate: ExchangeRateDto | null | undefined,
  currency: PriceCurrency,
): rate is ExchangeRateDto {
  return !!rate && !rate.stale && !rateNeedsReview(rate.fetchedAt, rate.pendingValidation) && rate.baseCurrency === currency
    && rate.targetCurrency === "VES" && convertMoneyCents(100, rate.rate) !== null;
}
