import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.SOKY_PLAYWRIGHT_MODULE ??
    "C:/Users/cesar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);
const base = process.env.SOKY_FUNCTIONAL_QA_URL ?? "http://127.0.0.1:3101";
assert.equal(new URL(base).port, "3101");
const reproduce = process.argv.includes("--reproduce");
const output = "qa/admin-demo/functional-fixes";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1366, height: 900 },
});
const page = await context.newPage();
const errors = [],
  results = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error" && /hydrat/i.test(message.text()))
    errors.push(message.text());
});
async function api(route, method = "GET", body, status = 200) {
  const response = await context.request.fetch(`${base}/api/mock/v1/${route}`, {
    method,
    headers: { Origin: base },
    data: body,
  });
  const data = await response.json();
  assert.equal(response.status(), status, JSON.stringify(data));
  return data;
}
async function login() {
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill("admin@soky.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("demo");
  await page
    .getByRole("button", { name: "Entrar a la demo", exact: true })
    .click();
  await page.waitForURL((url) => !url.pathname.endsWith("/login"));
  await page.waitForLoadState("networkidle");
}
const title = () => page.getByLabel("Título", { exact: true });
const boxes = () => page.getByRole("button", { name: /Boxes y promociones/ });
const dialog = () =>
  page.locator('dialog[aria-labelledby="admin-confirm-title"][open]');
const cancel = () =>
  dialog().getByRole("button", { name: "Seguir editando" }).click();
const discard = () =>
  dialog().getByRole("button", { name: "Descartar cambios" }).click();
const nav = (name) => page.getByRole("link", { name, exact: true }).first();
const key = "soky-admin-hero-slider-boxes";
const local = () =>
  page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key) ?? "null"),
    key,
  );
