import type { ExchangeRateDto } from "@/contracts/api";
import { apiClient } from "@/lib/api/client";

export function getCurrentExchangeRate() {
  return apiClient.get<ExchangeRateDto>("/exchange-rates/current");
}
