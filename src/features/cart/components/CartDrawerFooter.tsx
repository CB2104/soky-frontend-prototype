
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { useCurrentExchangeRate } from "@/features/exchange-rates/useCurrentExchangeRate";
import { useCartStore } from "../store";
import { getEstimatedCartTotals } from "../cartTotals";
import type { CartItem } from "../store";
import { WhatsAppSVG } from "@/components/brand/IconsSVG";

type CartDrawerFooterProps = {
  items: CartItem[];
  onClose: () => void;
};

export function CartDrawerFooter({ items, onClose }: CartDrawerFooterProps) {
  const { rate, status } = useCurrentExchangeRate();
  const catalogStatus = useCartStore((state) => state.catalogStatus);
  const retryCatalog = useCartStore((state) => state.retryCatalog);
  const totals = getEstimatedCartTotals(items, rate, catalogStatus === "ready");

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
                {status === "loading" ? "Consultando tasa…" : "Conversión referencial a Bs."}
              </p>
            </div>

            <p className="text-right text-lg font-black text-soky-orange-deep">
              {totals.totalVes
                ? formatMoney(totals.totalVes, "VES")
                : "Por confirmar"}
            </p>
          </div>
        </div>

        {rate?.warning ? (
          <p className="mt-3 text-xs leading-5 text-soky-muted">{rate.warning}</p>
        ) : null}
        {totals.conversionPending ? (
          <p role="status" className="mt-3 text-xs leading-5 text-soky-muted">
            {status === "error" ? "No pudimos consultar la tasa. El importe en Bs. queda por confirmar." : "El importe en Bs. requiere una tasa válida para la moneda de todos los productos."}
          </p>
        ) : null}
        {totals.missingSnapshots ? (
          <p className="mt-3 text-xs leading-5 text-soky-muted">
            {catalogStatus === "error" ? "No pudimos actualizar tu carrito." : catalogStatus !== "ready" ? "Verificando productos y precios…" : "Revisa los productos que ya no están disponibles."}
          </p>
        ) : null}
      </div>

      {catalogStatus === "error" ? (
        <Button variant="tertiary" type="button" onClick={retryCatalog} className="mt-3">Reintentar actualización</Button>
      ) : null}
      <div className="mt-4 grid gap-3">
        <Button variant="secondary"
          href="/cart"
          onClick={onClose}
          className="inline-flex w-full"
        >
          <span className="inline-flex items-center justify-center gap-2">
            Continuar pedido
            <WhatsAppSVG width={20} />
          </span>
        </Button>
      </div>
    </footer>
  );
}
