"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ProductCardViewModel } from "../mappers";
import { formatCartMoney } from "@/lib/format-cart-money";
import styles from "./ProductRecommendations.module.css";

export function CompactProductCard({product,onAdd}:{product:ProductCardViewModel;onAdd:()=>void}) {
  const [failed,setFailed] = useState(false);
  return <article className={styles.product}>
    <Link href={`/menu/${encodeURIComponent(product.slug)}`} scroll={false} data-transition-ignore="true" className={styles.photo} aria-label={`Ver ${product.title}`}>
      <Image src={failed ? "/images/products/product-photo-pending.svg" : product.imageUrl} alt={product.imageAlt} fill sizes="72px" onError={()=>setFailed(true)}/>
    </Link>
    <div className={styles.productInfo}><Link href={`/menu/${encodeURIComponent(product.slug)}`} scroll={false} data-transition-ignore="true" className={styles.productTitle}>{product.title}</Link>
      <p className={styles.price}>{formatCartMoney(product.priceAmount,product.priceCurrency)}</p></div>
    <Button size="sm" variant="primary" type="button" className={styles.add} onClick={onAdd} disabled={!product.isAvailable} aria-label={`Agregar ${product.title} al carrito`}>+ Agregar</Button>
  </article>;
}
