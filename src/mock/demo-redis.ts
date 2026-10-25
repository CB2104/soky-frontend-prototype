import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { Redis } from "@upstash/redis";
import { DEMO_LIFETIME_SECONDS, redisDemoConfig } from "./demo-config";
import type { DemoSession } from "./demo-context";
import { DemoError } from "./demo-errors";
import { createDemoSeed } from "./demo-seed";

type RedisCommands = {
  get(key: string): Promise<unknown>;
  del(key: string): Promise<unknown>;
  eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown>;
};
export const SESSION_SCRIPT = `-- soky-session-v2
if ARGV[5] == 'reuse' then
  if redis.call('GET', KEYS[3]) ~= ARGV[6] then return 0 end
  if redis.call('EXISTS', KEYS[1]) == 0 then return -1 end
else
  if redis.call('EXISTS', KEYS[1]) == 1 then return -1 end
  redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[3])
end
redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[3])
if ARGV[5] == 'reuse' then redis.call('DEL', KEYS[3]) end
return 1`;
export const READ_SCRIPT = `-- soky-read-v2
if redis.call('GET', KEYS[2]) ~= ARGV[1] then return -2 end
local value = redis.call('GET', KEYS[1])
if not value then return -1 end
return value`;
export const COMMIT_SCRIPT = `-- soky-commit-v2
if redis.call('GET', KEYS[2]) ~= ARGV[5] then return -2 end
local current = redis.call('GET', KEYS[1])
if not current then return -1 end
if current ~= ARGV[1] then return 0 end
if ARGV[4] ~= 'RECOVER' then
  local ok, state = pcall(cjson.decode, current)
  if not ok or state.revision ~= tonumber(ARGV[3]) then return 0 end
else
  local ttl = redis.call('TTL', KEYS[1])
  if ttl < 1 then return -1 end
  redis.call('SET', KEYS[3], current, 'EX', ttl)
end
redis.call('SET', KEYS[1], ARGV[2], 'KEEPTTL')
return 1`;
export const LIMIT_SCRIPT = `-- soky-limit-v2
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[2]) end
if count > tonumber(ARGV[1]) then return 0 end
return 1`;

export function expiredDemo(): never {
  throw new DemoError("UNAUTHORIZED", "La copia temporal de tu demo terminó. Vuelve a entrar para iniciar otra copia. Conserva tu borrador si quieres recuperarlo.", 401);
}
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export class RedisDemoStore {
  constructor(private redis: RedisCommands, private prefix: string) {}
  private key(kind: string, id: string) { return `${this.prefix}:${kind}:${id}`; }
  private async call<T>(operation: () => Promise<unknown>): Promise<T> {
    try { return await operation() as T; }
    catch (error) {
      if (error instanceof DemoError) throw error;
      throw new DemoError("STORAGE_ERROR", "Redis no está disponible. No se confirmó la operación; conserva tu borrador y vuelve a intentar.", 503);
    }
  }
  async session(token?: string): Promise<DemoSession | null> {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const tokenHash = hashToken(token);
    const value = await this.call<unknown>(() => this.redis.get(this.key("session", tokenHash)));
    if (typeof value !== "string") return null;
    try {
      const row = JSON.parse(value);
      if (!/^[a-f0-9]{32}$/.test(row.datasetId) || !Number.isSafeInteger(row.expiresAt) || row.expiresAt <= Date.now()) return null;
      return { datasetId: row.datasetId, expiresAt: row.expiresAt, tokenHash, serialized: value };
    } catch { return null; }
  }
  async limit(kind: string, subject: string, maximum: number, seconds: number) {
    const id = createHash("sha256").update(subject).digest("hex");
    const ok = await this.call<number>(() => this.redis.eval(LIMIT_SCRIPT, [this.key(`limit-${kind}`, id)], [maximum, seconds]));
    if (ok !== 1) throw new DemoError("RATE_LIMITED", "Se alcanzó el límite temporal de la demo. Espera unos minutos antes de volver a intentar.", 429);
  }
  async start(previousToken?: string) {
    let previous = await this.session(previousToken);
    if (previous && await this.call<unknown>(() => this.redis.get(this.key("data", previous!.datasetId))) === null) previous = null;
    if (!previous) await this.limit("new-copy", "global", 200, 86400);
    const token = randomBytes(32).toString("hex");
    const datasetId = previous?.datasetId ?? randomBytes(16).toString("hex");
    const expiresAt = previous?.expiresAt ?? Date.now() + DEMO_LIFETIME_SECONDS * 1000;
    const ttl = Math.ceil((expiresAt - Date.now()) / 1000);
    if (ttl < 1) expiredDemo();
    const serialized = JSON.stringify({ datasetId, expiresAt });
    const ok = await this.call<number>(() => this.redis.eval(SESSION_SCRIPT,
      [this.key("data", datasetId), this.key("session", hashToken(token)), this.key("session", previous?.tokenHash ?? "none")],
      [JSON.stringify(createDemoSeed()), serialized, ttl, "", previous ? "reuse" : "new", previous?.serialized ?? ""]));
    if (ok !== 1) expiredDemo();
    return { token, expiresAt };
  }
  async revoke(token?: string) {
    if (token && /^[a-f0-9]{64}$/.test(token)) await this.call(() => this.redis.del(this.key("session", hashToken(token))));
  }
  async read(session: DemoSession) {
    if (session.expiresAt <= Date.now()) expiredDemo();
    const value = await this.call<unknown>(() => this.redis.eval(READ_SCRIPT,
      [this.key("data", session.datasetId), this.key("session", session.tokenHash)], [session.serialized]));
    if (value === -1 || value === -2) expiredDemo();
    if (typeof value !== "string") throw new DemoError("DATA_CORRUPT", "La copia demo no es válida. Puedes restaurar solo tu copia desde Configuración.", 503);
    return value;
  }
  async commit(session: DemoSession, previous: string, next: string, revision: number | "RECOVER") {
    if (session.expiresAt <= Date.now()) expiredDemo();
    const result = await this.call<number>(() => this.redis.eval(COMMIT_SCRIPT,
      [this.key("data", session.datasetId), this.key("session", session.tokenHash), this.key("corrupt", session.datasetId)],
      [previous, next, String(revision), revision === "RECOVER" ? "RECOVER" : "SAVE", session.serialized]));
    if (result === -1 || result === -2) expiredDemo();
    if (result !== 1) throw new DemoError("CONFLICT", "Los datos cambiaron en otra pestaña. Conserva tu borrador y carga la versión actual antes de guardar.", 409);
  }
}

let store: RedisDemoStore | undefined;
export function redisDemoStore() {
  if (!store) {
    const config = redisDemoConfig();
    store = new RedisDemoStore(new Redis({ url: config.url, token: config.token, automaticDeserialization: false, retry: { retries: 0 } }), config.prefix);
  }
  return store;
}
