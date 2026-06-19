import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { BrushLabel } from "@/components/ui/brush-label";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PatternSurface } from "@/components/ui/pattern-surface";
import { Section } from "@/components/ui/section";
import { StampBadge } from "@/components/ui/stamp-badge";
import { WaveDivider } from "@/components/ui/wave-divider";
import { ProductCard } from "@/features/products/components/product-card";
import { getCategories } from "@/features/categories/api";
import { getFeaturedProducts } from "@/features/products/api";
import { mapProductToCard } from "@/features/products/mappers";
import { getActiveSliders } from "@/features/sliders/api";
import { getPublicSettings } from "@/features/settings/api";
import { siteUrl } from "@/lib/env";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [sliders, featuredProducts, categories, settings] = await Promise.all([
    getActiveSliders(),
    getFeaturedProducts(3),
    getCategories(),
    getPublicSettings(),
  ]);
  const hero = sliders[0];
  const products = featuredProducts.map(mapProductToCard);
  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsappPhone,
    "Hola SOKY, quiero ver las promos disponibles.",
  );
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
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd),
        }}
      />
      <section id="promos" className="scroll-mt-24">
        <PatternSurface
          className="relative bg-soky-blue text-soky-white"
          pattern="seigaiha"
        >
          <Container
            size="wide"
            className="grid min-h-[calc(100dvh-5rem)] items-center gap-8 py-10 md:grid-cols-12 md:py-14"
          >
            <div className="md:col-span-5">
              <BrushLabel className="mb-5" color="orange">
                Promos para compartir
              </BrushLabel>
              <h1 className="soky-heading max-w-xl text-[4rem] text-soky-white md:text-[6.5rem]">
                {hero?.title ?? "Sushi para compartir"}
              </h1>
              <p className="mt-5 max-w-md text-lg leading-8 text-soky-white/82">
                {hero?.description ?? settings.slogan}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href="/menu" size="lg">
                  Ver menú
                </Button>
                <Button
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  variant="whatsapp"
                  size="lg"
                >
                  Pedir ahora
                </Button>
              </div>
            </div>
            <div className="relative md:col-span-7">
              <div className="absolute -left-3 top-4 z-10 md:left-2">
                <StampBadge>Promo</StampBadge>
              </div>
              <div className="relative aspect-4/3 overflow-hidden rounded-3xl border-4 border-soky-white/20 shadow-2xl">
                <Image
                  src={
                    hero?.imageUrl ??
                    "https://picsum.photos/seed/soky-hero-fallback/1400/980"
                  }
                  alt={
                    hero?.imageAlt ?? "Box de sushi SOKY con rolls y toppings."
                  }
                  fill
                  priority
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Container>
          <WaveDivider tone="paper" />
        </PatternSurface>
      </section>
      <Section id="destacados" className="scroll-mt-24" tone="paper">
        <Container>
          <div className="max-w-2xl">
            <h2 className="soky-heading text-5xl text-soky-blue md:text-6xl">
              Promos grandes, lectura simple
            </h2>
            <p className="mt-4 text-lg leading-8 text-soky-muted">
              La energía de Instagram convertida en menú web: producto claro,
              precios visibles y pedido sin fricción.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index === 0}
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="paper">
        <Container className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="soky-heading text-5xl text-soky-blue md:text-6xl">
              Menú hecho para decidir rápido
            </h2>
            <p className="mt-4 text-lg leading-8 text-soky-muted">
              Categorías limpias, cards escaneables y productos en HTML para que
              el menú sea más útil que un flyer.
            </p>
            <Button href="/menu" className="mt-6">
              Explorar menú
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {categories.slice(0, 4).map((category) => (
              <a
                key={category.id}
                href={`/menu?category=${category.slug}`}
                className="rounded-2xl border border-soky-border bg-soky-paper p-5 transition hover:-translate-y-1 hover:shadow-soky-card"
              >
                <Badge variant="neutral">{category.group ?? "FOOD"}</Badge>
                <h3 className="mt-4 text-2xl font-black">{category.name}</h3>
                <p className="mt-2 text-sm leading-6 text-soky-muted">
                  {category.description}
                </p>
              </a>
            ))}
          </div>
        </Container>
      </Section>

      <Section id="ubicacion" className="scroll-mt-24" tone="navy">
        <Container className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <h2 className="soky-heading text-5xl text-soky-white md:text-6xl">
              Visita SOKY o pide para llevar
            </h2>
            <p className="mt-4 text-lg leading-8 text-soky-white/78">
              {settings.address}. {settings.deliveryNotes}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                variant="whatsapp"
              >
                Pedir por WhatsApp
              </Button>
              {settings.googleMapsUrl ? (
                <Button
                  href={settings.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  variant="secondary"
                >
                  Abrir mapa
                </Button>
              ) : null}
            </div>
          </div>
          <div className="rounded-3xl border border-white/15 bg-soky-white p-6 text-soky-ink">
            <h3 className="text-2xl font-black">Información rápida</h3>
            <div className="mt-5 grid gap-4">
              {settings.openingHoursDisplay.map((line) => (
                <div
                  key={line}
                  className="rounded-2xl bg-soky-paper p-4 font-bold"
                >
                  {line}
                </div>
              ))}
              <div className="rounded-2xl bg-soky-paper p-4 font-bold">
                Pickup:{" "}
                {settings.pickupEnabled ? "Disponible" : "No disponible"}
              </div>
              <div className="rounded-2xl bg-soky-paper p-4 font-bold">
                Delivery:{" "}
                {settings.deliveryEnabled ? "Disponible" : "No disponible"}
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
