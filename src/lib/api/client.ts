import type { ApiErrorResponse } from "@/contracts/api";
import { getApiBaseUrl } from "@/lib/env";
import { ApiError } from "./errors";

type ApiClientOptions = {
  body?: unknown;
  headers?: HeadersInit;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  cache?: RequestCache;
};

async function request<T>(path: string, options: ApiClientOptions = {}) {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers);

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    method: options.method ?? (options.body === undefined ? "GET" : "POST"),
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: options.cache ?? "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({
      code: "INTERNAL_ERROR",
      message: "No se pudo completar la solicitud.",
    }))) as ApiErrorResponse;

    throw new ApiError(response.status, error);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get<T>(path: string, options?: Omit<ApiClientOptions, "body" | "method">) {
    return request<T>(path, { ...options, method: "GET" });
  },
  post<T>(path: string, body?: unknown, options?: Omit<ApiClientOptions, "body" | "method">) {
    return request<T>(path, { ...options, method: "POST", body });
  },
  patch<T>(path: string, body?: unknown, options?: Omit<ApiClientOptions, "body" | "method">) {
    return request<T>(path, { ...options, method: "PATCH", body });
  },
  delete<T>(path: string, options?: Omit<ApiClientOptions, "body" | "method">) {
    return request<T>(path, { ...options, method: "DELETE" });
  },
};
