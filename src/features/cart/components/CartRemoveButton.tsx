"use client";

import { OpenTrashSVG, TrashSVG } from "@/components/brand/IconsSVG";
import styles from "./CartRemoveButton.module.css";

export function CartRemoveButton({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button type="button" className={styles.button} onClick={onRemove} aria-label={`Quitar ${label} del carrito`}>
      <span className={styles.closed}><TrashSVG aria-hidden="true" focusable="false" /></span>
      <span className={styles.open}><OpenTrashSVG aria-hidden="true" focusable="false" /></span>
    </button>
  );
}
