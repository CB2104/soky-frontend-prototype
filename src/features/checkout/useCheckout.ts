"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CartQuoteResponseDto, CreateOrderIntentRequestDto, CreateOrderIntentResponseDto, FulfillmentType } from "@/contracts/api";
import { quoteCart } from "@/features/cart/api";
import { getCartQuoteKey } from "@/features/cart/reconcile-cart";
import { useCartStore } from "@/features/cart/store";
import { useCartHydration } from "@/features/cart/useCartHydration";
import type { CartSettingsViewModel } from "@/features/cart/mappers";
import { trackEvent } from "@/features/analytics/client";
import { useCurrentExchangeRate } from "@/features/exchange-rates/useCurrentExchangeRate";
import { isUsableExchangeRate } from "@/features/exchange-rates/rate-validation";
import { parseMoneyCents } from "@/lib/money";
import { createOrderIntent, registerWhatsappClicked } from "./api";
import { buildCheckoutMessage } from "./whatsapp-message";

export type CheckoutForm = { customerName:string; deliveryAddress:string; fulfillmentType:FulfillmentType; notes:string };
type QuoteRecord = { key:string; quote?:CartQuoteResponseDto; error?:string };
type IntentRecord = { key:string; response?:CreateOrderIntentResponseDto; error?:string; pending?:boolean };
const EMPTY_ITEMS: ReturnType<typeof useCartStore.getState>["items"] = [];

function safeTrack(eventType:"checkout_started"|"whatsapp_clicked") {
  try { trackEvent({eventType,entityType:"cart"}); } catch { /* El tracking no bloquea el pedido. */ }
}