async function test(name, run) {
  try {
    await run();
    results.push(`PASS ${name}`);
    console.log("PASS", name);
  } catch (error) {
    results.push(`FAIL ${name}: ${error.message}`);
    await page.screenshot({ path: `${output}/failure.png` });
    throw error;
  }
}
async function openBoxes() {
  await page.goto(`${base}/admin-secret/sliders`, { waitUntil: "networkidle" });
  await boxes().click();
}
async function revokeAndReturn() {
  await api("auth/logout", "POST");
  await save(401);
  await page
    .getByText("Tu borrador se conserva en esta pestaña.", { exact: false })
    .waitFor();
  await page.screenshot({ path: `${output}/session-ended.png` });
  await page.getByRole("link", { name: "Volver a entrar" }).click();
  await login();
}
async function save(status = 200) {
  await page
    .getByRole("button", { name: "Guardar cambios", exact: true })
    .click();
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith("/admin/sliders/slider-boxes") &&
        response.status() === status,
    ),
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Guardar cambios", exact: true })
      .click(),
  ]);
}
try {
  await page.goto(`${base}/admin-secret/sliders`, { waitUntil: "networkidle" });
  await login();
  await boxes().click();
  await title().fill("QA borrador protegido");
  await page
    .getByRole("link", { name: "Productos", exact: true })
    .first()
    .click();
  if (reproduce) {
    await page.waitForURL("**/products");
    await page
      .getByRole("link", { name: "Hero y promociones", exact: true })
      .first()
      .click();
    await boxes().click();
    assert.notEqual(await title().inputValue(), "QA borrador protegido");
    results.push(
      "REPRODUCED F-01: sidebar loses the draft without confirmation",
    );
    await title().fill("QA recuperación real");
    await api("auth/logout", "POST");
    await save(401);
    await page.screenshot({ path: `${output}/before-session-ended.png` });
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("link", { name: "Volver a entrar" }).click();
    await login();
    await boxes().click();
    assert.notEqual(await title().inputValue(), "QA recuperación real");
    results.push(
      "REPRODUCED F-02: real revoked session loses draft after login",
    );
  } else {
    await test("F-01 sidebar cancel, Escape, focus and new-tab links", async () => {
      await cancel();
      assert.equal(await title().inputValue(), "QA borrador protegido");
      assert.equal(
        await nav("Productos").evaluate((el) => document.activeElement === el),
        true,
      );
      await nav("Productos").click();
      await dialog().waitFor();
      await page.screenshot({ path: `${output}/navigation-desktop.png` });
      await page.keyboard.press("Tab");
      assert.equal(
        await dialog()
          .getByRole("button", { name: "Descartar cambios" })
          .evaluate((el) => document.activeElement === el),
        true,
      );
      await page.keyboard.press("Shift+Tab");
      assert.equal(
        await dialog()
          .getByRole("button", { name: "Seguir editando" })
          .evaluate((el) => document.activeElement === el),
        true,
      );
      await page.keyboard.press("Escape");
      assert.equal(await title().inputValue(), "QA borrador protegido");
      const popupEvent = page.waitForEvent("popup");
      await page.getByRole("link", { name: /Ver sitio/ }).click();
      const popup = await popupEvent;
      await popup.close();
      assert.equal(await page.locator("dialog[open]").count(), 0);
    });
    await test("F-01 discard navigates once and removes only this composition", async () => {
      await page.evaluate(() =>
        sessionStorage.setItem(
          "soky-admin-hero-slider-chat",
          "sentinel-other-composition",
        ),
      );
      await nav("Productos").click();
      await discard();
      await page.waitForURL("**/products");
      assert.equal(await local(), null);
      assert.equal(
        await page.evaluate(() =>
          sessionStorage.getItem("soky-admin-hero-slider-chat"),
        ),
        "sentinel-other-composition",
      );
      await nav("Hero y promociones").click();
      await boxes().click();
      assert.notEqual(await title().inputValue(), "QA borrador protegido");
      await page.evaluate(() =>
        sessionStorage.removeItem("soky-admin-hero-slider-chat"),
      );
    });
    await test("F-01 Back and Forward cancel/discard without history duplicates", async () => {
      await nav("Categorías").click();
      await nav("Hero y promociones").click();
      await boxes().click();
      const length = await page.evaluate(() => history.length);
      await title().fill("Historial protegido");
      await page.waitForFunction(() =>
        sessionStorage
          .getItem("soky-admin-hero-slider-boxes")
          ?.includes("Historial protegido"),
      );
      await page.evaluate(() => history.back());
      await cancel();
      assert.equal(await title().inputValue(), "Historial protegido");
      assert.equal(await page.evaluate(() => history.length), length);
      await page.evaluate(() => history.back());
      await discard();
      await page.waitForURL("**/categories");
      await page.goForward();
      await boxes().click();
      assert.notEqual(await title().inputValue(), "Historial protegido");
      await nav("Productos").click();
      await page.waitForURL("**/products");
      await page.goBack();
      await page.waitForURL("**/sliders**");
      await boxes().click();
      await title().fill("Adelante protegido");
      await page.evaluate(() => history.forward());
      await cancel();
      assert.equal(await title().inputValue(), "Adelante protegido");
      await page.evaluate(() => history.forward());
      await discard();
      await page.waitForURL("**/products");
      await nav("Hero y promociones").click();
      await boxes().click();
    });
    await test("F-01 changing composition uses one accessible confirmation", async () => {
      await title().fill("Cambio de composición");
      await page.getByRole("button", { name: /Bienvenida/ }).click();
      await cancel();
      assert.equal(await title().inputValue(), "Cambio de composición");
      await page.getByRole("button", { name: /Bienvenida/ }).click();
      await discard();
      assert.equal(await local(), null);
      await boxes().click();
      assert.notEqual(await title().inputValue(), "Cambio de composición");
    });
    await test("F-01 mobile drawer cancel restores focus and discard navigates", async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await title().fill("Borrador móvil");
      await page
        .getByRole("button", { name: "Abrir menú de administración" })
        .click();
      const drawer = page.locator("#soky-admin-mobile-menu");
      await drawer
        .getByRole("link", { name: "Productos", exact: true })
        .click();
      await page.screenshot({ path: `${output}/navigation-mobile.png` });
      await page.keyboard.press("Escape");
      assert.equal(
        await drawer
          .getByRole("link", { name: "Productos", exact: true })
          .evaluate((el) => document.activeElement === el),
        true,
      );
      await drawer.getByRole("button", { name: "Cerrar menú" }).click();
      assert.equal(await title().inputValue(), "Borrador móvil");
      await page
        .getByRole("button", { name: "Abrir menú de administración" })
        .click();
      await drawer
        .getByRole("link", { name: "Productos", exact: true })
        .click();
      await discard();
      await page.waitForURL("**/products");
      await page.setViewportSize({ width: 1366, height: 900 });
      await nav("Hero y promociones").click();
      await boxes().click();
    });
    await test("F-01 logout asks before revocation; accepted discard clears recovery", async () => {
      await title().fill("No revocar antes de decidir");
      await page
        .getByRole("button", { name: "Salir", exact: true })
        .first()
        .click();
      await cancel();
      await api("auth/me");
      assert.equal(await title().inputValue(), "No revocar antes de decidir");
      await page
        .getByRole("button", { name: "Salir", exact: true })
        .first()
        .click();
      await discard();
      await page.waitForURL("**/login");
      await api("auth/me", "GET", undefined, 401);
      assert.equal(await local(), null);
      await login();
      await openBoxes();
    });
    await test("F-02 real 401 recovers composition, title and nested CTA without preview", async () => {
      await title().fill("Recuperado sin preview");
      await page
        .locator('[name="primaryCta.label"]')
        .fill("Explorar QA recuperado");
      await revokeAndReturn();
      assert.equal(await title().inputValue(), "Recuperado sin preview");
      assert.equal(
        await page.locator('[name="primaryCta.label"]').inputValue(),
        "Explorar QA recuperado",
      );
      assert.match(page.url(), /composition=slider-boxes/);
      await page.screenshot({ path: `${output}/recovered-after-login.png` });
      const before = await api("admin/demo/workspace");
      await save();
      const after = await api("admin/demo/workspace");
      assert.equal(after.revision, before.revision + 1);
      assert.equal(
        after.sliders.find((slide) => slide.id === "slider-boxes").title,
        "Recuperado sin preview",
      );
      assert.equal(await local(), null);
      await nav("Productos").click();
      await page.waitForURL("**/products");
      await nav("Hero y promociones").click();
      await boxes().click();
    });
    await test("F-02 external update preserves original revision and requires explicit comparison", async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await title().fill("Reaplicación consciente");
      await page.locator('[name="primaryCta.label"]').fill("CTA local");
      const before = await api("admin/demo/workspace");
      await api("auth/logout", "POST");
      await save(401);
      const second = await browser.newContext();
      await second.request.post(`${base}/api/mock/v1/auth/login`, {
        headers: { Origin: base },
        data: { email: "admin@soky.test", password: "demo" },
      });
      const changed = await second.request.patch(
        `${base}/api/mock/v1/admin/sliders/slider-boxes`,
        {
          headers: { Origin: base },
          data: {
            expectedRevision: before.revision,
            title: "Versión desde otra sesión",
          },
        },
      );
      assert.equal(changed.status(), 200);
      await second.close();
      await page.getByRole("link", { name: "Volver a entrar" }).click();
      await login();
      assert.equal(await title().inputValue(), "Reaplicación consciente");
      assert.equal((await local()).revision, before.revision);
      await page.screenshot({
        path: `${output}/recovered-conflict-mobile.png`,
      });
      assert.equal(
        await page
          .getByRole("button", { name: "Guardar cambios", exact: true })
          .isDisabled(),
        true,
      );
      await page
        .getByRole("button", {
          name: "Comparar con versión actual",
          exact: true,
        })
        .click();
      await page
        .getByText("Actual: Versión desde otra sesión", { exact: true })
        .waitFor();
      await page
        .getByRole("button", {
          name: "Conservar mis cambios sobre esta versión",
        })
        .click();
      await save();
      assert.equal(
        (await api("admin/demo/workspace")).revision,
        before.revision + 2,
      );
      assert.equal(await local(), null);
      await page.setViewportSize({ width: 1366, height: 900 });
    });
    await test("F-02 native reload warns, restores nested images/rotators, and reset requires reconciliation", async () => {
      await title().fill("Antes de restauración");
      await page
        .locator('[name="rotatorImages.0.alt"]')
        .fill("Imagen recuperable QA");
      const warning = page.waitForEvent("dialog");
      const reload = page.reload({ waitUntil: "networkidle" });
      const native = await warning;
      assert.equal(native.type(), "beforeunload");
      await native.accept();
      await reload;
      assert.equal(await title().inputValue(), "Antes de restauración");
      assert.equal(
        await page.locator('[name="rotatorImages.0.alt"]').inputValue(),
        "Imagen recuperable QA",
      );
      const before = await api("admin/demo/workspace");
      await api("admin/demo/reset", "POST", {
        expectedRevision: before.revision,
        confirm: "RESTORE",
      });
      page.once("dialog", (dialog) => dialog.accept());
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(await title().inputValue(), "Antes de restauración");
      assert.equal(
        await page
          .getByRole("button", { name: "Guardar cambios", exact: true })
          .isDisabled(),
        true,
      );
      await page
        .getByRole("button", {
          name: "Comparar con versión actual",
          exact: true,
        })
        .click();
      await page.getByRole("button", { name: "Usar versión actual" }).click();
      assert.equal(await local(), null);
    });
    await test("F-02 validation and network failures keep the recoverable draft until successful save", async () => {
      await title().fill("");
      await save(422);
      assert.equal((await local()).draft.values.title, "");
      await title().fill("Después de error de red");
      const endpoint = "**/api/mock/v1/admin/sliders/slider-boxes";
      await page.route(endpoint, (route) => route.abort("failed"));
      await page
        .getByRole("button", { name: "Guardar cambios", exact: true })
        .click();
      await dialog()
        .getByRole("button", { name: "Guardar cambios", exact: true })
        .click();
      await page
        .getByText(
          "No pudimos guardar. Tus cambios siguen aquí. Vuelve a intentar.",
          { exact: true },
        )
        .waitFor();
      assert.equal(
        (await local()).draft.values.title,
        "Después de error de red",
      );
      await page.unroute(endpoint);
      await save();
      assert.equal(await local(), null);
    });
    await test("F-02 invalid storage is ignored explicitly and can be exported/discarded", async () => {
      for (const value of [
        "{bad-json",
        "null",
        JSON.stringify({
          version: 999,
          editor: key,
          draft: {},
          baseline: {},
          revision: 1,
        }),
      ]) {
        await page.evaluate(
          ({ key, value }) => sessionStorage.setItem(key, value),
          { key, value },
        );
        await page.reload({ waitUntil: "networkidle" });
        await page
          .getByText(/El borrador local es inválido o incompatible/)
          .waitFor();
        assert.equal(
          await page
            .getByRole("button", { name: "Guardar cambios", exact: true })
            .isDisabled(),
          true,
        );
        const download = page.waitForEvent("download");
        await page
          .getByRole("button", { name: "Descargar borrador", exact: true })
          .click();
        await download;
        await page
          .getByRole("button", {
            name: "Descartar datos locales y usar versión actual",
          })
          .click();
        assert.equal(await local(), null);
      }
    });
    for (const editor of [
      {
        route: "products",
        open: "Agregar producto",
        field: "title",
        key: "soky-admin-product-new",
      },
      {
        route: "categories",
        open: "Agregar categoría",
        field: "name",
        key: "soky-admin-category-new",
      },
      {
        route: "settings",
        open: "Editar configuración",
        field: "businessName",
        key: "soky-admin-settings",
      },
    ])
      await test(`shared helpers: ${editor.route} keeps, restores and discards a record draft`, async () => {
        await page.goto(`${base}/admin-secret/${editor.route}`, {
          waitUntil: "networkidle",
        });
        await page
          .getByRole("button", { name: editor.open, exact: true })
          .click();
        const field = page.locator(`[name="${editor.field}"]`);
        await field.fill(`QA ${editor.route}`);
        await nav("Hero y promociones").click();
        await cancel();
        assert.equal(await field.inputValue(), `QA ${editor.route}`);
        const stored = await page.evaluate(
          (key) => JSON.parse(sessionStorage.getItem(key)),
          editor.key,
        );
        assert.equal(stored.version, 1);
        assert.equal(stored.editor, editor.key);
        if (editor.route === "products")
          await page.evaluate(
            ({ key, stored }) => {
              delete stored.version;
              delete stored.editor;
              sessionStorage.setItem(key, JSON.stringify(stored));
            },
            { key: editor.key, stored },
          );
        page.once("dialog", (dialog) => dialog.accept());
        await page.reload({ waitUntil: "networkidle" });
        await page
          .getByRole("button", { name: editor.open, exact: true })
          .click();
        await page.waitForFunction(
          ({ field, value }) =>
            document.querySelector(`[name="${field}"]`)?.value === value,
          { field: editor.field, value: `QA ${editor.route}` },
        );
        await page
          .getByRole("button", { name: "Cerrar editor", exact: true })
          .click();
        await discard();
        assert.equal(
          await page.evaluate((key) => sessionStorage.getItem(key), editor.key),
          null,
        );
      });
    await openBoxes();
    await test("F-02 denied storage retains memory, offers export, and blocks silent reauthentication", async () => {
      await page.addInitScript(() => {
        const read = Storage.prototype.getItem;
        Storage.prototype.getItem = function (key) {
          if (key.startsWith("soky-admin-hero-slider-"))
            throw new DOMException("Denied", "SecurityError");
          return read.call(this, key);
        };
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (key.startsWith("soky-admin-hero-slider-"))
            throw new DOMException("Denied", "SecurityError");
          return original.call(this, key, value);
        };
      });
      await page.reload({ waitUntil: "networkidle" });
      await title().fill("Solo en memoria");
      await page
        .getByText(/la recuperación después de salir no está garantizada/)
        .waitFor();
      await api("auth/logout", "POST");
      await save(401);
      assert.equal(
        await page
          .getByText("Tu borrador se conserva en esta pestaña.", {
            exact: false,
          })
          .count(),
        0,
      );
      const download = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Descargar borrador", exact: true })
        .last()
        .click();
      await download;
      await page.getByRole("link", { name: "Volver a entrar" }).click();
      await cancel();
      assert.equal(await title().inputValue(), "Solo en memoria");
      await page.getByRole("link", { name: "Volver a entrar" }).click();
      await discard();
      await login();
    });
  }
  assert.deepEqual(errors, []);
  console.log(results);
} finally {
  await writeFile(
    `${output}/${reproduce ? "before" : "browser"}-results.json`,
    JSON.stringify({ results, errors }, null, 2),
  );
  await browser.close();
}
