import { CategoriesWorkspace } from "@/features/admin/categories/CategoriesWorkspace";
import { requirePageSession } from "@/mock/demo-auth";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requirePageSession("categories");
  return <CategoriesWorkspace />;
}
