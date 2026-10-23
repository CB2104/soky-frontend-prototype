"use client";

import type { DemoSnapshot } from "@/contracts/demo";
import { apiClient } from "@/lib/api/client";
import { publishDemoRevision } from "@/features/demo/revision-client";

export function getDemoSnapshot() { return apiClient.get<DemoSnapshot>("/admin/demo/workspace"); }
export async function mutateAdminDemo(path: string, body: Record<string, unknown>, expectedRevision: number, method: "POST" | "PATCH" | "DELETE" = "PATCH") {
  const result = method === "DELETE"
    ? await apiClient.delete(path, { headers: { "If-Match": String(expectedRevision) } })
    : method === "POST" ? await apiClient.post(path, { ...body, expectedRevision }) : await apiClient.patch(path, { ...body, expectedRevision });
  publishDemoRevision();
  return result;
}
export function logoutDemo() { return apiClient.post("/auth/logout"); }
