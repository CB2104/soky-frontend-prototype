import type { PriceCurrency, PublicSettingsDto } from "@/contracts/api";
import { formatMoneyCents, parseMoneyCents } from "@/lib/money";
import type { CartItem } from "./store";

export { formatCartMoney } from "@/lib/format-cart-money";
import { formatCartMoney } from "@/lib/format-cart-money";

export type CartSettingsViewModel = {
  currency: PriceCurrency;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  minimumOrderCents: number;
};

export function mapSettingsToCart(settings: PublicSettingsDto): CartSettingsViewModel {
  return {currency:settings.defaultCurrency,pickupEnabled:settings.pickupEnabled,
    deliveryEnabled:settings.deliveryEnabled,minimumOrderCents:parseMoneyCents(settings.minimumOrderAmount ?? "0") ?? 0};
}

export type CartItemViewModel = {
  id: string;
  title: string;
  href: string;
  imageUrl: string;
  quantity: number;
  notes: string;
  unitPrice: string;
  lineTotal: string;
  issue?: string;
  canIncrease: boolean;
};

const issueLabels: Record<NonNullable<CartItem["catalogIssue"]>,string> = {
  NOT_FOUND:"Producto por revisar",INACTIVE:"Producto no disponible",UNAVAILABLE:"Agotado",
  INVALID_PRICE:"Precio por confirmar",INVALID_QUANTITY:"Cantidad por revisar",
};

export function mapCartItem(item: CartItem, verified: boolean, currency: PriceCurrency): CartItemViewModel {
  const cents = item.unitPriceCentsSnapshot;
  const valid = verified && !item.catalogIssue && item.unitPriceCurrencySnapshot === currency
    && cents !== undefined && Number.isSafeInteger(cents) && cents >= 0
    && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 99
    && Number.isSafeInteger(cents * item.quantity);
  return {
    id:item.productId,title:item.titleSnapshot,href:`/menu/${item.slug}`,
    imageUrl:item.imageUrlSnapshot || "/images/products/product-photo-pending.svg",
    quantity:item.quantity,notes:item.notes ?? "",
    unitPrice:valid ? formatCartMoney(formatMoneyCents(cents),currency) : "Por confirmar",
    lineTotal:valid ? formatCartMoney(formatMoneyCents(cents * item.quantity),currency) : "Por confirmar",
    issue:item.catalogIssue ? issueLabels[item.catalogIssue] : verified && !valid ? "Precio por confirmar" : undefined,
    canIncrease:valid && item.quantity < 99,
  };
}
