import {
  CartSVG,
  MapPinIcon,
  MenuBlockIcon,
  SushiSetIcon,
  WhatsAppSVG,
} from "@/components/brand/IconsSVG";
import { faqItems } from "./faq-content";
import styles from "./Faq.module.css";

const icons = {
  menu: MenuBlockIcon,
  whatsapp: WhatsAppSVG,
  pin: MapPinIcon,
  sushi: SushiSetIcon,
  cart: CartSVG,
};

export function FaqGrid() {
  return (
    <div className={styles.grid}>
      {faqItems.map((item) => {
        const Icon = icons[item.icon];

        return (
          <article
            key={item.id}
            id={item.id}
            className={styles.item}
            data-faq-reveal="item"
            aria-labelledby={`${item.id}-title`}
          >
            <h2 id={`${item.id}-title`} className={styles.question}>
              <span className={styles.icon} aria-hidden="true">
                <Icon />
              </span>
              <span>{item.question}</span>
            </h2>
            <p className={styles.answer}>
              <strong>{item.lead}</strong> {item.answer}
            </p>
          </article>
        );
      })}
    </div>
  );
}
