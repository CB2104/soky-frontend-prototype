import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminPath } from "@/lib/env";
import { DemoError } from "./demo-errors";
import { demoEnabled, demoStorageMode, DEMO_LIFETIME_SECONDS } from "./demo-config";
import { currentDemoSession } from "./demo-context";
import { redisDemoStore } from "./demo-redis";

export const SESSION_COOKIE = "soky_demo_session";
const symbol = Symbol.for("soky.demo.local-sessions.v2");
const globals = globalThis as typeof globalThis & { [symbol]?: Map<string, number> };
const sessions = globals[symbol] ??= new Map<string, number>();
export function newSession(previousToken?: string): string | Promise<string> {
  if (demoStorageMode() === "redis") return redisDemoStore().start(previousToken).then(row => row.token);
  for (const [token, expiry] of sessions) if (expiry <= Date.now()) sessions.delete(token);
  if (previousToken) sessions.delete(previousToken);
  const token = randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + DEMO_LIFETIME_SECONDS * 1000);
  return token;
}
export function validSession(token?: string): boolean | Promise<boolean> {
  if (demoStorageMode() === "redis") return redisDemoStore().session(token).then(row => Boolean(row));
  if (!token) return false;
  const expiry = sessions.get(token);
  if (!expiry || expiry <= Date.now()) { sessions.delete(token); return false; }
  return true;
}
export function requestToken(request: Request) {
  return request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
}
export async function loadRequestSession(request: Request) {
  if (!demoEnabled || demoStorageMode() === "file") return null;
  return redisDemoStore().session(requestToken(request));
}
export async function requireSession(request: Request) {
  if (!demoEnabled) throw new DemoError("DEMO_DISABLED", "La administración demo está desactivada.", 403);
  const bound = currentDemoSession();
  const valid = demoStorageMode() === "redis" && bound ? bound.expiresAt > Date.now() : await validSession(requestToken(request));
  if (!valid) throw new DemoError("UNAUTHORIZED", "Tu sesión demo terminó. Vuelve a entrar para iniciar otra copia temporal; conserva tu borrador si quieres recuperarlo.", 401);
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  const protocol = process.env.VERCEL === "1" ? "https:" : url.protocol;
  const authority = /^[a-z0-9.:[\]-]+$/i.test(host) ? `${protocol}//${host}` : "";
  if (!origin || origin !== authority) throw new DemoError("FORBIDDEN", "La solicitud debe proceder de esta misma demo.", 403);
}
export function logout(request: Request): void | Promise<void> {
  const token = requestToken(request);
  if (!token) return;
  if (demoStorageMode() === "redis") return redisDemoStore().revoke(token);
  if (token) sessions.delete(token);
}
export async function limitDemoLogin(request: Request) {
  if (demoStorageMode() === "file") return;
  const ip = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for") ?? "unknown" : "local";
  await redisDemoStore().limit("login", ip, 10, 600);
  await redisDemoStore().limit("login-global", "global", 360, 3600);
}
export async function requirePageSession(section = "") {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!demoEnabled || !await validSession(token)) redirect(`/${adminPath}/login?next=${encodeURIComponent(`/${adminPath}${section ? "/" + section : ""}`)}`);
}
