import { getAdminCategories, getAdminProducts } from "@/features/admin/api";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([getAdminProducts(), getAdminCategories()]);

  return (
    <div className="grid gap-5">
      <Header title="Products" description="CRUD MVP con imageUrl manual. Upload queda para V1." />
      <section className="soky-card p-5">
        <h2 className="text-lg font-black">Crear producto</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {["title", "slug", "priceAmount", "imageUrl", "imageAlt", "sortOrder"].map((field) => (
            <label key={field} className="grid gap-1 text-sm font-bold">
              {field}
              <input className="min-h-11 rounded-lg border border-soky-border px-3" />
            </label>
          ))}
          <label className="grid gap-1 text-sm font-bold">
            categoryId
            <select className="min-h-11 rounded-lg border border-soky-border px-3">
              {categories.data.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold md:col-span-2 xl:col-span-3">
            description
            <textarea className="min-h-24 rounded-lg border border-soky-border px-3 py-2" />
          </label>
        </form>
      </section>
      <section className="soky-card overflow-hidden">
        <Table
          headers={["Imagen", "Título", "Categoría", "Estado", "Disponible", "Precio", "Featured"]}
          rows={products.data.map((product) => [
            product.imageUrl,
            product.title,
            product.categorySlug ?? product.categoryId,
            product.status,
            product.isAvailable ? "Sí" : "No",
            `${product.priceAmount} ${product.priceCurrency}`,
            product.featured ? "Sí" : "No",
          ])}
        />
      </section>
    </div>
  );
}

function Header({ description, title }: { description: string; title: string }) {
  return (
    <div>
      <h1 className="text-3xl font-black">{title}</h1>
      <p className="mt-1 text-sm text-soky-muted">{description}</p>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="bg-soky-paper">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-black">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row[1]}-${rowIndex}`} className="border-t border-soky-border">
              {row.map((cell, cellIndex) => (
                <td key={`${row[1]}-${cellIndex}`} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
