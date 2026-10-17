import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FaqGrid } from "@/features/faq/FaqGrid";
import { FaqMotion } from "@/features/faq/FaqMotion";
import styles from "@/features/faq/Faq.module.css";
import { SiteReadySignal } from "@/providers/SiteLoadingProvider";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Respuestas rápidas sobre pedidos, pickup, delivery y pagos en SOKY.",
  alternates: { canonical: "/faq" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function FaqPage() {
  return (
    <main className={styles.page}>
      <FaqMotion>
        <Container>
          <header className={styles.header} data-faq-reveal="header">
            <p className={styles.eyebrow}>Antes del primer bocado</p>
            <h1 className={styles.title}>
              Preguntas <span className={styles.titleAccent}>frecuentes</span>
            </h1>
            <p className={styles.intro}>
              Todo lo que necesitas saber para preparar tu pedido y coordinarlo con
              SOKY por WhatsApp.
            </p>
          </header>
          <FaqGrid />
          <footer className={styles.footer} data-faq-reveal="footer">
            <p className={styles.note}>
              ¿Ya tienes tus favoritos? Empieza por el menú.
            </p>
            <div className={styles.actions}>
              <Button href="/menu" variant="primary" className={styles.menuLink}>
                Ver menú
              </Button>
              <Button variant="tertiary" href="/#ubicacion" className={styles.locationLink}>
                Ver ubicación y horarios
              </Button>
            </div>
          </footer>
        </Container>
      </FaqMotion>
      <SiteReadySignal />
    </main>
  );
}
