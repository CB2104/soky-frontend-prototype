import { MinusSVG, PlusSVG } from "@/components/brand/IconsSVG";
import styles from "./CartQuantityStepper.module.css";

type CartQuantityStepperProps = {
  label: string;
  quantity: number;
  disabledIncrease?: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
};

export function CartQuantityStepper({ label, quantity, disabledIncrease = false, onDecrease, onIncrease }: CartQuantityStepperProps) {
  return (
    <div className={styles.stepper} role="group" aria-label={`Cantidad de ${label}`}>
      <button type="button" className={styles.control} onClick={onDecrease}
        aria-label={quantity === 1 ? `Quitar ${label} del carrito` : `Reducir cantidad de ${label}`}>
        <MinusSVG fill="currentColor" aria-hidden="true" focusable="false" />
      </button>
      <span className={styles.value} aria-live="polite" aria-atomic="true">{quantity}</span>
      <button type="button" className={styles.control} onClick={onIncrease} disabled={disabledIncrease || quantity >= 99}
        aria-label={`Aumentar cantidad de ${label}`}>
        <PlusSVG fill="currentColor" aria-hidden="true" focusable="false" />
      </button>
    </div>
  );
}
