import type { PublicSettingsDto } from "@/contracts/api";
import { apiClient } from "@/lib/api/client";

export function getPublicSettings() {
  return apiClient.get<PublicSettingsDto>("/settings/public");
}
