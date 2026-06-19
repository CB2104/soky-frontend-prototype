import { AdminPageHeader, AdminTable } from "@/features/admin/components/admin-table";
import { getAdminExchangeRate, getAdminExchangeRateHistory } from "@/features/admin/api";

export const dynamic = "force-dynamic";

export default async function AdminExchangeRatesPage() {
  const [current, history] = await Promise.all([
    getAdminExchangeRate(),
    getAdminExchangeRateHistory(),
  ]);

  return (
    <div className="grid gap-5">
      <AdminPageHeader
        title="Exchange rates"
        description="El público solo lee la tasa. El refresh manual vive aquí."
      />
      <section className="soky-card p-5">
        <p className="text-sm font-bold text-soky-muted">Tasa actual</p>
        <p className="soky-number mt-2 text-5xl text-soky-blue">
          {current.rate} VES
        </p>
        <p className="mt-2 text-sm text-soky-muted">
          {current.mode} desde {current.source}. {current.stale ? "Stale" : "Vigente"}.
        </p>
      </section>
      <AdminTable
        headers={["Base", "Rate", "Source", "Fetched at", "Stale"]}
        rows={history.map((rate) => [
          rate.baseCurrency,
          rate.rate,
          rate.source,
          rate.fetchedAt,
          rate.stale ? "Sí" : "No",
        ])}
      />
    </div>
  );
}
