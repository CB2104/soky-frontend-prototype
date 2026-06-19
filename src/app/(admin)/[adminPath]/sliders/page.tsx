import { AdminPageHeader, AdminTable } from "@/features/admin/components/admin-table";
import { getAdminSliders } from "@/features/admin/api";

export const dynamic = "force-dynamic";

export default async function AdminSlidersPage() {
  const sliders = await getAdminSliders();

  return (
    <div className="grid gap-5">
      <AdminPageHeader
        title="Sliders"
        description="Hero y promos públicas. CTA target valida según tipo."
      />
      <section className="soky-card p-5">
        <h2 className="text-lg font-black">Crear slider</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {["title", "imageUrl", "imageAlt", "ctaLabel", "ctaTarget", "sortOrder"].map((field) => (
            <label key={field} className="grid gap-1 text-sm font-bold">
              {field}
              <input className="min-h-11 rounded-lg border border-soky-border px-3" />
            </label>
          ))}
          <label className="grid gap-1 text-sm font-bold">
            ctaType
            <select className="min-h-11 rounded-lg border border-soky-border px-3">
              <option>NONE</option>
              <option>PRODUCT</option>
              <option>CATEGORY</option>
              <option>CUSTOM_URL</option>
            </select>
          </label>
        </form>
      </section>
      <AdminTable
        headers={["Título", "CTA", "Target", "Activo", "Orden"]}
        rows={sliders.data.map((slider) => [
          slider.title,
          slider.ctaType,
          slider.ctaTarget ?? "-",
          slider.isActive ? "Sí" : "No",
          String(slider.sortOrder),
        ])}
      />
    </div>
  );
}
