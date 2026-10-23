import "server-only";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { mockUser } from "./db";
import { SESSION_COOKIE, checkOrigin, logout, newSession, requireSession } from "./demo-auth";
import { DemoError, invalid } from "./demo-errors";
import { demoEnabled, readDemoState, resetDemo } from "./demo-repository";
import { objectBody } from "./demo-validation";

const json = (data: unknown, revision?: number) => NextResponse.json(data, {
  headers: { "Cache-Control": "no-store", ...(revision ? { "X-Demo-Revision": String(revision) } : {}) },
});

export async function handleDemoSessionRequest(request: Request, resource: string) {
  if (request.method !== "GET") checkOrigin(request);
  const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: new URL(request.url).protocol === "https:", path: "/" };
  if (resource === "auth/login" && request.method === "POST") {
    if (!demoEnabled) throw new DemoError("DEMO_DISABLED", "La sesión demo está desactivada.", 403);
    const body = objectBody(await request.json());
    if (body.email !== "admin@soky.test" || body.password !== "demo") throw new DemoError("UNAUTHORIZED", "Correo o contraseña incorrectos.", 401);
    // Re-entering replaces the current session rather than leaving its old token active.
    logout(request);
    const result = json({ accessToken: "cookie-session", user: mockUser });
    result.cookies.set(SESSION_COOKIE, newSession(), { ...cookieOptions, maxAge: 8 * 3600 });
    return result;
  }
  // Logout is idempotent, including after process restart or expiration.
  if (resource === "auth/logout" && request.method === "POST") {
    logout(request);
    const result = json({ loggedOut: true });
    result.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return result;
  }
  requireSession(request);
  if (resource === "auth/refresh") return json({ accessToken: "cookie-session" });
  if (resource === "auth/me") return json(mockUser);
  if (resource === "admin/demo/status" && request.method === "GET") {
    try {
      const state = await readDemoState();
      return json({ demo: demoEnabled, revision: state.revision, updatedAt: state.updatedAt, persistence: "local-file-single-process", storageState: "ready" }, state.revision);
    } catch (error) {
      if (!(error instanceof DemoError)) throw error;
      return json({ demo: demoEnabled, revision: null, storageState: error.code === "DATA_CORRUPT" ? "corrupt" : "unavailable", message: error.message, recoverable: error.code === "DATA_CORRUPT" });
    }
  }
  if (resource === "admin/demo/reset" && request.method === "POST") {
    const body = objectBody(await request.json());
    if (body.confirm !== "RESTORE") invalid("confirm", "Confirma la restauración de los datos demo.");
    const state = await resetDemo(body.expectedRevision, () => { requireSession(request); checkOrigin(request); });
    for (const tag of ["soky-menu-products", "soky-menu-categories", "soky-menu-settings", "soky-hero-sliders"]) revalidateTag(tag, { expire: 0 });
    return json({ demo: true, revision: state.revision, updatedAt: state.updatedAt, restored: ["products", "categories", "settings", "sliders", "currentRate", "rateHistory", "analytics", "orderIntents"] }, state.revision);
  }
  throw new DemoError("NOT_FOUND", "Acción no disponible.", 404);
}
