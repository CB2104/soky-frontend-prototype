import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DemoState } from "@/contracts/demo";
import { DemoError } from "./demo-errors";

export function demoDirectory() {
  const folder = process.env.SOKY_DEMO_DATA_FOLDER ?? "";
  if (folder && !/^[a-z0-9-]+$/.test(folder)) throw new Error("SOKY_DEMO_DATA_FOLDER debe ser un nombre local simple.");
  return path.resolve(process.cwd(), ".soky-demo", folder);
}

export async function readDemoFile() {
  try { return await readFile(path.join(demoDirectory(), "state.json"), "utf8"); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new DemoError("STORAGE_ERROR", "No se pueden leer los datos demo. Revisa permisos y vuelve a intentar.", 503);
  }
}

export async function preserveCorruptFile(content: string) {
  try { await writeFile(path.join(demoDirectory(), `corrupt-${randomUUID()}.json`), content, { flag: "wx" }); }
  catch { throw new DemoError("STORAGE_ERROR", "No pudimos conservar una copia del archivo dañado. La restauración no se aplicó.", 503); }
}

export async function persistDemoFile(state: DemoState) {
  const directory = demoDirectory();
  const temporary = path.join(directory, `state-${randomUUID()}.tmp`);
  try {
    await mkdir(directory, { recursive: true });
    await writeFile(temporary, JSON.stringify(state, null, 2), { encoding: "utf8", flag: "wx", flush: true });
    // Node/libuv replaces files on Windows. Never unlink the old snapshot first.
    for (let attempt = 0; ; attempt++) {
      try { await rename(temporary, path.join(directory, "state.json")); break; }
      catch (error) {
        if (attempt >= 3 || !["EPERM", "EACCES", "EBUSY"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
        await new Promise(resolve => setTimeout(resolve, 25 * (attempt + 1)));
      }
    }
  } catch {
    await unlink(temporary).catch(() => undefined);
    throw new DemoError("STORAGE_ERROR", "No pudimos guardar en el archivo local. Tus cambios no se aplicaron; revisa permisos y espacio disponible.", 503);
  }
}
