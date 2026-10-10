import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { getCategories } from "@/features/categories/api";
import { getCurrentExchangeRate } from "@/features/exchange-rates/api";
import { isUsableExchangeRate } from "@/features/exchange-rates/rate-validation";
import { MenuCatalog } from "@/features/menu/components/MenuCatalog";
import { buildMenuSections, getMenuDestination } from "@/features/menu/menu-sections";
import { getAllProducts } from "@/features/products/api";
import { getPublicSettings } from "@/features/settings/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menú",
  description: "Explora el menú SOKY: boxes, rolls, ensaladas, entradas y más.",
  alternates: { canonical: "/menu" },
};

type Props = {
  searchParams?: Promise<{ category?: string; scenario?: string }>;
};

export default async function MenuPage({ searchParams }: Props) {
  const params = await searchParams;
  const data = await Promise.all([
    getCategories(),
    getAllProducts({ scenario: params?.scenario }),
    getCurrentExchangeRate().catch(() => null),
    getPublicSettings(),
  ]).then(([categories, products, rate, settings]) => ({
    sections: buildMenuSections(categories, products),
    products,
    rate,
    settings,
  })).catch(() => null);

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

  const initialDestination = getMenuDestination(data.sections, params?.category);

  return (
    <main className="relative isolate bg-soky-paper text-soky-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[url('/images/patterns/soky-cloud-wave-pattern.svg')] bg-size-[420px_auto] bg-repeat opacity-[0.035]"
      />
      <Container className="pt-10 md:pt-14">
        <h1 className="soky-heading text-5xl text-soky-blue md:text-7xl">
          Menú SOKY
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-soky-muted">
          Recorre el menú, encuentra tu favorito y agrégalo a tu pedido.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm text-soky-muted">
          <p>
            {isUsableExchangeRate(data.rate, data.settings.defaultCurrency)
              ? "Tasa: " + data.rate.rate + " VES por " + data.rate.baseCurrency
              : "Conversión a Bs. por confirmar"}
          </p>
          {data.rate?.warning ? <p>{data.rate.warning}</p> : null}
          <p>
            Pedido mínimo referencial: {data.settings.minimumOrderAmount ?? "Consultar"}{" "}
            {data.settings.defaultCurrency}
          </p>
        </div>
        {!initialDestination ? (
          <div className="py-12">
            <EmptyState
              title="Esta categoría no existe"
              description="Vuelve al menú completo para elegir una sección."
              actionHref="/menu"
              actionLabel="Ver menú completo"
            />
          </div>
        ) : data.products.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="No hay productos por ahora"
              description="Vuelve más tarde para revisar el menú."
              actionHref="/menu"
              actionLabel="Reintentar"
            />
          </div>
        ) : (
          <MenuCatalog
            sections={data.sections}
            initialDestination={initialDestination}
          />
        )}
      </Container>
    </main>
  );
}
