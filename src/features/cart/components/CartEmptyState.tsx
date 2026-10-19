import type { MouseEvent } from "react";
import { ArrowRightIcon, SushiSetIcon } from "@/components/brand/IconsSVG";
import { Button } from "@/components/ui/button";
import styles from "./CartDrawer.module.css";

type CartEmptyStateProps = { onNavigate: (event: MouseEvent<HTMLAnchorElement>, href: string) => void };

export function CartEmptyState({ onNavigate }: CartEmptyStateProps) {
  return <div className={styles.empty}>
    <SushiSetIcon className={styles.emptyArt} />
    <h3>EL PRIMER ANTOJO<br />LO ELIGES TÚ.</h3>
    <p>Explora el menú y agrega tus favoritos para empezar tu pedido.</p>
    <Button href="/menu" variant="secondary" className={styles.emptyAction} data-cart-empty-action
      onClick={event => onNavigate(event, "/menu")}>Explorar menú <ArrowRightIcon aria-hidden="true" /></Button>
  </div>;
}
