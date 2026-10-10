import Image from "next/image";
import { MenuBlockIcon } from "@/components/brand/IconsSVG";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import heroActions from "@/features/hero/components/HeroActions.module.css";
import { HowToOrderMotion } from "./HowToOrderMotion";
import styles from "./HowToOrderSection.module.css";

const steps = [
  {
    title: "Elige tus favoritos",
    description:
      "Explora el menú y las promos, revisa qué incluyen y agrega tus favoritos al carrito.",
    image: "/images/how-to-order/step-1.png",
  },
  {
    title: "Revisa y envía",
    description:
      "Comprueba las cantidades y el subtotal. Envía el resumen de tu pedido por WhatsApp.",
    image: "/images/how-to-order/step-2.png",
  },
  {
    title: "Confirma y paga",
    description:
      "El restaurante confirma disponibilidad, importe final y entrega. Acuerda el método de pago por WhatsApp.",
    image: "/images/how-to-order/step-3.png",
  },
  {
    title: "Recibe y disfruta",
    description:
      "Coordina con el restaurante la entrega o el retiro de tu pedido.",
    image: "/images/how-to-order/step-4.png",
  },
] as const;

function StepArrow() {
  return (
    <div className={styles.connector} data-order-arrow aria-hidden="true">
      <svg
        className={styles.horizontalArrow}
        viewBox="0 0 80 48"
        fill="none"
        focusable="false"
      >
        <path d="M5 35C23 8 48 8 72 25M59 12L72 25L55 29" />
      </svg>
      <svg
        className={styles.verticalArrow}
        viewBox="0 0 48 80"
        fill="none"
        focusable="false"
      >
        <path d="M12 5C38 24 37 49 23 72M13 57L23 72L35 58" />
      </svg>
    </div>
  );
}

export function HowToOrderSection() {
  return (
    <section
      id="como-pedir"
      className={styles.section}
      aria-labelledby="how-to-order-title"
      data-contact-speed-dial-hidden-zone
    >
      <Container className={styles.content}>
        <header className={styles.header}>
          <h2 id="how-to-order-title" className={styles.title}>
            Cómo pedir
          </h2>
          <p className={styles.intro}>
            Elige tus favoritos y lleva tu pedido listo a WhatsApp.
          </p>
        </header>

        <HowToOrderMotion>
          <ol className={styles.steps} role="list">
            {steps.map((step, index) => (
              <li key={step.image} className={styles.step} data-order-step>
                <div className={styles.visual}>
                  <div className={styles.imagePulse} data-order-image>
                    <Image
                      src={step.image}
                      alt=""
                      width={1024}
                      height={1024}
                      sizes="(max-width: 639px) 240px, (max-width: 1023px) 260px, 280px"
                      className={styles.image}
                    />
                  </div>
                </div>

              <div className={styles.stepCopy}>
                <span className={styles.number} aria-hidden="true">
                  {index + 1}
                </span>
                <div className={styles.stepText}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.description}>{step.description}</p>
                </div>
              </div>

                {index < steps.length - 1 && <StepArrow />}
              </li>
            ))}
          </ol>
        </HowToOrderMotion>

        <div className={styles.footer}>
          <p className={styles.note}>
            Tu pedido queda confirmado cuando el restaurante valida los detalles
            contigo por WhatsApp.
          </p>
          <Button
            href="/menu"
            variant="ghost"
            className={[heroActions.primaryAction, styles.cta].join(" ")}
          >
            <span aria-hidden="true" className={heroActions.actionIcon}>
              <MenuBlockIcon />
            </span>
            <span className={heroActions.actionLabel}>Ver menú</span>
          </Button>
        </div>
      </Container>
    </section>
  );
}
