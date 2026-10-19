import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";
import { motion, useIsPresent, useReducedMotion } from "motion/react";
import type { CartItemViewModel } from "../mappers";
import { CartQuantityStepper } from "./CartQuantityStepper";
import { CartRemoveButton } from "./CartRemoveButton";
import styles from "./CartDrawer.module.css";

type CartItemRowProps = {
  item: CartItemViewModel;
  description?: string;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
};

export function CartItemRow({ item, description, onNavigate, onDecrease, onIncrease, onRemove }: CartItemRowProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const isPresent = useIsPresent();
  return <motion.li className={styles.item} data-cart-item={item.id} inert={!isPresent}
    aria-hidden={!isPresent ? true : undefined} layout={reduceMotion ? false : "position"}
    initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }} transition={{ duration: reduceMotion ? 0 : .18 }}>
    <div className={styles.photo}><Image src={item.imageUrl} alt="" fill sizes="(max-width: 767px) and (orientation: portrait) 52px, (max-width: 359px) 64px, 72px" className={styles.productImage} /></div>
    <div className={styles.itemInfo}>
      <div className={styles.itemText}>
        <h3><Link href={item.href} scroll={false} data-transition-ignore="true" onClick={event => onNavigate(event, item.href)}>{item.title}</Link></h3>
        {description ? <p className={styles.description}>{description}</p> : null}
        <p className={styles.unitPrice}>{item.unitPrice}{item.unitPrice !== "Por confirmar" ? " / unidad" : ""}</p>
        {item.issue ? <p className={styles.issue} role="status">{item.issue}</p> : null}
      </div>
      <div className={styles.remove} data-cart-remove><CartRemoveButton label={item.title} onRemove={onRemove} /></div>
    </div>
    <div className={styles.itemActions}>
      <strong className={item.lineTotal === "Por confirmar" ? styles.pendingLine : styles.lineTotal}>{item.lineTotal}</strong>
      <CartQuantityStepper label={item.title} quantity={item.quantity} disabledIncrease={!item.canIncrease}
        onDecrease={onDecrease} onIncrease={onIncrease} />
    </div>
  </motion.li>;
}
