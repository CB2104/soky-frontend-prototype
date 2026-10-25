import type {
  AdminAnalyticsProductDto,
  AdminAnalyticsSliderDto,
  AdminAnalyticsSummaryDto,
  ExchangeRateDto,
  OrderIntentConfirmViewDto,
} from "./api";

export type AdminDashboardSummary = {
  total: number;
  published: number;
  unavailable: number;
  intents: number;
  whatsappClicked: number;
  rate: ExchangeRateDto;
};

export type AdminAnalyticsSummary = AdminAnalyticsSummaryDto & {
  source: "FIXED_DEMO_FIXTURES";
  promotionViews: number;
};
export type AdminAnalyticsProduct = AdminAnalyticsProductDto & { historical: boolean };
export type AdminAnalyticsPromotion = AdminAnalyticsSliderDto & { historical: boolean };
export type AdminOrderIntent = OrderIntentConfirmViewDto & { createdAt?: string };
