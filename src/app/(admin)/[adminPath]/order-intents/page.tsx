import { AdminPageHeader, AdminTable } from "@/features/admin/components/admin-table";
import { getAdminOrderIntents } from "@/features/admin/api";

export const dynamic = "force-dynamic";

export default async function AdminOrderIntentsPage() {
  const orders = await getAdminOrderIntents();

  return (
    <div className="grid gap-5">
      <AdminPageHeader
        title="Orders"
        description="MVP read-only. Cambio manual de estado queda para V1."
      />
      <AdminTable
        headers={["Código", "Estado", "Tipo", "Cliente", "Total VES", "WhatsApp"]}
        rows={orders.data.map((order) => [
          order.publicCode,
          order.status,
          order.fulfillmentType,
          order.customerName ?? "-",
          order.totals.totalVes,
          order.whatsappClickedAt ?? "Pendiente",
        ])}
      />
    </div>
  );
}
