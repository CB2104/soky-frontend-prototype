import { AdminPageHeader } from "@/features/admin/components/admin-table";
import { getAdminSettings } from "@/features/admin/api";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings();

  return (
    <div className="grid gap-5">
      <AdminPageHeader
        title="Settings"
        description="Configuración pública del negocio y operación."
      />
      <section className="soky-card p-5">
        <form className="grid gap-4 md:grid-cols-2">
          <Field label="businessName" value={settings.businessName} />
          <Field label="whatsappPhone" value={settings.whatsappPhone} />
          <Field label="instagramUrl" value={settings.instagramUrl ?? ""} />
          <Field label="googleMapsUrl" value={settings.googleMapsUrl ?? ""} />
          <Field label="address" value={settings.address ?? ""} />
          <Field label="defaultCurrency" value={settings.defaultCurrency} />
          <label className="grid gap-1 text-sm font-bold md:col-span-2">
            openingHoursDisplay
            <textarea
              className="min-h-24 rounded-lg border border-soky-border px-3 py-2"
              defaultValue={settings.openingHoursDisplay.join("\n")}
            />
          </label>
          <div className="rounded-2xl bg-soky-paper p-4 text-sm">
            Pickup: <strong>{settings.pickupEnabled ? "Activo" : "Inactivo"}</strong>
          </div>
          <div className="rounded-2xl bg-soky-paper p-4 text-sm">
            Delivery: <strong>{settings.deliveryEnabled ? "Activo" : "Inactivo"}</strong>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-1 text-sm font-bold">
      {label}
      <input className="min-h-11 rounded-lg border border-soky-border px-3" defaultValue={value} />
    </label>
  );
}
