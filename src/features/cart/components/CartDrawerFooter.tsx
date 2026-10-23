import type { MouseEvent } from "react";
import type { PriceCurrency } from "@/contracts/api";
import { ArrowRightIcon } from "@/components/brand/IconsSVG";
import { Button } from "@/components/ui/button";
import { formatCartMoney } from "@/lib/format-cart-money";
import { useCurrentExchangeRate } from "@/features/exchange-rates/useCurrentExchangeRate";
import { isUsableExchangeRate } from "@/features/exchange-rates/rate-validation";
import { useCartStore } from "../store";
import type { CartItem } from "../store";
import { getEstimatedCartTotals } from "../cartTotals";
import styles from "./CartDrawer.module.css";

type CartDrawerFooterProps = {
  items: CartItem[];
  currency: PriceCurrency;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
};

export function CartDrawerFooter({
  items,
  currency,
  onNavigate,
}: CartDrawerFooterProps) {
  const { rate, status, retry } = useCurrentExchangeRate();
  const catalogReady = useCartStore((state) => state.catalogStatus === "ready");
  const totals = getEstimatedCartTotals(items, rate, catalogReady);
  const currencyMismatch = items.some(
    (item) => item.unitPriceCurrencySnapshot !== currency,
  );
  const pending = totals.missingSnapshots || currencyMismatch;
  const baseAmount =
    currency === "EUR" ? totals.subtotalEur : totals.subtotalUsd;
  const subtotal = pending
    ? "Por confirmar"
    : formatCartMoney(baseAmount ?? "0.00", currency);
  const validConversion =
    !pending &&
    !totals.conversionPending &&
    isUsableExchangeRate(rate, currency);
  const equivalent = validConversion
    ? formatCartMoney(totals.totalVes ?? "0.00", "VES")
    : "Bs. por confirmar";
  const rateMessage =
    status === "loading"
      ? "Consultando tasa…"
      : status === "error"
        ? "No pudimos consultar la tasa. El importe en Bs. queda por confirmar."
        : !isUsableExchangeRate(rate, currency)
          ? "La tasa disponible no es válida para este pedido. El importe en Bs. queda por confirmar."
          : (rate.warning ?? `Tasa referencial: ${rate.rate} Bs./${currency}.`);

  return (
    <footer className={styles.footer}>
      <div className={styles.subtotal}>
        <span>Subtotal estimado</span>
        <strong className={pending ? styles.pendingSubtotal : undefined}>
          {subtotal}
        </strong>
      </div>
      <div className={styles.equivalent}>
        <span>Equivalente referencial</span>
        <strong>{equivalent}</strong>
      </div>
      <p
        className={styles.rateNote}
        role={status === "ready" ? undefined : "status"}
      >
        {rateMessage}
      </p>
      {status === "error" ||
      (status === "ready" && !isUsableExchangeRate(rate, currency)) ? (
        <Button
          type="button"
          variant="tertiary"
          className={styles.retryRate}
          onClick={retry}
        >
          Actualizar tasa
        </Button>
      ) : null}
      <Button
        href="/cart"
        variant="primary"
        className={styles.continue}
        onClick={(event) => onNavigate(event, "/cart")}
      >
        Continuar pedido <ArrowRightIcon aria-hidden="true" />
      </Button>
      <p className={styles.nextStep}>
        Entrega, datos y WhatsApp en el siguiente paso.
      </p>
    </footer>
  );
}
