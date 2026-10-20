import type { Metadata, Viewport } from "next";
import { Container } from "@/components/ui/container";
import { getPublicSettings } from "@/features/settings/api";
import { getAllProducts } from "@/features/products/api";
import { mapProductToCard } from "@/features/products/mappers";
import { mapSettingsToCart } from "@/features/cart/mappers";
import { CartPageContent } from "@/features/cart/components/page/CartPageContent";

export const metadata: Metadata = {
  title: "Carrito",
  description:
    "Revisa tu pedido SOKY, consulta el importe referencial y continúa por WhatsApp.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  colorScheme: "only light",
  themeColor: "#07054A",
};

export default async function CartPage() {
  const [settings,groups] = await Promise.all([getPublicSettings(),Promise.allSettled([getAllProducts({categorySlug:"entradas"}),getAllProducts({categorySlug:"bebidas"})])]);
  const categories = groups.map(result=>result.status === "fulfilled" ? result.value : []);
  const recommendations = Array.from({length:Math.max(...categories.map(group=>group.length))},(_,index)=>categories.flatMap(group=>group[index] ? [group[index]] : []))
    .flat().map(mapProductToCard).filter(product=>product.isAvailable && product.priceCurrency === settings.defaultCurrency);
  return <main className="bg-soky-paper text-soky-ink"><Container><CartPageContent settings={mapSettingsToCart(settings)} recommendations={recommendations}/></Container></main>;
}
