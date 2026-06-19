export type ApiMode = "mock" | "real";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

export const apiMode: ApiMode =
  process.env.NEXT_PUBLIC_API_MODE === "real" ? "real" : "mock";

export const apiBasePath =
  apiMode === "real"
    ? process.env.NEXT_PUBLIC_REAL_API_BASE_URL ?? "http://localhost:4000/api/v1"
    : process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/mock/v1";

export const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH ?? "admin-secret";

export function getApiBaseUrl() {
  if (apiBasePath.startsWith("http")) {
    return apiBasePath.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return apiBasePath.replace(/\/$/, "");
  }

  return `${siteUrl}${apiBasePath}`.replace(/\/$/, "");
}
