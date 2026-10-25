import {
  AdminIntegrationNotice,
  AdminPageHeader,
  AdminStatus,
  AdminTable,
} from "@/features/admin/components/admin-table";
import Link from "next/link";
import { getAdminOrderIntent, getAdminOrderIntents } from "@/features/admin/api";
import styles from "@/features/admin/components/AdminWorkspace.module.css";
import { requirePageSession } from "@/mock/demo-auth";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  CANCELLED: "Cancelada",
  CONFIRMED_BY_OPERATOR: "Confirmada por operador",
  EXPIRED: "Vencida",
  PENDING_WHATSAPP: "Pendiente de WhatsApp",
};

type SearchParams = Promise<{ page?: string; detail?: string }>;

export default async function AdminOrderIntentsPage({ searchParams }: { searchParams: SearchParams }) {
  await requirePageSession("order-intents");
  const params = await searchParams;
  const requestedPage = Number(params.page ?? 1);
  const page = Number.isSafeInteger(requestedPage) ? Math.max(1, requestedPage) : 1;
  const [result, selected] = await Promise.all([
    getAdminOrderIntents(`?page=${page}&limit=20`),
    params.detail ? getAdminOrderIntent(params.detail).catch(() => null) : Promise.resolve(null),
  ]);
  const orders = result.data as (typeof result.data[number] & { createdAt?: string })[];
  const incompatibleRate = orders.some((order) => {
    const originalCurrency = order.totals.subtotalEur ? "EUR" : "USD";
    return order.rateSnapshot.baseCurrency !== originalCurrency;
  });

  return (
    <div className={styles.page}>
      <AdminPageHeader
        title="Intenciones de pedido"
        description={`${result.meta.total} registros de demostración · Solo lectura. Una intención no representa una venta confirmada.`}
      />
      {incompatibleRate ? (
        <AdminIntegrationNotice>
          Un registro de ejemplo combina un importe en USD con una tasa basada en EUR. Se muestra solo el importe original y no una equivalencia en Bs.
        </AdminIntegrationNotice>
      ) : null}
      <div id="intenciones" className="min-w-0">
        <AdminTable
          caption="Intenciones de pedido de demostración"
          headers={["Código", "Fecha", "Estado", "Modalidad", "Total original", "Total Bs · snapshot", "Detalle"]}
          rowKeys={orders.map((order) => order.id)}
          rows={orders.map((order) => {
            const amount = order.totals.subtotalEur ?? order.totals.subtotalUsd;
            const currency = order.totals.subtotalEur ? "EUR" : "USD";
            const canShowBs = order.rateSnapshot.baseCurrency === currency;
            return [
              order.publicCode,
              order.createdAt ? formatDate(order.createdAt) : "Fecha no disponible",
              <AdminStatus key={`${order.id}-state`} tone={statusTone(order.status)}>
                {statusLabels[order.status] ?? "Estado por revisar"}
              </AdminStatus>,
              order.fulfillmentType === "PICKUP" ? "Retiro en el local" : "Entrega a domicilio",
              amount ? formatCurrency(amount, currency) : "Importe no disponible",
              canShowBs ? `${formatNumber(order.totals.totalVes)} Bs` : "Tasa incompatible",
              <Link key={`${order.id}-detail`} className={styles.link} href={`?page=${result.meta.page}&detail=${encodeURIComponent(order.id)}#detalle`}>
                Ver detalle
              </Link>,
            ];
          })}
          emptyMessage="Todavía no hay intenciones de pedido en la demo."
        />
      </div>
      {result.meta.total > 0 ? (
        <nav className={styles.pagination} aria-label="Paginación de intenciones">
          <Link className={styles.secondaryButton} aria-disabled={result.meta.page <= 1} href={`?page=${Math.max(1, result.meta.page - 1)}`} tabIndex={result.meta.page <= 1 ? -1 : undefined}>Anterior</Link>
          <span>Página {result.meta.page} de {result.meta.pageCount}</span>
          <Link className={styles.secondaryButton} aria-disabled={result.meta.page >= result.meta.pageCount} href={`?page=${Math.min(result.meta.pageCount, result.meta.page + 1)}`} tabIndex={result.meta.page >= result.meta.pageCount ? -1 : undefined}>Siguiente</Link>
        </nav>
      ) : null}
      {selected ? (
        <section id="detalle" className={`${styles.panel} ${styles.panelPadding}`} aria-labelledby="intent-detail-title">
          <div className={styles.toolbar}>
            <div>
              <h2 id="intent-detail-title" className={styles.panelTitle}>Detalle de {selected.publicCode}</h2>
              <p className={styles.sectionDescription}>Snapshot de solo lectura · No confirma ni cambia el estado del pedido.</p>
            </div>
            <Link className={styles.secondaryButton} href={`?page=${result.meta.page}#intenciones`}>Cerrar detalle</Link>
          </div>
          <dl className={`${styles.comparison} ${styles.intentSummary}`}>
            <div><dt>Creada</dt><dd>{selected.createdAt ? formatDate(selected.createdAt) : "Fecha no disponible"}</dd></div>
            <div><dt>Estado</dt><dd>{statusLabels[selected.status] ?? "Estado por revisar"}</dd></div>
            <div><dt>Modalidad</dt><dd>{selected.fulfillmentType === "PICKUP" ? "Retiro en el local" : "Entrega a domicilio"}</dd></div>
            <div><dt>Cliente de la demo</dt><dd>{selected.customerName || "No indicado"}{selected.customerPhone ? ` · ${selected.customerPhone}` : ""}</dd></div>
            {selected.fulfillmentType === "DELIVERY" ? <div><dt>Dirección</dt><dd>{selected.deliveryAddress || "No indicada"}</dd></div> : null}
            <div><dt>Total original</dt><dd>{formatIntentAmount(selected)}</dd></div>
            <div><dt>Snapshot de tasa</dt><dd>{selected.rateSnapshot.rate} {selected.rateSnapshot.targetCurrency} / {selected.rateSnapshot.baseCurrency} · referencia {formatDate(selected.rateSnapshot.fetchedAt)}</dd></div>
            <div><dt>WhatsApp</dt><dd>{selected.whatsappClickedAt ? `Salida registrada · ${formatDate(selected.whatsappClickedAt)}` : "Sin salida registrada"}</dd></div>
            {selected.notes ? <div><dt>Nota</dt><dd>{selected.notes}</dd></div> : null}
          </dl>
          <h3 className={styles.sectionTitle}>Productos de la intención</h3>
          <div className={styles.intentItems}>
            {selected.items.map((item) => <article key={item.productId} className={styles.intentItem}>
              <div><strong>{item.title}</strong><span>{item.quantity} × {formatCurrency(item.unitPriceAmount, item.unitPriceCurrency)}</span></div>
              <strong>{formatCurrency(item.lineTotalAmount, item.lineTotalCurrency)}</strong>
            </article>)}
          </div>
          {formatIntentAmount(selected).includes("tasa incompatible") ? <AdminIntegrationNotice>La tasa histórica usa otra moneda base. Se conserva el total original y no se presenta una conversión incompatible.</AdminIntegrationNotice> : null}
        </section>
      ) : null}
      {params.detail && !selected ? <AdminIntegrationNotice>No pudimos cargar el detalle solicitado. Vuelve al listado y prueba otra intención.</AdminIntegrationNotice> : null}
    </div>
  );
}

function formatIntentAmount(order: { totals: { subtotalEur?: string; subtotalUsd?: string; totalVes: string }; rateSnapshot: { baseCurrency: string } }) {
  const amount = order.totals.subtotalEur ?? order.totals.subtotalUsd;
  const currency = order.totals.subtotalEur ? "EUR" : "USD";
  const original = amount ? formatCurrency(amount, currency) : "Importe no disponible";
  return order.rateSnapshot.baseCurrency === currency ? `${original} · ${formatNumber(order.totals.totalVes)} Bs` : `${original} · tasa incompatible`;
}

function formatCurrency(amount: string, currency: "EUR" | "USD") {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${amount} ${currency}`;
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(amount: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Caracas",
  }).format(date);
}

function statusTone(status: string): "neutral" | "positive" | "warning" | "negative" {
  if (status === "CONFIRMED_BY_OPERATOR") return "positive";
  if (status === "PENDING_WHATSAPP") return "warning";
  if (status === "CANCELLED" || status === "EXPIRED") return "negative";
  return "neutral";
}