export function useCheckout(settings:CartSettingsViewModel) {
  const hasHydrated = useCartHydration();
  const storedItems = useCartStore(state=>state.items);
  const items = hasHydrated ? storedItems : EMPTY_ITEMS;
  const catalogStatus = useCartStore(state=>state.catalogStatus);
  const catalogRevision = useCartStore(state=>state.catalogRevision);
  const cartRevision = useCartStore(state=>state.cartRevision);
  const [form,setForm] = useState<CheckoutForm>({customerName:"",deliveryAddress:"",notes:"",fulfillmentType:settings.pickupEnabled ? "PICKUP" : "DELIVERY"});
  const [fulfillmentRevision,setFulfillmentRevision] = useState(0);
  const [retryVersion,setRetryVersion] = useState(0);
  const {rate,status:rateStatus,retry:retryRate} = useCurrentExchangeRate();
  const [quoteRecord,setQuoteRecord] = useState<QuoteRecord|null>(null);
  const [intentRecord,setIntentRecord] = useState<IntentRecord|null>(null);
  const [addressError,setAddressError] = useState<string>();
  const intentId = useRef(0);
  const activePopup = useRef<Window|null>(null);
  const quoteItems = useMemo(()=>items.map(item=>({productId:item.productId,quantity:item.quantity,notes:item.notes})),[items]);
  const modeEnabled = form.fulfillmentType === "PICKUP" ? settings.pickupEnabled : settings.deliveryEnabled;
  const cartReady = hasHydrated && catalogStatus === "ready" && items.length > 0 && items.every(item=>!item.catalogIssue
    && item.unitPriceCurrencySnapshot === settings.currency && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 99);
  const quoteKey = getCartQuoteKey(items,form.fulfillmentType,catalogRevision,cartRevision,fulfillmentRevision)
    + JSON.stringify([rate,catalogStatus,hasHydrated,retryVersion,settings.currency]);
  const intentKey = quoteKey + JSON.stringify(form);
  const currentKeys = useRef({quoteKey,intentKey});
  useLayoutEffect(()=>{currentKeys.current = {quoteKey,intentKey};intentId.current += 1;activePopup.current?.close();activePopup.current=null;},[quoteKey,intentKey]);
  useEffect(()=>()=>{intentId.current += 1;activePopup.current?.close();activePopup.current=null;},[]);
  const canQuote = cartReady && modeEnabled && isUsableExchangeRate(rate,settings.currency);

  useEffect(()=>{
    if (!canQuote) return;
    let disposed = false;
    const requestedKey = quoteKey;
    const timer = window.setTimeout(()=>{
      void quoteCart({items:quoteItems,fulfillmentType:form.fulfillmentType}).then(response=>{
        if (disposed || currentKeys.current.quoteKey !== requestedKey) return;
        if (!isUsableExchangeRate(response.rateSnapshot,settings.currency) || response.rateSnapshot.rate !== rate?.rate) {
          setQuoteRecord({key:requestedKey,error:"La tasa cambió. Actualiza la tasa para calcular de nuevo."});
          return;
        }
        setQuoteRecord({key:requestedKey,quote:response});
      },error=>{
        if (!disposed && currentKeys.current.quoteKey === requestedKey) setQuoteRecord({key:requestedKey,error:error instanceof Error ? error.message : "No pudimos calcular el pedido."});
      });
    },180);
    return ()=>{disposed = true;window.clearTimeout(timer);};
  },[canQuote,quoteKey,quoteItems,form.fulfillmentType,settings.currency,rate?.rate]);

  const quote = canQuote && quoteRecord?.key === quoteKey ? quoteRecord.quote ?? null : null;
  const quoteError = quoteRecord?.key === quoteKey ? quoteRecord.error : undefined;
  const subtotal = quote ? parseMoneyCents((settings.currency === "EUR" ? quote.totals.subtotalEur : quote.totals.subtotalUsd) ?? "") : null;
  const belowMinimum = subtotal !== null && subtotal < settings.minimumOrderCents;
  const canSubmit = !!quote && quote.invalidItems.length === 0 && subtotal !== null && !belowMinimum && modeEnabled;
  const request:CreateOrderIntentRequestDto = {items:quoteItems,fulfillmentType:form.fulfillmentType,
    customerName:form.customerName.trim() || undefined,deliveryAddress:form.fulfillmentType === "DELIVERY" ? form.deliveryAddress.trim() : undefined,notes:form.notes.trim() || undefined};
  const preview = quote ? buildCheckoutMessage(quote,request) : "El mensaje estará disponible cuando terminemos de verificar el pedido.";
  const intent = intentRecord?.key === intentKey ? intentRecord : null;

  function updateForm<K extends keyof CheckoutForm>(field:K,value:CheckoutForm[K]) {
    if (field === "fulfillmentType" && value !== form.fulfillmentType) setFulfillmentRevision(revision=>revision+1);
    if (field === "deliveryAddress" || field === "fulfillmentType") setAddressError(undefined);
    setForm(current=>({...current,[field]:value}));
  }

  function recordWhatsapp(id:string) {
    safeTrack("whatsapp_clicked");
    void registerWhatsappClicked(id).catch(()=>{});
  }

  async function submit() {
    if (!canSubmit || intent?.pending) return;
    if (form.fulfillmentType === "DELIVERY" && !form.deliveryAddress.trim()) {
      setAddressError("Indica la dirección para delivery.");
      document.getElementById("cart-delivery-address")?.focus();
      return;
    }
    const submittedKey = intentKey;
    const requestId = ++intentId.current;
    const submittedRevision = cartRevision;
    const submittedCatalogRevision = catalogRevision;
    let popup:Window|null = null;
    try { popup = window.open("about:blank","_blank"); if (popup) {popup.opener = null;popup.document.body.textContent = "Preparando tu pedido SOKY…";} } catch { popup = null; }
    activePopup.current = popup;
    setIntentRecord({key:submittedKey,pending:true});
    safeTrack("checkout_started");
    try {
      const response = await createOrderIntent(request);
      const current = useCartStore.getState();
      if (requestId !== intentId.current || currentKeys.current.intentKey !== submittedKey
        || current.cartRevision !== submittedRevision || current.catalogRevision !== submittedCatalogRevision) {popup?.close();return;}
      const url = new URL(response.whatsappUrl);
      if (url.protocol !== "https:" || url.hostname !== "wa.me") throw new Error("El enlace de WhatsApp no es válido.");
      setIntentRecord({key:submittedKey,response});
      activePopup.current = null;
      if (popup && !popup.closed) {
        try {popup.location.replace(url.href);recordWhatsapp(response.id);} catch {popup.close();}
      }
    } catch (error) {
      popup?.close();
      if (requestId === intentId.current && currentKeys.current.intentKey === submittedKey) setIntentRecord({key:submittedKey,error:error instanceof Error ? error.message : "No pudimos preparar WhatsApp. Inténtalo de nuevo."});
    }
  }

  return {hasHydrated,items,catalogStatus,form,updateForm,addressError,rate,rateStatus,retryRate,quote,
    quoteError,retryQuote:()=>setRetryVersion(version=>version+1),isUpdating:canQuote && quoteRecord?.key !== quoteKey,
    belowMinimum,canSubmit,preview,isSubmitting:!!intent?.pending,intentError:intent?.error,
    intentResponse:intent?.response,submit,recordWhatsapp};
}
