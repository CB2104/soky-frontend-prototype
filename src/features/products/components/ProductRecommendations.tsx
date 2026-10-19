import { SeigaihaHeader } from "@/components/brand/SeigaihaHeader";
import type { ProductCardViewModel } from "../mappers";
import { PRODUCT_CARD_IMAGE_SIZES } from "./ProductCard.constants";
import { ProductCard } from "./ProductCard";
import styles from "./ProductRecommendations.module.css";

export function ProductRecommendations({
  products,
  presentation = "card",
  onAdd,
}: {
  products: ProductCardViewModel[];
  presentation?: "card" | "compact";
  onAdd?: (product: ProductCardViewModel) => void;
}) {
  if (!products.length) return null;
  if (presentation === "card") {
    return (
      <section
        className={styles.cardRecommendations}
        aria-label="También puede gustarte"
      >
        <h2 className="text-2xl font-black">También puede gustarte</h2>
        <div className={`${styles.cardGrid} mt-5`}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              imageSizes={PRODUCT_CARD_IMAGE_SIZES}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      className={styles.section}
      aria-labelledby="cart-recommendations-title"
    >
      <SeigaihaHeader>
        <span className={styles.tag}>UN EXTRA NUNCA SOBRA</span>
        <h2 id="cart-recommendations-title">TAMBIÉN PUEDE GUSTARTE</h2>
        <p>Algo para acompañar siempre viene bien.</p>
      </SeigaihaHeader>
      <div className={styles.list}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            presentation="compact"
            onAdd={onAdd}
          />
        ))}
      </div>
    </section>
  );
}
