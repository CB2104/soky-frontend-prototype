import type { AdminSliderItemDto, CategoryDto, ExchangeRateDto, OrderIntentConfirmViewDto, ProductDto, PublicSettingsDto, AdminAnalyticsSummaryDto, AdminAnalyticsProductDto, AdminAnalyticsSliderDto } from "./api";

export type RateEntry = ExchangeRateDto & { id: string; previousRate: string | null; previousBaseCurrency?: ExchangeRateDto["baseCurrency"]; recordedAt: string; note: string };
export type DemoState = {
  schemaVersion: 1;
  revision: number;
  updatedAt: string;
  products: ProductDto[];
  categories: CategoryDto[];
  sliders: AdminSliderItemDto[];
  settings: PublicSettingsDto;
  currentRate: ExchangeRateDto & { pendingValidation?: boolean };
  rateHistory: RateEntry[];
  analytics: { summary: AdminAnalyticsSummaryDto; products: AdminAnalyticsProductDto[]; sliders: AdminAnalyticsSliderDto[] };
  orderIntents: (OrderIntentConfirmViewDto & { createdAt?: string })[];
};
export type DemoSnapshot = DemoState & { demo: true; analyticsSource?: "FIXED_DEMO_FIXTURES" };
