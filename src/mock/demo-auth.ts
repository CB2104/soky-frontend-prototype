import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminPath } from "@/lib/env";
import { DemoError } from "./demo-errors";
import { demoEnabled } from "./demo-repository";

export const SESSION_COOKIE = "soky_demo_session";
const key = Symbol.for("soky.demo.sessions.v1");
const globals = globalThis as typeof globalThis & { [key]?: Map<string, number> };
const sessions = globals[key] ??= new Map<string, number>();
export function newSession() {
  for (const [token, expiry] of sessions) if (expiry <= Date.now()) sessions.delete(token);
  const token = randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + 8 * 3600000);
  return token;
}
export function validSession(token?: string) {
  if (!token) return false;
  const expiry = sessions.get(token);
  if (!expiry || expiry <= Date.now()) { sessions.delete(token); return false; }
  return true;
}
export function requestToken(request: Request) {
  return request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
}
export function requireSession(request: Request) {
  if (!demoEnabled) throw new DemoError("DEMO_DISABLED", "La administración demo está desactivada.", 403);
  if (!validSession(requestToken(request))) throw new DemoError("UNAUTHORIZED", "Tu sesión demo terminó. Vuelve a entrar; los datos guardados se conservan.", 401);
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  // Next dev can canonicalize request.url to localhost even when the browser uses 127.0.0.1.
  // Host is the browser's HTTP authority; do not trust forwarded host/origin allowlists.
  const host = request.headers.get("host") ?? url.host;
  const authority = /^[a-z0-9.:[\]-]+$/i.test(host) ? `${url.protocol}//${host}` : "";
  if (!origin || origin !== authority) throw new DemoError("FORBIDDEN", "La solicitud debe proceder de esta misma demo.", 403);
}
export function logout(request: Request) { const token = requestToken(request); if (token) sessions.delete(token); }
export async function requirePageSession(section = "") {
  if (!demoEnabled || !validSession((await cookies()).get(SESSION_COOKIE)?.value)) redirect(`/${adminPath}/login?next=${encodeURIComponent(`/${adminPath}${section ? "/" + section : ""}`)}`);
}
