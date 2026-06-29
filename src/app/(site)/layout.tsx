import type { ReactNode } from "react";
import { getPublicSettings } from "@/features/settings/api";
import { SiteFooter } from "@/components/layout/site-footer";
import Navbar from "@/components/layout/Navbar";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import CartDrawer from "@/features/cart/components/CartDrawer";
import { ContactSpeedDial } from "@/features/contact/components/ContactSpeedDial";

export const dynamic = "force-dynamic";


type SiteLayoutProps = {
  children: ReactNode;
};

export default async function SiteLayout({ children }: SiteLayoutProps) {
  const settings = await getPublicSettings();
  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsappPhone,
    "Hola SOKY, quiero hacer un pedido.",
  );

  return (
    <div className="min-h-dvh bg-soky-paper text-soky-ink">
      <Navbar whatsappUrl={whatsappUrl} />
      {children}
      <SiteFooter settings={settings} />
      <ContactSpeedDial whatsappUrl={whatsappUrl} instagramUrl={settings.instagramUrl}/>
      <CartDrawer />
    </div>
  );
}
