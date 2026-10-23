import type { DemoState } from "@/contracts/demo";
import { mockCategories, mockProducts, mockSettings, mockSliderItems, adminAnalyticsSummary, adminAnalyticsProducts, adminAnalyticsSliders } from "./db";

export function createDemoSeed(revision = 1): DemoState {
  const percentage = (numerator: number, denominator: number) => denominator ? `${(numerator / denominator * 100).toFixed(1)}%` : "0.0%";
  const products = structuredClone(mockProducts);
  const sliders = structuredClone(mockSliderItems);
  for (const product of products) product.priceCurrency = "EUR";
  const bySlug = (slug: string) => products.find(product => product.slug === slug);
  const welcome = sliders.find(slide => slide.id === "slider-kiyomi");
  const boxes = sliders.find(slide => slide.id === "slider-boxes");
  const best = sliders.find(slide => slide.id === "slider-weekly-special");
  for (const slide of [welcome, boxes]) {
    if (!slide?.rotatorImages) continue;
    slide.rotatorImages = slide.rotatorImages.map((image, index) => {
      const product = bySlug(["box-kiyomi", "box-kyoto", "box-kurama"][index]);
      const { name: _name, priceLabel: _price, ...asset } = image;
      void _name; void _price;
      return { ...asset, productId: product?.id };
    });
  }
  if (boxes?.primaryCta) boxes.primaryCta.target = bySlug("box-kiyomi")?.categorySlug;
  if (best) { best.productId = bySlug("box-osaka")?.id; best.badgeLabel = "DESTACADO DEMO"; }
  // Only the mutable demo copy makes its featured Hero examples available.
  const heroProducts = new Set([best?.productId, ...[welcome, boxes].flatMap(slide => slide?.rotatorImages?.map(image => image.productId) ?? [])]);
  for (const product of products) if (heroProducts.has(product.id)) product.isAvailable = true;
  return {
    schemaVersion: 1, revision, updatedAt: new Date().toISOString(),
    products, categories: structuredClone(mockCategories), sliders,
    settings: { ...structuredClone(mockSettings), minimumOrderAmount: "1.00", exchangeRateMode: "MANUAL" },
    currentRate: { baseCurrency: "EUR", targetCurrency: "VES", rate: "1000.000000", mode: "MANUAL", source: "MANUAL", fetchedAt: "2026-10-23T12:00:00.000Z", stale: true, pendingValidation: true, warning: "Valor ficticio inicial. Revisa y guarda la tasa antes de cotizar." },
    rateHistory: [], orderIntents: [],
    analytics: {
      summary: { ...structuredClone(adminAnalyticsSummary), conversionRate: percentage(adminAnalyticsSummary.whatsappClicked, adminAnalyticsSummary.checkoutStarted) },
      products: structuredClone(adminAnalyticsProducts).map(row => ({ ...row, conversionRate: percentage(row.addToCart, row.views) })),
      sliders: structuredClone(adminAnalyticsSliders).filter(row => row.views >= 0 && row.clicks >= 0).map(row => ({ ...row, clickRate: percentage(row.clicks, row.views) })),
    },
  };
}
