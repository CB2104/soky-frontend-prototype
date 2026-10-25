import { registerHooks, createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = path.resolve(fileURLToPath(new URL("../src/", import.meta.url)));
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only")
      return { url: "data:text/javascript,export {}", shortCircuit: true };
    if (
      specifier.startsWith("@/") ||
      (specifier.startsWith(".") &&
        /\.ts(?:\?|$)/.test(context.parentURL ?? ""))
    ) {
      const base = specifier.startsWith("@/")
        ? path.join(root, specifier.slice(2))
        : fileURLToPath(new URL(specifier, context.parentURL));
      for (const candidate of [base, base + ".ts", base + ".json"]) {
        if (existsSync(candidate))
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.startsWith("next/"))
        return {
          url: pathToFileURL(require.resolve(specifier)).href,
          shortCircuit: true,
        };
      throw error;
    }
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".ts") || /\.ts\?/.test(url)) {
      return {
        format: "module",
        source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
            esModuleInterop: true,
          },
        }).outputText,
        shortCircuit: true,
      };
    }
    if (url.endsWith(".json"))
      return {
        format: "module",
        source: `export default ${readFileSync(new URL(url), "utf8")}`,
        shortCircuit: true,
      };
    return nextLoad(url, context);
  },
});
