import {
  getAdminAnalyticsSummary,
  getAdminExchangeRate,
  getAdminOrderIntents,
  getAdminProducts,
} from "@/features/admin/api";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [summary, rate, products, orders] = await Promise.all([
    getAdminAnalyticsSummary(),
    getAdminExchangeRate(),
    getAdminProducts(),
    getAdminOrderIntents(),
  ]);
  const unavailable = products.data.filter((product) => !product.isAvailable).length;

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-3xl font-black">Dashboard</h1>
        <p className="mt-1 text-sm text-soky-muted">Lectura rápida del MVP operativo.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Productos" value={String(products.meta.total)} />
        <MetricCard label="No disponibles" value={String(unavailable)} />
        <MetricCard label="Pedidos WhatsApp" value={String(orders.meta.total)} />
        <MetricCard label="WhatsApp clicks" value={String(summary.whatsappClicked)} />
      </div>
      <section className="soky-card p-5">
        <h2 className="text-xl font-black">Tasa actual</h2>
        <p className="mt-2 text-sm text-soky-muted">
          {rate.rate} VES por {rate.baseCurrency}. Fuente: {rate.source}.{" "}
          {rate.stale ? "Requiere revisión." : "Vigente."}
        </p>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="soky-card p-5">
      <p className="text-sm font-bold text-soky-muted">{label}</p>
      <p className="soky-number mt-3 text-4xl text-soky-blue">{value}</p>
    </div>
  );
}
