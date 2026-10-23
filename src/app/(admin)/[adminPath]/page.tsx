import Link from "next/link";
import { getAdminWorkspace } from "@/features/admin/api";
import { AdminMetricCard, AdminPageHeader } from "@/features/admin/components/admin-table";
import styles from "@/features/admin/components/AdminWorkspace.module.css";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ adminPath: string }>;
}) {
  const { adminPath } = await params;
  const workspace = await getAdminWorkspace();
  const activeCategories = new Set(
    workspace.categories.filter((category) => category.isActive).map((category) => category.id),
  );
  const publishedProducts = workspace.products.filter(
    (product) => product.status === "ACTIVE" && activeCategories.has(product.categoryId),
  );
  const unavailable = publishedProducts.filter((product) => !product.isAvailable).length;
  const whatsappClicked = workspace.orderIntents.filter((intent) => intent.whatsappClickedAt).length;
  const rate = workspace.currentRate;
  const leadingProducts = [...workspace.analytics.products]
    .sort((left, right) => right.views - left.views || right.addToCart - left.addToCart || left.title.localeCompare(right.title, "es"))
    .slice(0, 3);
  const rateNumber = Number(rate.rate);
  const formattedRate = Number.isFinite(rateNumber)
    ? new Intl.NumberFormat("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(rateNumber)
    : rate.rate;
  const referenceDate = new Date(rate.fetchedAt);
  const referenceLabel = rate.pendingValidation
    ? "Pendiente de validación manual"
    : Number.isNaN(referenceDate.getTime())
    ? "Fecha de referencia no disponible"
    : new Intl.DateTimeFormat("es-VE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Caracas",
      }).format(referenceDate);

  return (
    <div className={styles.page}>
      <AdminPageHeader
        title="Resumen"
        description="Una lectura rápida del catálogo y la actividad de esta demo."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AdminMetricCard label="Productos del catálogo" value={workspace.products.length} />
        <AdminMetricCard label="Productos publicados" value={publishedProducts.length} />
        <AdminMetricCard label="No disponibles · publicados" value={unavailable} />
        <AdminMetricCard label="Intenciones de pedido" value={workspace.orderIntents.length} />
        <AdminMetricCard label="Salidas a WhatsApp" value={whatsappClicked} />
      </div>
      <section className={`${styles.panel} ${styles.panelPadding}`} aria-labelledby="current-rate-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={styles.metricLabel}>Tasa manual · catálogo en {workspace.settings.defaultCurrency}</p>
            <h2 id="current-rate-title" className={styles.rateValue}>
              1 {rate.baseCurrency} = {formattedRate} Bs
            </h2>
            <p className={styles.rateMeta}>
              Referencia: {referenceLabel}. {rate.pendingValidation
                ? "Valor inicial de ejemplo."
                : rate.stale
                  ? "Necesita revisión."
                  : "En período de revisión."}
            </p>
          </div>
          <Link className={styles.link} href={`/${adminPath}/exchange-rates`}>
            Revisar tasas
          </Link>
        </div>
        <p className={styles.rateMeta}>
          Valor introducido manualmente para esta demo. No se consulta al proveedor.
        </p>
      </section>
      <section className={`${styles.panel} ${styles.panelPadding}`} aria-labelledby="product-ranking-title">
        <div className={styles.toolbar}>
          <div>
            <h2 id="product-ranking-title" className={styles.panelTitle}>Productos con más vistas</h2>
            <p className={styles.sectionDescription}>Conteos fijos de demostración; no son ventas ni actividad en vivo.</p>
          </div>
          <Link className={styles.link} href={`/${adminPath}/analytics`}>Ver analítica</Link>
        </div>
        {leadingProducts.length ? (
          <ol className={styles.rankingList}>
            {leadingProducts.map((product, index) => (
              <li key={product.productId} className={styles.rankingItem}>
                <span className={styles.rankingPosition} aria-label={`Puesto ${index + 1}`}>{index + 1}</span>
                <span className={styles.rankingProduct}><strong>{product.title}</strong><span>{product.views} vistas de ejemplo</span></span>
                <span className={styles.rankingAdds}>{product.addToCart} al carrito</span>
              </li>
            ))}
          </ol>
        ) : <p className={styles.emptyState}>Todavía no hay datos de ejemplo para productos.</p>}
      </section>
    </div>
  );
}
