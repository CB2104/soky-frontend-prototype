import { SettingsWorkspace } from "@/features/admin/settings/SettingsWorkspace";
import { requirePageSession } from "@/mock/demo-auth";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requirePageSession("settings");
  return <SettingsWorkspace />;
}
