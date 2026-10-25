import assert from "node:assert/strict";
import { createRequire } from "node:module";
import * as fs from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.SOKY_PLAYWRIGHT_MODULE ??
    "C:/Users/cesar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);
const base = "http://127.0.0.1:3331";
const output = path.resolve("qa/admin-demo/s1");
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const checks = [];
const pass = (name) => {
  checks.push(name);
  console.log(`PASS ${name}`);
};
try {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    reducedMotion: "reduce",
  });
  context.setDefaultTimeout(20000);
  const errors = [];
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base + "/admin-secret/demo", { waitUntil: "networkidle" });
  await page.waitForURL("**/admin-secret/login**");
  await page.getByLabel("Contraseña", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Entrar a la demo" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "No se pudo iniciar sesión" })
    .waitFor();
  await page.getByLabel("Contraseña", { exact: true }).fill("demo");
  await page.getByRole("button", { name: "Entrar a la demo" }).click();
  await page.waitForURL("**/admin-secret/demo");
  await page.waitForLoadState("networkidle");
  pass(
    "Browser guards direct navigation; login keeps generic error and returns internally",
  );
  const api = async (resource, body, method = "POST") => {
    const response = await context.request.fetch(
      base + "/api/mock/v1" + resource,
      {
        method,
        headers: { Origin: base },
        ...(body !== undefined ? { data: body } : {}),
      },
    );
    assert.equal(response.ok(), true, await response.text());
    return response.json();
  };
  const status = await api("/admin/demo/status", undefined, "GET");
  await page
    .getByRole("button", { name: "Restaurar demo", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Restaurar datos de la demo",
  });
  await dialog.waitFor();
  assert.equal(await page.locator(":focus").textContent(), "Cancelar");
  await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
  assert.equal(
    (await api("/admin/demo/status", undefined, "GET")).revision,
    status.revision,
  );
  pass("Reset dialog starts on Cancel; cancel keeps revision unchanged");
  await page
    .getByRole("button", { name: "Restaurar demo", exact: true })
    .click();
  await page.route("**/api/mock/v1/admin/demo/reset", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "STORAGE_ERROR",
        message:
          "No pudimos guardar en el archivo local. Tus cambios no se aplicaron.",
      }),
    }),
  );
  await dialog
    .getByRole("button", { name: "Restaurar datos", exact: true })
    .click();
  await dialog
    .getByRole("alert")
    .filter({ hasText: "Tus cambios no se aplicaron." })
    .waitFor();
  assert.equal(
    (await api("/admin/demo/status", undefined, "GET")).revision,
    status.revision,
  );
  assert.equal(
    await page
      .getByRole("status")
      .filter({ hasText: "Datos restaurados." })
      .count(),
    0,
  );
  await page.unroute("**/api/mock/v1/admin/demo/reset");
  await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
  pass(
    "Storage failure keeps reset confirmation open, shows error and never reports success",
  );
  const canonicalStatus = await api("/admin/demo/status", undefined, "GET");
  await api("/admin/demo/reset", {
    expectedRevision: canonicalStatus.revision,
    confirm: "RESTORE",
  });
  const products = await api("/products?limit=100", undefined, "GET");
  const product = products.data.find((p) => p.isAvailable);
  const cart = await context.newPage();
  cart.on("pageerror", (error) => errors.push(error.message));
  await cart.addInitScript((product) => {
    if (!sessionStorage.getItem("s1-seeded")) {
      localStorage.setItem(
        "soky.cart.v1",
        JSON.stringify({
          state: {
            items: [
              {
                productId: product.id,
                quantity: 1,
                slug: product.slug,
                titleSnapshot: "Precio obsoleto S1",
                unitPriceCurrencySnapshot: "EUR",
                unitPriceCentsSnapshot: 999999,
              },
            ],
          },
          version: 0,
        }),
      );
      sessionStorage.setItem("s1-seeded", "1");
    }
  }, product);
  await cart.goto(base + "/cart", { waitUntil: "networkidle" });
  await cart.waitForFunction(
    (title) =>
      JSON.parse(localStorage.getItem("soky.cart.v1")).state.items[0]
        ?.titleSnapshot === title,
    product.title,
  );
  const snapshot = await cart.evaluate(
    () => JSON.parse(localStorage.getItem("soky.cart.v1")).state.items[0],
  );
  assert.equal(
    snapshot.unitPriceCentsSnapshot,
    Math.round(Number(product.priceAmount) * 100),
  );
  pass(
    "Cart reconciles stale browser title, currency and price from repository",
  );
  const beforeChange = await api("/admin/demo/status", undefined, "GET");
  await api(
    "/admin/products/" + product.id,
    {
      expectedRevision: beforeChange.revision,
      title: "Cambio S1 entre pestañas",
    },
    "PATCH",
  );
  await cart.evaluate(() => window.dispatchEvent(new Event("focus")));
  await cart.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("soky.cart.v1")).state.items[0]
        ?.titleSnapshot === "Cambio S1 entre pestañas",
  );
  pass("Focus refresh catches repository changes without a broadcast");
  await page
    .getByRole("button", { name: "Restaurar demo", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Restaurar datos", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Datos restaurados." })
    .waitFor();
  await cart.waitForFunction(
    (title) =>
      JSON.parse(localStorage.getItem("soky.cart.v1")).state.items[0]
        ?.titleSnapshot === title,
    product.title,
  );
  await page.screenshot({
    path: path.join(output, "reset-desktop.png"),
    fullPage: true,
  });
  pass("Confirmed reset broadcasts reconciliation to open public tab");
  const rateStatus = await api("/admin/demo/status", undefined, "GET");
  await api("/admin/exchange-rates/manual", {
    expectedRevision: rateStatus.revision,
    baseCurrency: "EUR",
    rate: "1000.000000",
    fetchedAt: new Date().toISOString(),
  });
  await cart.evaluate(() => window.dispatchEvent(new Event("focus")));
  const previewButton = cart.getByRole("button", {
    name: "Preparar vista previa demo",
    exact: true,
  });
  await previewButton.waitFor();
  await previewButton.waitFor({ state: "visible" });
  await cart.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (button) =>
        button.textContent === "Preparar vista previa demo" && !button.disabled,
    ),
  );
  const pageCount = context.pages().length;
  await previewButton.click();
  await cart
    .getByRole("status")
    .filter({ hasText: "Vista previa demo preparada." })
    .waitFor();
  assert.equal(context.pages().length, pageCount);
  assert.equal(await cart.locator('a[href^="https://wa.me"]').count(), 0);
  await cart.screenshot({
    path: path.join(output, "checkout-preview-desktop.png"),
    fullPage: true,
  });
  pass(
    "Checkout prepares a local preview with no popup and no WhatsApp destination",
  );
  await page
    .getByRole("button", { name: "Restaurar demo", exact: true })
    .click();
  await dialog.getByRole("checkbox").check();
  await dialog
    .getByRole("button", { name: "Restaurar datos", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Carrito de presentación vacío." })
    .waitFor();
  await cart.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("soky.cart.v1")).state.items.length === 0,
  );
  pass("Explicit empty-cart reset clears presentation cart in another tab");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Restaurar demo", exact: true })
    .click();
  await dialog.waitFor();
  assert.equal(await page.locator(":focus").textContent(), "Cancelar");
  await page.screenshot({
    path: path.join(output, "reset-dialog-mobile.png"),
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
  pass("Reset confirmation fits 390px and preserves initial focus");
  await page.setViewportSize({ width: 1366, height: 900 });
  await page
    .getByRole("button", { name: "Salir", exact: true })
    .first()
    .click();
  await page.waitForURL("**/admin-secret/login");
  assert.equal(
    (await context.request.get(base + "/api/mock/v1/auth/me")).status(),
    401,
  );
  pass("Visible logout clears cookie and returns to login");
  assert.deepEqual(errors, []);
  pass("Browser journey has no uncaught JavaScript errors");
  await context.close();
  await fs.writeFile(
    path.join(output, "browser-results.json"),
    JSON.stringify({ checks, passed: checks.length }, null, 2),
  );
  console.log(JSON.stringify({ total: checks.length, passed: checks.length }));
} finally {
  await browser.close();
}
