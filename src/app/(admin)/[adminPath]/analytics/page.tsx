import { AdminPageHeader, AdminTable } from "@/features/admin/components/admin-table";
import {
  getAdminAnalyticsProducts,
  getAdminAnalyticsSliders,
  getAdminAnalyticsSummary,
} from "@/features/admin/api";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const [summary, products, sliders] = await Promise.all([
    getAdminAnalyticsSummary(),
    getAdminAnalyticsProducts(),
    getAdminAnalyticsSliders(),
  ]);

  return (
    <div className="grid gap-5">
      <AdminPageHeader
        title="Analytics"
        description="Eventos first-party sin datos personales innecesarios."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Views" value={summary.productViews} />
        <Metric label="Add to cart" value={summary.addToCart} />
        <Metric label="Checkout" value={summary.checkoutStarted} />
        <Metric label="WhatsApp" value={summary.whatsappClicked} />
      </div>
      <AdminTable
        headers={["Producto", "Views", "Add to cart", "Conversion"]}
        rows={products.map((product) => [
          product.title,
          String(product.views),
          String(product.addToCart),
          product.conversionRate,
        ])}
      />
      <AdminTable
        headers={["Slider", "Views", "Clicks", "Click rate"]}
        rows={sliders.map((slider) => [
          slider.title,
          String(slider.views),
          String(slider.clicks),
          slider.clickRate,
        ])}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="soky-card p-5">
      <p className="text-sm font-bold text-soky-muted">{label}</p>
      <p className="soky-number mt-2 text-4xl text-soky-blue">{value}</p>
    </div>
  );
}
