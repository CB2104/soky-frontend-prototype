import "server-only";
import { DemoError } from "./demo-errors";

export async function demoRequestBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 128 * 1024) { await reader.cancel(); throw new DemoError("PAYLOAD_TOO_LARGE", "La solicitud supera el tamaño permitido para la demo.", 413); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return null; }
}
