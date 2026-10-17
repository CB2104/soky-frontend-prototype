import type { Metadata } from "next";
import { HomeSharedScene } from "@/features/home/sections/HomeSharedScene";
import { HomeReadySignal } from "@/features/home/loading/HomeLoadingBoundary";
import { getCategories } from "@/features/categories/api";
import { mapProductToCard } from "@/features/products/mappers";
import { getPublicSettings } from "@/features/settings/api";
import { mapPublicSettingsToLocation } from "@/features/settings/mappers";
import { siteUrl } from "@/lib/env";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { getActivePublicSliders } from "@/features/sliders/api";
import { mapPublicSlidersToHeroSlides } from "@/features/hero/mappers";
import { HeroSlider } from "@/features/hero/components/HeroSlider";
import { BrandStripSection } from "@/features/hero/components/BrandStripSection";
import { MenuShowcase } from "@/features/home/sections/menu-showcase/MenuShowcase";
import { selectHomeCategoryCards } from "@/features/home/sections/menu-showcase/category-card-data";
import { HowToOrderSection } from "@/features/home/sections/how-to-order/HowToOrderSection";
import { LocationSection } from "@/features/home/sections/location/LocationSection";
import { getPromoProducts } from "@/features/products/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function HomePage() {
  const [sliderDtos, promoProducts, categories, settings] = await Promise.all([
    getActivePublicSliders(),
    getPromoProducts(6),
    getCategories(),
    getPublicSettings(),
  ]);

  const heroSlides = mapPublicSlidersToHeroSlides(sliderDtos);
  const products = promoProducts.map(mapProductToCard);
  const categoryCards = selectHomeCategoryCards(categories);
  const location = mapPublicSettingsToLocation(settings);

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsappPhone,
    "Hola SOKY, quiero ver las promos disponibles.",
  );

  const heroFallbackDescription =
    settings.slogan ?? "Sushi casual, colorido y facil de pedir.";
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: settings.businessName,
    servesCuisine: "Sushi",
    url: siteUrl,
    telephone: settings.whatsappPhone,
    address: settings.address,
    sameAs: settings.instagramUrl ? [settings.instagramUrl] : [],
  };

  return (
    <main data-home-loading-root>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd),
        }}
      />
      <HeroSlider
        fallbackDescription={heroFallbackDescription}
        slides={heroSlides}
        whatsappUrl={whatsappUrl}
      />
      <HomeSharedScene>
        <BrandStripSection />
        <MenuShowcase products={products} categories={categoryCards} />
        <HowToOrderSection />
      </HomeSharedScene>
      <LocationSection location={location} />
      <HomeReadySignal />
    </main>
  );
}
