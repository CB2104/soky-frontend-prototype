import Link from "next/link";
import type { PublicSettingsDto } from "@/contracts/api";
import SokyLogo from "@/components/brand/SokyLogo";
import {
  ArrowRightIcon,
  InstagramIcon,
  MapPinIcon,
  WhatsAppSVG,
} from "@/components/brand/IconsSVG";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { mapPublicSettingsToContact } from "@/features/settings/mappers";
import styles from "./SiteFooter.module.css";

type SiteFooterProps = { settings: PublicSettingsDto };

const navigation = [
  { href: "/", label: "Inicio" },
  { href: "/menu", label: "Menú" },
  { href: "/cart", label: "Carrito" },
  { href: "/faq", label: "FAQ" },
  { href: "/#ubicacion", label: "Ubicación" },
];

export function SiteFooter({ settings }: SiteFooterProps) {
  const contact = mapPublicSettingsToContact(settings);

  return (
    <footer className={styles.footer} data-contact-speed-dial-hidden-zone>
      <Container size="wide">
        <div className={styles.groups}>
          <div className={styles.brand}>
            <Link
              href="/"
              className={styles.logoLink}
              aria-label={`${contact.businessName}: inicio`}
            >
              <SokyLogo className={styles.logo} title="" />
            </Link>
            <p className={styles.slogan}>
              {settings.slogan?.trim() ||
                "Sushi casual, colorido y fácil de pedir."}
            </p>
            {contact.whatsappUrl ? (
              <Button
                href={contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="ghost"
                className={styles.primaryAction}
              >
                <WhatsAppSVG aria-hidden="true" />
                <span>Pedir por WhatsApp</span>
              </Button>
            ) : (
              <p className={styles.pending}>
                WhatsApp de pedidos por confirmar.
              </p>
            )}
          </div>

          <nav
            className={`${styles.group} ${styles.navigationGroup}`}
            aria-labelledby="footer-navigation-title"
          >
            <h2 id="footer-navigation-title" className={styles.heading}>
              Explora
            </h2>
            <ul className={styles.navigation}>
              {navigation.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={`${styles.group} ${styles.contactGroup}`}>
            <h2 className={styles.heading}>Encuéntranos</h2>
            <div className={styles.addressRow}>
              <MapPinIcon aria-hidden="true" />
              <address>{contact.address ?? "Dirección por confirmar"}</address>
            </div>
            {contact.mapsUrl ? (
              <a
                href={contact.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.mapsLink}
              >
                Abrir en Google Maps <ArrowRightIcon aria-hidden="true" />
              </a>
            ) : null}
            {contact.instagramUrl ? (
              <a
                href={contact.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.instagram}
              >
                <InstagramIcon aria-hidden="true" />
                <span>{contact.instagramLabel ?? "Instagram"}</span>
              </a>
            ) : null}
          </div>

          <div className={`${styles.group} ${styles.hoursGroup}`}>
            <h2 className={styles.heading}>Horarios</h2>
            {contact.hours.length ? (
              <dl className={styles.hours}>
                {contact.hours.map((line, index) => (
                  <div key={`${line.days}-${index}`}>
                    <dt>{line.days}</dt>
                    <dd>
                      {line.time ?? "Horario informado"}
                      {line.note ? <small>{line.note}</small> : null}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className={styles.pending}>Horarios por confirmar.</p>
            )}
          </div>
        </div>

        <div className={styles.bottom}>
          <p>
            © {new Date().getFullYear()} {contact.businessName}
          </p>
          <p>Pedidos sujetos a confirmación por WhatsApp.</p>
        </div>
      </Container>
    </footer>
  );
}
