import type {
  AdminAnalyticsProduct,
  AdminAnalyticsPromotion,
  AdminAnalyticsSummary,
  AdminDashboardSummary,
} from "@/contracts/admin-reporting";
import type { DemoState } from "@/contracts/demo";
import { currentRate } from "./demo-validation";
import { getPublicProducts } from "./helpers";

function percentage(numerator: number, denominator: number) {
  return denominator > 0 ? `${(numerator / denominator * 100).toFixed(1)}%` : "0.0%";
}

export function buildDemoDashboardSummary(state: DemoState): AdminDashboardSummary {
  // This is the same eligibility rule used by the public catalog and quote.
  const published = getPublicProducts(state);
  return {
    total: state.products.length,
    published: published.length,
    unavailable: published.filter(product => !product.isAvailable).length,
    intents: state.orderIntents.length,
    whatsappClicked: state.orderIntents.filter(intent => intent.whatsappClickedAt).length,
    rate: currentRate(state),
  };
}

export function buildDemoAnalytics(state: DemoState) {
  const productIds = new Set(state.products.map(product => product.id));
  const sliderIds = new Set(state.sliders.map(slider => slider.id));
  const products: AdminAnalyticsProduct[] = state.analytics.products.map(row => ({
    ...row,
    historical: !productIds.has(row.productId),
    conversionRate: percentage(row.addToCart, row.views),
  })).sort((a, b) => b.views - a.views || b.addToCart - a.addToCart
    || a.title.localeCompare(b.title, "es") || a.productId.localeCompare(b.productId));
  const sliders: AdminAnalyticsPromotion[] = state.analytics.sliders.map(row => ({
    ...row,
    historical: !sliderIds.has(row.sliderId),
    clickRate: percentage(row.clicks, row.views),
  })).sort((a, b) => b.views - a.views || b.clicks - a.clicks
    || a.title.localeCompare(b.title, "es") || a.sliderId.localeCompare(b.sliderId));
  const { checkoutStarted, whatsappClicked } = state.analytics.summary;
  const summary: AdminAnalyticsSummary = {
    source: "FIXED_DEMO_FIXTURES",
    // Detail rows are authoritative, including identified historical examples.
    productViews: products.reduce((sum, row) => sum + row.views, 0),
    promotionViews: sliders.reduce((sum, row) => sum + row.views, 0),
    addToCart: products.reduce((sum, row) => sum + row.addToCart, 0),
    checkoutStarted,
    whatsappClicked,
    conversionRate: percentage(whatsappClicked, checkoutStarted),
  };
  return { summary, products, sliders };
}

export function sortDemoIntents(intents: DemoState["orderIntents"]) {
  const timestamp = (value?: string) => {
    const parsed = Date.parse(value ?? "");
    return Number.isFinite(parsed) ? parsed : -Infinity;
  };
  return [...intents].sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt)
    || a.id.localeCompare(b.id));
}
