import type { AdminSliderItemDto, CategoryDto, ProductDto } from "@/contracts/api";

// Shared by the public API and draft preview. Composition assets remain intact.
export function resolveProductSlide(slide: AdminSliderItemDto, products: ProductDto[], categories: CategoryDto[]): AdminSliderItemDto {
  const eligible = (id?: string) => products.find(product => product.id === id && product.status === "ACTIVE" && product.isAvailable && categories.some(category => category.id === product.categoryId && category.isActive));
  const linked = slide.productId ? eligible(slide.productId) : undefined;
  const result = structuredClone(slide);
  if (slide.productId) {
    result.productName = linked?.title;
    if (slide.id === "slider-weekly-special") result.highlightText = linked?.details?.pieces ? String(linked.details.pieces) : undefined;
    if (result.primaryCta?.type === "PRODUCT") result.primaryCta = linked ? { ...result.primaryCta, target: linked.slug } : { label: "Ver menú", type: "MENU" };
  }
  for (const field of ["primaryCta", "secondaryCta"] as const) {
    const cta = result[field];
    if (cta?.type === "PRODUCT" && !products.some(product => product.slug === cta.target && eligible(product.id))) result[field] = { label: "Ver menú", type: "MENU" };
    if (cta?.type === "CATEGORY" && !categories.some(category => category.slug === cta.target && category.isActive)) result[field] = { label: "Ver menú", type: "MENU" };
  }
  result.rotatorImages = slide.rotatorImages?.flatMap((image, index) => {
    if (!image.productId) {
      // Immutable normal-mode legacy copy keeps its editorial name and assets.
      // Its price still comes from the catalog, without parsing a currency label.
      const legacySlug = slide.id === "slider-boxes" ? ["box-kiyomi", "box-kyoto", "box-kurama"][index] : undefined;
      const product = legacySlug ? products.find(product => product.slug === legacySlug) : undefined;
      return [{ ...image, ...(product ? { priceAmount: product.priceAmount, priceCurrency: product.priceCurrency } : {}) }];
    }
    const product = eligible(image.productId);
    return product ? [{ ...image, name: product.title, priceLabel: `${product.priceAmount} ${product.priceCurrency}`, priceAmount: product.priceAmount, priceCurrency: product.priceCurrency }] : [];
  });
  return result;
}
