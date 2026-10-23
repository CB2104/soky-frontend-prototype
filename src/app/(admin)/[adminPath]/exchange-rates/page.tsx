import { getAdminWorkspace } from "@/features/admin/api";
import { ManualRateWorkspace } from "@/features/admin/settings/ManualRateWorkspace";
import { requirePageSession } from "@/mock/demo-auth";

export const dynamic = "force-dynamic";

export default async function AdminExchangeRatesPage() {
  await requirePageSession("exchange-rates");
  return <ManualRateWorkspace initial={await getAdminWorkspace()} />;
}
