import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/features/products/components/product-card";
import { getFeaturedProducts, getProductBySlug } from "@/features/products/api";
import { mapProductToCard } from "@/features/products/mappers";
import { formatPriceLabel } from "@/lib/money";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);

  if (!product) {
    return {
      title: "Producto no encontrado",
    };
  }

  return {
    title: product.title,
    description: product.shortDescription ?? product.description,
    alternates: {
      canonical: `/menu/${product.slug}`,
    },
    openGraph: {
      title: `${product.title} | SOKY`,
      description: product.shortDescription ?? product.description,
      images: [{ url: product.imageUrl }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, featured] = await Promise.all([
    getProductBySlug(slug).catch(() => null),
    getFeaturedProducts(3).catch(() => []),
  ]);

  if (!product) {
    notFound();
  }

  const isAvailable = product.status === "ACTIVE" && product.isAvailable;
  const related = featured
    .filter((item) => item.id !== product.id)
    .slice(0, 2)
    .map(mapProductToCard);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.imageUrl,
    description: product.description,
    offers: {
      "@type": "Offer",
      price: product.priceAmount,
      priceCurrency: product.priceCurrency,
      availability: isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteUrl}/menu/${product.slug}`,
    },
  };

  return (
    <main className="bg-soky-paper text-soky-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container className="grid gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-soky-blue shadow-soky-card">
          <Image
            src={product.imageUrl}
            alt={product.imageAlt}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <section className="soky-card p-6">
          <div className="flex flex-wrap gap-2">
            {product.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant={tag.toLowerCase().includes("tempura") ? "tempura" : "neutral"}>
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="soky-heading mt-5 text-5xl text-soky-blue md:text-7xl">
            {product.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-soky-muted">{product.description}</p>
          <p className="soky-number mt-6 text-5xl text-soky-orange-deep">
            {formatPriceLabel(product.priceAmount, product.priceCurrency)}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {isAvailable ? (
              <Button href="/menu">Agregar desde menú</Button>
            ) : (
              <Badge variant="promo">No disponible</Badge>
            )}
            <Button href="/cart" variant="secondary">
              Ver carrito
            </Button>
          </div>
          {product.allergens.length > 0 ? (
            <div className="mt-6 rounded-2xl bg-soky-paper p-4">
              <h2 className="font-black">Alérgenos</h2>
              <p className="mt-1 text-sm text-soky-muted">{product.allergens.join(", ")}</p>
            </div>
          ) : null}
        </section>
      </Container>
      {related.length > 0 ? (
        <Container className="pb-12">
          <h2 className="text-2xl font-black">También puede gustarte</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </Container>
      ) : null}
    </main>
  );
}
