import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { CategoryGrid } from "./CategoryGrid";
import type { CategoryCardViewModel } from "./category-card-data";
import type { ProductCardViewModel } from "@/features/products/mappers";
import { MenuShowcaseBackground } from "./MenuShowcaseBackground";
import styles from "./MenuShowcase.module.css";
import { MenuShowcaseHeading } from "./MenuShowcaseHeading";
import { ProductCard } from "@/features/products/components/ProductCard";

type MenuShowcaseProps = {
  products: readonly ProductCardViewModel[];
  categories: readonly CategoryCardViewModel[];
};

export function MenuShowcase({ products, categories }: MenuShowcaseProps) {
  return (
    <div className={styles.showcase}>
      <MenuShowcaseBackground />

      <Container className={styles.content}>
        <section
          id="destacados"
          data-contact-speed-dial-hidden-zone
          className={styles.section}
          aria-labelledby="showcase-products-title"
        >
          <MenuShowcaseHeading
            id="showcase-products-title"
            eyebrow="Promos SOKY"
            title="Para cada antojo,"
            accent="un SOKY"
            description="Elige tu favorito y haz que hoy sea un día más rico."
          />

          {products.length > 0 ? (
            <div className={styles.productGrid}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  imageSizes="(max-width: 639px) and (orientation: portrait) 364px, (min-width: 380px) 340px, calc(100vw - 2rem)"
                />
              ))}
            </div>
          ) : (
            <p className={styles.productsEmpty}>
              No hay promos disponibles en este momento.
            </p>
          )}
        </section>

        <section
          id="categorias"
          data-contact-speed-dial-hidden-zone
          className={styles.section}
          aria-labelledby="showcase-categories-title"
        >
          <MenuShowcaseHeading
            id="showcase-categories-title"
            eyebrow="Explora el menú"
            title="Encuentra"
            accent="tu favorito"
            description="Recorre nuestras categorías y descubre qué pedir hoy."
            compact
          />

          <CategoryGrid categories={categories} />

          <div className={styles.menuLink}>
            <Button href="/menu">Ver menú completo</Button>
          </div>
        </section>
      </Container>
    </div>
  );
}
