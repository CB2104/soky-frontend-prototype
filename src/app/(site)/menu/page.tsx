import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { ProductCard } from "@/features/products/components/product-card";
import { getCategories } from "@/features/categories/api";
import { getCurrentExchangeRate } from "@/features/exchange-rates/api";
import { getProducts } from "@/features/products/api";
import { mapProductToCard } from "@/features/products/mappers";
import { getPublicSettings } from "@/features/settings/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menú",
  description: "Explora boxes, rolls tempura, fríos y entradas de SOKY.",
  alternates: {
    canonical: "/menu",
  },
};

type MenuPageProps = {
  searchParams?: Promise<{
    category?: string;
    scenario?: string;
  }>;
};

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const params = await searchParams;
  const categorySlug = params?.category;
  const scenario = params?.scenario;

  const data = await Promise.all([
    getCategories(),
    getProducts({ categorySlug, limit: 48, scenario }),
    getCurrentExchangeRate(),
    getPublicSettings(),
  ])
    .then(([categories, productsResponse, rate, settings]) => ({
      categories,
      products: productsResponse.data.map(mapProductToCard),
      rate,
      settings,
    }))
    .catch(() => null);

  if (!data) {
    return (
      <main className="bg-soky-paper text-soky-ink">
        <Container className="py-12">
          <ErrorState
            title="No pudimos cargar el menú"
            description="Revisa la conexión o intenta de nuevo en unos segundos."
            actionHref="/menu"
            actionLabel="Reintentar"
          />
        </Container>
      </main>
    );
  }

  const { categories, products, rate, settings } = data;
  // try {
  //   const [categories, productsResponse, rate, settings] = await Promise.all([
  //     getCategories(),
  //     getProducts({ categorySlug, limit: 48, scenario }),
  //     getCurrentExchangeRate(),
  //     getPublicSettings(),
  //   ]);
  //   const products = productsResponse.data.map(mapProductToCard);

  //   return (
  //     <main className="bg-soky-paper text-soky-ink">
  //       <Container className="py-10 md:py-14">
  //         <div className="max-w-3xl">
  //           <h1 className="soky-heading text-5xl text-soky-blue md:text-7xl">
  //             Menú SOKY
  //           </h1>
  //           <p className="mt-4 text-lg leading-8 text-soky-muted">
  //             Elige tu box favorito, agrégalo al carrito y confirma el total
  //             antes de WhatsApp.
  //           </p>
  //         </div>
  //         <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
  //           <Button
  //             href="/menu"
  //             variant={!categorySlug ? "primary" : "secondary"}
  //             size="sm"
  //           >
  //             Todos
  //           </Button>
  //           {categories.map((category) => (
  //             <Button
  //               key={category.id}
  //               href={`/menu?category=${category.slug}`}
  //               variant={
  //                 categorySlug === category.slug ? "primary" : "secondary"
  //               }
  //               size="sm"
  //             >
  //               {category.name}
  //             </Button>
  //           ))}
  //         </div>
  //         <div className="mt-5 flex flex-wrap items-center gap-3">
  //           <Badge variant={rate.stale ? "promo" : "success"}>
  //             Tasa {rate.rate} VES por {rate.baseCurrency}
  //           </Badge>
  //           {rate.stale ? (
  //             <p className="text-sm font-bold text-japan-seal">
  //               {rate.warning}
  //             </p>
  //           ) : null}
  //           <p className="text-sm text-soky-muted">
  //             Pedido mínimo referencial:{" "}
  //             {settings.minimumOrderAmount ?? "Consultar"}{" "}
  //             {settings.defaultCurrency}
  //           </p>
  //         </div>
  //         {products.length === 0 ? (
  //           <div className="mt-10">
  //             <EmptyState
  //               title="No hay productos en esta categoría"
  //               description="Prueba otra categoría o vuelve más tarde para ver nuevas promos."
  //               actionHref="/menu"
  //               actionLabel="Ver todo"
  //             />
  //           </div>
  //         ) : (
  //           <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
  //             {products.map((product, index) => (
  //               <ProductCard
  //                 key={product.id}
  //                 product={product}
  //                 priority={index < 2}
  //               />
  //             ))}
  //           </div>
  //         )}
  //       </Container>
  //     </main>
  //   );
  // } catch {
  //   return (
  //     <main className="bg-soky-paper text-soky-ink">
  //       <Container className="py-12">
  //         <ErrorState
  //           title="No pudimos cargar el menú"
  //           description="Revisa la conexión o intenta de nuevo en unos segundos."
  //           actionHref="/menu"
  //           actionLabel="Reintentar"
  //         />
  //       </Container>
  //     </main>
  //   );
  // }
}
