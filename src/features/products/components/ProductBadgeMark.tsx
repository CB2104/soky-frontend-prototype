import type { ProductBadgeKind } from "../product-card-editorial";
import { PercentIcon } from "@/components/brand/IconsSVG";
import type { ProductCardVariant } from "../mappers";

export function ProductBadgeMark({
  variant,
  kind,
  className,
  starClassName,
  percentClassName,
}: {
  variant: ProductCardVariant;
  kind?: ProductBadgeKind;
  className: string;
  starClassName: string;
  percentClassName: string;
}) {
  const resolvedKind = kind ?? (variant === "promo" ? "promo" : variant === "featured" ? "favorite" : undefined);
  if (!resolvedKind) return null;

  return (
    <span className={className} aria-hidden="true">
      {resolvedKind !== "promo" ? (
        <span className={starClassName} />
      ) : (
        <PercentIcon className={percentClassName} />
      )}
    </span>
  );
}
