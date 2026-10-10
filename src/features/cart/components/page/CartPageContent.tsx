"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import type { ProductCardViewModel } from "@/features/products/mappers";
import { ProductRecommendations } from "@/features/products/components/ProductRecommendations";
import { useAddProductToCart } from "@/features/products/useAddProductToCart";
import { useCheckout } from "@/features/checkout/useCheckout";
import { isUsableExchangeRate } from "@/features/exchange-rates/rate-validation";
import { useCartStore } from "../../store";
import { formatCartMoney, mapCartItem } from "../../mappers";
import type { CartSettingsViewModel } from "../../mappers";
import { formatMoneyCents } from "@/lib/money";
import { CartPageItemRow } from "./CartPageItemRow";
import { CartCheckoutForm } from "./CartCheckoutForm";
import { CartOrderSummary } from "./CartOrderSummary";
import styles from "./CartPage.module.css";

export function CartPageContent({settings,recommendations}:{settings:CartSettingsViewModel;recommendations:ProductCardViewModel[]}) {
  const checkout = useCheckout(settings);
  const decrement = useCartStore(state=>state.decrement);
  const increment = useCartStore(state=>state.increment);
  const remove = useCartStore(state=>state.removeItem);
  const setNotes = useCartStore(state=>state.setNotes);
  const retryCatalog = useCartStore(state=>state.retryCatalog);
  const clearCart = useCartStore(state=>state.clearCart);
  const addProduct = useAddProductToCart();
  const [feedback,setFeedback] = useState("");
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const [confirmClear,setConfirmClear] = useState(false);
  const quote = checkout.quote;
  const invalidIds = new Set(quote?.invalidItems.map(item=>item.productId) ?? []);
  const items = checkout.items.map(item=>{const mapped=mapCartItem(item,checkout.catalogStatus === "ready",settings.currency);return invalidIds.has(item.productId) ? {...mapped,issue:"Producto por revisar",canIncrease:false,unitPrice:"Por confirmar",lineTotal:"Por confirmar"} : mapped;});
  const units = items.reduce((total,item)=>total+item.quantity,0);
  const selected = new Set(items.map(item=>item.id));
  const availableRecommendations = recommendations.filter(product=>product.isAvailable && product.priceCurrency === settings.currency && !selected.has(product.id)).slice(0,4);
  const subtotal = settings.currency === "EUR" ? quote?.totals.subtotalEur : quote?.totals.subtotalUsd;
  const rateDate = quote && Number.isFinite(Date.parse(quote.rateSnapshot.fetchedAt)) ? new Intl.DateTimeFormat("es-VE",{dateStyle:"short",timeStyle:"short"}).format(new Date(quote.rateSnapshot.fetchedAt)) : "Fecha de consulta no disponible";
  let status:React.ReactNode;
  if (checkout.catalogStatus !== "ready") status = <>Verificando productos y precios…{checkout.catalogStatus === "error" ? <button type="button" onClick={retryCatalog}>Reintentar productos</button> : null}</>;
  else if (items.some(item=>!!item.issue)) status = <>Revisa o elimina los productos marcados para continuar.<button type="button" onClick={retryCatalog}>Actualizar productos</button></>;
  else if (checkout.rateStatus === "loading") status = "Actualizando la tasa…";
  else if (checkout.rateStatus === "error" || !isUsableExchangeRate(checkout.rate,settings.currency)) status = <>No hay una tasa vigente para calcular este pedido.<button type="button" onClick={checkout.retryRate}>Actualizar tasa</button></>;
  else if (checkout.quoteError) status = <>{checkout.quoteError}<button type="button" onClick={checkout.retryQuote}>Reintentar cálculo</button><button type="button" onClick={checkout.retryRate}>Actualizar tasa</button></>;
  else if (checkout.isUpdating) status = "Actualizando el pedido…";
  else if (quote?.invalidItems.length) status = "Hay productos que no se pueden comprar. Revisa la selección.";
  else if (checkout.belowMinimum) status = `Pedido mínimo: ${formatCartMoney(formatMoneyCents(settings.minimumOrderCents),settings.currency)}.`;

  return <div className={styles.page}>
    <div className={styles.intro}><div><p className={styles.overline}>EL SABOR ESTÁ A UN PASO</p><h1>TU PEDIDO<span>.</span></h1><p>Revisa tus favoritos y continúa por WhatsApp.</p></div><Link href="/menu" className={styles.back}>← Seguir explorando el menú</Link></div>
    {!checkout.hasHydrated ? <div className={styles.loading} role="status" aria-busy="true">Cargando tu selección…</div> : !items.length ? <section className={styles.empty}><p className={styles.overline}>AÚN NO HAY SABORES ELEGIDOS</p><h2>TU CARRITO ESTÁ VACÍO</h2><p>Elige tus rolls, boxes o entradas favoritos y vuelve para preparar el pedido.</p><Link href="/menu">Explorar menú →</Link></section> : <div className={styles.layout}>
      <div className={styles.main}>
        <section className={styles.panel} aria-labelledby="cart-products-title"><div className={styles.panelHeading}><div><span className={styles.overline}>TU SELECCIÓN</span><h2 id="cart-products-title">PRODUCTOS SELECCIONADOS</h2></div><span className={styles.count}>{units} unidades</span></div>
          <ul className={styles.items}>{items.map(item=><CartPageItemRow key={item.id} item={item} onDecrease={()=>decrement(item.id)} onIncrease={()=>increment(item.id)} onRemove={()=>remove(item.id)} onNotes={notes=>setNotes(item.id,notes)}/>)}</ul>
          <div className={styles.clear}>{confirmClear ? <><span>¿Vaciar el carrito?</span><button type="button" onClick={()=>{clearCart();setConfirmClear(false);}}>Sí, vaciar</button><button type="button" onClick={()=>setConfirmClear(false)}>Cancelar</button></> : <button type="button" onClick={()=>setConfirmClear(true)}>Vaciar carrito</button>}</div>
        </section>
        <ProductRecommendations products={availableRecommendations} presentation="compact" onAdd={product=>{addProduct(product,{openDrawer:false});setFeedback(`${product.title} agregado al pedido.`);feedbackRef.current?.focus();}}/>
        <p className={styles.feedback} ref={feedbackRef} role="status" aria-live="polite" tabIndex={-1}>{feedback}</p>
        <CartCheckoutForm settings={settings} form={checkout.form} onChange={checkout.updateForm} addressError={checkout.addressError}/>
      </div>
      <CartOrderSummary summary={{subtotal:subtotal ? formatCartMoney(subtotal,settings.currency) : "Por confirmar",equivalent:quote ? formatCartMoney(quote.totals.totalVes,"VES") : "Por confirmar",units,rate:quote ? `${quote.rateSnapshot.rate} Bs./${settings.currency} · Consulta: ${rateDate}` : "Tasa por confirmar",source:quote?.rateSnapshot.source === "MANUAL" ? "TASA MANUAL" : quote ? "TASA DE REFERENCIA" : "",warnings:[...new Set([...(quote?.warnings ?? []),...(quote?.rateSnapshot.source === "MANUAL" ? ["Tasa manual; fecha efectiva por confirmar."] : [])])],delivery:checkout.form.fulfillmentType === "DELIVERY"}}
        status={status} preview={checkout.preview} canSubmit={checkout.canSubmit} pending={checkout.isSubmitting} onSubmit={()=>void checkout.submit()} error={checkout.intentError} fallbackUrl={checkout.intentResponse?.whatsappUrl} finalMessage={checkout.intentResponse?.whatsappMessage} onFallback={()=>{if (checkout.intentResponse) checkout.recordWhatsapp(checkout.intentResponse.id);}}/>
    </div>}
  </div>;
}
