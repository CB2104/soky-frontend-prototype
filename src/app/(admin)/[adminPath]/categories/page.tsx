import { AdminPageHeader, AdminTable } from "@/features/admin/components/admin-table";
import { getAdminCategories } from "@/features/admin/api";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="grid gap-5">
      <AdminPageHeader
        title="Categories"
        description="Gestiona grupos de menú. Borrar desactiva en MVP cuando haya productos asociados."
      />
      <section className="soky-card p-5">
        <h2 className="text-lg font-black">Crear categoría</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {["key", "name", "slug", "sortOrder"].map((field) => (
            <label key={field} className="grid gap-1 text-sm font-bold">
              {field}
              <input className="min-h-11 rounded-lg border border-soky-border px-3" />
            </label>
          ))}
        </form>
      </section>
      <AdminTable
        headers={["Nombre", "Slug", "Grupo", "Activa", "Orden"]}
        rows={categories.data.map((category) => [
          category.name,
          category.slug,
          category.group ?? "OTHER",
          category.isActive ? "Sí" : "No",
          String(category.sortOrder),
        ])}
      />
    </div>
  );
}
