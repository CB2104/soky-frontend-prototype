import Link from "next/link";
import type { PublicSettingsDto } from "@/contracts/api";
import { Button } from "@/components/ui/button";
import { PatternSurface } from "@/components/ui/pattern-surface";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import SokyLogo from "../brand/SokyLogo";

type SiteFooterProps = {
  settings: PublicSettingsDto;
};

export function SiteFooter({ settings }: SiteFooterProps) {
  return (
    <PatternSurface className="bg-soky-navy text-soky-white" pattern="seigaiha">
      <footer className="soky-container grid gap-8 py-12 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="space-y-4">
          <SokyLogo className="h-12 w-auto" />
          <p className="max-w-sm text-sm leading-6 text-soky-white/78">
            {settings.slogan ?? "Sushi casual, colorido y fácil de pedir."}
          </p>
          <Button
            href={buildWhatsAppUrl(
              settings.whatsappPhone,
              "Hola SOKY, quiero pedir.",
            )}
            target="_blank"
            rel="noreferrer"
            variant="whatsapp"
          >
            Pedir por WhatsApp
          </Button>
        </div>
        <div>
          <h2 className="font-black">Navegación</h2>
          <div className="mt-4 grid gap-2 text-sm">
            <Link href="/">Inicio</Link>
            <Link href="/menu">Menú</Link>
            <Link href="/cart">Carrito</Link>
            <Link href="/faq">FAQ</Link>
          </div>
        </div>
        <div>
          <h2 className="font-black">Contacto</h2>
          <div className="mt-4 grid gap-2 text-sm text-soky-white/78">
            <p>{settings.address}</p>
            {settings.openingHoursDisplay.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {settings.instagramUrl ? (
              <a href={settings.instagramUrl} target="_blank" rel="noreferrer">
                @soky_ve
              </a>
            ) : null}
          </div>
        </div>
      </footer>
    </PatternSurface>
  );
}
