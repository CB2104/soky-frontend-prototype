import { getAdminWorkspace } from "@/features/admin/api";
import { AdminPageHeader } from "@/features/admin/components/admin-table";
import styles from "@/features/admin/components/AdminWorkspace.module.css";
import { HeroWorkspace } from "@/features/admin/hero/HeroWorkspace";
import { requirePageSession } from "@/mock/demo-auth";

export const dynamic = "force-dynamic";

export default async function AdminSlidersPage() {
  await requirePageSession("sliders");
  const workspace = await getAdminWorkspace();

  return (
    <div className={styles.page}>
      <AdminPageHeader
        title="Hero y promociones"
        description="Edita el contenido de las cuatro composiciones que ya usa el sitio. Su estructura visual se mantiene protegida."
      />
      <HeroWorkspace initialSnapshot={workspace} />
    </div>
  );
}
