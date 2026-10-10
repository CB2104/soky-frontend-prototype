import { SeigaihaHeader } from "@/components/brand/SeigaihaHeader";
import type { ProductCardViewModel } from "../mappers";
import { ProductCard } from "./ProductCard";
import styles from "./ProductRecommendations.module.css";

export function ProductRecommendations({products,presentation="card",onAdd}:{products:ProductCardViewModel[];presentation?:"card"|"compact";onAdd?:(product:ProductCardViewModel)=>void}) {
  if (!products.length) return null;
  if (presentation === "card") return <section aria-label="También puede gustarte">
    <h2 className="text-2xl font-black">También puede gustarte</h2>
    <div className="mt-5 grid gap-5 md:grid-cols-2">{products.map(product=><ProductCard key={product.id} product={product}/>)}</div>
  </section>;
  return <section className={styles.section} aria-labelledby="cart-recommendations-title">
    <SeigaihaHeader><span className={styles.tag}>UN EXTRA NUNCA SOBRA</span><h2 id="cart-recommendations-title">TAMBIÉN PUEDE GUSTARTE</h2><p>Algo para acompañar siempre viene bien.</p></SeigaihaHeader>
    <div className={styles.list}>{products.map(product=><ProductCard key={product.id} product={product} presentation="compact" onAdd={onAdd}/>)}</div>
  </section>;
}
