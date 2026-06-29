import Image from "next/image";
import Link from "next/link";
import type { CartItem } from "../store";
import { CartQuantityStepper } from "./CartQuantityStepper";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { OpenTrashSVG, TrashSVG } from "@/components/brand/IconsSVG";

type CartItemAccent = "blue" | "orange";

type CartItemRowProps = {
  accent: CartItemAccent;
  item: CartItem;
  onClose: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
};

const accentClasses = {
  blue: {
    stripe: "bg-soky-blue",
    gradient: "from-soky-blue/90",
  },
  orange: {
    stripe: "bg-soky-orange",
    gradient: "from-soky-orange/90",
  },
} satisfies Record<CartItemAccent, { stripe: string; gradient: string }>;

export const CartItemRow = ({
  accent,
  item,
  onClose,
  onDecrease,
  onIncrease,
  onRemove,
}: CartItemRowProps) => {
  const accentClass = accentClasses[accent];

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{
        duration: 0.18,
        ease: "easeOut",
        layout: {
          duration: 0.2,
          ease: "easeOut",
        },
      }}
      className="relative grid h-30 grid-cols-[96px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-soky-blue/10 bg-soky-white shadow-[0_10px_30px_rgb(7_5_74/0.08)]"
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-20 w-2",
          accentClass.stripe,
        )}
      />

      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-2 z-10 w-10 bg-linear-to-r to-transparent",
          accentClass.gradient,
        )}
      />
      <div className="relative h-full min-h-0 overflow-hidden bg-soky-paper">
        {item.imageUrlSnapshot ? (
          <Image
            src={item.imageUrlSnapshot}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/menu/${item.slug}`}
              className="group block"
              onClick={onClose}
            >
              <span className="line-clamp-1 text-[1.35rem] font-black leading-[1.05] tracking-[-0.02em] text-soky-navy transition-colors group-hover:text-soky-blue">
                {item.titleSnapshot}
              </span>
            </Link>

            {item.descriptionSnapshot ? (
              <p className="mt-1 line-clamp-1 text-xs leading-4 text-soky-muted">
                {item.descriptionSnapshot}
              </p>
            ) : null}

            {item.priceLabelSnapshot ? (
              <p className="mt-1 text-base font-black leading-none text-soky-orange-deep">
                {item.priceLabelSnapshot}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="group relative grid size-11 shrink-0 place-items-center rounded-full text-japan-seal transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-soky-paper active:scale-90"
            onClick={onRemove}
            aria-label={`Quitar ${item.titleSnapshot} del carrito`}
          >
            <span className="absolute transition-all duration-300  ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-1 group-hover:rotate-[-8deg] group-hover:opacity-0 group-focus-visible:opacity-0">
              <TrashSVG aria-hidden="true" focusable="false" />
            </span>

            <span className="absolute translate-y-1 rotate-6 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-y-0 group-hover:rotate-0 group-hover:opacity-100 group-focus-visible:opacity-100">
              <OpenTrashSVG aria-hidden="true" focusable="false" />
            </span>
          </button>
        </div>

        <CartQuantityStepper
          label={item.titleSnapshot}
          quantity={item.quantity}
          onDecrease={onDecrease}
          onIncrease={onIncrease}
        />
      </div>
    </motion.li>
  );
};
