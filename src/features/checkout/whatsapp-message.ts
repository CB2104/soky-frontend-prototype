import type { CartQuoteResponseDto, CreateOrderIntentRequestDto } from "@/contracts/api";
import { formatCartMoney } from "@/lib/format-cart-money";
import { formatRateDate } from "@/features/exchange-rates/manual-rate";

export function buildCheckoutMessage(quote: CartQuoteResponseDto, request: CreateOrderIntentRequestDto): string {
  const currency = quote.rateSnapshot.baseCurrency;
  const subtotal = currency === "EUR" ? quote.totals.subtotalEur : quote.totals.subtotalUsd;
  const notesById = new Map(request.items.map(item=>[item.productId,item.notes?.trim()]));
  const lines = ["Hola SOKY, quisiera solicitar este pedido.", ""];
  for (const item of quote.items) {
    lines.push(`${item.quantity} × ${item.title} — ${formatCartMoney(item.lineTotalAmount,item.lineTotalCurrency)}`);
    const note = notesById.get(item.productId);
    if (note) lines.push(`  Nota: ${note}`);
  }
  lines.push("", `Subtotal de productos: ${formatCartMoney(subtotal ?? "0",currency)}`,
    `Equivalente referencial: ${formatCartMoney(quote.totals.totalVes,"VES")}`,
    `Tasa utilizada: ${quote.rateSnapshot.rate} Bs./${currency}`);
  if (quote.rateSnapshot.source === "MANUAL") lines.push(`Tasa manual. Referencia: ${formatRateDate(quote.rateSnapshot.fetchedAt)} (Caracas).`);
  if (quote.rateSnapshot.warning) lines.push(quote.rateSnapshot.warning);
  lines.push("", `Modalidad: ${request.fulfillmentType === "DELIVERY" ? "Delivery" : "Retiro en el local"}`);
  if (request.customerName?.trim()) lines.push(`Nombre: ${request.customerName.trim()}`);
  if (request.fulfillmentType === "DELIVERY") {
    lines.push(`Dirección: ${request.deliveryAddress?.trim() ?? "Por indicar"}`,
      "Costo de delivery por confirmar por WhatsApp.");
  }
  if (request.notes?.trim()) lines.push(`Notas generales: ${request.notes.trim()}`);
  lines.push("", "El restaurante confirma disponibilidad, pago e importe final por WhatsApp.");
  return lines.join("\n");
}
