import {
  InstagramIcon,
  MapPinIcon,
  WhatsAppSVG,
} from "@/components/brand/IconsSVG";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { LocationViewModel } from "@/features/settings/mappers";
import { LocationBackground } from "./LocationBackground";
import { LocationMotion } from "./LocationMotion";
import styles from "./LocationSection.module.css";

type LocationSectionProps = {
  location: LocationViewModel;
};

export function LocationSection({ location }: LocationSectionProps) {
  return (
    <section
      id="ubicacion"
      aria-labelledby="location-title"
      className={styles.section}
      data-contact-speed-dial-hidden-zone
    >
      <LocationBackground />

      <Container size="wide" className={styles.layout}>
        <div className={styles.content} data-location-panel="information">
          <header className={styles.header}>
            <p className={styles.eyebrow} data-location-motion="eyebrow">
              Encuéntranos
            </p>
            <h2 id="location-title" className={styles.heading}>
              <span data-location-motion="title-line">Visita SOKY o pide</span>{" "}
              <span data-location-motion="title-line">para llevar</span>
            </h2>
            <p
              className={styles.description}
              data-location-motion="description"
            >
              Tus boxes favoritos, a un mensaje de distancia.
            </p>
          </header>

          <div
            className={styles.information}
            data-location-motion="information"
          >
            <div className={styles.informationGroup}>
              <span className={styles.informationIcon} aria-hidden="true">
                <MapPinIcon />
              </span>
              <div>
                <h3 className={styles.label}>Dirección</h3>
                <address className={styles.address}>
                  {location.address ?? "Dirección por confirmar"}
                </address>
              </div>
            </div>

            <div className={styles.informationGroup}>
              <span className={styles.informationIcon} aria-hidden="true">
                <span className={styles.clockIcon} />
              </span>
              <div className={styles.hoursContent}>
                <h3 className={styles.label}>Horarios</h3>
                {location.hours.length ? (
                  <dl className={styles.hours}>
                    {location.hours.map((line, index) => (
                      <div
                        className={styles.hoursRow}
                        key={`${line.days}-${index}`}
                      >
                        <dt>{line.days}</dt>
                        {line.time ? (
                          <dd>
                            <span>{line.time}</span>
                            {line.note ? (
                              <>
                                {" "}
                                <small>{line.note}</small>
                              </>
                            ) : null}
                          </dd>
                        ) : (
                          <dd className={styles.srOnly}>Horario informado</dd>
                        )}
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className={styles.address}>Horarios por confirmar</p>
                )}
              </div>
            </div>
          </div>

          {location.whatsappUrl ? (
            <Button
              href={location.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              className={styles.primaryAction}
              data-location-motion="action"
              aria-label="Pedir por WhatsApp"
            >
              <WhatsAppSVG aria-hidden="true" />
              <span className={styles.actionLabel} aria-hidden="true">
                Pedir por WhatsApp
              </span>
              <span className={styles.compactActionLabel} aria-hidden="true">
                WhatsApp
              </span>
            </Button>
          ) : (
            <Button
              disabled
              aria-describedby="location-contact-pending"
              variant="primary"
              className={styles.primaryAction}
              data-location-motion="action"
              aria-label="Pedir por WhatsApp"
            >
              <WhatsAppSVG aria-hidden="true" />
              <span className={styles.actionLabel} aria-hidden="true">
                Pedir por WhatsApp
              </span>
              <span className={styles.compactActionLabel} aria-hidden="true">
                WhatsApp
              </span>
            </Button>
          )}
          {!location.whatsappUrl ? (
            <p id="location-contact-pending" className={styles.pending}>
              WhatsApp de pedidos por confirmar.
            </p>
          ) : null}
        </div>

        <div className={styles.visitPanel} data-location-panel="visit">
          <header className={styles.mapIntro}>
            <p className={styles.eyebrow} data-location-motion="eyebrow">
              Cómo llegar
            </p>
            <h3 data-location-motion="title-line">Ven a visitarnos</h3>
          </header>
          {location.mapsUrl ? (
            <Button
              href={location.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              className={styles.secondaryAction}
              data-location-motion="action"
              aria-label="Abrir en Google Maps"
            >
              <MapPinIcon />
              <span className={styles.actionLabel} aria-hidden="true">
                Abrir en Google Maps
              </span>
              <span className={styles.compactActionLabel} aria-hidden="true">
                Google Maps
              </span>
            </Button>
          ) : null}
          <div className={styles.mapArea}>
            <div className={styles.mapSurface} data-location-motion="map">
              {location.mapsEmbedUrl ? (
                <iframe
                  title={`Ubicación de ${location.businessName} en Google Maps`}
                  src={location.mapsEmbedUrl}
                  width="600"
                  height="620"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className={styles.map}
                />
              ) : (
                <div className={styles.mapUnavailable}>
                  <MapPinIcon aria-hidden="true" />
                  <p>
                    {location.mapsUrl
                      ? "Consulta la ubicación del local en Google Maps."
                      : "La ubicación del local estará disponible aquí."}
                  </p>
                </div>
              )}
            </div>
          </div>
          {location.instagramUrl ? (
            <div className={styles.social}>
              <Button variant="tertiary"
                href={location.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.instagram}
              >
                <InstagramIcon aria-hidden="true" />
                <span>{location.instagramLabel ?? "Instagram"}</span>
              </Button>
            </div>
          ) : null}
        </div>
      </Container>
      <LocationMotion />
    </section>
  );
}
