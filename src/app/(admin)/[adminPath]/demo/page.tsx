import { requirePageSession } from "@/mock/demo-auth";
import { DemoResetPanel } from "@/features/admin/components/DemoResetPanel";
import { AdminPageHeader } from "@/features/admin/components/admin-table";
import styles from "@/features/admin/components/AdminWorkspace.module.css";

export const dynamic = "force-dynamic";

export default async function AdminDemoPage() {
  await requirePageSession("demo");
  return <div className={styles.page}>
    <AdminPageHeader title="Demo y restauración" description="Consulta el estado del conjunto de ejemplo y restaura sus datos cuando haga falta." />
    <DemoResetPanel />
  </div>;
}
