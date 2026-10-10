"use client";

import { useLayoutEffect, useRef, useState, useTransition } from "react";
import type { CartQuoteResponseDto, FulfillmentType } from "@/contracts/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { quoteCart } from "@/features/cart/api";
import { useCartStore } from "@/features/cart/store";
import { trackEvent } from "@/features/analytics/client";
import {
  createOrderIntent,
  registerWhatsappClicked,
} from "@/features/checkout/api";
import { useCurrentExchangeRate } from "@/features/exchange-rates/useCurrentExchangeRate";
import { isUsableExchangeRate } from "@/features/exchange-rates/rate-validation";
import { formatMoney } from "@/lib/money";
import { getCartIntentItemsKey, getCartQuoteKey } from "../reconcile-cart";
import { useCartHydration } from "../useCartHydration";

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
  const storedItems = useCartStore((state) => state.items);
  const hasHydrated = useCartHydration();
  const items = hasHydrated ? storedItems : [];
  const removeItem = useCartStore((state) => state.removeItem);
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [fulfillmentRevision, setFulfillmentRevision] = useState(0);
  const catalogStatus = useCartStore((state) => state.catalogStatus);
  const catalogRevision = useCartStore((state) => state.catalogRevision);
  const cartRevision = useCartStore((state) => state.cartRevision);
  const retryCatalog = useCartStore((state) => state.retryCatalog);
  const { rate, status: rateStatus } = useCurrentExchangeRate();
  const [quoteRecord, setQuoteRecord] = useState<{
    key: string;
    response: CartQuoteResponseDto;
  } | null>(null);
  const [errorRecord, setErrorRecord] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const quoteRequestId = useRef(0);
  const intentRequestId = useRef(0);
  const quoteItems = items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    notes: item.notes,
  }));

  const rateKey = JSON.stringify(rate);
  const quoteKey = getCartQuoteKey(items, form.fulfillmentType, catalogRevision, cartRevision, fulfillmentRevision) + rateKey;
  const quoteKeyRef = useRef(quoteKey);
  useLayoutEffect(() => {
    quoteKeyRef.current = quoteKey;
    quoteRequestId.current += 1;
    intentRequestId.current += 1;
  }, [quoteKey]);

  const quote = catalogStatus === "ready" && isUsableExchangeRate(rate, "EUR")
    && quoteRecord?.key === quoteKey ? quoteRecord.response : null;
  const error = errorRecord?.key === quoteKey ? errorRecord.message : null;
  const cartReady = catalogStatus === "ready" && items.length > 0
    && items.every((item) => !item.catalogIssue);
  const canCreateIntent = !!quote && cartReady && quote.invalidItems.length === 0
    && isUsableExchangeRate(quote.rateSnapshot, "EUR")
    && quote.rateSnapshot.rate === rate?.rate;
  const [isPending, startTransition] = useTransition();

  function handleQuote() {
    if (!cartReady) return;

    const requestedKey = quoteKey;
    const requestId = ++quoteRequestId.current;
    setQuoteRecord(null);
    setErrorRecord(null);
    startTransition(async () => {
      try {
        const response = await quoteCart({
          items: quoteItems,
          fulfillmentType: form.fulfillmentType,
        });
        if (requestId !== quoteRequestId.current || requestedKey !== quoteKeyRef.current) return;
        setQuoteRecord({ key: requestedKey, response });
        trackEvent({ eventType: "checkout_started", entityType: "cart" });
      } catch (currentError) {
        if (requestId !== quoteRequestId.current || requestedKey !== quoteKeyRef.current) return;
        setErrorRecord({
          key: requestedKey,
          message: currentError instanceof Error
            ? currentError.message
            : "No se pudo calcular el pedido.",
        });
      }
    });
  }

  function handleOrderIntent() {
    if (!canCreateIntent) return;

    const submittedQuoteKey = quoteKey;
    const submittedItemsKey = getCartIntentItemsKey(items);
    const submittedCatalogRevision = catalogRevision;
    const requestId = ++intentRequestId.current;
    setErrorRecord(null);
    startTransition(async () => {
      try {
        const response = await createOrderIntent({
          items: quoteItems,
          customerName: form.customerName || undefined,
          customerPhone: form.customerPhone || undefined,
          fulfillmentType: form.fulfillmentType,
          deliveryAddress:
            form.fulfillmentType === "DELIVERY"
              ? form.deliveryAddress
              : undefined,
          notes: form.notes || undefined,
        });
        if (requestId !== intentRequestId.current || submittedQuoteKey !== quoteKeyRef.current) return;

        await registerWhatsappClicked(response.id);
        if (requestId !== intentRequestId.current || submittedQuoteKey !== quoteKeyRef.current) return;

        trackEvent({ eventType: "whatsapp_clicked", entityType: "cart" });
        window.open(response.whatsappUrl, "_blank", "noopener,noreferrer");
        const currentState = useCartStore.getState();
        if (getCartIntentItemsKey(currentState.items) === submittedItemsKey
          && currentState.catalogRevision === submittedCatalogRevision) {
          clearCart();
        }
      } catch (currentError) {
        if (requestId !== intentRequestId.current || submittedQuoteKey !== quoteKeyRef.current) return;
        setErrorRecord({
          key: submittedQuoteKey,
          message: currentError instanceof Error
            ? currentError.message
            : "No se pudo abrir WhatsApp.",
        });
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="soky-card p-5">
        <h1 className="soky-heading text-4xl text-soky-blue md:text-5xl">
          Tu pedido
        </h1>
        {items.length > 0 && catalogStatus !== "ready" ? (
          <p role="status" className="mt-4 text-sm text-soky-muted">
            {catalogStatus === "error" ? "No pudimos actualizar los productos." : "Verificando productos y precios…"}
            {catalogStatus === "error" ? <button type="button" onClick={retryCatalog} className="ml-2 min-h-11 font-bold underline">Reintentar</button> : null}
          </p>
        ) : null}
        {items.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-soky-paper p-5 text-soky-muted">
            Tu carrito está vacío. Vuelve al menú para agregar tus boxes
            favoritos.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {items.map((item) => (
              <li
                key={item.productId}
                className="rounded-2xl border border-soky-border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{item.titleSnapshot}</p>
                    <p className="text-sm text-soky-muted">
                      Cantidad: {item.quantity}{" "}
                      {catalogStatus === "ready" && item.catalogIssue
                        ? `· ${item.catalogIssue === "UNAVAILABLE" ? "Agotado" : "Producto por revisar"}`
                        : null}
                    </p>
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
              disabled={isPending}
              className="min-h-12 rounded-xl border border-soky-border bg-soky-white px-4 text-soky-ink"
              value={form.customerName}
              onChange={(event) => setForm({ ...form, customerName: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Teléfono
            <input
              disabled={isPending}
              className="min-h-12 rounded-xl border border-soky-border bg-soky-white px-4 text-soky-ink"
              value={form.customerPhone}
              onChange={(event) => setForm({ ...form, customerPhone: event.target.value })}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Tipo de entrega
            <select
              disabled={isPending}
              className="min-h-12 rounded-xl border border-soky-border bg-soky-white px-4 text-soky-ink"
              value={form.fulfillmentType}
              onChange={(event) => {
                setFulfillmentRevision((revision) => revision + 1);
                setForm({ ...form, fulfillmentType: event.target.value as FulfillmentType });
              }}
            >
              <option value="PICKUP">Retiro</option>
              <option value="DELIVERY">Delivery</option>
            </select>
          </label>
          {form.fulfillmentType === "DELIVERY" ? (
            <label className="grid gap-2 text-sm font-bold">
              Dirección
              <textarea
                disabled={isPending}
                className="min-h-24 rounded-xl border border-soky-border bg-soky-white px-4 py-3 text-soky-ink"
                value={form.deliveryAddress}
                onChange={(event) => setForm({ ...form, deliveryAddress: event.target.value })}
              />
            </label>
          ) : null}
          <label className="grid gap-2 text-sm font-bold">
            Notas
            <textarea
              disabled={isPending}
              className="min-h-24 rounded-xl border border-soky-border bg-soky-white px-4 py-3 text-soky-ink"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>
        </div>

        <div className="mt-5 grid gap-3">
          <Button
            type="button"
            onClick={handleQuote}
            disabled={!cartReady || !isUsableExchangeRate(rate, "EUR") || isPending}
          >
            {isPending ? "Calculando" : "Calcular total"}
          </Button>
          {items.length > 0 && !isUsableExchangeRate(rate, "EUR") ? (
            <p role="status" className="text-sm text-soky-muted">
              {rateStatus === "error" ? "No pudimos consultar la tasa. Vuelve a esta ventana para reintentar." : "La tasa debe estar disponible y validada para calcular el pedido."}
            </p>
          ) : null}
          {items.length > 0 && !quote && cartReady ? (
            <p role="status" className="text-sm text-soky-muted">Calcula el total para continuar con este pedido.</p>
          ) : null}
          {quote ? (
            <div className="rounded-2xl bg-soky-paper p-4">
              <p className="text-sm font-bold text-soky-muted">
                Total autoritativo
              </p>
              <p className="soky-number mt-1 text-4xl text-soky-blue">
                {formatMoney(quote.totals.totalVes, "VES")}
              </p>
              <p className="mt-2 text-sm text-soky-muted">
                Tasa: {quote.rateSnapshot.rate} VES por {quote.rateSnapshot.baseCurrency}
              </p>
              {quote.warnings.map((warning) => <p key={warning} className="mt-2 text-sm text-soky-muted">{warning}</p>)}
              {quote.rateSnapshot.stale ? (
                <Badge className="mt-3" variant="promo">Tasa por validar</Badge>
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
