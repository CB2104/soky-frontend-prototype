import Image from "next/image";
import type { Metadata } from "next";
import { SiteReadySignal } from "@/providers/SiteLoadingProvider";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/states";
import { getCategories } from "@/features/categories/api";
import { getCurrentExchangeRate } from "@/features/exchange-rates/api";
import { isUsableExchangeRate } from "@/features/exchange-rates/rate-validation";
import { MenuCatalog } from "@/features/menu/components/MenuCatalog";
import { MenuRecoveryFallback } from "@/features/menu/components/MenuRecoveryFallback";
import { buildMenuSections, getMenuDestination } from "@/features/menu/menu-sections";
import { getAllProducts } from "@/features/products/api";
import { getPublicSettings } from "@/features/settings/api";
import styles from "./MenuPage.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menú",
  description: "Explora el menú SOKY: boxes, rolls, ensaladas, entradas y más.",
  alternates: { canonical: "/menu" },
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
      <main className={styles.main}>
        <Container className={styles.state}>
          <MenuRecoveryFallback />
        </Container>
        <SiteReadySignal />
      </main>
    );
  }

  const initialDestination = getMenuDestination(data.sections, params?.category);

  return (
    <main className={styles.main}>
      <header className={styles.masthead} aria-labelledby="menu-title">
        <div className={styles.artboard} aria-hidden="true">
          <div className={styles.arc} />
          <Image
            src="/images/hero/soky-slide4-sushi-cutout.webp"
            alt=""
            width={1448}
            height={1086}
            sizes="(max-width: 767px) 112px, (max-width: 1023px) 184px, 280px"
            loading="eager"
            className={styles.sushi}
          />
        </div>
        <Container className={styles.heroInner}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Menú SOKY</p>
            <h1 id="menu-title" className={styles.title}>
              <span className={styles.titleLead}>¿Qué te</span>{" "}
              <span className={styles.titleWord}>provoca?</span>
            </h1>
            <p className={styles.introduction}>
              Entradas, rolls y boxes. Arma tu pedido a tu gusto.
            </p>
            <div className={styles.operations}>
              <p>Precios en {data.settings.defaultCurrency}</p>
              <p>
                {isUsableExchangeRate(data.rate, data.settings.defaultCurrency)
                  ? "Tasa: " + data.rate.rate + " VES por " + data.rate.baseCurrency
                  : "Conversión a Bs. por confirmar"}
              </p>
              <p>
                Pedido mínimo referencial: {data.settings.minimumOrderAmount ?? "Consultar"}{" "}
                {data.settings.defaultCurrency}
              </p>
              {data.rate?.warning ? (
                <p className={styles.rateWarning}>{data.rate.warning}</p>
              ) : null}
            </div>
          </div>
        </Container>
      </header>
      <Container>
        {!initialDestination ? (
          <div className={styles.state}>
            <EmptyState
              title="Esta categoría no existe"
              description="Vuelve al menú completo para elegir una sección."
              actionHref="/menu"
              actionLabel="Ver menú completo"
            />
          </div>
        ) : data.products.length === 0 ? (
          <div className={styles.state}>
            <EmptyState
              title="No hay productos por ahora"
              description="Vuelve más tarde para revisar el menú."
              actionHref="/menu"
              actionLabel="Reintentar"
            />
          </div>
        ) : (
          <MenuCatalog sections={data.sections} initialDestination={initialDestination} />
        )}
      </Container>
      <SiteReadySignal />
    </main>
  );
}
