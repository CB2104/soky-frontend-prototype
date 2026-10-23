import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "lenis/dist/lenis.css";
import { getPublicSettings } from "@/features/settings/api";
import { SiteFooter } from "@/components/layout/footer/SiteFooter";
import Navbar from "@/components/layout/Navbar";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import CartDrawer from "@/features/cart/components/CartDrawer";
import { CartCatalogSync } from "@/features/cart/components/CartCatalogSync";
import { ContactSpeedDial } from "@/features/contact/components/ContactSpeedDial";
import { SmoothScroll } from "@/providers/SmoothScroll";
import TransitionProvider from "@/providers/TransitionProvider";
import { DemoRevisionSync } from "@/features/demo/DemoRevisionSync";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  colorScheme: "only light",
  themeColor: "#1729A6",
};

type SiteLayoutProps = {
  children: ReactNode;
  product: ReactNode;
};

export default async function SiteLayout({ children, product }: SiteLayoutProps) {
  const settings = await getPublicSettings();
  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsappPhone,
    "Hola SOKY, quiero hacer un pedido.",
    settings.demoPreview,
  );

  return (
    <TransitionProvider>
      <div data-site-loading-root className="min-h-dvh bg-soky-paper text-soky-ink">
        <SmoothScroll />
        <DemoRevisionSync enabled={!!settings.demoPreview} />
        <Navbar whatsappUrl={whatsappUrl} />
        {children}
        {product}
        <SiteFooter settings={settings} />
        <ContactSpeedDial
          whatsappUrl={whatsappUrl}
          instagramUrl={settings.instagramUrl}
        />
        <CartCatalogSync />
        <CartDrawer currency={settings.defaultCurrency} />
      </div>
    </TransitionProvider>
  );
}
