import "server-only";
import { cookies } from "next/headers";
import { apiMode } from "@/lib/env";
import type { ApiErrorResponse } from "@/contracts/api";
import { handleDemoRequest } from "@/mock/demo-api";
import { SESSION_COOKIE } from "@/mock/demo-auth";
import { apiClient } from "./client";
import { ApiError } from "./errors";

export async function serverApiGet<T>(path: string): Promise<T> {
  if (apiMode !== "mock") return apiClient.get<T>(path);
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") || path.includes("#")) throw new Error("Consulta interna no válida.");
  const url = new URL(`/api/mock/v1${path}`, "http://soky.internal");
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const request = new Request(url, { headers: token && /^[a-f0-9]{64}$/.test(token) ? { Cookie: `${SESSION_COOKIE}=${token}` } : {} });
  // Direct server dispatch: no HTTP roundtrip, fixed deployment origin or shared cache.
  const response = await handleDemoRequest(request, url.pathname.slice("/api/mock/v1/".length));
  const data = await response.json();
  if (!response.ok) throw new ApiError(response.status, data as ApiErrorResponse);
  return data as T;
}
