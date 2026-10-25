import {
  AdminIntegrationNotice,
  AdminMetricCard,
  AdminPageHeader,
  AdminTable,
} from "@/features/admin/components/admin-table";
import {
  getAdminAnalyticsProducts,
  getAdminAnalyticsSliders,
  getAdminAnalyticsSummary,
} from "@/features/admin/api";
import styles from "@/features/admin/components/AdminWorkspace.module.css";
import { requirePageSession } from "@/mock/demo-auth";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requirePageSession("analytics");
  const [summary, products, sliders] = await Promise.all([
    getAdminAnalyticsSummary(),
    getAdminAnalyticsProducts(),
    getAdminAnalyticsSliders(),
  ]);

  return (
    <div className={styles.page}>
      <AdminPageHeader
        title="Analítica"
        description="Actividad de ejemplo para mostrar cómo podría leerse el recorrido del catálogo."
      />
      <AdminIntegrationNotice>
        Datos de demostración · Ejemplo. Estas cifras fijas no se actualizan con las visitas de esta sesión ni representan ventas reales.
        No hay un registro de eventos de sesión disponible para este panel.
      </AdminIntegrationNotice>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AdminMetricCard label="Vistas de producto · ejemplo" value={summary.productViews} />
        <AdminMetricCard label="Vistas de promoción · ejemplo" value={summary.promotionViews} />
        <AdminMetricCard label="Adiciones al carrito · ejemplo" value={summary.addToCart} />
        <AdminMetricCard label="Inicios de checkout · ejemplo" value={summary.checkoutStarted} />
        <AdminMetricCard label="Salidas a WhatsApp · ejemplo" value={summary.whatsappClicked} />
      </div>
      <AdminIntegrationNotice>
        Totales de vistas y adiciones: suma de las filas de ejemplo, incluidos los registros históricos identificados.
        Adiciones / vistas = adiciones al carrito ÷ vistas del producto × 100.
        Clics / vistas = clics de la promoción ÷ vistas de la promoción × 100.
        Salidas / inicios de checkout: {summary.checkoutStarted > 0 ? summary.conversionRate : "Sin datos"} (salidas a WhatsApp ÷ inicios de checkout × 100).
        Un denominador cero se muestra como «Sin datos». Ningún porcentaje acredita una compra.
      </AdminIntegrationNotice>
      <AdminTable
        caption="Vistas y adiciones al carrito por producto, datos de ejemplo"
        headers={["Producto · ejemplo", "Vistas", "Al carrito", "Adiciones / vistas"]}
        rowKeys={products.map((product) => product.productId)}
        rows={products.map((product) => [
          product.historical ? `${product.title} · Registro histórico (${product.productId})` : product.title,
          String(product.views),
          String(product.addToCart),
          product.views > 0 ? product.conversionRate : "Sin datos",
        ])}
        emptyMessage="Todavía no hay datos de ejemplo para productos."
      />
      <AdminTable
        caption="Vistas y clics por promoción, datos de ejemplo"
        headers={["Hero o promoción · ejemplo", "Vistas", "Clics", "Clics / vistas"]}
        rowKeys={sliders.map((slider) => slider.sliderId)}
        rows={sliders.map((slider) => [
          slider.historical ? `${slider.title} · Registro histórico (${slider.sliderId})` : slider.title,
          String(slider.views),
          String(slider.clicks),
          slider.views > 0 ? slider.clickRate : "Sin datos",
        ])}
        emptyMessage="Todavía no hay datos de ejemplo para promociones."
      />
    </div>
  );
}
