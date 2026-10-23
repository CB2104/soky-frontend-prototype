import { apiClient } from "@/lib/api/client";

export type AdminMutationResponse<T> = {
  data: T;
  revision: number;
};

export async function saveAdmin<T>(
  path: string,
  body: Record<string, unknown>,
  revision: number,
  method: "POST" | "PATCH" | "DELETE" = "PATCH",
) {
  const headers = { "If-Match": String(revision) };
  if (method === "DELETE") return apiClient.delete<T>(path, { headers });

  const payload = { ...body, expectedRevision: revision };
  if (method === "POST") return apiClient.post<T>(path, payload);
  return apiClient.patch<T>(path, payload);
}
