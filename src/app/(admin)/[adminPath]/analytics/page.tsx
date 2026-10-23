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
        Datos de demostración: estas cifras no se actualizan con la actividad de esta sesión ni representan ventas reales.
      </AdminIntegrationNotice>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Vistas de producto · ejemplo" value={summary.productViews} />
        <AdminMetricCard label="Adiciones al carrito · ejemplo" value={summary.addToCart} />
        <AdminMetricCard label="Inicios de pedido · ejemplo" value={summary.checkoutStarted} />
        <AdminMetricCard label="Salidas a WhatsApp · ejemplo" value={summary.whatsappClicked} />
      </div>
      <AdminIntegrationNotice>
        Los porcentajes del servicio no muestran su denominador y se omiten hasta validar el cálculo. Las tablas enseñan conteos de ejemplo.
      </AdminIntegrationNotice>
      <AdminTable
        caption="Vistas y adiciones al carrito por producto, datos de ejemplo"
        headers={["Producto", "Vistas", "Al carrito"]}
        rowKeys={products.map((product) => product.productId)}
        rows={products.map((product) => [
          product.title,
          String(product.views),
          String(product.addToCart),
        ])}
        emptyMessage="Todavía no hay datos de ejemplo para productos."
      />
      <AdminTable
        caption="Vistas y clics por promoción, datos de ejemplo"
        headers={["Hero o promoción", "Vistas", "Clics"]}
        rowKeys={sliders.map((slider) => slider.sliderId)}
        rows={sliders.map((slider) => [
          slider.title,
          String(slider.views),
          String(slider.clicks),
        ])}
        emptyMessage="Todavía no hay datos de ejemplo para promociones."
      />
    </div>
  );
}
