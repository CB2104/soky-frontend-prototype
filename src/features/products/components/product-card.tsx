"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/features/analytics/client";
import { useCartStore } from "@/features/cart/store";
import type { ProductCardViewModel } from "@/features/products/mappers";

type ProductCardProps = {
  product: ProductCardViewModel;
  priority?: boolean;
};

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <article className="soky-card flex h-full flex-col overflow-hidden text-soky-ink">
      <a href={`/menu/${product.slug}`} className="group block">
        <div className="relative aspect-[4/3] overflow-hidden bg-soky-blue">
          <Image
            alt={product.imageAlt}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            src={product.imageUrl}
          />
          {product.badge ? (
            <div className="absolute left-4 top-4">
              <Badge variant={product.badge === "Promo" ? "promo" : "neutral"}>
                {product.badge}
              </Badge>
            </div>
          ) : null}
        </div>
      </a>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-2">
          <h3 className="text-2xl font-black leading-tight">{product.title}</h3>
          <p className="text-sm leading-6 text-soky-muted">{product.description}</p>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <span className="soky-number text-3xl text-soky-blue">{product.priceLabel}</span>
          {product.isAvailable ? (
            <Button
              type="button"
              onClick={() => {
                addItem(product);
                trackEvent({
                  eventType: "product_add_to_cart",
                  entityType: "product",
                  entityId: product.id,
                });
              }}
            >
              Agregar
            </Button>
          ) : (
            <Badge variant="neutral">No disponible</Badge>
          )}
        </div>
      </div>
    </article>
  );
}
