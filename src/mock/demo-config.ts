import "server-only";
import { createHash } from "node:crypto";
import { DemoError } from "./demo-errors";

export const demoEnabled = process.env.SOKY_DEMO_MODE === "on";
export const DEMO_LIFETIME_SECONDS = 8 * 60 * 60;
export function demoStorageMode() {
  const mode = process.env.SOKY_DEMO_STORAGE ?? "redis";
  if (!["file", "redis"].includes(mode) || (mode === "file" && process.env.VERCEL === "1")) {
    throw new DemoError("STORAGE_CONFIGURATION", "Configura Redis para la demo publicada. El archivo local solo está disponible de forma explícita fuera de Vercel.", 503);
  }
  return mode as "file" | "redis";
}

export function redisDemoConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.STORAGE_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_URL
    ? process.env.UPSTASH_REDIS_REST_TOKEN : process.env.STORAGE_KV_REST_API_TOKEN;
  let parsed: URL;
  try { parsed = new URL(url ?? ""); } catch { throw new DemoError("STORAGE_CONFIGURATION", "Falta la dirección HTTPS de Redis en la configuración del servidor.", 503); }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || !token) {
    throw new DemoError("STORAGE_CONFIGURATION", "Revisa la dirección HTTPS y el token de lectura/escritura de Redis en el servidor.", 503);
  }
  const environment = process.env.VERCEL_ENV ?? "development";
  if (!["production", "preview", "development"].includes(environment)) throw new DemoError("STORAGE_CONFIGURATION", "El entorno de almacenamiento no está reconocido.", 503);
  const namespace = process.env.SOKY_DEMO_NAMESPACE ?? "default";
  if (!/^[a-z0-9-]{1,48}$/.test(namespace)) throw new DemoError("STORAGE_CONFIGURATION", "El espacio de datos demo debe ser un nombre simple del servidor.", 503);
  const branch = process.env.VERCEL_GIT_COMMIT_REF;
  if (environment === "preview" && !branch) throw new DemoError("STORAGE_CONFIGURATION", "La preview necesita una rama identificada para separar sus datos.", 503);
  const branchKey = environment === "preview" ? `:${createHash("sha256").update(branch!).digest("hex").slice(0, 20)}` : "";
  return { url: parsed.href.replace(/\/$/, ""), token, prefix: `soky:demo:v2:${environment}:${namespace}${branchKey}` };
}
