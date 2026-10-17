import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { HomeSceneBottle, HomeSceneOrnament } from "../HomeSceneOrnament";
import { CategoryGrid } from "./CategoryGrid";
import type { CategoryCardViewModel } from "./category-card-data";
import type { ProductCardViewModel } from "@/features/products/mappers";
import styles from "./MenuShowcase.module.css";
import { MenuShowcaseHeading } from "./MenuShowcaseHeading";
import { ProductCard } from "@/features/products/components/ProductCard";
import { PRODUCT_CARD_IMAGE_SIZES } from "@/features/products/components/ProductCard.constants";

type MenuShowcaseProps = {
  products: readonly ProductCardViewModel[];
  categories: readonly CategoryCardViewModel[];
};

export function MenuShowcase({ products, categories }: MenuShowcaseProps) {
  return (
    <div className={styles.showcase}>
      <section
        id="destacados"
        data-home-scene-part="products"
        data-contact-speed-dial-hidden-zone
        className={`${styles.section} ${styles.productsSurface}`}
        aria-labelledby="showcase-products-title"
      >
        <Container className={styles.content}>
          <HomeSceneOrnament placement="products">
            <MenuShowcaseHeading
              id="showcase-products-title"
              eyebrow="Promos SOKY"
              title="Para cada antojo,"
              accent="un SOKY"
              description="Elige tu favorito y haz que hoy sea un día más rico."
            />
          </HomeSceneOrnament>

          {products.length > 0 ? (
            <div className={styles.productGrid}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  imageSizes={PRODUCT_CARD_IMAGE_SIZES}
                />
              ))}
            </div>
          ) : (
            <p className={styles.productsEmpty}>
              No hay promos disponibles en este momento.
            </p>
          )}
        </Container>
      </section>

      <section
        id="categorias"
        data-home-scene-part="categories"
        data-contact-speed-dial-hidden-zone
        className={`${styles.section} ${styles.categoriesSurface}`}
        aria-labelledby="showcase-categories-title"
      >
        <Container className={styles.content}>
          <HomeSceneOrnament placement="categories">
            <MenuShowcaseHeading
              id="showcase-categories-title"
              eyebrow="Explora el menú"
              title="Encuentra"
              accent="tu favorito"
              description="Recorre nuestras categorías y descubre qué pedir hoy."
              compact
            />
          </HomeSceneOrnament>

          <CategoryGrid categories={categories} />

          <div className={styles.menuLink}>
            <Button variant="tertiary" href="/menu">Ver menú completo</Button>
          </div>
        </Container>
        <HomeSceneBottle />
      </section>
    </div>
  );
}
