import type { CartSettingsViewModel } from "../../mappers";
import type { CheckoutForm } from "@/features/checkout/useCheckout";
import styles from "./CartPage.module.css";

export function CartCheckoutForm({form,settings,onChange,addressError}:{form:CheckoutForm;settings:CartSettingsViewModel;onChange:<K extends keyof CheckoutForm>(field:K,value:CheckoutForm[K])=>void;addressError?:string}) {
  return <section className={styles.panel} aria-labelledby="cart-details-title"><div className={styles.panelHeading}><div><span className={styles.overline}>EL ÚLTIMO PASO</span><h2 id="cart-details-title">¿CÓMO PREFIERES RECIBIRLO?</h2><p>Solo lo necesario para preparar tu solicitud.</p></div></div>
    <form id="cart-checkout-form" className={styles.form} onSubmit={event=>event.preventDefault()} noValidate>
      <fieldset><legend>Modalidad de entrega <span aria-hidden="true">*</span></legend><div className={styles.modes}>
        <button type="button" disabled={!settings.pickupEnabled} aria-pressed={form.fulfillmentType === "PICKUP"} onClick={()=>onChange("fulfillmentType","PICKUP")}>Retiro en el local</button>
        <button type="button" disabled={!settings.deliveryEnabled} aria-pressed={form.fulfillmentType === "DELIVERY"} onClick={()=>onChange("fulfillmentType","DELIVERY")}>Delivery</button>
      </div></fieldset>
      {!settings.pickupEnabled && !settings.deliveryEnabled ? <p className={styles.error}>No hay modalidades de entrega disponibles.</p> : null}
      <div className={styles.formGrid}>
        <label>Tu nombre <small>(opcional)</small><input type="text" autoComplete="name" maxLength={100} value={form.customerName} onChange={event=>onChange("customerName",event.target.value)} placeholder="Ej. María Pérez"/></label>
        {form.fulfillmentType === "DELIVERY" ? <label htmlFor="cart-delivery-address">Dirección exacta *<textarea id="cart-delivery-address" autoComplete="street-address" required rows={2} maxLength={500} value={form.deliveryAddress} onChange={event=>onChange("deliveryAddress",event.target.value)} aria-invalid={!!addressError} aria-describedby={addressError ? "cart-address-error" : undefined} placeholder="Urb., calle, casa/apto. y punto de referencia"/>{addressError ? <span id="cart-address-error" role="alert" className={styles.error}>{addressError}</span> : null}</label> : null}
        <label className={styles.wide}>Notas generales <small>(opcional)</small><textarea rows={2} maxLength={500} value={form.notes} onChange={event=>onChange("notes",event.target.value)} placeholder="Ej. Servilletas extra o instrucciones especiales"/></label>
      </div>
    </form>
  </section>;
}
