import { formatMoney } from "@/lib/money";
import Link from "next/link";
import { getEstimatedCartTotals } from "../cartTotals";
import type { CartItem } from "../store";
import { WhatsAppSVG } from "@/components/brand/IconsSVG";

type CartDrawerFooterProps = {
  items: CartItem[];
  onClose: () => void;
};

export function CartDrawerFooter({ items, onClose }: CartDrawerFooterProps) {
  const totals = getEstimatedCartTotals(items);

  const subtotalLabel =
    [
      totals.subtotalUsd ? formatMoney(totals.subtotalUsd, "USD") : null,
      totals.subtotalEur ? formatMoney(totals.subtotalEur, "EUR") : null,
    ]
      .filter(Boolean)
      .join(" + ") || "Por calcular";

  return (
    <footer className="shrink-0 border-t border-soky-blue/15 bg-soky-white px-5 py-4">
      <div className="rounded-3xl bg-soky-paper p-4 ring-1 ring-soky-blue/10">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-soky-muted">Subtotal estimado</span>
          <span className="font-bold text-soky-navy">{subtotalLabel}</span>
        </div>

        <div className="mt-3 border-t border-soky-blue/10 pt-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-base font-black text-soky-navy">
                Total estimado
              </p>
              <p className="mt-1 text-xs text-soky-muted">
                Bs. se calcula al finalizar
              </p>
            </div>

            <p className="text-right text-lg font-black text-soky-orange-deep">
              {totals.totalVes
                ? formatMoney(totals.totalVes, "VES")
                : "Por confirmar"}
            </p>
          </div>
        </div>

        {totals.missingSnapshots ? (
          <p className="mt-3 text-xs leading-5 text-soky-muted">
            Algunos productos antiguos necesitan recalcularse en el checkout.
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3">
        <Link
          href="/cart"
          onClick={onClose}
          className="group inline-flex w-full touch-manipulation rounded-full bg-soky-paper p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2"
        >
          <span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-soky-orange bg-[url('/images/endless-clouds-light.svg')] bg-size-[56px_28px] bg-repeat px-4 text-sm font-bold text-soky-white transition-[background-color,transform] duration-200 group-hover:bg-soky-orange-deep group-active:scale-[0.98]">
            Continuar pedido
            <WhatsAppSVG width={20} />
          </span>
        </Link>
      </div>
    </footer>
  );
}
