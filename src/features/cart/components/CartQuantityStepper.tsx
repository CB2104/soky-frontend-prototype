import { MinusSVG, PlusSVG } from "@/components/brand/IconsSVG";
import { motion } from "motion/react";
type CartQuantityStepperProps = {
  label: string;
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
};

export function CartQuantityStepper({
  label,
  quantity,
  onDecrease,
  onIncrease,
}: CartQuantityStepperProps) {
  return (
    <div className="mt-auto flex justify-end">
      <div className="inline-flex items-center gap-1 rounded-full bg-soky-paper/95 p-1 ring-1 ring-soky-blue/10 shadow-[0_8px_20px_rgb(7_5_74/0.08),inset_0_1px_0_rgb(255_255_255/0.85)]">
        <motion.button
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.1 }}
          type="button"
          className="grid size-6 place-items-center rounded-full border border-soky-blue/15 bg-soky-white font-black text-soky-blue transition-colors hover:border-soky-orange-deep hover:bg-soky-orange/70 hover:text-soky-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2"
          aria-label={
            quantity === 1
              ? `Quitar ${label} del carrito`
              : `Reducir cantidad de ${label}`
          }
          onClick={onDecrease}
        >
          <MinusSVG />
        </motion.button>

        <span
          aria-atomic="true"
          aria-live="polite"
          className="grid min-w-9 place-items-center px-2 text-sm font-black text-soky-ink"
        >
          {quantity}
        </span>

        <motion.button
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.1 }}
          type="button"
          className="grid size-6 place-items-center rounded-full border border-soky-blue/15 bg-soky-white font-black text-soky-blue transition-colors hover:border-soky-orange-deep hover:bg-soky-orange/70 hover:text-soky-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2"
          aria-label={`Aumentar cantidad de ${label}`}
          onClick={onIncrease}
        >
          <PlusSVG />
        </motion.button>
      </div>
    </div>
  );
}
