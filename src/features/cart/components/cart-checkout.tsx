"use client";

import { useMemo, useState, useTransition } from "react";
import type { CartQuoteResponseDto, FulfillmentType } from "@/contracts/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { quoteCart } from "@/features/cart/api";
import { useCartStore } from "@/features/cart/store";
import { createOrderIntent, registerWhatsappClicked } from "@/features/checkout/api";
import { trackEvent } from "@/features/analytics/client";
import { formatMoney } from "@/lib/money";

type CheckoutForm = {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  fulfillmentType: FulfillmentType;
  notes: string;
};

const initialForm: CheckoutForm = {
  customerName: "",
  customerPhone: "",
  deliveryAddress: "",
  fulfillmentType: "PICKUP",
  notes: "",
};

export function CartCheckout() {
  const clearCart = useCartStore((state) => state.clearCart);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [quote, setQuote] = useState<CartQuoteResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const quoteItems = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes,
      })),
    [items],
  );

  function handleQuote() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await quoteCart({
          items: quoteItems,
          fulfillmentType: form.fulfillmentType,
        });
        setQuote(response);
        trackEvent({ eventType: "checkout_started", entityType: "cart" });
      } catch (currentError) {
        setError(currentError instanceof Error ? currentError.message : "No se pudo calcular el pedido.");
      }
    });
  }

  function handleOrderIntent() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await createOrderIntent({
          items: quoteItems,
          customerName: form.customerName || undefined,
          customerPhone: form.customerPhone || undefined,
          fulfillmentType: form.fulfillmentType,
          deliveryAddress:
            form.fulfillmentType === "DELIVERY" ? form.deliveryAddress : undefined,
          notes: form.notes || undefined,
        });
        await registerWhatsappClicked(response.id);
        trackEvent({ eventType: "whatsapp_clicked", entityType: "cart" });
        window.open(response.whatsappUrl, "_blank", "noopener,noreferrer");
        clearCart();
      } catch (currentError) {
        setError(currentError instanceof Error ? currentError.message : "No se pudo abrir WhatsApp.");
      }
    });
  }

  const canCreateIntent =
    quote && quote.invalidItems.length === 0 && items.length > 0 && !quote.rateSnapshot.stale;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="soky-card p-5">
        <h1 className="soky-heading text-4xl text-soky-blue md:text-5xl">Tu pedido</h1>
        {items.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-soky-paper p-5 text-soky-muted">
            Tu carrito está vacío. Vuelve al menú para agregar tus boxes favoritos.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {items.map((item) => (
              <li key={item.productId} className="rounded-2xl border border-soky-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{item.titleSnapshot}</p>
                    <p className="text-sm text-soky-muted">Cantidad: {item.quantity}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => removeItem(item.productId)}
                  >
                    Quitar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <aside className="soky-card p-5">
        <h2 className="text-2xl font-black">Checkout por WhatsApp</h2>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-bold">
            Nombre
            <input
              className="min-h-12 rounded-xl border border-soky-border bg-soky-white px-4 text-soky-ink"
              value={form.customerName}
              onChange={(event) => setForm({ ...form, customerName: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Teléfono
            <input
              className="min-h-12 rounded-xl border border-soky-border bg-soky-white px-4 text-soky-ink"
              value={form.customerPhone}
              onChange={(event) => setForm({ ...form, customerPhone: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Tipo de entrega
            <select
              className="min-h-12 rounded-xl border border-soky-border bg-soky-white px-4 text-soky-ink"
              value={form.fulfillmentType}
              onChange={(event) =>
                setForm({ ...form, fulfillmentType: event.target.value as FulfillmentType })
              }
            >
              <option value="PICKUP">Retiro</option>
              <option value="DELIVERY">Delivery</option>
            </select>
          </label>
          {form.fulfillmentType === "DELIVERY" ? (
            <label className="grid gap-2 text-sm font-bold">
              Dirección
              <textarea
                className="min-h-24 rounded-xl border border-soky-border bg-soky-white px-4 py-3 text-soky-ink"
                value={form.deliveryAddress}
                onChange={(event) => setForm({ ...form, deliveryAddress: event.target.value })}
              />
            </label>
          ) : null}
          <label className="grid gap-2 text-sm font-bold">
            Notas
            <textarea
              className="min-h-24 rounded-xl border border-soky-border bg-soky-white px-4 py-3 text-soky-ink"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>
        </div>

        <div className="mt-5 grid gap-3">
          <Button type="button" onClick={handleQuote} disabled={items.length === 0 || isPending}>
            {isPending ? "Calculando" : "Calcular total"}
          </Button>
          {quote ? (
            <div className="rounded-2xl bg-soky-paper p-4">
              <p className="text-sm font-bold text-soky-muted">Total autoritativo</p>
              <p className="soky-number mt-1 text-4xl text-soky-blue">
                {formatMoney(quote.totals.totalVes, "VES")}
              </p>
              <p className="mt-2 text-sm text-soky-muted">
                Tasa: {quote.rateSnapshot.rate} VES por {quote.rateSnapshot.baseCurrency}
              </p>
              {quote.rateSnapshot.stale ? (
                <Badge className="mt-3" variant="promo">
                  Tasa por validar
                </Badge>
              ) : null}
              {quote.invalidItems.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="font-bold text-japan-seal">Corrige estos productos:</p>
                  {quote.invalidItems.map((item) => (
                    <button
                      key={`${item.productId}-${item.reason}`}
                      type="button"
                      className="block text-sm font-bold text-japan-seal underline"
                      onClick={() => removeItem(item.productId)}
                    >
                      Quitar {item.productId}: {item.reason}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {error ? (
            <p className="rounded-xl bg-japan-seal/10 p-3 text-sm font-bold text-japan-seal">
              {error}
            </p>
          ) : null}
          <Button
            type="button"
            variant="whatsapp"
            onClick={handleOrderIntent}
            disabled={!canCreateIntent || isPending}
          >
            Abrir WhatsApp
          </Button>
        </div>
      </aside>
    </div>
  );
}
