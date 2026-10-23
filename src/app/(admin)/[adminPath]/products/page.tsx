import { ProductsWorkspace } from "@/features/admin/products/ProductsWorkspace";
import { requirePageSession } from "@/mock/demo-auth";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requirePageSession("products");
  return <ProductsWorkspace />;
}
